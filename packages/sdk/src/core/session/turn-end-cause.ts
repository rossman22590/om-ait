import { isAbortError } from '../http/abort-error';
import type {
  SessionTurnEndError,
  SessionTurnEnded,
  SessionTurnFailure,
} from '../rest/projects-client/sessions';

/** The parts of a `/turn` read that can say why a turn ended. */
export interface SessionTurnOutcome {
  last_ended?: SessionTurnEnded;
  recent_failures?: SessionTurnFailure[];
}

/**
 * The cause the control plane recorded for the turn that answered `messageId`,
 * or `null` when there is none worth showing.
 *
 * The transcript of an interrupted turn only says `MessageAbortedError`. An
 * abort is the effect of whatever stopped the turn; when the sandbox named that
 * cause (a memory guard, say), the control plane carries it. `recent_failures`
 * is searched first: `last_ended` is one row and vanishes the moment the next
 * turn starts. A recorded abort is a plain Stop and has no cause to show.
 */
export function turnEndCause(
  outcome: SessionTurnOutcome | undefined,
  messageId: string | null | undefined,
): SessionTurnEndError | null {
  if (!outcome || !messageId) return null;
  const listed = outcome.recent_failures?.find((failure) => failure.message_id === messageId);
  const lastEnded = outcome.last_ended;
  const error =
    listed?.error ??
    (lastEnded?.message_id === messageId && lastEnded.end_reason === 'failed'
      ? lastEnded.error
      : undefined);
  if (!error?.message) return null;
  if (isAbortError({ name: error.name ?? undefined, message: error.message })) return null;
  return error;
}
