# @kortix/llm-catalog

This package supplies the bundled provider catalog and the Kortix managed model lineup. The API owns runtime routing and the live served catalog.

## Managed models

The managed lineup is served through Morph. The model picker groups every managed model under **Kortix**. Requests use Kortix credits. Project BYOK providers remain separate.

| Picker name | Gateway model ID | Input | USD per 1M input / cached input / output tokens |
| --- | --- | --- | --- |
| Kimi K3 2.8T | `morph-kimik3` | Text, image | $2.50 / $0.29 / $14.00 |
| Kimi K3 2.8T Fast | `morph-kimik3-fast` | Text, image | $6.00 / $0.60 / $22.50 |
| DeepSeek V4.1 Flash (default) | `morph-dsv41flash` | Text, image | $0.30 / $0.009 / $1.20 |

Morph's [public model feed](https://www.morphllm.com/api/models/json) reports these input types and upstream prices. These are Morph rates before Kortix credit markup.

The OpenCode reference is `kortix/<gateway model ID>`. The bundled sandbox fallback uses the same IDs and capabilities. The API only serves models with a configured `MORPH_API_KEY`.

Every managed model accepts text and image input. A real image chat request on 2026-09-17 returned HTTP 200 and identified the test image's red square on all three IDs. Kimi K3 is the higher capability choice. DeepSeek V4.1 Flash is the lower cost default. The default's transient fallback is Kimi K3, so image input remains supported during a fallback.

The public feed also lists GLM-5.3-Flash (`morph-glm53flash`) with text, image, and video input at $0.10 / $0.02 / $0.35 per 1M input / cached input / output tokens. On 2026-09-17, the supplied key received HTTP 400 `invalid_request_error` for that ID, not HTTP 429. MiniMax M3 and Qwen 3.8 27B are absent from the public feed and returned the same HTTP 400. GLM-5.3 744B and DeepSeek V4 Flash 0731 are callable but accept only text input. Add an ID only after the configured endpoint accepts a real image chat request with this key.

## Catalog

`CATALOG` is the bundled models.dev snapshot. `MANAGED_MODELS` contains the managed lineup. `PLATFORM_DEFAULT_MODEL_ID` is `morph-dsv41flash`. The runtime catalog refreshes from the configured models.dev URL.

## License

Elastic-2.0.
