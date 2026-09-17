/**
 * WAVE 0 FEASIBILITY PROOF — temporary.
 *
 * This file exists to prove one thing: `@kortix/sdk/react`'s hooks run
 * unmodified inside the OpenTUI React reconciler under Bun, against a real
 * API and a real cloud sandbox. It renders the smallest surface that can show
 * it — the session list, the lifecycle phase, the message count, the tail of
 * the transcript, and a one-line composer that calls `send`.
 *
 * Wave 1 replaces it with `features/sidebar/*` and the real
 * `features/session/*` transcript + composer. Nothing else should import it.
 */

import { useProjectSessions, useSession } from '@kortix/sdk/react';
import { useState } from 'react';

import { glyph, theme } from '../../theme.ts';
import { formatElapsed, lastTextMessage, messageText, oneLine } from '../../lib/transcript-view.ts';
import { List, Spinner } from '../../ui/index.ts';

export interface SessionSidebarProbeProps {
  projectId: string | null;
  focused: boolean;
  selectedSessionId: string | null;
  onOpenSession: (sessionId: string) => void;
  maxRows: number;
}

function statusGlyph(status: string): string {
  if (status === 'running' || status === 'active') return glyph.running;
  if (status === 'failed' || status === 'error') return glyph.failed;
  return glyph.stopped;
}

/** The session list, straight off `useProjectSessions`. */
export function SessionSidebarProbe({
  projectId,
  focused,
  selectedSessionId,
  onOpenSession,
  maxRows,
}: SessionSidebarProbeProps) {
  const { sessions, isLoading, isError } = useProjectSessions(projectId ?? '', {
    enabled: Boolean(projectId),
  });

  if (!projectId) return <text fg={theme.faint}>No project.</text>;
  if (isLoading && sessions.length === 0) return <Spinner label="loading sessions" />;
  if (isError && sessions.length === 0) return <text fg={theme.danger}>Session list failed.</text>;

  const items = sessions.map((session) => ({
    id: session.session_id,
    label: session.name ?? session.branch_name ?? session.session_id.slice(0, 8),
    glyph: statusGlyph(session.status),
    right: session.status === 'running' ? 'run' : '',
  }));

  return (
    <box flexDirection="column">
      <text fg={theme.dim}>{`Sessions ${sessions.length}`}</text>
      <List
        items={items}
        focused={focused}
        selectedId={selectedSessionId}
        onOpen={(item) => onOpenSession(item.id)}
        maxRows={Math.max(maxRows - 1, 1)}
        width={26}
        emptyText="No sessions yet."
      />
    </box>
  );
}

export interface SessionProbeProps {
  projectId: string;
  sessionId: string;
  focused: boolean;
  height: number;
}

/** One session: phase, transcript tail, and a composer that really sends. */
export function SessionProbe({ projectId, sessionId, focused, height }: SessionProbeProps) {
  const session = useSession(projectId, sessionId);
  const [draft, setDraft] = useState('');
  const [sent, setSent] = useState<string | null>(null);

  const tail = lastTextMessage(session.messages as never);
  const tailText = tail ? messageText(tail) : '';
  const working = session.working.state === 'working';
  const elapsed =
    working && session.working.since ? formatElapsed(Date.now() - session.working.since) : '';

  return (
    <box flexDirection="column" height={height}>
      <text fg={theme.dim}>
        {`phase ${session.phase} · stage ${session.stage ?? '-'} · messages ${session.messages.length}`}
      </text>
      <text fg={theme.faint}>
        {`runtime ${session.runtimePhase} · opencode ${session.opencodeSessionId?.slice(0, 12) ?? '-'}`}
      </text>
      <box height={1} />
      <box flexGrow={1} flexDirection="column" overflow="hidden">
        {tail ? (
          <text fg={theme.fg}>{`${tail.info.role}: ${oneLine(tailText, 400)}`}</text>
        ) : (
          <text fg={theme.faint}>No text parts yet.</text>
        )}
      </box>
      {session.sendError ? (
        <text fg={theme.danger}>{`send failed: ${session.sendError.kind} — ${session.sendError.message}`}</text>
      ) : null}
      <box flexDirection="row" height={1}>
        {working ? <Spinner label={`working ${elapsed}`} /> : <text fg={theme.faint}>idle</text>}
        {sent ? <text fg={theme.faint}>{`  sent: ${oneLine(sent, 40)}`}</text> : null}
      </box>
      <box border borderStyle="single" borderColor={focused ? theme.borderFocus : theme.border}>
        <input
          focused={focused}
          placeholder="Type a prompt, Enter sends"
          value={draft}
          onInput={setDraft}
          // Zero-arg on purpose: `<input>`'s `onSubmit` prop type is the
          // intersection of the React binding's `(value: string) => void` and
          // the renderable option's `(event: SubmitEvent) => void`, so no
          // single typed parameter satisfies both. The draft state is the
          // authority — `onInput` keeps it current.
          onSubmit={() => {
            const text = draft.trim();
            if (!text) return;
            setSent(text);
            setDraft('');
            void session.send(text);
          }}
        />
      </box>
    </box>
  );
}
