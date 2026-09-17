/**
 * Live feasibility harness (wave 0). Not a unit test — it needs a real API,
 * a real token, and a real cloud sandbox, so it is never run by `bun test`.
 *
 *   KORTIX_API_URL=http://localhost:17408 KORTIX_API_KEY=<jwt> \
 *   KORTIX_PROJECT_ID=<pid> KORTIX_SESSION_ID=<sid> \
 *   bun run test/live-probe.tsx "say hello in five words"
 *
 * It mounts the real `<App/>` in OpenTUI's headless test renderer, prints the
 * captured frame text at each milestone, sends a prompt through the real
 * composer, and exits 0 only when the transcript received streamed text.
 */

import { createTestRenderer } from '@opentui/core/testing';
import { createRoot } from '@opentui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { App } from '../src/app.tsx';
import { resolveHost } from '../src/auth/hosts.ts';
import { initKortix } from '../src/kortix.ts';

const PROMPT = process.argv[2] ?? 'Reply with exactly: TUI-PROBE-OK';
/** The exact string the reply must contain. Make it unique per run so the
 *  assertion cannot pass on a message an earlier run left in the session. */
const EXPECT = process.env.PROBE_EXPECT ?? 'TUI-PROBE-OK';
const READY_TIMEOUT_MS = Number(process.env.PROBE_READY_TIMEOUT_MS ?? 300_000);
const STREAM_TIMEOUT_MS = Number(process.env.PROBE_STREAM_TIMEOUT_MS ?? 240_000);

function stamp(): string {
  return new Date().toISOString().slice(11, 19);
}

function banner(title: string): void {
  console.log(`\n===== ${stamp()} ${title} =====`);
}

const host = resolveHost();
if (!host) throw new Error('no host: set KORTIX_API_URL + KORTIX_API_KEY');
initKortix(host);

const projectId = process.env.KORTIX_PROJECT_ID?.trim() ?? null;
const sessionId = process.env.KORTIX_SESSION_ID?.trim() ?? null;
if (!projectId || !sessionId) throw new Error('set KORTIX_PROJECT_ID and KORTIX_SESSION_ID');

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 2 } },
});

const setup = await createTestRenderer({ width: 100, height: 30 });
const root = createRoot(setup.renderer);
root.render(
  <QueryClientProvider client={queryClient}>
    <App host={host} projectId={projectId} initialSessionId={sessionId} onQuit={() => {}} />
  </QueryClientProvider>,
);

async function settle(ms: number): Promise<void> {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    await setup.renderOnce();
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

async function waitForFrame(match: RegExp, timeoutMs: number, label: string): Promise<string> {
  const until = Date.now() + timeoutMs;
  let last = '';
  while (Date.now() < until) {
    await setup.renderOnce();
    last = setup.captureCharFrame();
    if (match.test(last)) return last;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  banner(`TIMEOUT waiting for ${label}`);
  console.log(last);
  throw new Error(`timeout waiting for ${label} after ${timeoutMs}ms`);
}

await settle(2000);
banner('FRAME 0 — first paint (boot phase)');
console.log(setup.captureCharFrame());

await settle(2000);
banner('FRAME 1 — mounted (session list + session mount)');
console.log(setup.captureCharFrame());

const readyFrame = await waitForFrame(/phase ready/, READY_TIMEOUT_MS, 'phase ready');
banner('FRAME 2 — phase ready');
console.log(readyFrame);

// Focus the main region (Tab from the sidebar), then type into the composer.
setup.mockInput.pressTab();
await settle(500);
await setup.mockInput.typeText(PROMPT, 5);
await settle(500);
banner('FRAME 3 — prompt typed into the composer');
console.log(setup.captureCharFrame());

setup.mockInput.pressEnter();
await settle(1000);
banner('FRAME 4 — after Enter');
console.log(setup.captureCharFrame());

const streamed = await waitForFrame(
  new RegExp(`assistant: .*${EXPECT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
  STREAM_TIMEOUT_MS,
  `an assistant text part containing "${EXPECT}"`,
);
banner('FRAME 5 — streamed assistant text');
console.log(streamed);

await settle(3000);
banner('FRAME 6 — final');
console.log(setup.captureCharFrame());

root.unmount();
setup.renderer.destroy();
process.exit(0);
