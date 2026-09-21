import { describe, expect, test } from 'bun:test';
import { promptModelOverride } from '../channels/vision-model';

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
