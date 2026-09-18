/**
 * The whole app against a real API, a real project and a real cloud sandbox.
 *
 * Not a unit test: it needs a token and a live session, so `bun test` never
 * runs it. It is the headless half of the wave-3 proof — the pty run
 * (`README.md` → Troubleshooting) proves the real process paints and restores
 * the terminal; this proves the ROUTES and the DATA, with assertions instead of
 * eyes, and exits non-zero when any of them fails.
 *
 *   KORTIX_API_URL=http://localhost:17408 KORTIX_API_KEY=<jwt> \
 *   KORTIX_PROJECT_ID=<pid> KORTIX_SESSION_ID=<sid> \
 *   bun run apps/tui/scripts/live-app.tsx "say hello in five words"
 *
 * What it asserts, in order:
 *   1. the sidebar lists real sessions, grouped by day;
 *   2. the session view reaches `ready` on the real runtime;
 *   3. a typed prompt streams a reply containing a unique marker;
 *   4. `Ctrl+P` opens the switcher over the real session list;
 *   5. `?` opens the help overlay and shows every scope;
 *   6. `Alt+F` routes to the files screen and `Esc` comes back.
 */

import { createTestRenderer } from '@opentui/core/testing';
import { createRoot } from '@opentui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { App } from '../src/app.tsx';
import { resolveHost } from '../src/auth/hosts.ts';
import { registerEmbeddedTerminal } from '../src/features/terminal/register.ts';
import { initKortix } from '../src/kortix.ts';

registerEmbeddedTerminal();

const MARKER = process.env.LIVE_MARKER ?? `TUI-W3-${Date.now().toString(36).toUpperCase()}`;
const PROMPT = process.argv[2] ?? `Reply with exactly: ${MARKER}`;
const READY_TIMEOUT_MS = Number(process.env.LIVE_READY_TIMEOUT_MS ?? 300_000);
const STREAM_TIMEOUT_MS = Number(process.env.LIVE_STREAM_TIMEOUT_MS ?? 240_000);
const WIDTH = Number(process.env.LIVE_WIDTH ?? 120);
const HEIGHT = Number(process.env.LIVE_HEIGHT ?? 40);

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

const setup = await createTestRenderer({ width: WIDTH, height: HEIGHT });
const root = createRoot(setup.renderer);
root.render(
  <QueryClientProvider client={queryClient}>
    <App
      host={host}
      projectId={projectId}
      accountId={host.accountId || null}
      initialSessionId={sessionId}
      onQuit={() => {}}
    />
  </QueryClientProvider>,
);

async function settle(ms: number): Promise<void> {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    await setup.renderOnce();
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

async function waitForFrame(
  match: (frame: string) => boolean,
  timeoutMs: number,
  label: string,
): Promise<string> {
  const until = Date.now() + timeoutMs;
  let last = '';
  while (Date.now() < until) {
    await setup.renderOnce();
    last = setup.captureCharFrame();
    if (match(last)) return last;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  fail(`timeout waiting for ${label} after ${timeoutMs}ms`, last);
}

/** The session header is the first row inside the panel. */
function headerLine(frame: string): string {
  return frame.split('\n')[1] ?? '';
}

function countOccurrences(text: string, needle: string): number {
  return text.split(needle).length - 1;
}

/**
 * A failure has to EXIT, not throw: the SSE stream and the query client keep
 * the event loop alive, so a bare throw leaves the process hanging instead of
 * reporting. Same reason `fail()` is used for the timeouts.
 */
function fail(label: string, frame: string): never {
  banner(`FAILED — ${label}`);
  console.log(frame);
  process.exit(1);
}

function expectFrame(frame: string, needle: string, label: string): void {
  if (frame.includes(needle)) {
    console.log(`  ok · ${label}`);
    return;
  }
  fail(`${label}: frame does not contain ${JSON.stringify(needle)}`, frame);
}

await settle(3000);
banner('FRAME 0 — first paint');
console.log(setup.captureCharFrame());

// 1. The sidebar is real data: day headings come from the session list.
const listed = await waitForFrame(
  (frame) => /Today|Yesterday|\d{4}-\d{2}-\d{2}/.test(frame),
  60_000,
  'a day heading',
);
banner('FRAME 1 — sidebar lists sessions grouped by day');
console.log(listed);
expectFrame(listed, '+ New session', 'the sidebar prints its nav rows');
expectFrame(listed, 'Customize', 'the sidebar prints the screen rows');

// 2. The session reaches ready on the real runtime. The glyph is read off the
//    HEADER row, not the whole frame: the sidebar prints the same glyph for a
//    running session and would satisfy a frame-wide match on its own.
const ready = await waitForFrame(
  (frame) => headerLine(frame).includes('●'),
  READY_TIMEOUT_MS,
  'the ready glyph in the session header',
);
banner('FRAME 2 — session ready');
console.log(ready);

// 3. A prompt streams back. Boot focus is the composer, so it types straight in.
await setup.mockInput.typeText(PROMPT, 5);
await settle(500);
banner('FRAME 3 — prompt typed');
console.log(setup.captureCharFrame());

setup.mockInput.pressEnter();
await settle(1500);
banner('FRAME 4 — after Enter');
console.log(setup.captureCharFrame());

// The PROMPT itself carries the marker, so its own user turn is one
// occurrence. A reply is the SECOND — matching on one would pass on the echo of
// what was just typed and prove nothing.
const streamed = await waitForFrame(
  (frame) => countOccurrences(frame, MARKER) >= 2,
  STREAM_TIMEOUT_MS,
  `an assistant reply repeating "${MARKER}" (a second occurrence)`,
);
banner('FRAME 5 — streamed reply');
console.log(streamed);

// 4. Ctrl+P — the switcher, over the same session list.
setup.mockInput.pressKey('p', { ctrl: true });
await settle(1500);
const switcher = setup.captureCharFrame();
banner('FRAME 6 — Ctrl+P switcher');
console.log(switcher);
expectFrame(switcher, 'Go to', 'the switcher opens');
expectFrame(switcher, 'project · ', 'the switcher lists projects under the sessions');
setup.mockInput.pressEscape();
await settle(500);

// 5. `?` — the help overlay, generated from the one keymap.
setup.mockInput.pressTab();
await settle(300);
setup.mockInput.pressKey('?');
await settle(800);
const help = setup.captureCharFrame();
banner('FRAME 7 — help overlay');
console.log(help);
expectFrame(help, 'Anywhere', 'the help overlay opens on the global scope');
setup.mockInput.pressEscape();
await settle(500);

// 6. Alt+F routes to files, Esc comes back to the session.
setup.mockInput.pressKey('f', { meta: true });
await settle(2000);
const files = setup.captureCharFrame();
banner('FRAME 8 — Alt+F files screen');
console.log(files);
expectFrame(files, 'files', 'the files route opens');
setup.mockInput.pressEscape();
await settle(1000);
banner('FRAME 9 — Esc back to the session');
console.log(setup.captureCharFrame());

banner(`PASS — marker ${MARKER}`);
root.unmount();
setup.renderer.destroy();
process.exit(0);
