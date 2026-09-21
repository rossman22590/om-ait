import { describe, expect, mock, test } from 'bun:test';
import { channelTurnModel, promptModelOverride, visionCandidates } from '../channels/vision-model';

/**
 * Why this exists: on dev 2026-09-19 a Teams message with a pasted screenshot
 * ran on `deepseek-v4-flash`, whose served catalog entry says
 * `capabilities.input.image: false`. The agent downloaded the PNG (28 740
 * bytes, verified), called `read`, saw nothing, went looking for ImageMagick
 * and tesseract, and ended the turn with no answer.
 *
 * `visionModelFor` itself reads the live gateway catalog, so its behaviour is
 * covered where the catalog is real (the channel session tests + the live dev
 * run). What is pure and worth pinning here is the wire shape of the override:
 * an override with the wrong `providerID` silently resolves to nothing and the
 * turn quietly runs on the text-only model again.
 */
describe('promptModelOverride', () => {
  test('a managed slug is addressed on the kortix provider', () => {
    expect(promptModelOverride('gpt-5.6-luna')).toEqual({
      providerID: 'kortix',
      modelID: 'gpt-5.6-luna',
    });
  });

  test('an already-prefixed ref does not get a second provider segment', () => {
    expect(promptModelOverride('kortix/gpt-5.6-luna')).toEqual({
      providerID: 'kortix',
      modelID: 'gpt-5.6-luna',
    });
  });

  test('a native provider ref keeps its own provider', () => {
    expect(promptModelOverride('anthropic/claude-opus-4-8')).toEqual({
      providerID: 'anthropic',
      modelID: 'claude-opus-4-8',
    });
  });

  test('a BYOK ref with a nested model id keeps the whole tail as the model', () => {
    expect(promptModelOverride('openrouter/z-ai/glm-5.3')).toEqual({
      providerID: 'openrouter',
      modelID: 'z-ai/glm-5.3',
    });
  });
});

/**
 * Candidate ORDER is the whole safety story. Probed live on dev 2026-09-21,
 * the configured target `gpt-5.6-luna` answers "requires Kortix's managed
 * provider, which is disabled on this deployment" — so a selector that
 * returns only the configured id either no-ops or fails the turn. The list
 * has to fall through to something the deployment actually serves
 * (`glm-5.3-flash` there, verified with a real prompt).
 */
describe('visionCandidates', () => {
  test('the configured target comes first', () => {
    expect(visionCandidates('p1', 'deepseek-v4-flash')[0]).toBe('gpt-5.6-luna');
  });

  test('the rest fall through cheapest-first, so an unservable target still has a successor', () => {
    expect(visionCandidates('p1', 'deepseek-v4-flash')).toEqual([
      'gpt-5.6-luna',
      'glm-5.3-flash',
      'kimi-k3',
    ]);
  });

  test('a text-only model is never a candidate', () => {
    expect(visionCandidates('p1', 'deepseek-v4-flash')).not.toContain('deepseek-v4-flash');
  });

  test('a model that already reads images is not offered as its own replacement', () => {
    expect(visionCandidates('p1', 'glm-5.3-flash')).not.toContain('glm-5.3-flash');
  });

  test('a kortix/-prefixed current model is matched on its wire id', () => {
    expect(visionCandidates('p1', 'kortix/gpt-5.6-luna')).not.toContain('gpt-5.6-luna');
  });
});

/**
 * The second way a channel turn is dead before it starts: the session's pin
 * was retired from the catalog. Verified on dev 2026-09-21 —
 * `PUT /sessions/:id/model` answered
 * `Model "deepseek-v4-flash" is not available for this account` for the model
 * that Teams session had been pinned to since 2026-09-18, so every turn would
 * have failed upstream with nothing shown to the user.
 */
describe('channelTurnModel', () => {
  test('leaves a healthy pin alone when the message has no image', async () => {
    expect(
      await channelTurnModel({
        projectId: 'p1',
        accountId: 'a1',
        userId: 'u1',
        currentModel: 'glm-5.3-flash',
        hasImage: false,
      }),
    ).toBeNull();
  });

  test('leaves a vision-capable pin alone even when the message has an image', async () => {
    expect(
      await channelTurnModel({
        projectId: 'p1',
        accountId: 'a1',
        userId: 'u1',
        currentModel: 'glm-5.3-flash',
        hasImage: true,
      }),
    ).toBeNull();
  });

  test('replaces a text-only pin for an image message', async () => {
    expect(
      await channelTurnModel({
        projectId: 'p1',
        accountId: 'a1',
        userId: 'u1',
        currentModel: 'deepseek-v4-flash',
        hasImage: true,
      }),
    ).toBe('glm-5.3-flash');
  });

  test('replaces a retired pin with the platform default when no image is involved', async () => {
    expect(
      await channelTurnModel({
        projectId: 'p1',
        accountId: 'a1',
        userId: 'u1',
        currentModel: 'retired-model-v1',
        hasImage: false,
      }),
    ).toBe('deepseek-v4-flash');
  });

  test('a retired pin AND an image must land on a model that can read one', async () => {
    expect(
      await channelTurnModel({
        projectId: 'p1',
        accountId: 'a1',
        userId: 'u1',
        currentModel: 'retired-model-v1',
        hasImage: true,
      }),
    ).toBe('glm-5.3-flash');
  });

  test('an unauthenticated sender never moves the model', async () => {
    expect(
      await channelTurnModel({
        projectId: 'p1',
        accountId: 'a1',
        userId: null,
        currentModel: 'retired-model-v1',
        hasImage: true,
      }),
    ).toBeNull();
  });
});

mock.module('../llm-gateway/enablement', () => ({
  projectLlmGatewayEnabledById: async () => true,
}));

mock.module('../billing/services/entitlements', () => ({
  accountMayUseManagedModels: async () => true,
}));

// Mirrors dev: the configured vision target is refused, the catalog's cheapest
// vision model is not.
mock.module('../llm-gateway/resolution/default-model', () => ({
  isModelServableForAccount: async ({ model }: { model: string }) =>
    model !== 'gpt-5.6-luna' && model !== 'retired-model-v1',
}));

mock.module('../config', () => ({
  config: { LLM_GATEWAY_VISION_MODEL: 'gpt-5.6-luna' },
}));

mock.module('../llm-gateway/models/served-managed-models', () => ({
  platformDefaultModelId: () => 'deepseek-v4-flash',
}));

mock.module('../llm-gateway/models/catalog-models', () => ({
  gatewayModelCatalog: () => ({
    'deepseek-v4-flash': { name: 'DeepSeek V4 Flash', attachment: false, cost: { input: 0.09 } },
    'gpt-5.6-luna': { name: 'GPT-5.6 Luna', attachment: true, cost: { input: 0.2 } },
    'glm-5.3-flash': { name: 'GLM 5.3 Flash', attachment: true, cost: { input: 0.075 } },
    'kimi-k3': { name: 'Kimi K3', attachment: true, cost: { input: 0.5 } },
  }),
}));
