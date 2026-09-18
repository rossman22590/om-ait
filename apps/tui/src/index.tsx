/**
 * Boot.
 *
 *   register elements → host config → Kortix client → QueryClient
 *   → CLI renderer → <Root/>
 *
 * The order matters.
 *
 *  1. `registerEmbeddedTerminal()` runs before the first render.
 *     `<embedded-terminal>` is not a built-in JSX tag; `extend()` has to have
 *     run before the element is ever created (`features/terminal/register.ts`).
 *  2. `createKortix` installs the process-global platform config that every
 *     `@kortix/sdk/react` hook reads, so it runs before the first hook renders.
 *     When no host is configured yet the login screen runs FIRST and calls
 *     `initKortix` itself once a host is picked.
 *  3. The renderer is created with `exitOnCtrlC: false`: the app owns Ctrl+C
 *     (press twice), and every exit path goes through `shutdown()` so the
 *     terminal is restored — an alternate-screen renderer that dies without
 *     `destroy()` leaves the user with a broken shell.
 */

import { createCliRenderer } from '@opentui/core';
import { createRoot } from '@opentui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { App } from './app.tsx';
import { type ResolvedHost, listHostEntries, resolveHost } from './auth/hosts.ts';
import { LoginScreen } from './features/login/index.ts';
import { registerEmbeddedTerminal } from './features/terminal/register.ts';
import { initKortix, kortix } from './kortix.ts';

registerEmbeddedTerminal();

/** The project whose sessions the sidebar lists. */
async function resolveProjectId(fallback?: string): Promise<string | null> {
  const fromEnv = process.env.KORTIX_PROJECT_ID?.trim();
  if (fromEnv) return fromEnv;
  if (fallback) return fallback;
  try {
    const projects = await kortix().projects.list();
    return projects?.[0]?.project_id ?? null;
  } catch {
    return null;
  }
}

interface RootProps {
  initialHost: ResolvedHost | null;
  initialProjectId: string | null;
  initialSessionId: string | null;
  onQuit: () => void;
}

/**
 * Login or app.
 *
 * The host is state, so `Ctrl+H` is a state change and not a process restart:
 * the login screen comes back, the user picks another host, `initKortix`
 * rebuilds the one client, and the app remounts with a fresh `key` so every
 * query and every SSE stream is torn down with the old host.
 */
function Root({ initialHost, initialProjectId, initialSessionId, onQuit }: RootProps) {
  const [host, setHost] = useState<ResolvedHost | null>(initialHost);
  /** The host `Alt+H` left behind, so Esc can put it back. Null at boot. */
  const [previousHost, setPreviousHost] = useState<ResolvedHost | null>(null);
  const [projectId, setProjectId] = useState<string | null>(initialProjectId);
  const [generation, setGeneration] = useState(0);

  const onLoggedIn = useCallback((resolved: ResolvedHost) => {
    initKortix(resolved);
    setHost(resolved);
    setPreviousHost(null);
    setProjectId(resolved.defaultProjectId ?? null);
    setGeneration((value) => value + 1);
  }, []);

  // Esc on the host list. With a host behind it this is "never mind" and the
  // app comes back on the SAME host — `initKortix` again because the login
  // screen's own validation may have re-pointed the process-global config.
  // At boot there is nothing behind it, so it quits.
  const onCancel = useCallback(() => {
    if (!previousHost) return onQuit();
    initKortix(previousHost);
    setHost(previousHost);
    setPreviousHost(null);
  }, [previousHost, onQuit]);

  if (!host) {
    return (
      <LoginScreen
        hosts={listHostEntries()}
        width={process.stdout.columns ?? 80}
        height={process.stdout.rows ?? 24}
        onLoggedIn={onLoggedIn}
        onQuit={onCancel}
        cancelLabel={previousHost ? 'Esc back' : 'Esc quit'}
      />
    );
  }

  return (
    <App
      key={`${host.name}:${host.backendUrl}:${generation}`}
      host={host}
      projectId={projectId}
      accountId={host.accountId || null}
      initialSessionId={initialSessionId}
      onQuit={onQuit}
      onSwitchHost={() => {
        setPreviousHost(host);
        setHost(null);
      }}
    />
  );
}

async function main(): Promise<void> {
  const host = resolveHost();
  if (host) initKortix(host);
  const projectId = host ? await resolveProjectId(host.defaultProjectId) : null;

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // There is no window to focus in a terminal, and a TUI that refetches
        // on every keystroke burns the API. The SDK's own query contracts set
        // per-query staleness; these are only the process-wide floors.
        refetchOnWindowFocus: false,
        retry: 2,
      },
    },
  });

  const renderer = await createCliRenderer({ exitOnCtrlC: false });
  const root = createRoot(renderer);

  let stopped = false;
  const shutdown = (code = 0, error?: unknown): void => {
    if (stopped) return;
    stopped = true;
    try {
      root.unmount();
    } catch {
      // A reconciler already torn down by the error we are handling.
    }
    renderer.destroy();
    if (error) {
      process.stderr.write(
        `${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`,
      );
    }
    process.exit(code);
  };

  process.on('uncaughtException', (error) => shutdown(1, error));
  process.on('unhandledRejection', (error) => shutdown(1, error));
  process.on('SIGTERM', () => shutdown(0));
  process.on('SIGHUP', () => shutdown(0));

  root.render(
    <QueryClientProvider client={queryClient}>
      <Root
        initialHost={host}
        initialProjectId={projectId}
        initialSessionId={process.env.KORTIX_SESSION_ID?.trim() || null}
        onQuit={() => shutdown(0)}
      />
    </QueryClientProvider>,
  );
}

await main();
