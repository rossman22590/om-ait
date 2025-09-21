# Codex Mini Integration Documentation

## Overview
This document outlines the integration of the OpenAI Codex Mini model into the application, including configuration details and implementation notes.

## Model Details
- **Model Name**: Codex Mini
- **Provider**: OpenAI (via OpenRouter)
- **Model ID**: `openrouter/openai/codex-mini`
- **Context Window**: 128,000 tokens
- **Pricing**:
  - Input: $1.50 per 1M tokens
  - Output: $6.00 per 1M tokens

## Implementation

### Backend Configuration
1. **Model Registration**
   - Added to `core/ai_models/registry.py`
   - Configured with appropriate capabilities and pricing

2. **Integration Points**
   - Uses OpenRouter for model access
   - Requires `OPENROUTER_API_KEY` environment variable
   - Falls back to OpenRouter's infrastructure for model access

### Frontend Configuration
1. **Model Selection**
   - Available in the model dropdown for paid users
   - Properly formatted display name: "Codex Mini"
   - Recognized by both `codex-mini` and `openai/codex-mini` aliases

## Capabilities
- Chat completion
- Function calling
- Code interpretation
- Structured output generation

## Usage Notes
1. **Authentication**
   - Requires valid OpenRouter API key
   - Key should be set in environment variables as `OPENROUTER_API_KEY`

2. **Rate Limiting**
   - Subject to OpenRouter's rate limits
   - Monitor usage through OpenRouter dashboard

3. **Billing**
   - Billed per token usage
   - Uses the same billing pipeline as other models

## Troubleshooting

### Common Issues
1. **API Key Not Found**
   - Ensure `OPENROUTER_API_KEY` is set in environment
   - Verify the key has necessary permissions

2. **Model Not Available**
   - Check OpenRouter status page for outages
   - Verify model name is correct in registry

3. **Authentication Failures**
   - Validate API key format
   - Check for network connectivity issues

## Related Files
- `core/ai_models/registry.py` - Model registration and configuration
- `core/services/llm.py` - LLM service integration
- `frontend/src/lib/stores/model-store.ts` - Frontend model store

## Version History
- **2024-09-20**: Initial integration of Codex Mini via OpenRouter
- **2024-09-20**: Updated model configuration and capabilities
- **2024-09-20**: Added proper error handling and fallbacks

## Future Enhancements
- Monitor performance and adjust token limits if needed
- Consider adding more fine-grained capability controls
- Explore direct integration options if usage volume increases
