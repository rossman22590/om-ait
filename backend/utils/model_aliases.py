"""
Model name aliases for LLM providers.
Maps short names to full provider-specific names.
"""

MODEL_NAME_ALIASES = {
    # Short names to full names
    "sonnet-3.7": "anthropic/claude-3-7-sonnet-latest",
    "gpt-4.1": "openai/gpt-4.1-2025-04-14",
    "gpt-4o": "openai/gpt-4o",
    "gpt-4-turbo": "openai/gpt-4-turbo",
    "gpt-4": "openai/gpt-4",
    "gemini-flash-2.5": "openrouter/google/gemini-2.5-flash-preview",
    "gemini-2.5-flash-preview-04-17": "gemini/gemini-2.5-flash-preview-04-17",
    "gemini-2.5-pro-preview-05-06": "gemini/gemini-2.5-pro-preview-05-06",
    "gemini-pro-preview": "gemini/gemini-2.5-pro-preview-05-06",
    "gemini-pro-2.5": "gemini/gemini-2.5-pro-preview-05-06",
    "grok-3": "xai/grok-3-fast-latest",
    "grok-3-fast-latest": "xai/grok-3-fast-latest",
    "grok-3-mini": "xai/grok-3-mini-fast-beta",
    "grok-mini": "xai/grok-3-mini-fast-beta",
    "deepseek": "openrouter/deepseek/deepseek-chat",
    "qwen3": "openrouter/qwen/qwen3-235b-a22b", 

    # Also include full names as keys to ensure they map to themselves
    "anthropic/claude-3-7-sonnet-latest": "anthropic/claude-3-7-sonnet-latest",
    "openai/gpt-4.1-2025-04-14": "openai/gpt-4.1-2025-04-14",
    "openai/gpt-4o": "openai/gpt-4o",
    "openai/gpt-4-turbo": "openai/gpt-4-turbo",
    "openai/gpt-4": "openai/gpt-4",
    "openrouter/google/gemini-2.5-flash-preview": "openrouter/google/gemini-2.5-flash-preview",
    "gemini/gemini-2.5-flash-preview-04-17": "gemini/gemini-2.5-flash-preview-04-17",
    "gemini/gemini-2.5-pro-preview-05-06": "gemini/gemini-2.5-pro-preview-05-06",
    "xai/grok-3-fast-latest": "xai/grok-3-fast-latest",
    "xai/grok-3-mini-fast-beta": "xai/grok-3-mini-fast-beta",
    "openrouter/deepseek/deepseek-chat": "openrouter/deepseek/deepseek-chat",
    "openrouter/qwen/qwen3-235b-a22b": "openrouter/qwen/qwen3-235b-a22b",
}

def get_full_model_name(model_name: str) -> str:
    """
    Convert a short model name to its full name with provider prefix.
    If the model name is already in full format, it will be returned as is.
    
    Args:
        model_name: The model name to convert (e.g., "gpt-4.1" or "openai/gpt-4.1-2025-04-14")
        
    Returns:
        The full model name with provider prefix
    """
    return MODEL_NAME_ALIASES.get(model_name, model_name)
