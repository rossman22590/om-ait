import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { withDbFlakeRetry } from '../src/core/db-lane-retry';

/**
 * The `@kortix/db` group carries a one-shot retry for a Bun runtime flake.
 *
 * ## The bug it contains
 *
 * Bun 1.3.14 on Linux leaks an epoll registration for a dup'd stdio descriptor
 * when a test file's `process.stderr` is lazily reified: the WriteStream fast
 * path calls `Bun.file(fd).writer()`, which dups the fd and registers the dup
 * with epoll at construction, and the registration is never torn down. epoll
 * keys interest entries by `{file description, fd number}`, so once the stale
 * entry's fd number is reused, the next `EPOLL_CTL_ADD` fails:
 *
 *     error: EEXIST: file already exists, epoll_ctl
 *           at new WriteStream (internal:fs/streams:244:58)
 *
 * Bun reports it as "Unhandled error between tests" and the whole `@kortix/db`
 * process dies, taking the packages lane with it. The tell that it is NOT an
 * assertion is that the run prints `1 fail` under an EMPTY `1 tests failed:`
 * list — no test is named, because the file crashed during registration.
 *
 * Upstream: oven-sh/bun#37968, fixed by oven-sh/bun#38008, released in Bun
 * 1.4.2. Observed on 1 of 9 sampled CI runs (both attempts of run
 * 35331083850, 2026-09-18).
 *
 * ## Why a retry and not a code change
 *
 * The fault is inside Bun's own `internal:fs/streams`; no repo code constructs
 * the stream. `--parallel=1` cannot help either — `epoll_ctl` EEXIST is an
 * intra-process error, and separate Bun workers hold separate epoll instances.
 * `--isolate` is the trigger in the upstream report, not the cure. Until the
 * pinned Bun carries the fix, containment is the only lever.
 *
 * ## Why this test exists
 *
 * A workaround that outlives its cause is how a real regression gets retried
 * into silence. The last case below FLIPS once the pinned Bun reaches 1.4.2:
 * it then demands the wrapper be deleted.
 */

const root = resolve(__dirname, '../..');
const laneSource = readFileSync(resolve(root, 'tests/bin/package-quality.ts'), 'utf8');
const runtimeVersions = JSON.parse(
  readFileSync(resolve(root, 'packages/shared/src/runtime-versions.json'), 'utf8'),
) as { bun: string };

/** The Bun release carrying oven-sh/bun#38008. */
const BUN_EPOLL_FIX_VERSION = '1.4.2';

function compareVersions(a: string, b: string): number {
  const left = a.split('.').map(Number);
  const right = b.split('.').map(Number);
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const diff = (left[index] ?? 0) - (right[index] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('withDbFlakeRetry — behaviour', () => {
  test('a passing group runs exactly once and is never retried', async () => {
    const attempt = vi.fn(async () => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await withDbFlakeRetry(attempt);

    expect(attempt).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalled();
  });

  test('a single flake is absorbed: one failure, then the retry succeeds', async () => {
    const attempt = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error('EEXIST: file already exists, epoll_ctl'))
      .mockResolvedValueOnce(undefined);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(withDbFlakeRetry(attempt)).resolves.toBeUndefined();

    expect(attempt).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledTimes(1);
    // The warning must name the upstream bug so the next reader can check
    // whether the log actually shows the flake, or a real failure.
    expect(String(warn.mock.calls[0]?.[0])).toContain('37968');
  });

  test('a REAL failure still blocks the lane and is not retried forever', async () => {
    const attempt = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error('first: genuine assertion failure'))
      .mockRejectedValueOnce(new Error('second: genuine assertion failure'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(withDbFlakeRetry(attempt)).rejects.toThrow('second: genuine assertion failure');

    // Exactly two: the attempt and one retry. Never a third.
    expect(attempt).toHaveBeenCalledTimes(2);
  });

  test('the original failure is surfaced in the retry warning, not swallowed', async () => {
    const attempt = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error('exited with code 1'))
      .mockResolvedValueOnce(undefined);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await withDbFlakeRetry(attempt);

    expect(String(warn.mock.calls[0]?.[0])).toContain('exited with code 1');
  });
});

describe('@kortix/db packages-lane flake containment — wiring', () => {
  test('the db group, and only it, is wrapped in the retry', () => {
    const wrapped = laneSource.match(/withDbFlakeRetry\(\s*\(\)\s*=>\s*([^)]*)\)/g) ?? [];
    expect(wrapped).toHaveLength(1);
    expect(wrapped[0]).toContain("'@kortix/db'");
  });

  test('the workaround is deleted once the pinned Bun carries the upstream fix', () => {
    if (compareVersions(runtimeVersions.bun, BUN_EPOLL_FIX_VERSION) >= 0) {
      expect(
        laneSource,
        [
          `Pinned Bun is ${runtimeVersions.bun}, which includes the`,
          'oven-sh/bun#38008 fix for the epoll_ctl EEXIST flake. Delete',
          'withDbFlakeRetry from tests/bin/package-quality.ts, delete',
          'tests/src/core/db-lane-retry.ts, and delete this test file.',
        ].join(' '),
      ).not.toContain('withDbFlakeRetry');
      return;
    }
    expect(laneSource).toContain('withDbFlakeRetry');
  });
});
