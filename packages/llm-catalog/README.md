# @kortix/llm-catalog

This package supplies the bundled provider catalog and the Kortix managed model lineup. The API owns runtime routing and the live served catalog.

## Managed models

The managed lineup is served through Morph. The model picker groups every managed model under **Kortix**. Requests use Kortix credits. Project BYOK providers remain separate.

| Picker name | Gateway model ID | Input | USD per 1M input / cached input / output tokens |
| --- | --- | --- | --- |
| Kimi K3 2.8T | `morph-kimik3` | Text, image | $2.50 / $0.29 / $14.00 |
| Kimi K3 2.8T Fast | `morph-kimik3-fast` | Text, image | $6.00 / $0.60 / $22.50 |
| GLM-5.3 744B (default) | `morph-glm53-744b` | Text | $1.19 / $0.1955 / $3.74 |
| DeepSeek V4.1 Flash | `morph-dsv41flash` | Text, image | $0.30 / $0.009 / $1.20 |
| DeepSeek V4 Flash 0731 | `morph-dsv4flash` | Text | $0.141953 / $0.0359375 / $0.399625 |

Morph's [public model feed](https://www.morphllm.com/api/models/json) reports these input types and upstream prices. These are Morph rates before Kortix credit markup.

The OpenCode reference is `kortix/<gateway model ID>`. The bundled sandbox fallback uses the same IDs and capabilities. The API only serves models with a configured `MORPH_API_KEY`.

The public feed also lists GLM-5.3-Flash (`morph-glm53flash`) with text, image, and video input at $0.10 / $0.02 / $0.35 per 1M input / cached input / output tokens. On 2026-09-17, the supplied key received HTTP 400 `invalid_request_error` for that ID, not HTTP 429. MiniMax M3 and Qwen 3.8 27B are absent from the public feed and returned the same HTTP 400. Add an ID only after the configured endpoint accepts a real chat request with this key.

## Catalog

`CATALOG` is the bundled models.dev snapshot. `MANAGED_MODELS` contains the managed lineup. `PLATFORM_DEFAULT_MODEL_ID` is `morph-glm53-744b`. The runtime catalog refreshes from the configured models.dev URL.

## License

Elastic-2.0.
