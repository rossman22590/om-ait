import { describe, expect, test } from 'bun:test';

import type { KeyEvent } from '@opentui/core';

import { KEYMAP, formatBinding, formatChord, matchesBinding, matchesChord } from './keymap.ts';

/** A KeyEvent as OpenTUI's KeyHandler delivers it. */
function key(name: string, modifiers: Partial<KeyEvent> = {}): KeyEvent {
  return {
    name,
    ctrl: false,
    meta: false,
    shift: false,
    option: false,
    sequence: name,
    number: false,
    raw: name,
    eventType: 'press',
    source: 'raw',
    ...modifiers,
  } as KeyEvent;
}

describe('KEYMAP table', () => {
  test('every id is unique', () => {
    const ids = KEYMAP.map((binding) => binding.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('every binding has at least one chord and a description', () => {
    for (const binding of KEYMAP) {
      expect(binding.chords.length).toBeGreaterThan(0);
      expect(binding.description.length).toBeGreaterThan(0);
      for (const chord of binding.chords) expect(chord.key.length).toBeGreaterThan(0);
    }
  });

  test('no two bindings in one scope answer the same chord', () => {
    for (const scope of new Set(KEYMAP.map((binding) => binding.scope))) {
      const seen = new Map<string, string>();
      for (const binding of KEYMAP.filter((entry) => entry.scope === scope)) {
        for (const chord of binding.chords) {
          const id = [
            chord.key.length === 1 && chord.key >= 'A' && chord.key <= 'Z'
              ? `${chord.key.toLowerCase()}+shift`
              : `${chord.key.toLowerCase()}${chord.shift ? '+shift' : ''}`,
            chord.ctrl ? 'ctrl' : '',
            chord.alt ? 'alt' : '',
          ].join('|');
          expect(seen.get(id) ?? binding.id).toBe(binding.id);
          seen.set(id, binding.id);
        }
      }
    }
  });

  test('every binding the app dispatches on is present', () => {
    // The ids app.tsx switches on. A rename here is a missing key at runtime.
    const required = [
      'quit',
      'help',
      'focus.next',
      'focus.prev',
      'panel.terminal',
      'back',
      'list.up',
      'list.down',
      'list.open',
    ];
    for (const id of required) expect(KEYMAP.some((binding) => binding.id === id)).toBe(true);
  });
});

describe('matchesChord', () => {
  test('matches the plain key', () => {
    expect(matchesChord(key('j'), { key: 'j' })).toBe(true);
  });

  test('a modifier on the event does not match a modifier-less chord', () => {
    expect(matchesChord(key('c', { ctrl: true }), { key: 'c' })).toBe(false);
    expect(matchesChord(key('t', { option: true }), { key: 't' })).toBe(false);
  });

  test('ctrl and alt must both be present to match', () => {
    expect(matchesChord(key('c', { ctrl: true }), { key: 'c', ctrl: true })).toBe(true);
    expect(matchesChord(key('t', { option: true }), { key: 't', alt: true })).toBe(true);
    expect(matchesChord(key('t'), { key: 't', alt: true })).toBe(false);
  });

  test('g and G are different chords', () => {
    expect(matchesChord(key('g'), { key: 'g' })).toBe(true);
    expect(matchesChord(key('g'), { key: 'G' })).toBe(false);
    expect(matchesChord(key('g', { shift: true }), { key: 'g' })).toBe(false);
  });

  test('both terminal spellings of a capital letter match', () => {
    // raw mode: name `G`, shift clear. kitty protocol: name `g`, shift set.
    expect(matchesChord(key('G'), { key: 'G' })).toBe(true);
    expect(matchesChord(key('g', { shift: true }), { key: 'G' })).toBe(true);
  });

  test('shift is ignored for punctuation, where terminals disagree', () => {
    expect(matchesChord(key('?', { shift: true }), { key: '?' })).toBe(true);
    expect(matchesChord(key('?'), { key: '?' })).toBe(true);
    expect(matchesChord(key('/'), { key: '/' })).toBe(true);
  });

  test('a named key compares shift: Tab is not Shift+Tab', () => {
    expect(matchesChord(key('tab'), { key: 'tab' })).toBe(true);
    expect(matchesChord(key('tab'), { key: 'tab', shift: true })).toBe(false);
    expect(matchesChord(key('tab', { shift: true }), { key: 'tab' })).toBe(false);
  });
});

describe('matchesBinding', () => {
  test('Ctrl+C and Ctrl+Q both quit', () => {
    expect(matchesBinding(key('c', { ctrl: true }), 'quit')).toBe(true);
    expect(matchesBinding(key('q', { ctrl: true }), 'quit')).toBe(true);
    expect(matchesBinding(key('c'), 'quit')).toBe(false);
  });

  test('Tab and Shift+Tab are different bindings', () => {
    expect(matchesBinding(key('tab'), 'focus.next')).toBe(true);
    expect(matchesBinding(key('tab'), 'focus.prev')).toBe(false);
    expect(matchesBinding(key('tab', { shift: true }), 'focus.prev')).toBe(true);
  });

  test('an unknown id never matches', () => {
    expect(matchesBinding(key('x'), 'no.such.binding')).toBe(false);
  });
});

describe('formatting', () => {
  test('prints modifiers and friendly names', () => {
    expect(formatChord({ key: 'c', ctrl: true })).toBe('Ctrl+c');
    expect(formatChord({ key: 't', alt: true })).toBe('Alt+t');
    expect(formatChord({ key: 'return' })).toBe('Enter');
    expect(formatChord({ key: 'escape' })).toBe('Esc');
    expect(formatChord({ key: 'up' })).toBe('↑');
  });

  test('joins a multi-chord binding', () => {
    const quit = KEYMAP.find((binding) => binding.id === 'quit');
    expect(quit && formatBinding(quit)).toBe('Ctrl+c / Ctrl+q');
    expect(formatChord({ key: 'tab', shift: true })).toBe('Shift+Tab');
    expect(formatChord({ key: 'G' })).toBe('G');
  });
});
