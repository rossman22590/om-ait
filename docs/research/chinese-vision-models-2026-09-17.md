# Chinese vision models for Kortix Managed — 2026-09-17

## Decision

Offer only Morph models that accept both text and images with the configured key. Set DeepSeek V4.1 Flash as the default. Offer Kimi K3 and Kimi K3 Fast as quality and latency choices. Keep the managed default's transient fallback on Kimi K3 so an image turn remains valid after fallback. Keep text-only Morph models out of the Kortix managed picker.

This decision keeps the existing Morph-only upstream rule. A public model listing is insufficient evidence for launch: the same key must complete a real image chat request through the configured endpoint. The live test used a 128 × 128 PNG with a red square and asked for its color. All three selected models returned HTTP 200 and answered “red.”

## US residency and zero data retention: launch gate

The three image tests establish model capability only. They do **not** establish US-only processing or zero data retention (ZDR) for the supplied key. Do not describe Kortix Managed as US-hosted or ZDR until the full serving path meets both requirements.

Morph's [privacy policy](https://www.morphllm.com/privacy) allows up to 90 days of content retention on its free/pay-as-you-go tier and up to 30 days on its paid tier. The policy gives its enterprise tier ZDR. It says primary processing occurs in the United States, with additional processing in select other countries. “Primary” does not guarantee that a specific request remains in the US. Regional data centers are described as an option, but the public policy does not identify a US-pinned endpoint for this key.

Morph's [dedicated inference](https://www.morphllm.com/dedicated-inference) advertises no stored prompts or responses and retains operational and billing metadata. It uses GPU-hour billing, a 90-day initial term, and a different model catalog. That catalog lists Kimi K3 and GLM-5.3-Flash, but does not list the current default DeepSeek V4.1 Flash. The page does not specify the physical region. The per-token prices below therefore apply to the current shared API only; they are not a dedicated-endpoint quote.

Kortix itself also stores project and session data. The [production US East 2 migration runbook](../runbooks/prod-us-east-2-supabase-migration.md) says production traffic still uses the `eu-west-2` source. It records a US shadow whose replication is broken and whose deployment lane is disabled. The [sandbox-provider runbook](../runbooks/enable-sandbox-provider.md) places the production API secret and ECS service in `eu-west-2`. Provider-side ZDR would not make the whole Kortix product ZDR, and a US Morph endpoint would not make the current Kortix production data plane US-only.

Before launch, obtain written terms and technical verification for:

1. The exact Morph account, key, endpoint, and selected model IDs covered by ZDR, including image inputs, tool calls, errors, caches, logs, backups, and subprocessors.
2. A US-only processing and storage region for inference, failover, support access, and operational metadata. Confirm that the endpoint fails closed when US capacity is unavailable.
3. The dedicated or enterprise price, capacity, minimum term, and an image-capable default model available in that US region.
4. A Kortix product scope: either move all relevant production data and sandbox surfaces to the US, or state narrowly that **model inference** runs in the US with provider-side ZDR. Do not imply Kortix deletes customers' stored projects or conversations.

The current PR remains a model-capability preview. Its public privacy and residency claims must wait for these checks.

## Current eligible models

Morph's [machine-readable model feed](https://www.morphllm.com/api/models/json) supplies input types, context, and rates. Prices below are upstream USD per million tokens, before Kortix credit markup. All three output text and list 1,048,576 input context tokens. The Kortix catalog advertises a conservative 16,384 output-token ceiling.

| Model | Input | Cached input | Output | Current AA Intelligence Index | Role |
| --- | ---: | ---: | ---: | ---: | --- |
| DeepSeek V4.1 Flash (`morph-dsv41flash`) | $0.30 | $0.009 | $1.20 | 40 | Default and BYOK fallback |
| Kimi K3 (`morph-kimik3`) | $2.50 | $0.29 | $14.00 | 44 | Quality option and managed transient fallback |
| Kimi K3 Fast (`morph-kimik3-fast`) | $6.00 | $0.60 | $22.50 | Same K3 weights; serving tuned for latency | Premium latency option |

The [Artificial Analysis comparison](https://artificialanalysis.ai/models/comparisons/deepseek-v4-1-flash-vs-kimi-k3) reports Index 40 versus 44. It also reports higher throughput and lower latency for DeepSeek V4.1 Flash, and greater output per task for DeepSeek. The Index is a broad text/agent aggregate, not a vision-only score or a Kortix workload evaluation. Kimi K3 costs 8.3× more per uncached input token and 11.7× more per output token at Morph's current rates. Both have native vision in their [DeepSeek](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash) and [Kimi](https://www.kimi.com/en/blog/kimi-k3) model descriptions.

## Strongest next candidate

GLM-5.3-Flash (`morph-glm53flash`) accepts text, image, and video according to [Morph's feed](https://www.morphllm.com/api/models/json). Morph lists $0.10 input, $0.02 cached input, and $0.35 output per million tokens. [Artificial Analysis](https://artificialanalysis.ai/models/comparisons/glm-5-3-flash-vs-kimi-k3) scores it 42 versus Kimi K3's 44. This is the best reported price/capability candidate for a future default.

It is not currently routable with the configured key. Three `POST /v1/chat/completions` requests on 2026-09-17 returned HTTP 400 `invalid_request_error`, not HTTP 429. The response said the model was not served by this endpoint and listed apply models as accepted. `GET /v1/models` for the same key omitted it. Morph's public feed still marks it `is_ready: true`. Add it only after the configured key and endpoint accept a real text-plus-image request.

## Exclusions

- GLM-5.3 744B and DeepSeek V4 Flash 0731 return HTTP 200 for text, but Morph's feed lists only text input. They cannot meet the default image contract.
- MiniMax M3 has text, image, and video input according to its [model card](https://huggingface.co/MiniMaxAI/MiniMax-M3). Morph's current model feed omits its alias, and the configured endpoint returns HTTP 400. [Artificial Analysis](https://artificialanalysis.ai/models/comparisons/deepseek-v4-1-flash-vs-minimax-m3) scores it 30 versus DeepSeek V4.1 Flash's 40, so it has no clear quality case even if restored.
- Qwen 3.8 27B has image and video input according to its [model card](https://huggingface.co/Qwen/Qwen3.8-27B). Morph [retired its public Qwen aliases](https://www.morphllm.com/qwen-api) on 2026-08-27. The configured endpoint returns HTTP 400, and Morph publishes no current per-token rate for this alias.

## Launch checks

1. The served managed catalog contains exactly the three image-capable IDs above, each branded `kortix`.
2. A fresh session with no model override selects `morph-dsv41flash`. A text prompt and an attached image reach it.
3. The default transient fallback selects `morph-kimik3`. A BYOK fallback selects `morph-dsv41flash`.
4. A preview session completes both text and image turns with the preview Morph key. The repository Actions secret `MORPH_API_KEY` is required for this check.
