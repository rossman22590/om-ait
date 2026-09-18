/**
 * One retry for the `@kortix/db` group of the packages lane, and only for it.
 *
 * ## The bug this contains
 *
 * Bun 1.3.14 on Linux leaks an epoll registration for a dup'd stdio descriptor
 * when a test file lazily reifies `process.stderr`: the WriteStream fast path
 * calls `Bun.file(fd).writer()`, which dups the fd and registers the dup with
 * epoll at construction, and nothing tears it down. epoll keys interest
 * entries by `{file description, fd number}`, so once that fd number is reused
 * the next `EPOLL_CTL_ADD` fails and Bun kills the run:
 *
 *     error: EEXIST: file already exists, epoll_ctl
 *           at new WriteStream (internal:fs/streams:244:58)
 *
 * It arrives as "Unhandled error between tests" and prints `1 fail` under an
 * EMPTY `1 tests failed:` list — no assertion failed, the file crashed during
 * registration. Observed on 1 of 9 sampled CI runs (both attempts of run
 * 35331083850, 2026-09-18); it takes the whole packages lane down with it.
 *
 * ## Why a retry, and not a fix
 *
 * The fault is inside Bun's own `internal:fs/streams` — no repo code
 * constructs that stream, so there is nothing here to correct. `--parallel=1`
 * does not help either: `epoll_ctl` EEXIST is an intra-process error, and
 * separate Bun workers hold separate epoll instances. `--isolate` is the
 * trigger in the upstream report, not the cure.
 *
 * Upstream oven-sh/bun#37968, fixed by oven-sh/bun#38008, released in Bun
 * 1.4.2. Containment is the only lever until the pin in
 * `packages/shared/src/runtime-versions.json` moves.
 *
 * ## What it deliberately does NOT do
 *
 * Exactly one extra attempt, never a loop. A deterministic failure fails both
 * times and still blocks the lane, so this absorbs a flake and never a
 * regression. The retry is announced on `console.warn` with the original
 * cause, so a rising flake rate stays visible instead of silently eating CI
 * time — and so a reader can check whether the log actually shows the epoll
 * signature or something real.
 *
 * `tests/unit/package-quality-db-retry.test.ts` fails and demands this file be
 * deleted once the pinned Bun reaches 1.4.2.
 */
export async function withDbFlakeRetry(attempt: () => Promise<void>): Promise<void> {
  try {
    await attempt();
  } catch (error) {
    console.warn(
      [
        '[package-quality] @kortix/db group failed; retrying once for the Bun',
        'epoll_ctl flake (oven-sh/bun#37968, fixed in Bun 1.4.2). If the log has',
        'no "EEXIST: file already exists, epoll_ctl", this failure is REAL and',
        `the retry only costs time. Cause: ${String(error)}`,
      ].join(' '),
    );
    await attempt();
  }
}
