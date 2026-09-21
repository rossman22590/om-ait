import { describe, expect, test } from 'bun:test';
import { turnEndCause } from './turn-end-cause';

// Session ad02e053 (2026-09-18): the sandbox memory guard aborted a turn at 97 %
// box memory. The transcript only says `MessageAbortedError: Aborted`; the
// control plane's `last_ended.error` names the cause. A renderer shows the cause
// on the turn it belongs to, and on no other.

const GUARD = {
  name: 'SandboxMemoryGuard',
  message: 'sandbox memory at 97% (opencode 513 MB RSS of 3915 MB)',
};
const ended = (over: Record<string, unknown> = {}) => ({
  turn_token: 'tok',
  message_id: 'msg_u2',
  end_reason: 'failed',
  ended_at: '2026-09-18T13:42:49.000Z',
  error: GUARD,
  ...over,
});

describe('turnEndCause', () => {
  test('names the cause for the turn the control plane says it ended', () => {
    expect(turnEndCause({ last_ended: ended() }, 'msg_u2')).toEqual(GUARD);
  });

  test('says nothing for any other turn', () => {
    expect(turnEndCause({ last_ended: ended() }, 'msg_u1')).toBeNull();
    expect(turnEndCause({ last_ended: ended({ message_id: undefined }) }, 'msg_u2')).toBeNull();
    expect(turnEndCause({ last_ended: ended() }, null)).toBeNull();
  });

  test('says nothing when the recorded error is itself an abort: a Stop has no cause to show', () => {
    const abort = { name: 'MessageAbortedError', message: 'Aborted' };
    expect(turnEndCause({ last_ended: ended({ error: abort }) }, 'msg_u2')).toBeNull();
  });

  test('says nothing without a recorded error, a message, or a failed ending', () => {
    expect(turnEndCause(undefined, 'msg_u2')).toBeNull();
    expect(turnEndCause({ last_ended: ended({ error: undefined }) }, 'msg_u2')).toBeNull();
    expect(turnEndCause({ last_ended: ended({ error: { name: 'X', message: null } }) }, 'msg_u2')).toBeNull();
    expect(turnEndCause({ last_ended: ended({ end_reason: 'completed' }) }, 'msg_u2')).toBeNull();
  });

  // `last_ended` is one row and is omitted while a turn runs. A queued prompt
  // starts the next turn seconds after a guard abort, so the cause has to be
  // found by message id in `recent_failures`, whatever `last_ended` says.
  test('finds the cause of an OLDER turn in recent_failures while the next turn runs', () => {
    const observation = { recent_failures: [{ message_id: 'msg_u2', ended_at: null, error: GUARD }] };
    expect(turnEndCause(observation, 'msg_u2')).toEqual(GUARD);
    expect(turnEndCause(observation, 'msg_u3')).toBeNull();
  });

  test('finds it after a later turn has become last_ended', () => {
    const observation = {
      last_ended: ended({ message_id: 'msg_u3', end_reason: 'completed', error: undefined }),
      recent_failures: [{ message_id: 'msg_u2', ended_at: null, error: GUARD }],
    };
    expect(turnEndCause(observation, 'msg_u2')).toEqual(GUARD);
    expect(turnEndCause(observation, 'msg_u3')).toBeNull();
  });
});
