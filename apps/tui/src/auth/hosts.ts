/**
 * Where the TUI gets its backend URL and token.
 *
 * There is exactly one auth source: the CLI's multi-host config
 * (`~/.config/kortix/config.json`), read through `@kortix/cli`'s own
 * `src/api/config.ts`. `kortix login` writes it; the TUI only reads it. The
 * TUI never parses that file itself, so a config-format change lands in one
 * place.
 *
 * `KORTIX_API_URL` + `KORTIX_API_KEY` (or `KORTIX_TOKEN`, the name the CLI
 * already honors inside a sandbox) override the config for scripts, tests, and
 * CI. The override never writes to disk.
 */

import {
  type Host,
  activeHostName,
  getHost,
  listHosts,
  loadConfig,
  secureRemoteBase,
} from '@kortix/cli/src/api/config.ts';
import { sdkBackendUrl } from '@kortix/cli/src/api/sdk.ts';

export interface ResolvedHost {
  /** Config key (`cloud`, `local-dev`, …), or `env` for the env override. */
  name: string;
  /** Absolute backend base the SDK needs, always ending in `/v1`. */
  backendUrl: string;
  /** Bearer for every call: a PAT, an API key, or a Supabase JWT. */
  token: string;
  /** The host's active account. Empty string when the config has none yet. */
  accountId: string;
  /** The host's default project, when `kortix` recorded one. */
  defaultProjectId?: string;
  /** Signed-in identity, for the status bar. Empty when unknown. */
  userEmail: string;
  /** Which source won. */
  source: 'env' | 'config';
}

export interface HostEntry {
  name: string;
  backendUrl: string;
  hasToken: boolean;
  active: boolean;
  userEmail: string;
}

type Env = Record<string, string | undefined>;

function envToken(env: Env): string | undefined {
  const token = env.KORTIX_API_KEY?.trim() || env.KORTIX_TOKEN?.trim();
  return token || undefined;
}

function envBackendUrl(env: Env): string | undefined {
  const url = env.KORTIX_API_URL?.trim();
  return url || undefined;
}

/**
 * The host this process runs against, or null when nothing is configured
 * (the caller then shows the login screen).
 *
 * Precedence, highest first:
 *   1. `KORTIX_API_KEY` (or `KORTIX_TOKEN`) + `KORTIX_API_URL`
 *   2. the active host in the CLI config
 *
 * A config host with an empty token is not usable and resolves to null — the
 * user is listed in `listHostEntries()` but has to log in.
 */
export function resolveHost(env: Env = process.env): ResolvedHost | null {
  const token = envToken(env);
  const url = envBackendUrl(env);
  if (token) {
    return {
      name: 'env',
      backendUrl: sdkBackendUrl(url ?? 'https://api.kortix.com'),
      token,
      accountId: env.KORTIX_ACCOUNT_ID?.trim() ?? '',
      defaultProjectId: env.KORTIX_PROJECT_ID?.trim() || undefined,
      userEmail: '',
      source: 'env',
    };
  }

  const name = activeHostName();
  const config = loadConfig();
  const host: Host | undefined = name ? config.hosts[name] : undefined;
  if (!name || !host || !host.token) return null;

  return {
    name,
    // An explicit `KORTIX_API_URL` still re-points a config host (CLI parity),
    // but without a token it cannot create one.
    backendUrl: sdkBackendUrl(url ?? host.url),
    token: host.token,
    accountId: host.account_id ?? '',
    defaultProjectId: host.default_project?.project_id,
    userEmail: host.user_email ?? '',
    source: 'config',
  };
}

/** Every configured host, for the host switcher and the login screen. */
export function listHostEntries(): HostEntry[] {
  return listHosts().map((entry) => ({
    name: entry.name,
    backendUrl: sdkBackendUrl(entry.host.url),
    hasToken: Boolean(entry.host.token),
    active: entry.active,
    userEmail: entry.host.user_email ?? '',
  }));
}

/** The origin without the `/v1` mount — for display and for PTY URLs. */
export function hostOrigin(backendUrl: string): string {
  return secureRemoteBase(backendUrl).replace(/\/v1$/, '');
}

/** The `ResolvedHost` a stored CLI host record resolves to. */
export function resolvedFromHost(name: string, host: Host): ResolvedHost {
  return {
    name,
    backendUrl: sdkBackendUrl(host.url),
    token: host.token,
    accountId: host.account_id ?? '',
    defaultProjectId: host.default_project?.project_id,
    userEmail: host.user_email ?? '',
    source: 'config',
  };
}

/**
 * A row from the host list → the host this process would run against.
 *
 * `resolveHost()` only ever answers for the ACTIVE host, and `listHostEntries()`
 * deliberately drops the token. Selecting a row means resolving THAT row, so
 * the token is read back here by name. Returns null when the host is gone or
 * carries no token.
 *
 * `read` is injected so a test never touches a real
 * `~/.config/kortix/config.json`.
 */
export function hostToResolved(
  entry: Pick<HostEntry, 'name'>,
  deps: { read: (name: string) => Host | null } = { read: getHost },
): ResolvedHost | null {
  const host = deps.read(entry.name);
  if (!host || !host.token) return null;
  return resolvedFromHost(entry.name, host);
}
