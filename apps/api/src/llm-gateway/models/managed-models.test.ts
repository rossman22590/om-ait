import { describe, expect, test } from 'bun:test';

import {
  type ManagedModel,
  RUNTIME_MANAGED_MODELS,
  getRuntimeManagedModel,
  isRuntimeManagedModelId,
  parseManagedModels,
  resolvePlatformDefaultModelId,
  servedManagedModels,
} from './managed-models';

describe('runtime managed model registry', () => {
  test('exposes the configured control-plane overlay through one lookup', () => {
    expect(RUNTIME_MANAGED_MODELS.length).toBeGreaterThan(0);
    const first = RUNTIME_MANAGED_MODELS[0]!;
    expect(getRuntimeManagedModel(first.id)).toBe(first);
    expect(isRuntimeManagedModelId(first.id)).toBe(true);
    expect(isRuntimeManagedModelId('not-managed')).toBe(false);
  });

  test('accepts a complete operator-defined managed-model replacement', () => {
    const configured = parseManagedModels(JSON.stringify([{
      id: 'operator-model',
      name: 'Operator Model',
      upstreamModelId: 'morph-model-v2',
      transport: 'morph',
      pricingRef: 'morph/morph-model-v2',
      tier: 'balanced',
      vision: true,
      limit: { context: 64_000, output: 8_000 },
    }]));

    expect(configured).toEqual([expect.objectContaining({
      id: 'operator-model',
      upstreamModelId: 'morph-model-v2',
      vision: true,
    })]);
  });

  test('deactivates text-only models from operator overlays', () => {
    const vision = {
      id: 'vision', name: 'Vision', upstreamModelId: 'z-ai/glm-5.3-flash',
      transport: 'openrouter', pricingRef: 'openrouter/z-ai/glm-5.3-flash',
      tier: 'fast', vision: true, limit: { context: 1_000, output: 100 },
    };
    expect(parseManagedModels(JSON.stringify([{ ...vision, id: 'text', vision: false }, vision])))
      .toEqual([expect.objectContaining({ id: 'vision' })]);
  });

  test('rejects an unknown managed transport', () => {
    expect(() => parseManagedModels(JSON.stringify([{
      id: 'retired-model',
      name: 'Retired Model',
      upstreamModelId: 'retired-model',
      transport: 'aster',
      pricingRef: 'vendor/retired-model',
      tier: 'balanced',
      vision: false,
      limit: { context: 1_000, output: 1_000 },
    }]))).toThrow();
  });

  test('rejects malformed and duplicate managed-model definitions', () => {
    expect(() => parseManagedModels('{broken')).toThrow('must be valid JSON');
    const duplicate = {
      id: 'same',
      name: 'Same',
      upstreamModelId: 'morph-same',
      transport: 'morph',
      pricingRef: 'morph/morph-same',
      tier: 'fast',
      vision: false,
      limit: { context: 1, output: 1 },
    };
    expect(() => parseManagedModels(JSON.stringify([duplicate, duplicate]))).toThrow('duplicate');
  });
});

const managed = (
  id: string,
  transport: ManagedModel['transport'],
  tier: ManagedModel['tier'] = 'balanced',
): ManagedModel => ({
  id,
  name: id,
  upstreamModelId: id,
  transport,
  pricingRef: id,
  tier,
  vision: false,
  limit: { context: 1_000, output: 1_000 },
});

describe('servedManagedModels — never offer a managed model with no upstream credential', () => {
  const lineup = [
    managed('morph-kimik3', 'morph', 'flagship'),
    managed('morph-glm53-744b', 'morph'),
    managed('morph-dsv4flash', 'morph', 'fast'),
  ];

  test('drops every model whose transport has no configured credential', () => {
    const served = servedManagedModels(lineup, (m) => m.id !== 'morph-glm53-744b');
    expect(served.map((m) => m.id)).toEqual(['morph-kimik3', 'morph-dsv4flash']);
  });

  test('keeps the whole lineup when every transport is credentialed', () => {
    expect(servedManagedModels(lineup, () => true).map((m) => m.id)).toEqual([
      'morph-kimik3',
      'morph-glm53-744b',
      'morph-dsv4flash',
    ]);
  });

  test('returns nothing when no transport is credentialed', () => {
    expect(servedManagedModels(lineup, () => false)).toEqual([]);
  });
});

describe('resolvePlatformDefaultModelId — the platform default must always be reachable', () => {
  const lineup = [
    managed('morph-kimik3', 'morph', 'flagship'),
    managed('morph-dsv4flash', 'morph', 'fast'),
  ];

  test('keeps the configured default when it is actually served', () => {
    const served = [managed('morph-glm53-744b', 'morph'), ...lineup];
    expect(resolvePlatformDefaultModelId('morph-glm53-744b', served)).toBe('morph-glm53-744b');
  });

  test('falls back to the served flagship when the configured default is unreachable', () => {
    expect(resolvePlatformDefaultModelId('morph-glm53-744b', lineup)).toBe('morph-kimik3');
  });

  test('accepts and preserves the opencode `kortix/<id>` ref form', () => {
    expect(resolvePlatformDefaultModelId('kortix/morph-glm53-744b', lineup)).toBe('morph-kimik3');
    const served = [managed('morph-glm53-744b', 'morph'), ...lineup];
    expect(resolvePlatformDefaultModelId('kortix/morph-glm53-744b', served)).toBe('kortix/morph-glm53-744b');
  });

  test('falls back to the first served model when no flagship is served', () => {
    const noFlagship = [managed('morph-dsv4flash', 'morph', 'fast')];
    expect(resolvePlatformDefaultModelId('morph-glm53-744b', noFlagship)).toBe('morph-dsv4flash');
  });

  test('leaves a BYOK default untouched — it resolves from a project key, not a managed transport', () => {
    expect(resolvePlatformDefaultModelId('anthropic/claude-opus-4-8', lineup)).toBe(
      'anthropic/claude-opus-4-8',
    );
  });

  test('leaves the configured default unchanged when nothing managed is served at all', () => {
    expect(resolvePlatformDefaultModelId('morph-glm53-744b', [])).toBe('morph-glm53-744b');
    expect(resolvePlatformDefaultModelId('', [])).toBe('');
  });
});
