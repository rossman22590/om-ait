import type { ResolvedHost } from '@kortix/tui/src/auth/hosts.ts';
import type { RunTuiOptions } from '@kortix/tui/src/main.tsx';

import { type Auth, loadAuth, loadAuthForHost } from '../api/auth.ts';
import {
  type DefaultProjectRef,
  type Host,
  activeHostEntry,
  defaultProject,
  getHost,
  hasEnvTokenHost,
} from '../api/config.ts';
import { sdkBackendUrl } from '../api/sdk.ts';
import { takeFlagValue } from '../command-helpers.ts';
import { C, help, status } from '../style.ts';

const DOCS_URL = 'https://kortix.com/docs/tui';

/**
 * The one line the renderer prints before it takes the screen.
 *
 * It goes to STDERR on purpose. The TUI runs on the alternate screen; when it
 * exits, everything it painted is gone and only what was written before it
 * survives in scrollback. A user who never finds `?` still leaves with the two
 * facts that matter: the command is experimental, and where the docs are.
 */
export const EXPERIMENTAL_NOTICE = `kortix tui is experimental — keys: ? · docs: ${DOCS_URL}`;

const HELP = help`Usage: kortix tui [options]

Experimental. Open the Kortix terminal client: the sidebar of sessions, the
transcript and composer, a real shell inside the session sandbox, and the
Files, Review, Apps, Customize and Account screens — all in your terminal.

Authentication is this CLI's. It runs against the active host, or the one
\`--host\` names. With no host logged in, the TUI opens its own login screen
instead of failing.

Options:
  --host <name>     Use this configured host instead of the active one.
  --project <id>    List this project's sessions (default: the host's default
                    project, else its first project).
  --session <id>    Open this session at boot.
  -h, --help        Show this help.

Keys:
  ?                 Every binding, generated from the app's own keymap.
  Ctrl+p            Session switcher across every project.
  Ctrl+n            New session in this project.
  Alt+t             Toggle the sandbox terminal beside the transcript.
  Alt+f / Alt+r     Files · Review.
  Alt+a / Alt+c     Apps · Customize.
  Alt+u / Alt+h     Account · switch host.
  Alt+o             Hand this session to the stock opencode TUI.
  Ctrl+c twice      Quit.

Needs a real terminal at least 80x24 wide. Experimental means the screens,
keys and flags can change without a deprecation.

Examples:
  kortix tui
  kortix tui --host cloud
  kortix tui --project <project-id> --session <session-id>

Docs: ${DOCS_URL}
`;

export interface TuiFlags {
  host?: string;
  project?: string;
  session?: string;
  help: boolean;
}

/** `kortix tui` takes flags only — a bare positional is a typo, not an id. */
export function parseTuiFlags(argv: string[]): TuiFlags {
  const rest = [...argv];
  const flags: TuiFlags = { help: false };
  for (let i = rest.length - 1; i >= 0; i -= 1) {
    if (rest[i] === '-h' || rest[i] === '--help') {
      flags.help = true;
      rest.splice(i, 1);
    }
  }
  flags.host = takeFlagValue(rest, ['--host']);
  flags.project = takeFlagValue(rest, ['--project']);
  flags.session = takeFlagValue(rest, ['--session']);
  const left = rest[0];
  if (left !== undefined) {
    throw new Error(
      left.startsWith('-')
        ? `unknown option "${left}"`
        : `unexpected argument "${left}" — kortix tui takes options only (--project/--session)`,
    );
  }
  return flags;
}

/**
 * One CLI `Auth` → the `ResolvedHost` the TUI runs against.
 *
 * The TUI normally reads `~/.config/kortix/config.json` itself
 * (`apps/tui/src/auth/hosts.ts`). Under `kortix tui` it must not: `--host` has
 * already picked the host, and the CLI is the one place that knows which token
 * won. So the CLI resolves auth exactly as every other subcommand does and
 * hands the answer down.
 *
 * `api_base` is the bare origin the config stores; `sdkBackendUrl` is the one
 * rule for turning it into the `/v1` mount the SDK needs.
 */
export function resolvedHostFromAuth(input: {
  name: string;
  auth: Auth;
  defaultProjectId?: string;
  /** True when `KORTIX_TOKEN` supplied the token, so a rejection can name it. */
  fromEnvToken: boolean;
}): ResolvedHost {
  return {
    name: input.name,
    backendUrl: sdkBackendUrl(input.auth.api_base),
    token: input.auth.token,
    accountId: input.auth.account_id ?? '',
    ...(input.defaultProjectId ? { defaultProjectId: input.defaultProjectId } : {}),
    userEmail: input.auth.user_email ?? '',
    source: input.fromEnvToken ? 'env' : 'config',
    ...(input.fromEnvToken ? { envVar: 'KORTIX_TOKEN' as const } : {}),
  };
}

export interface TuiDeps {
  loadAuth: () => Auth | null;
  loadAuthForHost: (name: string) => Auth | null;
  /** The active host's name — `sandbox` for a `KORTIX_TOKEN` shell. */
  activeHostName: () => string;
  getHost: (name: string) => Host | null;
  defaultProject: () => DefaultProjectRef | null;
  hasEnvTokenHost: () => boolean;
  /** Loads the renderer. Dynamic so no other subcommand pays for React. */
  importTui: () => Promise<{ runTui: (options: RunTuiOptions) => Promise<number> }>;
  /** Leaves the process once the renderer has given the terminal back. */
  exit: (code: number) => void;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

const DEFAULT_DEPS: TuiDeps = {
  loadAuth,
  loadAuthForHost,
  activeHostName: () => activeHostEntry().name,
  getHost,
  defaultProject,
  hasEnvTokenHost,
  // The ONE import of the TUI, and it is lazy on purpose: `@opentui/core`
  // dlopen's a 5.5 MB native library and pulls React in with it. Every other
  // `kortix` subcommand must keep starting without either.
  importTui: () => import('@kortix/tui/src/main.tsx'),
  exit: (code) => process.exit(code),
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
};

export async function runTui(argv: string[], overrides: Partial<TuiDeps> = {}): Promise<number> {
  const deps: TuiDeps = { ...DEFAULT_DEPS, ...overrides };

  let flags: TuiFlags;
  try {
    flags = parseTuiFlags(argv);
  } catch (err) {
    deps.stderr(`${(err as Error).message}\n\n${HELP}`);
    return 2;
  }
  if (flags.help) {
    deps.stdout(HELP);
    return 0;
  }

  let host: ResolvedHost | null = null;
  if (flags.host) {
    // An explicit `--host` is a claim about WHICH instance. A missing or
    // token-less one is an error, not an invitation to log into another.
    const auth = deps.loadAuthForHost(flags.host);
    if (!auth?.token) {
      deps.stderr(
        `${status.err(`Host "${flags.host}" is not logged in.`)} Run ` +
          `${C.cyan}kortix hosts login ${flags.host}${C.reset}.\n`,
      );
      return 1;
    }
    host = resolvedHostFromAuth({
      name: flags.host,
      auth,
      defaultProjectId: deps.getHost(flags.host)?.default_project?.project_id,
      fromEnvToken: false,
    });
  } else {
    const auth = deps.loadAuth();
    // No host is NOT an error here. The TUI owns a login screen that lists the
    // configured hosts and can add one, which beats printing `kortix login`
    // and quitting — the user asked for the app, so give them the app.
    if (auth?.token) {
      host = resolvedHostFromAuth({
        name: deps.activeHostName(),
        auth,
        defaultProjectId: deps.defaultProject()?.project_id,
        fromEnvToken: deps.hasEnvTokenHost(),
      });
    }
  }

  deps.stderr(`${EXPERIMENTAL_NOTICE}\n`);
  const { runTui: render } = await deps.importTui();
  const code = await render({
    host,
    projectId: flags.project ?? null,
    sessionId: flags.session ?? null,
  });

  // Leave the process HERE instead of through the CLI's usual `process.exitCode`
  // drain. Measured on the compiled binary against a real host: the app's live
  // queries and streams keep Bun's event loop alive after `renderer.destroy()`
  // has already restored the terminal — the `ESC[?1049l` is in the stream and
  // the shell is back, but the command never returns. Draining is the right
  // default for a command whose stdout may be a pipe; a full-screen renderer
  // writes straight to the tty and this command's only other output is the one
  // stderr line above, so there is nothing to truncate. `apps/tui/src/index.tsx`
  // exits the same way, for the same reason.
  deps.exit(code);
  return code;
}
