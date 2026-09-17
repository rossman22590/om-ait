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
];

// This is the set confirmed by the supplied Morph key through GET /v1/models.
// Add the remaining screenshot models when the key can actually invoke them.
describe('managed catalog', () => {
  test('serves only confirmed Morph agent models', () => {
    expect(DEFAULT_MANAGED_MODEL_IDS).toEqual(served);
    expect(PLATFORM_DEFAULT_MODEL_ID).toBe('morph-dsv41flash');
    expect(MANAGED_FLAGSHIP_MODEL_ID).toBe('morph-kimik3');
  });

  test('every managed model routes directly to Morph with explicit credit pricing', () => {
    for (const model of MANAGED_MODELS) {
      expect(model.transport).toBe('morph');
      expect(model.upstreamModelId).toBe(model.id);
      expect(model.pricingRef).toBe(`morph/${model.id}`);
      expect(model.pricing?.inputPerMillion).toBeGreaterThan(0);
      expect(model.pricing?.outputPerMillion).toBeGreaterThan(0);
      expect(model.providerBrand).toBeUndefined();
      expect(model.vision).toBe(true);
    }
  });

  test('DeepSeek cache-read rates match the Morph model feed', () => {
    expect(getManagedModel('morph-dsv41flash')?.pricing?.cachedInputPerMillion).toBe(0.009);
    expect(getManagedModel('morph-dsv4flash')).toBeUndefined();
  });

  test('old Kortix managed IDs and BYOK refs do not resolve as managed', () => {
    for (const old of [
      'grok-4.6', 'deepseek-v4-flash', 'deepseek-v4-pro-0813', 'muse-spark-1.2',
      'minimax-m3', 'gpt-5.6-luna', 'gpt-6-astra', 'glm-5.3-flash',
      'anthropic/claude-opus-4.8', 'nope',
    ]) {
      expect(getManagedModel(old)).toBeUndefined();
      expect(isManagedModelId(old)).toBe(false);
    }
    expect(getManagedModel('morph-dsv41flash')?.name).toBe('DeepSeek V4.1 Flash');
  });
});
