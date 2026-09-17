/**
 * The one keymap table.
 *
 * Every binding the TUI answers to is declared here once. The help overlay
 * (`?`) renders from this table, so a binding that is not in the table is not
 * discoverable and must not exist. Handlers match with `matchesBinding`, never
 * by comparing `key.name` inline.
 */

import type { KeyEvent } from '@opentui/core';

/** Where a binding applies. `global` is active on every screen. */
export type KeyScope = 'global' | 'sidebar' | 'transcript' | 'composer' | 'terminal' | 'modal';

/** A single chord: a key name plus the modifiers that must be held. */
export interface Chord {
  /** `KeyEvent.name`, lowercase (`'c'`, `'tab'`, `'up'`, `'escape'`, `'pageup'`). */
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  /** Alt / Option. OpenTUI reports it as `KeyEvent.option`. */
  alt?: boolean;
}

export interface Binding {
  /** Stable id a handler switches on. */
  id: string;
  scope: KeyScope;
  chords: Chord[];
  /** Imperative, one line, for the help overlay. */
  description: string;
}

function chord(key: string, modifiers: Omit<Chord, 'key'> = {}): Chord {
  return { key, ...modifiers };
}

export const KEYMAP: readonly Binding[] = [
  // — global —
  {
    id: 'quit',
    scope: 'global',
    chords: [chord('c', { ctrl: true }), chord('q', { ctrl: true })],
    description: 'Quit. Ctrl+C asks once, then quits on the second press.',
  },
  { id: 'help', scope: 'global', chords: [chord('?')], description: 'Show this help.' },
  {
    id: 'focus.next',
    scope: 'global',
    chords: [chord('tab')],
    description: 'Focus the next region.',
  },
  {
    id: 'focus.prev',
    scope: 'global',
    chords: [chord('tab', { shift: true })],
    description: 'Focus the previous region.',
  },
  {
    id: 'switcher',
    scope: 'global',
    chords: [chord('p', { ctrl: true })],
    description: 'Open the session switcher.',
  },
  {
    id: 'session.new',
    scope: 'global',
    chords: [chord('n', { ctrl: true })],
    description: 'Create a session.',
  },
  {
    id: 'panel.terminal',
    scope: 'global',
    chords: [chord('t', { alt: true })],
    description: 'Toggle the terminal panel.',
  },
  {
    id: 'screen.files',
    scope: 'global',
    chords: [chord('f', { alt: true })],
    description: 'Open files.',
  },
  {
    id: 'screen.review',
    scope: 'global',
    chords: [chord('r', { alt: true })],
    description: 'Open review.',
  },
  {
    id: 'screen.apps',
    scope: 'global',
    chords: [chord('a', { alt: true })],
    description: 'Open apps.',
  },
  {
    id: 'screen.customize',
    scope: 'global',
    chords: [chord('c', { alt: true })],
    description: 'Open customize.',
  },
  {
    id: 'hosts',
    scope: 'global',
    chords: [chord('h', { ctrl: true })],
    description: 'Switch host.',
  },
  {
    id: 'back',
    scope: 'global',
    chords: [chord('escape')],
    description: 'Close the overlay, or clear the composer.',
  },

  // — lists (sidebar, pickers, any List) —
  {
    id: 'list.down',
    scope: 'sidebar',
    chords: [chord('j'), chord('down')],
    description: 'Move down.',
  },
  { id: 'list.up', scope: 'sidebar', chords: [chord('k'), chord('up')], description: 'Move up.' },
  { id: 'list.first', scope: 'sidebar', chords: [chord('g')], description: 'Go to the first row.' },
  {
    id: 'list.last',
    scope: 'sidebar',
    chords: [chord('g', { shift: true }), chord('G')],
    description: 'Go to the last row.',
  },
  {
    id: 'list.pageDown',
    scope: 'sidebar',
    chords: [chord('pagedown')],
    description: 'Page down.',
  },
  { id: 'list.pageUp', scope: 'sidebar', chords: [chord('pageup')], description: 'Page up.' },
  { id: 'list.open', scope: 'sidebar', chords: [chord('return')], description: 'Open the row.' },
  { id: 'list.filter', scope: 'sidebar', chords: [chord('/')], description: 'Filter the list.' },
  {
    id: 'list.delete',
    scope: 'sidebar',
    chords: [chord('d')],
    description: 'Delete the row (asks first).',
  },
  { id: 'list.rename', scope: 'sidebar', chords: [chord('r')], description: 'Rename the row.' },

  // — transcript —
  {
    id: 'transcript.bottom',
    scope: 'transcript',
    chords: [chord('g', { shift: true }), chord('G')],
    description: 'Jump to the newest turn and re-lock autoscroll.',
  },
  {
    id: 'transcript.older',
    scope: 'transcript',
    chords: [chord('pageup')],
    description: 'Load older turns at the top.',
  },

  // — composer —
  { id: 'composer.send', scope: 'composer', chords: [chord('return')], description: 'Send.' },
  {
    id: 'composer.newline',
    scope: 'composer',
    chords: [chord('return', { shift: true })],
    description: 'Insert a newline.',
  },
  {
    id: 'composer.commands',
    scope: 'composer',
    chords: [chord('/')],
    description: 'Open the command picker (at column 0).',
  },
] as const;

/** True when `event` is this chord. */
export function matchesChord(event: KeyEvent, target: Chord): boolean {
  const name = event.name?.toLowerCase();
  if (!name) return false;
  if (name !== target.key.toLowerCase()) return false;
  if (Boolean(target.ctrl) !== Boolean(event.ctrl)) return false;
  if (Boolean(target.alt) !== Boolean(event.option)) return false;
  // A shift-less binding must not swallow its shifted twin (`g` vs `G`), but a
  // terminal reports `shift` inconsistently for punctuation (`?` is shift+`/`
  // on a US layout and arrives as name `?`), so shift is only compared for
  // single letters.
  const isLetter = target.key.length === 1 && /[a-z]/i.test(target.key);
  if (isLetter && Boolean(target.shift) !== Boolean(event.shift)) return false;
  return true;
}

/** True when `event` matches any chord of the binding with this id. */
export function matchesBinding(event: KeyEvent, id: string): boolean {
  const binding = KEYMAP.find((entry) => entry.id === id);
  if (!binding) return false;
  return binding.chords.some((target) => matchesChord(event, target));
}

export function bindingsForScope(scope: KeyScope): Binding[] {
  return KEYMAP.filter((binding) => binding.scope === scope);
}

/** Render one chord the way the help overlay and hints print it. */
export function formatChord(target: Chord): string {
  const parts: string[] = [];
  if (target.ctrl) parts.push('Ctrl');
  if (target.alt) parts.push('Alt');
  if (target.shift && /[a-z]/i.test(target.key) && target.key.length === 1) parts.push('Shift');
  const NAMES: Record<string, string> = {
    return: 'Enter',
    escape: 'Esc',
    pageup: 'PgUp',
    pagedown: 'PgDn',
    up: '↑',
    down: '↓',
    left: '←',
    right: '→',
    tab: 'Tab',
  };
  parts.push(NAMES[target.key] ?? target.key);
  return parts.join('+');
}

export function formatBinding(binding: Binding): string {
  return binding.chords.map(formatChord).join(' / ');
}
