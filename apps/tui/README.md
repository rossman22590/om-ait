# `@kortix/tui` — Kortix in the terminal (experimental)

A full terminal client for Kortix. It renders with
[OpenTUI](https://github.com/anomalyco/opentui) on Bun and reads every byte of
Kortix data through `@kortix/sdk`. `apps/tui/SPEC.md` is the plan; this file is
how to run what exists today.

**Status: wave 0.** The shell, the keymap, the UI primitives, and a feasibility
probe are in. The real sidebar, transcript, composer, terminal panel, and the
secondary screens are not — see [What works today](#what-works-today).

## Run

```bash
# from the repo root, once
pnpm install

# then
pnpm --filter @kortix/tui dev
```

Authentication comes from the CLI's own host config
(`~/.config/kortix/config.json`), so `kortix login` is the setup step. The TUI
only reads that file.

Minimum terminal size is 80×24. Below 100 columns the terminal panel replaces
the split instead of sharing it; below 60 columns the sidebar is hidden.

## Environment variables

| Variable | Effect |
| --- | --- |
| `KORTIX_API_KEY` | Bearer token. With it, the CLI config is not read at all. |
| `KORTIX_TOKEN` | Same as `KORTIX_API_KEY` (the name the CLI uses inside a sandbox). |
| `KORTIX_API_URL` | Backend origin, with or without `/v1`. Defaults to `https://api.kortix.com`. |
| `KORTIX_PROJECT_ID` | The project whose sessions are listed. Defaults to the host's default project, else the first project. |
| `KORTIX_SESSION_ID` | Open this session at boot. |
| `KORTIX_CONFIG_FILE` | Read hosts from this file instead of `~/.config/kortix/config.json`. |
| `KORTIX_TUI_THEME` | `dark` or `light`. Otherwise `COLORFGBG` decides, defaulting to dark. |

Scripted run against a local stack, touching no file on disk:

```bash
KORTIX_API_URL=http://localhost:8008 KORTIX_API_KEY="$JWT" \
  pnpm --filter @kortix/tui dev
```

## Keys

`?` prints the live table — it is generated from `src/keymap.ts`, so it is
never out of date. The global set:

| Keys | Action |
| --- | --- |
| `Ctrl+C` twice, or `Ctrl+Q` | Quit. The first `Ctrl+C` asks. |
| `?` | Help overlay. |
| `Tab` / `Shift+Tab` | Cycle focus: sidebar → main → terminal. |
| `Alt+T` | Toggle the terminal panel. |
| `Esc` | Close the overlay. |
| `j` `k` `↑` `↓` `g` `G` `PgUp` `PgDn` | Move in a list. |
| `Enter` | Open the selected row; in the composer, send. |

`Ctrl+P`, `Ctrl+N`, `Ctrl+H`, `Alt+F`, `Alt+R`, `Alt+A`, `Alt+C` are in the
table and reserved. They land with the screens they open.

## What works today

- Host resolution from the CLI config, with the env override.
- One `createKortix` client, one `QueryClient`.
- Layout frame: sidebar, session region, terminal panel placeholder, status
  bar, help overlay, quit confirmation, resize breakpoints.
- Session list from `useProjectSessions`.
- A session mounted with `useSession`: lifecycle phase, message count, the
  transcript tail, and a one-line composer that really sends.

Not yet: the grouped sidebar, the full transcript with tool cards, the
pickers, prompts, the PTY panel, files, review, apps, customize, account, and
the login screen (a missing host prints instructions and exits 2).

## Tests

```bash
pnpm --filter @kortix/tui test        # bun test
pnpm --filter @kortix/tui typecheck   # tsc --noEmit
npx biome check apps/tui
```

Tests sit next to the file they cover (`src/**/*.test.ts[x]`) — the repo
`.gitignore` ignores every `test/` directory, so the layout in `SPEC.md` §3
would not be tracked. Component tests render through OpenTUI's headless test
renderer and assert on captured frame text. `apps/tui/docs/opentui-notes.md` has the API cheat sheet
and the traps, including why key presses must be wrapped in React's `act`.

### Live probe

`scripts/live-probe.tsx` mounts the real app against a real API and a real
sandbox, sends a prompt, and exits non-zero unless the reply streams back:

```bash
cd apps/tui
KORTIX_API_URL=http://localhost:8008 KORTIX_API_KEY="$JWT" \
KORTIX_PROJECT_ID="$PID" KORTIX_SESSION_ID="$SID" \
PROBE_EXPECT="MARKER-123" \
  bun run scripts/live-probe.tsx "Reply with exactly: MARKER-123"
```

It prints the captured frame at each milestone. It is not part of `bun test`:
it needs credentials and provisions nothing itself.

## Troubleshooting

- **`ERR_PNPM_UNSUPPORTED_ENGINE` on install.** `@opentui/core` declares
  `engines.node: >=26.4.0`. The repo `.npmrc` documents why `engine-strict` is
  off; re-enabling it breaks this app's install.
- **The terminal is left in a broken state.** Every exit path calls
  `renderer.destroy()`. If a crash ever escapes it, `reset` restores the
  shell; report the stack trace, because that path is a bug.
- **Nothing renders, or the frame is blank.** The screen needs at least 80×24.
- **`No Kortix host is configured.`** Run `kortix login`, or set
  `KORTIX_API_URL` and `KORTIX_API_KEY`.
