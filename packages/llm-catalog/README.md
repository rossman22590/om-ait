# @kortix/llm-catalog

This package supplies the bundled provider catalog and the Kortix managed model lineup. The API owns runtime routing and the live served catalog.

## Managed models

The managed lineup is served through Morph. The model picker groups every managed model under **Kortix**. Requests use Kortix credits. Project BYOK providers remain separate.

| Picker name | Gateway model ID | Image input |
| --- | --- | --- |
| Kimi K3 2.8T | `morph-kimik3` | Yes |
| Kimi K3 2.8T Fast | `morph-kimik3-fast` | Yes |
| GLM-5.3 744B (default) | `morph-glm53-744b` | No |
| DeepSeek V4.1 Flash | `morph-dsv41flash` | Yes |
| DeepSeek V4 Flash 0731 | `morph-dsv4flash` | No |

The OpenCode reference is `kortix/<gateway model ID>`. The bundled sandbox fallback uses the same IDs and capabilities. The API only serves models with a configured `MORPH_API_KEY`.

Morph's model page lists GLM-5.3-Flash, MiniMax M3, and Qwen 3.8 27B. The supplied API key did not serve those three IDs on 2026-09-17. Add them after the Morph endpoint accepts real chat requests with this key.

## Catalog

`CATALOG` is the bundled models.dev snapshot. `MANAGED_MODELS` contains the managed lineup. `PLATFORM_DEFAULT_MODEL_ID` is `morph-glm53-744b`. The runtime catalog refreshes from the configured models.dev URL.

## License

Elastic-2.0.
