# @kortix/llm-catalog

This package supplies the bundled provider catalog and the Kortix managed model lineup. The API owns runtime routing and the live served catalog.

## Managed models

The managed lineup uses OpenRouter routes pinned to named zero-data-retention endpoints. The model picker groups every managed model under **Kortix**. Requests use Kortix credits. Project BYOK providers remain separate.

| Picker name | Gateway model ID | Input | USD per 1M input / cached input / output tokens |
| --- | --- | --- | --- |
| Kimi K3 2.8T | `kimi-k3` | Text, image | $2.50 / $0.25 / $10.95 |
| Kimi K3 2.8T Fast | `kimi-k3-fast` | Text, image | $4.50 / $0.45 / $22.50 |
| DeepSeek V4.1 Flash (default) | `deepseek-v4.1-flash` | Text, image | $0.20 / $0.006 / $0.60 |
| GLM-5.3-Flash | `glm-5.3-flash` | Text, image | $0.15 / $0.05 / $0.50 |

The prices match the pinned [OpenRouter endpoints](https://openrouter.ai/api/v1/endpoints/zdr) on 2026-09-18. All rates exclude Kortix credit markup.

The OpenCode reference is `kortix/<gateway model ID>`. The bundled sandbox fallback uses the same IDs and capabilities. All entries require `OPENROUTER_API_KEY`.

Every managed model declares text and image input. Pinned image requests returned HTTP 200 for Kimi and DeepSeek on 2026-09-18. Kimi K3 uses `wafer`; Kimi K3 Fast uses `fireworks/fast`; DeepSeek V4.1 Flash uses `deepinfra/fp8`. GLM-5.3-Flash is pinned to `coreweave/nvfp4` with `zdr: true`, `data_collection: deny`, and `allow_fallbacks: false`. On 2026-09-18, three requests to that endpoint returned HTTP 429 `rate_limit_exceeded` from CoreWeave's shared pool. Do not make it the platform default or publish it as available until a pinned text and image request succeeds with the deployment key. DeepSeek V4.1 Flash remains the default.

The public Morph feed lists a different GLM-5.3-Flash endpoint (`morph-glm53flash`) at $0.10 / $0.02 / $0.35. On 2026-09-17, the supplied Morph key received HTTP 400 `invalid_request_error` for that ID. MiniMax M3 and Qwen 3.8 27B are absent from that feed and returned HTTP 400. GLM-5.3 744B and DeepSeek V4 Flash 0731 accept only text input, so they are excluded. Runtime managed-model overrides also remove entries with `vision: false`.

## Catalog

`CATALOG` is the bundled models.dev snapshot. `MANAGED_MODELS` contains the managed lineup. `PLATFORM_DEFAULT_MODEL_ID` is `deepseek-v4.1-flash`. The runtime catalog refreshes from the configured models.dev URL.

## License

Elastic-2.0.
