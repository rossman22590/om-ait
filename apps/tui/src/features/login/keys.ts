/**
 * The login screen's key table.
 *
 * Same `Binding` shape as `src/keymap.ts`, with one difference the integrator
 * has to close: `KeyScope` in `keymap.ts` is a closed union that has no
 * `'login'` member, and `keymap.ts` is not this agent's file to edit. So the
 * scope is declared locally here. Widening `KeyScope` with `'login'` (and
 * `'account'`) is a one-line edit; after it, `LOGIN_KEYS` is assignable to
 * `Binding[]` and the help overlay (`?`) renders these rows with no other
 * change.
 *
 * A binding that is not in this table does not exist: the login screen never
 * compares `key.name` inline.
 */

import type { KeyEvent } from '@opentui/core';

import { type Chord, matchesChord } from '../../keymap.ts';

/** The scope these bindings live in. Local until `keymap.ts` widens `KeyScope`. */
export type LoginScope = 'login';

export interface LoginBinding {
  id: string;
  scope: LoginScope;
  chords: Chord[];
  description: string;
}

export const LOGIN_KEYS: readonly LoginBinding[] = [
  {
    id: 'login.down',
    scope: 'login',
    chords: [{ key: 'j' }, { key: 'down' }],
    description: 'Move down the host list.',
  },
  {
    id: 'login.up',
    scope: 'login',
    chords: [{ key: 'k' }, { key: 'up' }],
    description: 'Move up the host list.',
  },
  {
    id: 'login.select',
    scope: 'login',
    chords: [{ key: 'return' }],
    description: 'Use the selected host. A host with no token opens the token form.',
  },
  {
    id: 'login.add',
    scope: 'login',
    chords: [{ key: 'n' }],
    description: 'Add a host: name, API URL, and a token.',
  },
  {
    id: 'login.edit',
    scope: 'login',
    chords: [{ key: 'e' }],
    description: "Replace the selected host's token.",
  },
  {
    id: 'login.delete',
    scope: 'login',
    chords: [{ key: 'd' }],
    description: 'Remove the selected host (asks first).',
  },
  {
    id: 'login.confirm',
    scope: 'login',
    chords: [{ key: 'y' }],
    description: 'Confirm the removal.',
  },
  {
    id: 'login.deny',
    scope: 'login',
    chords: [{ key: 'n' }],
    description: 'Decline the removal.',
  },
  {
    id: 'login.field.next',
    scope: 'login',
    chords: [{ key: 'tab' }],
    description: 'Next form field.',
  },
  {
    id: 'login.field.prev',
    scope: 'login',
    chords: [{ key: 'tab', shift: true }],
    description: 'Previous form field.',
  },
  {
    id: 'login.submit',
    scope: 'login',
    chords: [{ key: 'return' }],
    description: 'Submit the form.',
  },
  {
    id: 'login.cancel',
    scope: 'login',
    chords: [{ key: 'escape' }],
    description: 'Leave the form, the confirm, or the screen.',
  },
] as const;

/** True when `event` matches any chord of the login binding with this id. */
export function matchesLoginBinding(event: KeyEvent, id: string): boolean {
  const binding = LOGIN_KEYS.find((entry) => entry.id === id);
  if (!binding) return false;
  return binding.chords.some((chord) => matchesChord(event, chord));
}
