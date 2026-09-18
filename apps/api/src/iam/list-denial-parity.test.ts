/**
 * An authorization LIST path must carry the same denial its single-resource
 * sibling does. An empty list is not a refusal.
 *
 * `authorize()` answered a browser session that had not cleared the account's
 * MFA requirement with `deny('account_mfa_required')` — a 403 whose body
 * carries a machine-readable `code`, which the SDK turns into a
 * `kortix:mfa-required` event, which the `MfaStepUpProvider` mounted in the web
 * app's root layout turns into the step-up dialog. The whole remedy exists and
 * is wired.
 *
 * `listAccessible()` applied the IDENTICAL gate and returned a bare
 * `{ mode: 'none' }`. The projects route rendered that as `[]` with HTTP 200,
 * so no 403 was ever produced, no event was ever dispatched, and the dialog
 * could never fire. A member of an MFA-required account saw an account that
 * looked empty — with a "Create a project" affordance — and no way to discover
 * that a second factor was all that stood in the way. Granting them more roles
 * changed nothing: the gate sits ABOVE role evaluation in both functions.
 *
 * Two things are pinned here: the shared gate is written ONCE, and no listing
 * denial is returned without the reason that explains it.
 */
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mfaGateBlocks } from './authorize';

const source = readFileSync(resolve(import.meta.dir, 'authorize.ts'), 'utf8');

describe('mfaGateBlocks', () => {
  const required = { accountMfaRequired: true };
  const notRequired = { accountMfaRequired: false };

  test('a browser session below aal2 on an MFA-required account is blocked', () => {
    expect(mfaGateBlocks(required, null, 'aal1')).toBe(true);
    expect(mfaGateBlocks(required, null, undefined)).toBe(true);
  });

  test('a stepped-up browser session passes', () => {
    expect(mfaGateBlocks(required, null, 'aal2')).toBe(false);
  });

  test('a token is never blocked — it has no second factor to step up with', () => {
    expect(mfaGateBlocks(required, 'tok_1', 'aal1')).toBe(false);
    expect(mfaGateBlocks(required, 'tok_1', undefined)).toBe(false);
  });

  test('an account that does not require MFA never blocks', () => {
    expect(mfaGateBlocks(notRequired, null, 'aal1')).toBe(false);
    expect(mfaGateBlocks(notRequired, null, undefined)).toBe(false);
  });
});

describe('the list path and the single-resource path agree', () => {
  test('neither restates the MFA condition — both route through the predicate', () => {
    // The condition itself may appear ONCE, inside mfaGateBlocks.
    const restatements = source.match(/accountMfaRequired && !tokenId/g) ?? [];
    expect(restatements.length).toBe(1);
    // …and both consumers call the shared predicate.
    expect(source.match(/mfaGateBlocks\(/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
  });

  test('no listing denial is returned without its reason', () => {
    const start = source.indexOf('async function listAccessibleProjects');
    expect(start).toBeGreaterThan(-1);
    const end = source.indexOf('\nexport async function filterAccessibleObjects', start);
    const body = source.slice(start, end === -1 ? undefined : end);
    // A bare `{ mode: 'none' }` in the listing path is the defect: it discards
    // the reason the caller needs in order to act.
    expect(body).not.toMatch(/\{\s*mode:\s*'none'\s*\}/);
  });

  test('the MFA listing denial names the same reason authorize() denies with', () => {
    const start = source.indexOf('async function listAccessibleProjects');
    const end = source.indexOf('\nexport async function filterAccessibleObjects', start);
    const body = source.slice(start, end === -1 ? undefined : end);
    expect(body).toContain("reason: 'account_mfa_required'");
  });
});
