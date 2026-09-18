# @kortix/llm-catalog

This package supplies the bundled provider catalog and the Kortix managed model lineup. The API owns runtime routing and the live served catalog.

## Managed models

The managed lineup uses OpenRouter routes pinned to named zero-data-retention endpoints. The model picker groups every managed model under **Kortix**. Requests use Kortix credits. Project BYOK providers remain separate.

| Picker name | Gateway model ID | Input | USD per 1M input / cached input / output tokens |
| --- | --- | --- | --- |
| DeepSeek V4.1 Flash (default) | `deepseek-v4.1-flash` | Text, image | $0.20 / $0.006 / $0.60 |
| GLM-5.3-Flash | `glm-5.3-flash` | Text, image | $0.15 / $0.05 / $0.50 |
| DeepSeek V4 Flash 0731 | `deepseek-v4-flash-0731` | Text only | $0.06 / $0.015 / $0.18 |

The prices match the pinned [OpenRouter endpoints](https://openrouter.ai/api/v1/endpoints/zdr) on 2026-09-18. All rates exclude Kortix credit markup.

The OpenCode reference is `kortix/<gateway model ID>`. The bundled sandbox fallback uses the same IDs and capabilities. All entries require `OPENROUTER_API_KEY`.

DeepSeek V4.1 Flash uses `deepinfra/fp8` for text and image. DeepSeek V4 Flash 0731 uses `deepinfra/fp8` for text only; a pinned text request returned HTTP 200 on 2026-09-18. GLM-5.3-Flash uses `coreweave/nvfp4` for text and image. Every route sets `zdr: true`, `data_collection: deny`, and `allow_fallbacks: false`. On 2026-09-18, pinned GLM requests returned HTTP 429 `rate_limit_exceeded` from CoreWeave's shared pool. DeepSeek V4.1 Flash remains the default until a pinned GLM text and image request succeeds with the deployment key.

The public Morph feed lists a different GLM-5.3-Flash endpoint (`morph-glm53flash`) at $0.10 / $0.02 / $0.35. On 2026-09-17, the supplied Morph key received HTTP 400 `invalid_request_error` for that ID. MiniMax M3 and Qwen 3.8 27B are absent from that feed and returned HTTP 400. GLM-5.3 744B accepts only text input and is excluded. Runtime managed-model overrides remove entries with `vision: false` except `deepseek-v4-flash-0731`.

DeepSeek V4 Pro 0813 is also text only. OpenRouter's ZDR endpoint list quotes $0.70 input and $2.88 output per million tokens on Ionstream, versus $0.06 and $0.18 for the selected V4 Flash 0731 route. Pro is not part of this cost-focused lineup.

## Catalog

`CATALOG` is the bundled models.dev snapshot. `MANAGED_MODELS` contains the managed lineup. `PLATFORM_DEFAULT_MODEL_ID` is `deepseek-v4.1-flash`. The runtime catalog refreshes from the configured models.dev URL.

## License

Elastic-2.0.
