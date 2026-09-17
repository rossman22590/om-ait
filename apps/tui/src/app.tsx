import { useKeyboard, useRenderer, useTerminalDimensions } from '@opentui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ResolvedHost } from './auth/hosts.ts';
import { SessionProbe, SessionSidebarProbe } from './features/session/session-probe.tsx';
import { KEYMAP, formatBinding, matchesBinding } from './keymap.ts';
import { theme } from './theme.ts';
import { Kbd, Modal, Panel, StatusBar, Toast } from './ui/index.ts';

/** The regions Tab cycles through. The terminal joins only when it is open. */
export type Focus = 'sidebar' | 'main' | 'terminal';

const SIDEBAR_WIDTH = 28;
/** Below this width the terminal panel takes the whole main area. */
export const SPLIT_MIN_COLUMNS = 100;
/** Below this width the sidebar is a picker (Ctrl+P), not a column. */
export const SIDEBAR_MIN_COLUMNS = 60;

export function nextFocus(current: Focus, order: Focus[], step: 1 | -1): Focus {
  const index = order.indexOf(current);
  if (index < 0) return order[0] as Focus;
  const next = (index + step + order.length) % order.length;
  return order[next] as Focus;
}

export interface AppProps {
  host: ResolvedHost;
  /** The project the session list reads. Resolved at boot. */
  projectId: string | null;
  /** Pre-selected session, from `KORTIX_SESSION_ID`. */
  initialSessionId?: string | null;
  /** Tear the renderer down and leave. `src/index.tsx` owns the real exit. */
  onQuit: () => void;
}

/**
 * The layout frame and the global keymap. Everything visible is a child:
 * the sidebar, the main region, the terminal panel, the status bar, and the
 * overlays. Route state lives here and nowhere else (SPEC §3).
 */
export function App({ host, projectId, initialSessionId = null, onQuit }: AppProps) {
  const dimensions = useTerminalDimensions();
  const renderer = useRenderer();
  const [focus, setFocus] = useState<Focus>('sidebar');
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [quitArmed, setQuitArmed] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);

  const wide = dimensions.width >= SPLIT_MIN_COLUMNS;
  const showSidebar = dimensions.width >= SIDEBAR_MIN_COLUMNS;
  const focusOrder = useMemo<Focus[]>(() => {
    const order: Focus[] = showSidebar ? ['sidebar', 'main'] : ['main'];
    if (terminalOpen) order.push('terminal');
    return order;
  }, [showSidebar, terminalOpen]);

  useEffect(() => {
    if (!focusOrder.includes(focus)) setFocus(focusOrder[0] as Focus);
  }, [focusOrder, focus]);

  // Ctrl+C arms, a second press within 2s quits. The renderer is created with
  // `exitOnCtrlC: false` so this is the only path out.
  useEffect(() => {
    if (!quitArmed) return;
    const timer = setTimeout(() => setQuitArmed(false), 2000);
    return () => clearTimeout(timer);
  }, [quitArmed]);

  const toggleTerminal = useCallback(() => {
    setTerminalOpen((open) => {
      if (open && focus === 'terminal') setFocus('main');
      return !open;
    });
  }, [focus]);

  useKeyboard((key) => {
    if (helpOpen) {
      if (matchesBinding(key, 'help') || matchesBinding(key, 'back')) setHelpOpen(false);
      return;
    }
    if (matchesBinding(key, 'quit')) {
      if (key.name === 'q' || quitArmed) {
        onQuit();
        return;
      }
      setQuitArmed(true);
      return;
    }
    if (quitArmed) setQuitArmed(false);
    if (matchesBinding(key, 'help')) return setHelpOpen(true);
    if (matchesBinding(key, 'focus.prev')) return setFocus((f) => nextFocus(f, focusOrder, -1));
    if (matchesBinding(key, 'focus.next')) return setFocus((f) => nextFocus(f, focusOrder, 1));
    if (matchesBinding(key, 'panel.terminal')) return toggleTerminal();
  });

  // A resize repaints the whole frame; `useTerminalDimensions` already
  // re-renders, so this only keeps the native buffer in step.
  useEffect(() => {
    renderer.requestRender();
  }, [renderer, dimensions.width, dimensions.height]);

  const hints = [
    '? help',
    'Tab focus',
    'Alt+T terminal',
    quitArmed ? 'Ctrl+C again to quit' : 'Ctrl+C quit',
  ].join(' · ');

  return (
    <box
      flexDirection="column"
      width={dimensions.width}
      height={dimensions.height}
      backgroundColor={theme.bg}
    >
      <box flexDirection="row" flexGrow={1} overflow="hidden">
        {showSidebar ? (
          <Panel
            title={host.name}
            footer={projectId ? projectId.slice(0, 8) : 'no project'}
            focused={focus === 'sidebar'}
            width={SIDEBAR_WIDTH}
            flexShrink={0}
          >
            <SessionSidebarProbe
              projectId={projectId}
              focused={focus === 'sidebar'}
              selectedSessionId={sessionId}
              onOpenSession={(id) => {
                setSessionId(id);
                setFocus('main');
              }}
              maxRows={Math.max(dimensions.height - 5, 1)}
            />
          </Panel>
        ) : null}

        {!terminalOpen || wide ? (
          <Panel
            title={sessionId ? `session ${sessionId.slice(0, 8)}` : 'no session'}
            focused={focus === 'main'}
            flexGrow={1}
            minWidth={20}
            padding={1}
          >
            {projectId && sessionId ? (
              <SessionProbe
                projectId={projectId}
                sessionId={sessionId}
                focused={focus === 'main'}
                height={Math.max(dimensions.height - 6, 3)}
              />
            ) : (
              <text fg={theme.faint}>
                {projectId
                  ? 'Pick a session on the left, or press Ctrl+N.'
                  : 'No project on this host.'}
              </text>
            )}
          </Panel>
        ) : null}

        {terminalOpen ? (
          <Panel
            title="Terminal"
            focused={focus === 'terminal'}
            width={wide ? '40%' : undefined}
            flexGrow={wide ? 0 : 1}
            padding={1}
          >
            <text fg={theme.faint}>The PTY panel arrives in wave 1 (features/terminal).</text>
          </Panel>
        ) : null}
      </box>

      <StatusBar
        left={
          <text fg={theme.dim}>
            {host.source === 'env' ? 'env' : host.name}
            {host.userEmail ? ` · ${host.userEmail}` : ''}
          </text>
        }
        right={hints}
      />

      {quitArmed ? (
        <Toast message="Press Ctrl+C again to quit." onDismiss={() => setQuitArmed(false)} />
      ) : null}

      {helpOpen ? (
        <Modal
          title="Keys"
          hint="Esc close"
          onClose={() => setHelpOpen(false)}
          width={Math.min(72, dimensions.width - 4)}
          height={Math.min(KEYMAP.length + 4, dimensions.height - 2)}
        >
          {KEYMAP.map((binding) => (
            <box key={binding.id} flexDirection="row">
              <box width={22} flexShrink={0}>
                <Kbd keys={formatBinding(binding)} />
              </box>
              <text fg={theme.dim}>{binding.description}</text>
            </box>
          ))}
        </Modal>
      ) : null}
    </box>
  );
}
