# Session transcript history

`session_transcript_history` is an experimental, per-project feature flag. It is off by default.
Enable **Settings → Feature flags → Session Transcript History** for the project to test it.

Opening a session still calls `/start` and starts its computer. The SDK also reads
`GET /projects/:projectId/sessions/:sessionId/transcript?shape=sync&history=true` independently
of the shared snapshot and the runtime. It paints the last 40 saved messages first.
The existing live reconciliation replaces those messages by their original OpenCode IDs.
Older-message loading uses the live runtime once it is available.

The composer accepts prompts during startup. A send immediately displays the user's message,
the existing Thinking indicator, and a notice that delivery follows startup. The prompt uses
the existing durable inbox. Before the runtime is ready, it can omit the model override and
use the server's default. Normal model-selection checks return when the runtime is ready.
Agent permissions, billing, and connector checks still apply on the API.

## Capture and storage

The API captures messages when the sandbox reports `end` or `turn_end`. Manual sandbox stop
also captures before powering off. The browser does not write transcripts.

With the flag enabled, capture follows every `x-next-cursor` page. It stores the complete
renderable transcript in the existing `session_transcript_messages` and `session_transcript_mirrors`
tables. No schema migration is required. Each request has an 8-second deadline; a full read has
a 60-second deadline. Capture retries up to three times with 250 ms and 500 ms backoff.

Writes use one transaction, a session advisory lock, and batches of 100 messages. Captures in
one API process run in order. A newer stored snapshot cannot be overwritten by an older read.
A complete capture replaces removed messages as well as adding and updating messages.

Message IDs, completion timestamps, and errors survive capture. Existing size limits and
sanitization still apply: file URLs and tool inputs/outputs are omitted. This is a display copy,
not a backup for restoring a runtime or replaying its tool history.

A failed capture preserves the last saved transcript. If all retries fail or the sandbox disappears
before reporting turn end, the latest messages need the live runtime. Another completed turn or
manual stop attempts capture again. A process restart can interrupt an asynchronous capture.

Projects that complete a full capture receive `metadata.session_transcript_history_retained=true`.
This preserves their stored history when the feature flag is turned off. Disabling the flag restores
the existing session-open and tail-capture behavior; it does not prune previously retained history.

## Attachments

With the flag enabled, the existing-session composer saves new local files through the API
before queueing the prompt. Each file has a stable `kortix-attachment://` reference. The private
Supabase Storage bucket `session-attachments` holds the bytes; transcript rows hold references,
filenames, and MIME types. The API creates the bucket on the first upload. No schema migration
is required. The limit is 25 MiB per file.

The prompt inbox stores references while the computer starts. Delivery writes each file to a
deterministic sandbox path and puts that path plus the private reference in the message. Image
previews and file downloads use authenticated API reads, including while the computer is stopped.
Retrying a failed batch reuses successful uploads and preserves each file's original position.
Different files with the same name retain separate IDs. Disabling the flag stops new saved uploads
but preserves existing downloads. Deleting a session removes its private attachment objects.

Attachments sent before this feature, and initial prompts created before a session exists, retain
the existing sandbox-backed behavior. They are not retroactively copied into object storage.
Missing old sandbox bytes cannot be reconstructed from the transcript's filename and MIME metadata.

## Local verification

From the canonical worktree:

```sh
pnpm worktree start session-transcript-history
```

Open `http://localhost:17800`. The API uses port `17808`. This worktree shares the primary local
Supabase database. Sign in with your local account.

1. Enable the flag in a project's Feature flags settings.
2. Open a session, send a message, and wait for the answer to finish.
3. Navigate away and reopen the session. Repeat after stopping its computer.
4. Confirm both sides of the conversation appear while the computer starts.
5. Type and send before startup finishes. Confirm the message and Thinking appear immediately.
6. Wait for startup. Confirm the message runs once and the conversation stays in order.
7. Attach an image and a text file before startup finishes. Confirm previews, one delivery, and downloads after reopening.
8. Disable the flag and confirm the prior session-open behavior remains usable.

An old session with no saved transcript falls back to the live runtime. Complete a turn with
the flag enabled to capture its full history. A stored transcript from a replaced OpenCode root
is rejected rather than used to select that old root.

## Automated checks

- `pnpm test -- --id SESS-31`: stopped-session upload/download, immutable retries, 25 MiB limit, access checks, flag rollback, and deletion cleanup.
- `pnpm test -- --id SESS-30`: real HTTP flag enforcement, stopped-session reads, access checks,
  and replaced-root rejection.
- `E2E_GREP='30 — saved session history' pnpm test -- --browser-only`: toggles the flag in the
  real UI and verifies stored messages while `/start` and `/snapshot` remain pending. It sends
  during startup, asserts the optimistic message and Thinking indicator, and reads back the
  accepted prompt from the real API inbox.
- `E2E_GREP='30 — real replies' pnpm test -- --target-browser-full`: uses the configured preview
  or deployed test target and provisions a real cloud session. It sends through the UI, reads
  the completed reply from the database before stopping, reopens the stopped session, and
  sends while wake is pending. It checks delivery records, one user message and one completed
  reply per send, and both replies after a page reload. This cloud journey is excluded from
  the deterministic local profile. It deletes its sessions and auth user and archives its project.
- `apps/api/src/__tests__/integration-session-transcript-capture.test.ts`: real PostgreSQL writes
  for more than 500 messages, retries, idempotence, concurrent captures, and flag rollback.
- SDK hook tests cover disabled reads, missing history, session switching, and late responses.

The local browser fixture proves startup request initiation and pre-readiness rendering.
The deployed browser journey additionally verifies cloud startup, streaming, turn-end capture,
stop, wake, queued delivery, and reload. Both checks are required before merging.

On 2026-09-16, the shared local database returned `PGRST203` for `atomic_use_credits` because
two function signatures matched. The released browser startup request returned `402`.
This prevents that fixture from proving cloud startup; transcript rendering passed before the request was released.
