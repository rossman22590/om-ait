import { describe, expect, test } from 'bun:test';
import {
  DEFAULT_MANAGED_MODEL_IDS,
  MANAGED_FLAGSHIP_MODEL_ID,
  MANAGED_MODELS,
  PLATFORM_DEFAULT_MODEL_ID,
  getManagedModel,
  isManagedModelId,
} from './index';

const served = [
  'morph-kimik3',
  'morph-kimik3-fast',
  'morph-dsv41flash',
  'glm-5.3-flash',
];

// The bundled lineup includes Morph models and a CoreWeave-pinned OpenRouter model.
describe('managed catalog', () => {
  test('serves only the selected image-capable agent models', () => {
    expect(DEFAULT_MANAGED_MODEL_IDS).toEqual(served);
    expect(PLATFORM_DEFAULT_MODEL_ID).toBe('morph-dsv41flash');
    expect(MANAGED_FLAGSHIP_MODEL_ID).toBe('morph-kimik3');
  });

  test('every managed model supports image input and has explicit credit pricing', () => {
    for (const model of MANAGED_MODELS) {
      expect(model.pricing?.inputPerMillion).toBeGreaterThan(0);
      expect(model.pricing?.outputPerMillion).toBeGreaterThan(0);
      expect(model.providerBrand).toBeUndefined();
      expect(model.vision).toBe(true);
    }
    expect(getManagedModel('glm-5.3-flash')).toMatchObject({
      upstreamModelId: 'z-ai/glm-5.3-flash',
      transport: 'openrouter',
      openrouterProvider: {
        only: ['coreweave/nvfp4'],
        allow_fallbacks: false,
        zdr: true,
        data_collection: 'deny',
      },
    });
    for (const model of MANAGED_MODELS.filter((entry) => entry.transport === 'morph')) {
      expect(model.upstreamModelId).toBe(model.id);
      expect(model.pricingRef).toBe(`morph/${model.id}`);
    }
  });

  test('DeepSeek cache-read rates match the Morph model feed', () => {
    expect(getManagedModel('morph-dsv41flash')?.pricing?.cachedInputPerMillion).toBe(0.009);
    expect(getManagedModel('morph-dsv4flash')).toBeUndefined();
  });

  test('old Kortix managed IDs and BYOK refs do not resolve as managed', () => {
    for (const old of [
      'grok-4.6', 'deepseek-v4-flash', 'deepseek-v4-pro-0813', 'muse-spark-1.2',
      'minimax-m3', 'gpt-5.6-luna', 'gpt-6-astra',
      'anthropic/claude-opus-4.8', 'nope',
    ]) {
      expect(getManagedModel(old)).toBeUndefined();
      expect(isManagedModelId(old)).toBe(false);
    }
    expect(getManagedModel('morph-dsv41flash')?.name).toBe('DeepSeek V4.1 Flash');
  });
});
