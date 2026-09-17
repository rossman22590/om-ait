/**
 * Live harness for attach mode (SPEC §5.11). Not a unit test: it needs a real
 * API, a real session, and the version-matched `opencode` binary, so `bun
 * test` never runs it.
 *
 * Run it under a pseudo-terminal — `opencode attach` inherits stdio and needs
 * a controlling tty, and so does the OpenTUI renderer:
 *
 *   KORTIX_API_URL=http://localhost:17408 KORTIX_API_KEY=<jwt> \
 *   KORTIX_PROJECT_ID=<pid> KORTIX_SESSION_ID=<sid> \
 *   python3 scripts/pty-run.py bun run scripts/dev-attach.tsx
 *
 * It boots the real `createCliRenderer`, paints a marker frame, calls
 * `runAttach`, lets opencode own the terminal for `ATTACH_HOLD_MS`, sends `q`
 * (then Ctrl+C) to leave it, and paints again. Reading the captured byte
 * stream proves the handoff:
 *
 *   ESC[?1049h   the TUI entered the alternate screen
 *   KORTIX-TUI-BEFORE
 *   ESC[?25h ESC[?1049l   suspend() left it, cursor restored, BEFORE opencode
 *   …opencode's own frames…
 *   ESC[?1049h   resume() re-entered it
 *   KORTIX-TUI-AFTER
 *
 * The wrapper is what sends `q`/Ctrl+C — this process reads the tty, it cannot
 * write to it. macOS `script` cannot stand in: it gives the child no
 * controlling tty on stdin. The wrapper, in full:
 *
 *   import os, pty, select, struct, subprocess, sys, termios, fcntl, time
 *   mfd, sfd = pty.openpty()
 *   fcntl.ioctl(sfd, termios.TIOCSWINSZ, struct.pack('HHHH', 40, 120, 0, 0))
 *   p = subprocess.Popen(sys.argv[1:], stdin=sfd, stdout=sfd, stderr=sfd,
 *                        close_fds=True, preexec_fn=os.setsid,
 *                        env={**os.environ, 'TERM': 'xterm-256color'})
 *   os.close(sfd)
 *   # drain mfd into a buffer; at ATTACH_HOLD_MS write b'q', then b'\x03';
 *   # at exit print the buffer and scan it for the sequences above.
 */

import { createCliRenderer } from '@opentui/core';
import { createRoot } from '@opentui/react';
import { useEffect, useState } from 'react';

import { resolveHost } from '../src/auth/hosts.ts';
import { attachResultToast } from '../src/features/attach/attach-status.tsx';
import {
  type AttachStatus,
  type RunAttachResult,
  runAttach,
} from '../src/features/attach/attach.ts';
import { initKortix } from '../src/kortix.ts';

/** Handed to the wrapper: how long opencode should keep the terminal. */
const ATTACH_HOLD_MS = Number(process.env.ATTACH_HOLD_MS ?? 25_000);
/** Paint time before and after, so both markers land in the byte stream. */
const PAINT_MS = Number(process.env.ATTACH_PAINT_MS ?? 1_200);

const host = resolveHost();
if (!host) throw new Error('no host: set KORTIX_API_URL + KORTIX_API_KEY');
initKortix(host);

const projectId = process.env.KORTIX_PROJECT_ID?.trim();
const sessionId = process.env.KORTIX_SESSION_ID?.trim();
if (!projectId || !sessionId) throw new Error('set KORTIX_PROJECT_ID and KORTIX_SESSION_ID');

function Marker({ label }: { label: string }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((value) => value + 1), 250);
    return () => clearInterval(timer);
  }, []);
  return (
    <box border borderStyle="single" title="Kortix TUI" padding={1}>
      <text>{`${label} ${tick}`}</text>
    </box>
  );
}

const renderer = await createCliRenderer({ exitOnCtrlC: false, targetFps: 15 });
const root = createRoot(renderer);
root.render(<Marker label="KORTIX-TUI-BEFORE" />);
await new Promise((resolve) => setTimeout(resolve, PAINT_MS));

const statuses: AttachStatus[] = [];

// Nothing here types `q` into opencode: this process reads the tty, it cannot
// write to it. The pty WRAPPER injects the quit keys on the master fd (see the
// header). `ATTACH_HOLD_MS` is what the wrapper is told to wait.
const result: RunAttachResult = await runAttach({
  renderer,
  host,
  projectId,
  sessionId,
  onStatus: (status) => statuses.push(status),
});

root.render(<Marker label="KORTIX-TUI-AFTER" />);
await new Promise((resolve) => setTimeout(resolve, PAINT_MS));

root.unmount();
renderer.destroy();

// Only now, with the renderer gone, is plain stdout the terminal again.
process.stdout.write(`\nATTACH-STAGES ${statuses.map((s) => s.stage).join(',')}\n`);
process.stdout.write(`ATTACH-RESULT ${JSON.stringify(result)}\n`);
process.stdout.write(`ATTACH-TOAST ${attachResultToast(result).message}\n`);
process.exit('error' in result ? 1 : 0);
