"""
LLM API interface for making calls to various language models.

This module provides a unified interface for making API calls to different LLM providers
using LiteLLM with simplified error handling and clean parameter management.
"""

from typing import Union, Dict, Any, Optional, AsyncGenerator, List
import os
import json
import asyncio
import litellm
from litellm.router import Router
from litellm.files.main import ModelResponse
from core.utils.logger import logger
from core.utils.config import config
from core.agentpress.error_processor import ErrorProcessor
from pathlib import Path
from datetime import datetime, timezone

# Configure LiteLLM
# os.environ['LITELLM_LOG'] = 'DEBUG'
# litellm.set_verbose = True  # Enable verbose logging
litellm.modify_params = True
litellm.drop_params = True

# CRITICAL: Disable all LiteLLM internal retries to prevent infinite loops on 400 errors
# We handle retries at our own layer (auto-continue) with proper error checking
litellm.num_retries = 0

# Enable additional debug logging
# import logging
# litellm_logger = logging.getLogger("LiteLLM")
# litellm_logger.setLevel(logging.DEBUG)
provider_router = None
ENABLE_BEDROCK = os.getenv("ENABLE_BEDROCK", "false").lower() == "true"


class LLMError(Exception):
    """Exception for LLM-related errors."""
    pass


# CRITICAL: Vanity model ID mapping - these MUST be converted before ANY LiteLLM call
_VANITY_TO_REAL_MODEL = {
    "kortix/basic": "openrouter/anthropic/claude-haiku-4.5",
    "kortix/power": "openrouter/anthropic/claude-sonnet-4.5",
}

def _ensure_real_model_id(model_id: str) -> str:
    """
    CRITICAL: Convert vanity model IDs to real LiteLLM model IDs.
    
    This function MUST be called before ANY LiteLLM API call.
    Vanity IDs like 'kortix/basic' and 'kortix/power' are internal aliases
    that LiteLLM does not recognize - they MUST be converted to real provider models.
    """
    if model_id in _VANITY_TO_REAL_MODEL:
        real_model = _VANITY_TO_REAL_MODEL[model_id]
        logger.warning(f"🚨 VANITY ID INTERCEPTED: {model_id} -> {real_model}")
        return real_model
    return model_id

def setup_api_keys() -> None:
    """Set up API keys from environment variables."""
    if not config:
        logger.warning("Config not loaded - skipping API key setup")
        return
        
    providers = [
        "OPENAI",
        "ANTHROPIC",
        "GROQ",
        "OPENROUTER",
        "XAI",
        "MORPH",
        "GEMINI",
        "OPENAI_COMPATIBLE",
    ]
    
    for provider in providers:
        try:
            key = getattr(config, f"{provider}_API_KEY", None)
            if key:
                # logger.debug(f"API key set for provider: {provider}")
                pass
            else:
                logger.debug(f"No API key found for provider: {provider} (this is normal if not using this provider)")
        except AttributeError as e:
            logger.debug(f"Could not access {provider}_API_KEY: {e}")

    # Set up OpenRouter API base if not already set
    if hasattr(config, 'OPENROUTER_API_KEY') and hasattr(config, 'OPENROUTER_API_BASE'):
        if config.OPENROUTER_API_KEY and config.OPENROUTER_API_BASE:
            os.environ["OPENROUTER_API_BASE"] = config.OPENROUTER_API_BASE
            # logger.debug(f"Set OPENROUTER_API_BASE to {config.OPENROUTER_API_BASE}")

    # Set up AWS Bedrock bearer token authentication
    if hasattr(config, 'AWS_BEARER_TOKEN_BEDROCK'):
        bedrock_token = config.AWS_BEARER_TOKEN_BEDROCK
        if bedrock_token:
            os.environ["AWS_BEARER_TOKEN_BEDROCK"] = bedrock_token
            logger.debug("AWS Bedrock bearer token configured")
        else:
            logger.debug("AWS_BEARER_TOKEN_BEDROCK not configured - Bedrock models will not be available")

def setup_provider_router(openai_compatible_api_key: str = None, openai_compatible_api_base: str = None):
    global provider_router
    
    # Get config values safely
    config_openai_key = getattr(config, 'OPENAI_COMPATIBLE_API_KEY', None) if config else None
    config_openai_base = getattr(config, 'OPENAI_COMPATIBLE_API_BASE', None) if config else None
    
    model_list = [
        {
            "model_name": "openai-compatible/*", # support OpenAI-Compatible LLM provider
            "litellm_params": {
                "model": "openai/*",
                "api_key": openai_compatible_api_key or config_openai_key,
                "api_base": openai_compatible_api_base or config_openai_base,
            },
        },
        {
            "model_name": "*", # supported LLM provider by LiteLLM
            "litellm_params": {
                "model": "*",
            },
        },
    ]
    
    fallbacks = [
        # MAP-tagged Haiku 4.5 (default) -> Sonnet 4 -> Sonnet 4.5
        {
            "bedrock/converse/arn:aws:bedrock:us-west-2:935064898258:application-inference-profile/heol2zyy5v48": [
                "bedrock/converse/arn:aws:bedrock:us-west-2:935064898258:application-inference-profile/tyj1ks3nj9qf",
                "bedrock/converse/arn:aws:bedrock:us-west-2:935064898258:application-inference-profile/few7z4l830xh",
            ]
        },
        # MAP-tagged Sonnet 4.5 -> Sonnet 4 -> Haiku 4.5
        {
            "bedrock/converse/arn:aws:bedrock:us-west-2:935064898258:application-inference-profile/few7z4l830xh": [
                "bedrock/converse/arn:aws:bedrock:us-west-2:935064898258:application-inference-profile/tyj1ks3nj9qf",
                "bedrock/converse/arn:aws:bedrock:us-west-2:935064898258:application-inference-profile/heol2zyy5v48",
            ]
        },
        # MAP-tagged Sonnet 4 -> Haiku 4.5
        {
            "bedrock/converse/arn:aws:bedrock:us-west-2:935064898258:application-inference-profile/tyj1ks3nj9qf": [
                "bedrock/converse/arn:aws:bedrock:us-west-2:935064898258:application-inference-profile/heol2zyy5v48",
            ]
        }
    ]

    # Context window specific fallbacks: used only when the model raises a context window exceeded error
    # Keep empty by default; can be extended to map models to larger-context alternatives
    context_window_fallbacks = []
    
    # Configure Router with specific retry settings:
    # - num_retries=0: Disable router-level retries - we handle errors at our layer
    # - fallbacks: ONLY for rate limits and overloaded errors, NOT for 400 errors
    # - context_window_fallbacks: Automatically fallback to models with larger context windows when context is exceeded
    # CRITICAL: 400 Bad Request errors must NOT retry or fallback - they're permanent failures
    # EXCEPTION: ContextWindowExceededError is a special case where fallback to larger context models is appropriate
    provider_router = Router(
        model_list=model_list,
        num_retries=0,  # CRITICAL: Disable all router-level retries to prevent infinite loops
        fallbacks=fallbacks,
        context_window_fallbacks=context_window_fallbacks,  # Handle context window exceeded errors
        # Only use fallbacks for rate limits (429) and server errors (5xx), NOT client errors (4xx)
        # context_window_fallbacks are separate and only triggered by context length issues
    )
    
    if ENABLE_BEDROCK:
        logger.info(f"Configured LiteLLM Router with {len(fallbacks)} Bedrock-only fallback rules")
    else:
        logger.info("Configured LiteLLM Router with Bedrock fallbacks disabled")

def _should_sanitize(model_name: str) -> bool:
    """Check if a model requires JSON schema sanitization.
    
    Some providers don't support advanced JSON Schema features like anyOf, oneOf, allOf.
    Returns True if the model's schemas should be sanitized.
    """
    if not model_name:
        return True
    
    model_lower = model_name.lower()
    
    # Models that DON'T need sanitization (support full JSON Schema)
    no_sanitize_patterns = [
        'gpt-4', 'gpt-5', 'openai',  # OpenAI models support full schema
    ]
    
    for pattern in no_sanitize_patterns:
        if pattern in model_lower:
            return False
    
    # Default: sanitize for safety (Anthropic, Bedrock, etc. need sanitization)
    return True

def _configure_openai_compatible(params: Dict[str, Any], model_name: str, api_key: Optional[str], api_base: Optional[str]) -> None:
    """Configure OpenAI-compatible provider setup."""
    if not model_name.startswith("openai-compatible/"):
        return
    
    # Get config values safely
    config_openai_key = getattr(config, 'OPENAI_COMPATIBLE_API_KEY', None) if config else None
    config_openai_base = getattr(config, 'OPENAI_COMPATIBLE_API_BASE', None) if config else None
    
    # Check if have required config either from parameters or environment
    if (not api_key and not config_openai_key) or (
        not api_base and not config_openai_base
    ):
        raise LLMError(
            "OPENAI_COMPATIBLE_API_KEY and OPENAI_COMPATIBLE_API_BASE is required for openai-compatible models. If just updated the environment variables, wait a few minutes or restart the service to ensure they are loaded."
        )
    
    setup_provider_router(api_key, api_base)
    logger.debug(f"Configured OpenAI-compatible provider with custom API base")

def _sanitize_json_schema(obj: Any) -> Any:
    """Sanitize JSON Schemas for providers that don't support combinators or union types.
    - Removes anyOf/oneOf/allOf recursively
    - Ensures parameters/properties are valid with a concrete 'type'
    - Collapses list types like ["string","null"] to a single permissive type
    """
    def _sanitize(o: Any) -> Any:
        if isinstance(o, dict):
            # Drop unsupported combinators
            o = {k: _sanitize(v) for k, v in o.items() if k not in ("anyOf", "oneOf", "allOf", "if", "then", "else")}

            # Ensure objects have correct structure
            if o.get("type") == "object" or "properties" in o or "required" in o:
                o.setdefault("type", "object")
                o.setdefault("properties", {})
                if not isinstance(o["properties"], dict):
                    o["properties"] = {}

            # Fix properties without explicit type
            props = o.get("properties")
            if isinstance(props, dict):
                for name, prop in list(props.items()):
                    if isinstance(prop, dict):
                        if "type" not in prop:
                            if "items" in prop:
                                prop["type"] = "array"
                            else:
                                prop["type"] = "string"
                        t = prop.get("type")
                        if isinstance(t, list):
                            # Prefer a non-null primitive
                            non_null = [x for x in t if x != "null"]
                            prop["type"] = non_null[0] if non_null else "string"
                        # Recurse into nested structures
                        props[name] = _sanitize(prop)

            # Arrays: ensure items exist and sanitize
            if o.get("type") == "array":
                if "items" in o:
                    o["items"] = _sanitize(o["items"]) or {"type": "string"}
                else:
                    o["items"] = {"type": "string"}

            # Collapse top-level type list
            if isinstance(o.get("type"), list):
                tn = [x for x in o["type"] if x != "null"]
                o["type"] = tn[0] if tn else "string"

            return o
        if isinstance(o, list):
            return [_sanitize(i) for i in o]
        return o

    return _sanitize(obj)


def _add_tools_config(params: Dict[str, Any], tools: Optional[List[Dict[str, Any]]], tool_choice: str, sanitize: bool = True) -> None:
    """Add tools configuration to parameters.
    If sanitize is True, strip unsupported JSON Schema combinators; otherwise pass through unchanged.
    """
    if tools is None:
        return
    
    sanitized_tools = tools
    if sanitize:
        # Use robust sanitizer to remove combinators and collapse union/null types
        sanitized_tools = _sanitize_json_schema(tools)

    params.update({
        "tools": sanitized_tools,
        "tool_choice": tool_choice
    })
    # logger.debug(f"Added {len(tools)} tools to API parameters")

async def make_llm_api_call(
    messages: List[Dict[str, Any]],
    model_name: str,
    response_format: Optional[Any] = None,
    temperature: float = 0,
    max_tokens: Optional[int] = None,
    tools: Optional[List[Dict[str, Any]]] = None,
    tool_choice: str = "auto",
    api_key: Optional[str] = None,
    api_base: Optional[str] = None,
    stream: bool = True,  # Always stream for better UX
    top_p: Optional[float] = None,
    model_id: Optional[str] = None,
    headers: Optional[Dict[str, str]] = None,
    extra_headers: Optional[Dict[str, str]] = None,
    stop: Optional[List[str]] = None,
) -> Union[Dict[str, Any], AsyncGenerator, ModelResponse]:
    """Make an API call to a language model using LiteLLM.
    
    Args:
        messages: List of message dictionaries
        model_name: Name of the model to use
        response_format: Optional response format specification
        temperature: Temperature for sampling (0-1)
        max_tokens: Maximum tokens to generate
        tools: Optional list of tool definitions
        tool_choice: Tool choice strategy ("auto", "required", "none")
        api_key: Optional API key override
        api_base: Optional API base URL override
        stream: Whether to stream the response
        top_p: Optional top_p for sampling
        model_id: Optional model ID for tracking
        headers: Optional headers to send with request
        extra_headers: Optional extra headers to send with request
        stop: Optional list of stop sequences
    """
    logger.info(f"Making LLM API call to model: {model_name} with {len(messages)} messages")
    
    # Prepare parameters using centralized model configuration
    from core.ai_models import model_manager
    # Resolve vanity names to registry ids, then to provider-native ids for LiteLLM
    resolved_model_name = model_manager.resolve_model_id(model_name)
    try:
        # Always get the actual provider model id before building params
        provider_model_name = model_manager.registry.get_litellm_model_id(resolved_model_name)
    except Exception:
        provider_model_name = resolved_model_name
    # CRITICAL: Ensure we NEVER pass vanity IDs to LiteLLM
    provider_model_name = _ensure_real_model_id(provider_model_name)
    logger.info(f"🔄 Resolved model: {model_name} -> {resolved_model_name} -> {provider_model_name}")
    
    # Only pass headers/extra_headers if they are not None to avoid overriding model config
    override_params = {
        "messages": messages,
        "temperature": temperature,
        "response_format": response_format,
        "top_p": top_p,
        "stream": stream,
        "api_key": api_key,
        "api_base": api_base,
        "stop": stop
    }
    
    # Only add headers if they are provided (not None)
    if headers is not None:
        override_params["headers"] = headers
    if extra_headers is not None:
        override_params["extra_headers"] = extra_headers
    
    # Optionally sanitize response_format only for strict providers
    rf_to_send = response_format
    if _should_sanitize(resolved_model_name) and isinstance(response_format, dict):
        try:
            if response_format.get("type") == "json_schema":
                js = response_format.get("json_schema") or {}
                if isinstance(js, dict):
                    if "schema" in js and isinstance(js["schema"], (dict, list)):
                        js["schema"] = _sanitize_json_schema(js["schema"])
                    else:
                        response_format["json_schema"] = _sanitize_json_schema(js)
                rf_to_send = response_format
        except Exception as e:
            logger.warning(f"Failed to sanitize response_format schema: {e}")

    if rf_to_send is not None:
        override_params["response_format"] = rf_to_send

    # Build params using registry config and forcibly set the provider id
    params = model_manager.get_litellm_params(resolved_model_name, **override_params)
    # CRITICAL: Always use the real model ID, never vanity
    params["model"] = _ensure_real_model_id(provider_model_name)
    
    # Ensure stop sequences are in final params
    if stop is not None:
        params["stop"] = stop
        logger.info(f"🛑 Stop sequences configured: {stop}")
    else:
        params.pop("stop", None)
    
    if model_id:
        params["model_id"] = model_id
    
    if stream:
        params["stream_options"] = {"include_usage": True}
    
    # Apply additional configurations
    _configure_openai_compatible(params, model_name, api_key, api_base)
    _add_tools_config(params, tools, tool_choice, sanitize=_should_sanitize(resolved_model_name))
    
    # Final safeguard: Re-apply stop sequences
    if stop is not None:
        params["stop"] = stop
    
    try:
        # Save debug input if enabled via config
        if config and config.DEBUG_SAVE_LLM_IO:
            try:
                debug_dir = Path("debug_streams")
                debug_dir.mkdir(exist_ok=True)
                timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")
                debug_file = debug_dir / f"input_{timestamp}.json"
        
                # Save the exact params going to LiteLLM
                debug_data = {
                    "timestamp": timestamp,
                    "model": params.get("model"),
                    "messages": params.get("messages"),
                    "temperature": params.get("temperature"),
                    "max_tokens": params.get("max_tokens"),
                    "stop": params.get("stop"),
                    "stream": params.get("stream"),
                    "tools": params.get("tools"),
                    "tool_choice": params.get("tool_choice"),
                }
                
                with open(debug_file, 'w', encoding='utf-8') as f:
                    json.dump(debug_data, f, indent=2, ensure_ascii=False)
                    
                logger.info(f"📁 Saved LLM input to: {debug_file}")
            except Exception as e:
                logger.warning(f"⚠️ Error saving debug input: {e}")
        
        # CRITICAL: Final safety - ALWAYS convert vanity IDs before ANY LiteLLM call
        params["model"] = _ensure_real_model_id(params.get("model", ""))
        logger.info(f"🔍 Calling LiteLLM Router with model: {params.get('model')}")
        response = await provider_router.acompletion(**params)
        
        # For streaming responses, we need to handle errors that occur during iteration
        if hasattr(response, '__aiter__') and stream:
            return _wrap_streaming_response(response)
        
        return response
        
    except Exception as e:
        # Retry once with sanitized payload if schema-related error and we didn't sanitize initially
        err_msg = str(e).lower()
        schema_err = any(tok in err_msg for tok in ["oneof", "anyof", "allof", "input_schema", "does not support", "schema"])
        initial = _should_sanitize(resolved_model_name)
        if not initial and schema_err:
            try:
                retry_override = dict(override_params)
                # Force sanitize response_format
                retry_rf = response_format
                if isinstance(response_format, dict):
                    try:
                        if response_format.get("type") == "json_schema":
                            js = response_format.get("json_schema") or {}
                            if isinstance(js, dict):
                                if "schema" in js and isinstance(js["schema"], (dict, list)):
                                    js["schema"] = _sanitize_json_schema(js["schema"])
                                else:
                                    response_format["json_schema"] = _sanitize_json_schema(js)
                        retry_rf = response_format
                    except Exception:
                        pass
                if retry_rf is not None:
                    retry_override["response_format"] = retry_rf
                retry_params = model_manager.get_litellm_params(resolved_model_name, **retry_override)
                retry_params["model"] = _ensure_real_model_id(provider_model_name)
                _configure_openai_compatible(retry_params, model_name, api_key, api_base)
                _add_tools_config(retry_params, tools, tool_choice, sanitize=True)
                if stop is not None:
                    retry_params["stop"] = stop
                if stream:
                    retry_params["stream_options"] = {"include_usage": True}
                response = await provider_router.acompletion(**retry_params)
                if hasattr(response, '__aiter__') and stream:
                    return _wrap_streaming_response(response)
                return response
            except Exception as retry_e:
                # Final fallback: drop tools/response_format to get a plain text answer
                try:
                    retry_override2 = dict(override_params)
                    retry_override2.pop("response_format", None)
                    retry_params2 = model_manager.get_litellm_params(resolved_model_name, **retry_override2)
                    retry_params2["model"] = _ensure_real_model_id(provider_model_name)
                    _configure_openai_compatible(retry_params2, model_name, api_key, api_base)
                    # Do not include tools
                    if "tools" in retry_params2:
                        retry_params2.pop("tools", None)
                    if "tool_choice" in retry_params2:
                        retry_params2.pop("tool_choice", None)
                    if stop is not None:
                        retry_params2["stop"] = stop
                    if stream:
                        retry_params2["stream_options"] = {"include_usage": True}
                    response = await provider_router.acompletion(**retry_params2)
                    if hasattr(response, '__aiter__') and stream:
                        return _wrap_streaming_response(response)
                    return response
                except Exception as retry2_e:
                    processed_retry = ErrorProcessor.process_llm_error(retry2_e, context={"model": model_name, "retry": True, "fallback_no_tools": True})
                    ErrorProcessor.log_error(processed_retry)
                    raise LLMError(processed_retry.message)

        # If initial sanitization was applied and still schema error, try no-tools fallback once
        if initial and schema_err:
            try:
                simple_override = dict(override_params)
                simple_override.pop("response_format", None)
                simple_params = model_manager.get_litellm_params(resolved_model_name, **simple_override)
                simple_params["model"] = _ensure_real_model_id(provider_model_name)
                _configure_openai_compatible(simple_params, model_name, api_key, api_base)
                # remove tools
                if "tools" in simple_params:
                    simple_params.pop("tools", None)
                if "tool_choice" in simple_params:
                    simple_params.pop("tool_choice", None)
                if stop is not None:
                    simple_params["stop"] = stop
                if stream:
                    simple_params["stream_options"] = {"include_usage": True}
                response = await provider_router.acompletion(**simple_params)
                if hasattr(response, '__aiter__') and stream:
                    return _wrap_streaming_response(response)
                return response
            except Exception as retry3_e:
                processed_retry = ErrorProcessor.process_llm_error(retry3_e, context={"model": model_name, "retry": True, "initial_sanitized": True, "fallback_no_tools": True})
                ErrorProcessor.log_error(processed_retry)
                raise LLMError(processed_retry.message)

        processed_error = ErrorProcessor.process_llm_error(e, context={"model": model_name})
        ErrorProcessor.log_error(processed_error)
        raise LLMError(processed_error.message)

async def _wrap_streaming_response(response) -> AsyncGenerator:
    """Wrap streaming response to handle errors during iteration."""
    try:
        async for chunk in response:
            yield chunk
    except Exception as e:
        # Convert streaming errors to processed errors
        processed_error = ErrorProcessor.process_llm_error(e)
        ErrorProcessor.log_error(processed_error)
        raise LLMError(processed_error.message)

setup_api_keys()
setup_provider_router()


if __name__ == "__main__":
    from litellm import completion
    import os

    setup_api_keys()

    response = completion(
        model="openrouter/anthropic/claude-sonnet-4.5",
        messages=[{"role": "user", "content": "Hello! Testing 1M context window."}],
        max_tokens=100,
        extra_headers={
            "anthropic-beta": "context-1m-2025-08-07"  # 👈 Enable 1M context
        }
    )
