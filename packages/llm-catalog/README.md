# @kortix/llm-catalog

This package supplies the bundled provider catalog and the Kortix managed model lineup. The API owns runtime routing and the live served catalog.

## Managed models

The managed lineup uses Morph and an OpenRouter route pinned to CoreWeave. The model picker groups every managed model under **Kortix**. Requests use Kortix credits. Project BYOK providers remain separate.

| Picker name | Gateway model ID | Input | USD per 1M input / cached input / output tokens |
| --- | --- | --- | --- |
| Kimi K3 2.8T | `morph-kimik3` | Text, image | $2.50 / $0.29 / $14.00 |
| Kimi K3 2.8T Fast | `morph-kimik3-fast` | Text, image | $6.00 / $0.60 / $22.50 |
| DeepSeek V4.1 Flash (default) | `morph-dsv41flash` | Text, image | $0.30 / $0.009 / $1.20 |
| GLM-5.3-Flash | `glm-5.3-flash` | Text, image | $0.15 / $0.05 / $0.50 |

Morph's [public model feed](https://www.morphllm.com/api/models/json) reports the Morph input types and upstream prices. The GLM rate is the [CoreWeave OpenRouter endpoint](https://openrouter.ai/z-ai/glm-5.3-flash-20260826/) rate. All rates exclude Kortix credit markup.

The OpenCode reference is `kortix/<gateway model ID>`. The bundled sandbox fallback uses the same IDs and capabilities. Morph entries require `MORPH_API_KEY`; GLM-5.3-Flash requires `OPENROUTER_API_KEY`.

Every managed model declares text and image input. A real image chat request on 2026-09-17 returned HTTP 200 and identified the test image's red square on all three Morph IDs. GLM-5.3-Flash is pinned to `coreweave/nvfp4` with `zdr: true`, `data_collection: deny`, and `allow_fallbacks: false`. On 2026-09-18, three requests to that endpoint returned HTTP 429 `rate_limit_exceeded` from CoreWeave's shared pool. Do not make it the platform default or publish it as available until a pinned text and image request succeeds with the deployment key. DeepSeek V4.1 Flash remains the default.

The public Morph feed lists a different GLM-5.3-Flash endpoint (`morph-glm53flash`) at $0.10 / $0.02 / $0.35. On 2026-09-17, the supplied Morph key received HTTP 400 `invalid_request_error` for that ID. MiniMax M3 and Qwen 3.8 27B are absent from that feed and returned HTTP 400. GLM-5.3 744B and DeepSeek V4 Flash 0731 accept only text input, so they are excluded. Runtime managed-model overrides also remove entries with `vision: false`.

## Catalog

`CATALOG` is the bundled models.dev snapshot. `MANAGED_MODELS` contains the managed lineup. `PLATFORM_DEFAULT_MODEL_ID` is `morph-dsv41flash`. The runtime catalog refreshes from the configured models.dev URL.

## License

Elastic-2.0.
