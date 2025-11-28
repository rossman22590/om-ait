from typing import Dict, List, Optional, Set
from .ai_models import Model, ModelProvider, ModelCapability, ModelPricing, ModelConfig
from core.utils.config import config, EnvMode

# Kortix models route through OpenRouter to Anthropic
# Map kortix/basic -> Haiku 4.5, kortix/power -> Sonnet 4.5
_KORTIX_BASIC_MODEL = "openrouter/anthropic/claude-haiku-4.5"
_KORTIX_POWER_MODEL = "openrouter/anthropic/claude-sonnet-4.5"

# Default model IDs (these are aliases that resolve to actual IDs)
FREE_MODEL_ID = "kortix/basic"
PREMIUM_MODEL_ID = "kortix/power"

is_local = config.ENV_MODE == EnvMode.LOCAL
is_prod = config.ENV_MODE == EnvMode.PRODUCTION
# Apply a global pricing multiplier (cheaper in production if desired)
pricing_multiplier = 0.20 if is_prod else 1.0

class ModelRegistry:
    def __init__(self):
        self._models: Dict[str, Model] = {}
        self._aliases: Dict[str, str] = {}
        self._initialize_models()
    
    def _initialize_models(self):
        # Machine Basic - Via OpenRouter
        self.register(Model(
            id="kortix/basic",
            name="Machine Basic",
            provider=ModelProvider.OPENROUTER,
            aliases=["kortix-basic", "Kortix Basic", "machine-basic", "Machine Basic"],
            context_window=1_000_000,
            capabilities=[
                ModelCapability.CHAT,
                ModelCapability.FUNCTION_CALLING,
                ModelCapability.VISION,
                ModelCapability.THINKING,
            ],
            pricing=ModelPricing(
                input_cost_per_million_tokens=3.00 * pricing_multiplier,
                output_cost_per_million_tokens=15.00 * pricing_multiplier
            ),
            tier_availability=["free", "paid"],
            priority=110,
            recommended=True,
            enabled=True,
            config=ModelConfig(
                extra_headers={
                    "anthropic-beta": "context-1m-2025-08-07",
                    "HTTP-Referer": config.OR_SITE_URL if hasattr(config, 'OR_SITE_URL') and config.OR_SITE_URL else "",
                    "X-Title": config.OR_APP_NAME if hasattr(config, 'OR_APP_NAME') and config.OR_APP_NAME else ""
                },
            )
        ))
        
        # Machine Power - Via OpenRouter
        self.register(Model(
            id="kortix/power",
            name="Machine Power",
            provider=ModelProvider.OPENROUTER,
            aliases=["kortix-power", "Kortix POWER Mode", "Kortix Power", "machine-power", "Machine Power"],
            context_window=1_000_000,
            capabilities=[
                ModelCapability.CHAT,
                ModelCapability.FUNCTION_CALLING,
                ModelCapability.VISION,
                ModelCapability.THINKING,
            ],
            pricing=ModelPricing(
                input_cost_per_million_tokens=3.00 * pricing_multiplier,
                output_cost_per_million_tokens=15.00 * pricing_multiplier
            ),
            tier_availability=["paid"],
            priority=109,
            recommended=True,
            enabled=True,
            config=ModelConfig(
                extra_headers={
                    "anthropic-beta": "context-1m-2025-08-07",
                    "HTTP-Referer": config.OR_SITE_URL if hasattr(config, 'OR_SITE_URL') and config.OR_SITE_URL else "",
                    "X-Title": config.OR_APP_NAME if hasattr(config, 'OR_APP_NAME') and config.OR_APP_NAME else ""
                },
            )
        ))

        # Claude Opus 4.5 - Best quality via OpenRouter
        self.register(Model(
            id="openrouter/anthropic/claude-opus-4.5",
            name="Opus 4.5",
            provider=ModelProvider.OPENROUTER,
            aliases=[
                "claude-opus-4.5", "claude-opus-4-5",
                "anthropic/claude-opus-4.5", "anthropic/claude-opus-4-5",
                "openrouter/anthropic/claude-opus-4.5", "openrouter/anthropic/claude-opus-4-5",
                "Claude Opus 4.5"
            ],
            context_window=1_000_000,
            capabilities=[
                ModelCapability.CHAT,
                ModelCapability.FUNCTION_CALLING,
                ModelCapability.VISION,
                ModelCapability.THINKING,
            ],
            pricing=ModelPricing(
                input_cost_per_million_tokens=6.00 * pricing_multiplier,
                output_cost_per_million_tokens=30.00 * pricing_multiplier
            ),
            tier_availability=["paid"],
            priority=103,
            recommended=True,
            enabled=True,
            config=ModelConfig(
                extra_headers={
                    "anthropic-beta": "context-1m-2025-08-07",
                    "HTTP-Referer": config.OR_SITE_URL if hasattr(config, 'OR_SITE_URL') and config.OR_SITE_URL else "",
                    "X-Title": config.OR_APP_NAME if hasattr(config, 'OR_APP_NAME') and config.OR_APP_NAME else ""
                },
            )
        ))

        # Claude Sonnet 4.5 - Premium flagship model via OpenRouter
        self.register(Model(
            id="openrouter/anthropic/claude-sonnet-4.5",
            name="Sonnet 4.5",
            provider=ModelProvider.OPENROUTER,
            aliases=["claude-sonnet-4.5", "claude-sonnet-4-5", "anthropic/claude-sonnet-4.5", "anthropic/claude-sonnet-4-5", "openrouter/anthropic/claude-sonnet-4.5", "openrouter/anthropic/claude-sonnet-4-5", "Claude Sonnet 4.5", "4.5", "Sonnet 4.5", "arn:aws:bedrock:us-west-2:935064898258:inference-profile/global.anthropic.claude-sonnet-4-5-20250929-v1:0"],
            context_window=1_000_000,
            capabilities=[
                ModelCapability.CHAT,
                ModelCapability.FUNCTION_CALLING,
                ModelCapability.VISION,
                ModelCapability.THINKING,
            ],
            pricing=ModelPricing(
                input_cost_per_million_tokens=3.00 * pricing_multiplier,
                output_cost_per_million_tokens=15.00 * pricing_multiplier
            ),
            tier_availability=["paid"],
            priority=102,
            recommended=True,
            enabled=True,
            config=ModelConfig(
                extra_headers={
                    "anthropic-beta": "context-1m-2025-08-07",
                    "HTTP-Referer": config.OR_SITE_URL if hasattr(config, 'OR_SITE_URL') and config.OR_SITE_URL else "",
                    "X-Title": config.OR_APP_NAME if hasattr(config, 'OR_APP_NAME') and config.OR_APP_NAME else ""
                },
            )
        ))
        
        # Claude Haiku 4.5 - Fast and efficient via OpenRouter
        self.register(Model(
            id="openrouter/anthropic/claude-haiku-4.5",
            name="Haiku 4.5",
            provider=ModelProvider.OPENROUTER,
            aliases=["claude-haiku-4.5", "anthropic/claude-haiku-4.5", "anthropic/claude-haiku-4-5", "Claude Haiku 4.5", "global.anthropic.claude-haiku-4-5-20251001-v1:0", "bedrock/global.anthropic.claude-haiku-4-5-20251001-v1:0", "bedrock/converse/arn:aws:bedrock:us-west-2:935064898258:application-inference-profile/heol2zyy5v48"],
            context_window=200_000,
            capabilities=[
                ModelCapability.CHAT,
                ModelCapability.FUNCTION_CALLING,
                ModelCapability.VISION,
            ],
            pricing=ModelPricing(
                input_cost_per_million_tokens=1.00 * pricing_multiplier,
                output_cost_per_million_tokens=5.00 * pricing_multiplier
            ),
            tier_availability=["free", "paid"],
            priority=105,
            recommended=True,
            enabled=True,
            config=ModelConfig(
                extra_headers={
                    "HTTP-Referer": config.OR_SITE_URL if hasattr(config, 'OR_SITE_URL') and config.OR_SITE_URL else "",
                    "X-Title": config.OR_APP_NAME if hasattr(config, 'OR_APP_NAME') and config.OR_APP_NAME else ""
                },
            )
        ))

        # Grok 4 Fast - Via XAI directly
        self.register(Model(
            id="xai/grok-4-fast-non-reasoning",
            name="Grok 4 Fast",
            provider=ModelProvider.XAI,
            aliases=["grok-4-fast-non-reasoning", "Grok 4 Fast", "xai/grok-4-fast-non-reasoning", "grok-4-fast"],
            context_window=2_000_000,
            capabilities=[
                ModelCapability.CHAT,
                ModelCapability.FUNCTION_CALLING,
            ],
            pricing=ModelPricing(
                input_cost_per_million_tokens=0.20 * pricing_multiplier,
                output_cost_per_million_tokens=0.50 * pricing_multiplier
            ),
            tier_availability=["paid"],
            priority=98,
            enabled=True
        ))    
        
        # Meta Llama 4 Scout - Auto routing via OpenRouter
        self.register(Model(
            id="openrouter/meta-llama/llama-4-scout",
            name="Auto",
            provider=ModelProvider.OPENROUTER,
            aliases=["meta-llama/llama-4-scout", "llama-4-scout", "Auto", "openrouter/meta-llama/llama-4-scout"],
            context_window=128_000,
            capabilities=[
                ModelCapability.CHAT,
                ModelCapability.FUNCTION_CALLING,
            ],
            pricing=ModelPricing(
                input_cost_per_million_tokens=0.50 * pricing_multiplier,
                output_cost_per_million_tokens=1.50 * pricing_multiplier
            ),
            tier_availability=["paid"],
            priority=92,
            recommended=True,
            enabled=True,
            config=ModelConfig(
                extra_headers={
                    "HTTP-Referer": config.OR_SITE_URL if hasattr(config, 'OR_SITE_URL') and config.OR_SITE_URL else "",
                    "X-Title": config.OR_APP_NAME if hasattr(config, 'OR_APP_NAME') and config.OR_APP_NAME else ""
                }
            )
        ))  
        
        # OpenAI GPT-5 - Via OpenRouter
        self.register(Model(
            id="openrouter/openai/gpt-5",
            name="GPT-5",
            provider=ModelProvider.OPENROUTER,
            aliases=["gpt-5", "GPT-5", "openai/gpt-5", "openrouter/openai/gpt-5"],
            context_window=400_000,
            capabilities=[
                ModelCapability.CHAT,
                ModelCapability.FUNCTION_CALLING,
                ModelCapability.VISION,
                ModelCapability.STRUCTURED_OUTPUT,
            ],
            pricing=ModelPricing(
                input_cost_per_million_tokens=1.25 * pricing_multiplier,
                output_cost_per_million_tokens=10.00 * pricing_multiplier
            ),
            tier_availability=["paid"],
            priority=97,
            enabled=True,
            config=ModelConfig(
                extra_headers={
                    "HTTP-Referer": config.OR_SITE_URL if hasattr(config, 'OR_SITE_URL') and config.OR_SITE_URL else "",
                    "X-Title": config.OR_APP_NAME if hasattr(config, 'OR_APP_NAME') and config.OR_APP_NAME else ""
                }
            )
        ))
        
        # GPT-5 Codex - Via OpenRouter
        self.register(Model(
            id="openrouter/openai/gpt-5-codex",
            name="GPT-5 Codex",
            provider=ModelProvider.OPENROUTER,
            aliases=["gpt-5-codex", "GPT-5 Codex", "openai/gpt-5-codex", "openrouter/openai/gpt-5-codex"],
            context_window=400_000,
            capabilities=[
                ModelCapability.CHAT,
                ModelCapability.FUNCTION_CALLING,
                ModelCapability.STRUCTURED_OUTPUT,
            ],
            pricing=ModelPricing(
                input_cost_per_million_tokens=1.25 * pricing_multiplier,
                output_cost_per_million_tokens=10.00 * pricing_multiplier
            ),
            tier_availability=["paid"],
            priority=96,
            enabled=True,
            config=ModelConfig(
                extra_headers={
                    "HTTP-Referer": config.OR_SITE_URL if hasattr(config, 'OR_SITE_URL') and config.OR_SITE_URL else "",
                    "X-Title": config.OR_APP_NAME if hasattr(config, 'OR_APP_NAME') and config.OR_APP_NAME else ""
                }
            )
        ))
        
        # OpenAI GPT-5.1 Codex - Via OpenRouter
        self.register(Model(
            id="openrouter/openai/gpt-5.1-codex",
            name="GPT-5.1 Codex",
            provider=ModelProvider.OPENROUTER,
            aliases=["gpt-5.1-codex", "GPT-5.1 Codex", "openai/gpt-5.1-codex", "openrouter/openai/gpt-5.1-codex"],
            context_window=400_000,
            capabilities=[
                ModelCapability.CHAT,
                ModelCapability.FUNCTION_CALLING,
                ModelCapability.STRUCTURED_OUTPUT,
            ],
            pricing=ModelPricing(
                input_cost_per_million_tokens=1.25 * pricing_multiplier,
                output_cost_per_million_tokens=10.00 * pricing_multiplier
            ),
            tier_availability=["paid"],
            priority=96,
            enabled=True,
            config=ModelConfig(
                extra_headers={
                    "HTTP-Referer": config.OR_SITE_URL if hasattr(config, 'OR_SITE_URL') and config.OR_SITE_URL else "",
                    "X-Title": config.OR_APP_NAME if hasattr(config, 'OR_APP_NAME') and config.OR_APP_NAME else ""
                }
            )
        ))
        
        # OpenAI GPT-5 Mini - Via OpenRouter
        self.register(Model(
            id="openrouter/openai/gpt-5-mini",
            name="GPT-5 Mini",
            provider=ModelProvider.OPENROUTER,
            aliases=["gpt-5-mini", "GPT-5 Mini", "openai/gpt-5-mini", "openrouter/openai/gpt-5-mini"],
            context_window=400_000,
            capabilities=[
                ModelCapability.CHAT,
                ModelCapability.FUNCTION_CALLING,
                ModelCapability.STRUCTURED_OUTPUT,
            ],
            pricing=ModelPricing(
                input_cost_per_million_tokens=0.25 * pricing_multiplier,
                output_cost_per_million_tokens=2.00 * pricing_multiplier
            ),
            tier_availability=["free", "paid"],
            priority=96,
            enabled=True,
            config=ModelConfig(
                extra_headers={
                    "HTTP-Referer": config.OR_SITE_URL if hasattr(config, 'OR_SITE_URL') and config.OR_SITE_URL else "",
                    "X-Title": config.OR_APP_NAME if hasattr(config, 'OR_APP_NAME') and config.OR_APP_NAME else ""
                }
            )
        ))
        
        # OpenAI GPT-5 Nano - Via OpenRouter
        self.register(Model(
            id="openrouter/openai/gpt-5-nano-2025-08-07",
            name="GPT-5 Nano",
            provider=ModelProvider.OPENROUTER,
            aliases=["gpt-5-nano", "GPT-5 Nano", "openai/gpt-5-nano", "openai/gpt-5-nano-2025-08-07", "openrouter/openai/gpt-5-nano-2025-08-07"],
            context_window=400_000,
            capabilities=[
                ModelCapability.CHAT,
                ModelCapability.FUNCTION_CALLING,
                ModelCapability.STRUCTURED_OUTPUT,
            ],
            pricing=ModelPricing(
                input_cost_per_million_tokens=0.10 * pricing_multiplier,
                output_cost_per_million_tokens=0.80 * pricing_multiplier
            ),
            tier_availability=["free", "paid"],
            priority=95,
            enabled=True,
            config=ModelConfig(
                extra_headers={
                    "HTTP-Referer": config.OR_SITE_URL if hasattr(config, 'OR_SITE_URL') and config.OR_SITE_URL else "",
                    "X-Title": config.OR_APP_NAME if hasattr(config, 'OR_APP_NAME') and config.OR_APP_NAME else ""
                }
            )
        ))
        
        # Google Gemini 2.5 Pro - Via OpenRouter
        self.register(Model(
            id="openrouter/google/gemini-2.5-pro",
            name="Gemini 2.5 Pro",
            provider=ModelProvider.OPENROUTER,
            aliases=["gemini-2.5-pro", "Gemini 2.5 Pro", "google/gemini-2.5-pro", "openrouter/google/gemini-2.5-pro"],
            context_window=2_000_000,
            capabilities=[
                ModelCapability.CHAT,
                ModelCapability.FUNCTION_CALLING,
                ModelCapability.VISION,
                ModelCapability.STRUCTURED_OUTPUT,
            ],
            pricing=ModelPricing(
                input_cost_per_million_tokens=1.25 * pricing_multiplier,
                output_cost_per_million_tokens=10.00 * pricing_multiplier
            ),
            tier_availability=["paid"],
            priority=95,
            enabled=True,
            config=ModelConfig(
                extra_headers={
                    "HTTP-Referer": config.OR_SITE_URL if hasattr(config, 'OR_SITE_URL') and config.OR_SITE_URL else "",
                    "X-Title": config.OR_APP_NAME if hasattr(config, 'OR_APP_NAME') and config.OR_APP_NAME else ""
                }
            )
        ))
        
        # Google Gemini 2.5 Flash - Via OpenRouter
        self.register(Model(
            id="openrouter/google/gemini-2.5-flash",
            name="Gemini 2.5 Flash",
            provider=ModelProvider.OPENROUTER,
            aliases=["google/gemini-2.5-flash", "gemini-2.5-flash", "Gemini 2.5 Flash", "openrouter/google/gemini-2.5-flash"],
            context_window=1_050_000,
            capabilities=[
                ModelCapability.CHAT,
                ModelCapability.FUNCTION_CALLING,
                ModelCapability.VISION,
                ModelCapability.STRUCTURED_OUTPUT,
            ],
            pricing=ModelPricing(
                input_cost_per_million_tokens=0.30,
                output_cost_per_million_tokens=2.50,
                cached_read_cost_per_million_tokens=0.30,
                cache_write_5m_cost_per_million_tokens=3.75,
                cache_write_1h_cost_per_million_tokens=6.00
            ),
            tier_availability=["paid"],
            priority=93,
            recommended=True,
            enabled=True,
            config=ModelConfig(
                extra_headers={
                    "HTTP-Referer": config.OR_SITE_URL if hasattr(config, 'OR_SITE_URL') and config.OR_SITE_URL else "",
                    "X-Title": config.OR_APP_NAME if hasattr(config, 'OR_APP_NAME') and config.OR_APP_NAME else ""
                }
            )
        ))

        # Moonshot Kimi K2 - Via OpenRouter
        self.register(Model(
            id="openrouter/moonshotai/kimi-k2",
            name="Kimi K2",
            provider=ModelProvider.OPENROUTER,
            aliases=["kimi-k2", "Kimi K2", "moonshotai/kimi-k2", "openrouter/moonshotai/kimi-k2"],
            context_window=200_000,
            capabilities=[
                ModelCapability.CHAT,
                ModelCapability.FUNCTION_CALLING,
            ],
            pricing=ModelPricing(
                input_cost_per_million_tokens=1.00 * pricing_multiplier,
                output_cost_per_million_tokens=3.00 * pricing_multiplier
            ),
            tier_availability=["free", "paid"],
            priority=94,
            enabled=True,
            config=ModelConfig(
                extra_headers={
                    "HTTP-Referer": config.OR_SITE_URL if hasattr(config, 'OR_SITE_URL') and config.OR_SITE_URL else "",
                    "X-Title": config.OR_APP_NAME if hasattr(config, 'OR_APP_NAME') and config.OR_APP_NAME else ""
                }
            )
        ))
        
        # Moonshot Kimi K2 Thinking - Via OpenRouter
        self.register(Model(
            id="openrouter/moonshotai/kimi-k2-thinking",
            name="Kimi K2 Thinking",
            provider=ModelProvider.OPENROUTER,
            aliases=["kimi-k2-thinking", "Kimi K2 Thinking", "moonshotai/kimi-k2-thinking", "openrouter/moonshotai/kimi-k2-thinking"],
            context_window=200_000,
            capabilities=[
                ModelCapability.CHAT,
                ModelCapability.FUNCTION_CALLING,
                ModelCapability.THINKING,
            ],
            pricing=ModelPricing(
                input_cost_per_million_tokens=1.50 * pricing_multiplier,
                output_cost_per_million_tokens=6.00 * pricing_multiplier
            ),
            tier_availability=["paid"],
            priority=94,
            enabled=True,
            config=ModelConfig(
                extra_headers={
                    "HTTP-Referer": config.OR_SITE_URL if hasattr(config, 'OR_SITE_URL') and config.OR_SITE_URL else "",
                    "X-Title": config.OR_APP_NAME if hasattr(config, 'OR_APP_NAME') and config.OR_APP_NAME else ""
                }
            )
        ))

        # GLM 4.6 - Via OpenRouter
        self.register(Model(
            id="openrouter/z-ai/glm-4.6",
            name="GLM 4.6",
            provider=ModelProvider.OPENROUTER,
            aliases=["glm-4.6", "GLM 4.6", "z-ai/glm-4.6", "openrouter/z-ai/glm-4.6"],
            context_window=202_752,
            capabilities=[
                ModelCapability.CHAT,
                ModelCapability.FUNCTION_CALLING,
            ],
            pricing=ModelPricing(
                input_cost_per_million_tokens=0.50 * pricing_multiplier,
                output_cost_per_million_tokens=1.75 * pricing_multiplier
            ),
            tier_availability=["paid"],
            priority=94,
            enabled=True,
            config=ModelConfig(
                extra_headers={
                    "HTTP-Referer": config.OR_SITE_URL if hasattr(config, 'OR_SITE_URL') and config.OR_SITE_URL else "",
                    "X-Title": config.OR_APP_NAME if hasattr(config, 'OR_APP_NAME') and config.OR_APP_NAME else ""
                }
            )
        ))

        # Minimax M2 - Via OpenRouter
        self.register(Model(
            id="openrouter/minimax/minimax-m2",
            name="Minimax M2",
            provider=ModelProvider.OPENROUTER,
            aliases=["minimax/minimax-m2", "minimax-m2", "openrouter/minimax/minimax-m2"],
            context_window=200_000,
            capabilities=[
                ModelCapability.CHAT,
                ModelCapability.FUNCTION_CALLING,
            ],
            pricing=ModelPricing(
                input_cost_per_million_tokens=0.60 * pricing_multiplier,
                output_cost_per_million_tokens=2.00 * pricing_multiplier
            ),
            tier_availability=["paid"],
            priority=93,
            enabled=True,
            config=ModelConfig(
                extra_headers={
                    "HTTP-Referer": config.OR_SITE_URL if hasattr(config, 'OR_SITE_URL') and config.OR_SITE_URL else "",
                    "X-Title": config.OR_APP_NAME if hasattr(config, 'OR_APP_NAME') and config.OR_APP_NAME else ""
                }
            )
        ))

    def register(self, model: Model) -> None:
        self._models[model.id] = model
        for alias in model.aliases:
            self._aliases[alias] = model.id
    
    def get(self, model_id: str) -> Optional[Model]:
        if not model_id:
            return None
            
        if model_id in self._models:
            return self._models[model_id]
        
        if model_id in self._aliases:
            actual_id = self._aliases[model_id]
            return self._models.get(actual_id)
        
        return None
    
    def get_all(self, enabled_only: bool = True) -> List[Model]:
        models = list(self._models.values())
        if enabled_only:
            models = [m for m in models if m.enabled]
        return models
    
    def get_by_tier(self, tier: str, enabled_only: bool = True) -> List[Model]:
        models = self.get_all(enabled_only)
        return [m for m in models if tier in m.tier_availability]
    
    def get_by_provider(self, provider: ModelProvider, enabled_only: bool = True) -> List[Model]:
        models = self.get_all(enabled_only)
        return [m for m in models if m.provider == provider]
    
    def get_by_capability(self, capability: ModelCapability, enabled_only: bool = True) -> List[Model]:
        models = self.get_all(enabled_only)
        return [m for m in models if capability in m.capabilities]
    
    def resolve_model_id(self, model_id: str) -> Optional[str]:
        model = self.get(model_id)
        return model.id if model else None
    
    def get_litellm_model_id(self, model_id: str) -> str:
        """Get the actual model ID to pass to LiteLLM.
        
        Resolves kortix/basic -> Haiku 4.5 and kortix/power -> Sonnet 4.5 (OpenRouter Anthropic).
        """
        if model_id == "kortix/basic":
            return _KORTIX_BASIC_MODEL
        if model_id == "kortix/power":
            return _KORTIX_POWER_MODEL
        
        model = self.get(model_id)
        if model:
            if model.id == "kortix/basic":
                return _KORTIX_BASIC_MODEL
            if model.id == "kortix/power":
                return _KORTIX_POWER_MODEL
            return model.id
        
        return model_id
    
    def resolve_from_litellm_id(self, litellm_model_id: str) -> str:
        """Reverse lookup: resolve a LiteLLM model ID back to registry model ID.
        
        Used by cost calculator to find pricing for kortix models.
        """
        if litellm_model_id == _KORTIX_BASIC_MODEL:
            return "kortix/basic"
        if litellm_model_id == _KORTIX_POWER_MODEL:
            return "kortix/power"
        
        if self.get(litellm_model_id):
            return litellm_model_id
        
        return litellm_model_id
    
    def get_aliases(self, model_id: str) -> List[str]:
        model = self.get(model_id)
        return model.aliases if model else []
    
    def enable_model(self, model_id: str) -> bool:
        model = self.get(model_id)
        if model:
            model.enabled = True
            return True
        return False
    
    def disable_model(self, model_id: str) -> bool:
        model = self.get(model_id)
        if model:
            model.enabled = False
            return True
        return False
    
    def get_context_window(self, model_id: str, default: int = 31_000) -> int:
        model = self.get(model_id)
        return model.context_window if model else default
    
    def get_pricing(self, model_id: str) -> Optional[ModelPricing]:
        model = self.get(model_id)
        return model.pricing if model else None
    
    def to_legacy_format(self) -> Dict:
        models_dict = {}
        pricing_dict = {}
        context_windows_dict = {}
        
        for model in self.get_all(enabled_only=True):
            models_dict[model.id] = {
                "pricing": {
                    "input_cost_per_million_tokens": model.pricing.input_cost_per_million_tokens,
                    "output_cost_per_million_tokens": model.pricing.output_cost_per_million_tokens,
                } if model.pricing else None,
                "context_window": model.context_window,
                "tier_availability": model.tier_availability,
            }
            
            if model.pricing:
                pricing_dict[model.id] = {
                    "input_cost_per_million_tokens": model.pricing.input_cost_per_million_tokens,
                    "output_cost_per_million_tokens": model.pricing.output_cost_per_million_tokens,
                }
            
            context_windows_dict[model.id] = model.context_window
        
        free_models = [m.id for m in self.get_by_tier("free")]
        paid_models = [m.id for m in self.get_by_tier("paid")]
        
        from core.utils.logger import logger
        logger.debug(f"Legacy format generation: {len(free_models)} free models, {len(paid_models)} paid models")
        logger.debug(f"Free models: {free_models}")
        logger.debug(f"Paid models: {paid_models}")
        
        return {
            "MODELS": models_dict,
            "HARDCODED_MODEL_PRICES": pricing_dict,
            "MODEL_CONTEXT_WINDOWS": context_windows_dict,
            "FREE_TIER_MODELS": free_models,
            "PAID_TIER_MODELS": paid_models,
        }

registry = ModelRegistry()
