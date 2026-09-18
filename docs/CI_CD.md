# CI/CD Pipeline

Local development and CI use one test command.

`pnpm worktree` owns checkout isolation, ports, dependencies, Supabase topology,
and the callback tunnel. The root test runner reads `.kortix-worktree.json` and
uses that lifecycle instead of creating a second worktree abstraction.

## Test command

- `pnpm test` runs local REST and CLI flows, SDK tests, runner tests, route
  coverage, and worktree tests.
- `pnpm test -- --full` adds Playwright and every app/package test.
- `pnpm test -- --packages-only` isolates every app/package and publish check.
- `pnpm test -- --target-smoke` proves the deployed staging SHA and web surface.
- `pnpm test -- --target-full` runs every configured staging flow and browser
  journey after the same SHA proof. Release QA uses this mode.
- REST and CLI flows use local Supabase, PostgreSQL, API, gateway, and Git.
- External Stripe, email, managed-Git, and cloud-sandbox flows remain explicit
  exclusions in the local profile.

See `tests/README.md` for flow authoring and result files.

## Where the test suite runs

`.github/workflows/tests.yml` is the only local-profile test implementation. It
runs six lanes in parallel — `core`, `browser-1` … `browser-4`, `packages` —
each natively on one Blacksmith runner (`CI_RUNNER_L`, 8 vCPU / 32 GB). The six
lanes equal one `pnpm test -- --full` run, and the slowest lane defines the
duration.

Measured on run `35384964452` with two browser shards: `core` 2m18s, `packages`
6m34s, `browser-1` 8m11s, `browser-2` **10m19s**. Decomposing the 10m19s lane:
81s runner setup, 53s in-lane stack boot, **480s of Playwright journeys**. Fixed
cost is ~134s and the journeys total ~837s across ~44 tests, so a browser lane's
wall clock is `134 + 837/N`:

| browser shards | projected browser lane | suite wall clock |
| --- | --- | --- |
| 2 | ~9.2 min (10m19s observed) | ~10.3 min |
| 3 | ~6.9 min | ~6.9 min |
| **4** | **~5.7 min** | **~6.6 min (bounded by `packages`)** |
| 6 | ~4.6 min | ~6.6 min — no change |

The browser lanes went 2 → 4 on 2026-09-18. Past 4, `packages` (6m34s) is the
long pole and another browser shard buys nothing, so that is where the sharding
stops. `--browser-shard` maps straight to Playwright's native `--shard`, so the
denominator needs no partition code — unlike the API shards, which are computed
by `src/core/shard.ts`.

Until 2026-08-26 each lane ran inside a Platinum or Daytona cloud sandbox with a
warm template, and the runner was a thin orchestrator. That path was deleted
after the provider chain failed on its own on about every third lane. Only
`deploy-preview.yml` still uses a cloud sandbox, because a preview needs a
long-lived public HTTPS origin.

### Two callers, neither of them a gate on `main`

Changed 2026-09-18. Before that every pull request into `main` waited for the
full suite: ~11 min median and 68 min worst case, against ~3-6 min for every
other pull-request check. It gated nothing — the `main-push-protection` ruleset
requires a pull request with 0 approvals and **no required status checks**, so a
red suite never blocked a merge. It only made people wait.

| Caller | Trigger | Purpose |
| --- | --- | --- |
| `tests-pr.yml` | pull request into `staging`; pull request into `main` carrying `test` or `preview`; manual dispatch | gate the release candidate, and opt in per pull request |
| `tests-main.yml` | every push to `main` (and manual dispatch) | answer "is the dev trunk green at its latest commit" |

`tests-pr.yml`'s `test verdict` job always runs and always passes. It names the
rule that applied and, when the suite is skipped, how to ask for it, so an empty
check list is a stated decision rather than a broken workflow. Adding `test` or
`preview` to an already-open pull request re-triggers the workflow, so the opt-in
needs no push.

`tests-main.yml` cannot block anything: the code has merged, and
`deploy-dev.yml` deploys the same push without waiting for it.
`cancel-in-progress: true` matches `deploy-dev.yml`, so the trunk answer is
always about the newest commit and a cancelled run is normal. A red run posts a
comment on the offending commit naming the failing lanes, and the fix is an
ordinary pull request — `main` is allowed to be broken while work is shaken out.

Because a `main` pull request no longer runs the suite for you, run it locally
before merging: the narrowest relevant command first, then `pnpm test`.

### Deployed targets

Two workflows test a deployed origin instead of the local profile:

- `deploy-preview.yml` — `pnpm test -- --target-full` against a full self-host
  preview origin, on the `preview` label.
- `tests-release.yml` — sharded `--target-api-full` / `--target-browser-full`
  against deployed staging on a pull request into `prod`. Its aggregator job
  `full suite + quality gates` is the **only** required status check in the
  repository.

## Release path

1. Merge development changes to `main`.
2. `deploy-dev.yml` deploys the merged API, gateway, and web SHA to ECS dev.
3. Promote a release candidate to `staging` through a PR.
4. `build-staging.yml` and `deploy-staging.yml` build and deploy staging.
5. Open the reviewed `staging` to `prod` release PR.
6. `tests-release.yml` requires the deployed staging API and gateway to report
   `RELEASE_SOURCE_SHA`. It runs every configured REST, CLI, and Playwright
   journey against staging. Any excluded API flow fails the gate.
7. Merge the release PR.
8. `deploy-prod.yml` publishes and deploys the approved artifact.

The staging push does not repeat local-profile tests. The production PR does
not repeat them either. The staging PR owns local-profile coverage. The
production PR owns deployed-staging coverage.

Deployment workflows must still prove the deployed SHA and live health. Test
success does not prove deployment success.
