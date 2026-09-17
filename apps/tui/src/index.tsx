/**
 * Boot.
 *
 *   host config → Kortix client → QueryClient → CLI renderer → <App/>
 *
 * The order matters. `createKortix` installs the process-global platform
 * config that every `@kortix/sdk/react` hook reads, so it runs before the
 * first render. The renderer is created with `exitOnCtrlC: false`: the app
 * owns Ctrl+C (press twice), and every exit path goes through `shutdown()` so
 * the terminal is restored — an alternate-screen renderer that dies without
 * `destroy()` leaves the user with a broken shell.
 */

import { createCliRenderer } from '@opentui/core';
import { createRoot } from '@opentui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { App } from './app.tsx';
import { resolveHost } from './auth/hosts.ts';
import { initKortix, kortix } from './kortix.ts';

const LOGIN_HINT = [
  'No Kortix host is configured.',
  '',
  'Run `kortix login`, or set both:',
  '  KORTIX_API_URL=http://localhost:8008',
  '  KORTIX_API_KEY=<pat-or-jwt>',
].join('\n');

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

async function main(): Promise<void> {
  const host = resolveHost();
  if (!host) {
    process.stderr.write(`${LOGIN_HINT}\n`);
    process.exitCode = 2;
    return;
  }

  initKortix(host);
  const projectId = await resolveProjectId(host.defaultProjectId);

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
      <App
        host={host}
        projectId={projectId}
        initialSessionId={process.env.KORTIX_SESSION_ID?.trim() || null}
        onQuit={() => shutdown(0)}
      />
    </QueryClientProvider>,
  );
}

await main();
