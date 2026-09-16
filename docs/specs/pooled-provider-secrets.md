# Pooled provider secrets

## Problem

A project stores one shared provider key in its secrets screen. Every project member can use it. A member must enter the same key again in another project. A session cannot choose two keys for the same provider or remove one key without disrupting the others. The reverted provider-connection feature stored access as a user or project binding and placed credential management inside the provider picker.

## Resource and access contract

- An account is the tenant boundary. A secret is an account resource with an immutable `secret_id`, provider, credential kind, label, encrypted value, creator, and lifecycle state. The value never appears in a read response, audit record, log, or browser storage.
- A secret has explicit member grants. A grant permits use, not value disclosure. A creator receives a grant when creating a secret. An account manager may rotate, share, or delete a secret; a granted member may select it. A grant cannot name a member of another account.
- This release supports LLM gateway API keys. OAuth credentials, runtime variables, and connector credentials require separate delivery adapters.
- Effective use is the intersection of account membership, secret grant, project session permission, the running agent's grant, and session selection. Resolve each at the server boundary. A session token alone does not authorize a secret.
- Background sessions cannot select account resources in this release. They require an explicit service principal grant in a later delivery adapter.
- Existing project secrets keep their current behavior while the flag is off. The rollout does not copy or delete their values. When the flag is on, sessions without a resource selection may continue to use the legacy project secret path. An explicit resource selection never falls back to a legacy or managed credential without the user's separate routing choice.

## Flag

- Key: `pooled_provider_secrets`; label: **Pooled provider secrets**.
- Operator availability and the existing per-project flag both gate resource use in that project. The default is off. Account resource metadata can remain available after a project disables the flag, but disabled projects cannot select or consume it.
- The API enforces the flag for session create, pool updates, and gateway resolution. Disabling the flag stops future gateway resource use.
- Gateway pooling requires `llm_gateway`. Native OpenCode mode keeps its existing project secret behavior.

## Session selection and pool

- A session selects a set of stable secret IDs per provider. Missing selection inherits legacy behavior. An empty explicit selection means no resource secret for that provider. The SDK and UI preserve omitted, empty, and explicit selections distinctly.
- A selected secret must match the provider, be active, be granted to the session's principal, and be allowed by the running agent. Invalid or unauthorized IDs fail the write atomically. Every gateway request re-evaluates authorization and active state.
- For each new model request, choose a starting key from the eligible pool and visit each selected key at most once. On a pre-output `429`, bound `Retry-After` to 60 seconds, put that key on a shared cooldown, and try the next eligible key. A `429` is not counted against the provider as a whole. If every key is unavailable, return `429` with the earliest retry time.
- Never replay a request once response content has streamed. Do not cycle keys for a provider-wide `5xx`. Other credential errors return without changing resource state.
- Removing a key from one session edits that session's selection. Deleting a secret removes its grants and prunes future selections. An explicit pool with no eligible keys fails closed.
- Read responses show label, provider, grant summary, and cooldown, never values. Gateway request logs must not include secret values.

## User experience

- Put secret resource management in the existing Secrets surface. Use its table, filters, row actions, modal, and access-row patterns. Each key is one row with a distinct label and status. Keep `Remove from this session` separate from `Delete secret for everyone`.
- Add secret grants to the existing resource-access presentation. A secret's Access control lists members who may use it. Do not add a second, unsynchronized grant editor.
- Add provider secret selection to the existing session overrides control. Show the effective choice and distinguish inherited from explicit selection. Support multiple selected keys and a clear reset to inherited behavior.
- Verify both themes, 720 × 480, collapsed sidebar, keyboard focus, scrolling, and the native Electron shell. The UI sends IDs, never values, after initial creation or rotation.

## Verification contract

1. With the flag off, the resource routes reject use and an existing project key still serves a real model request.
2. A manager creates two Anthropic secrets and grants one to member A and both to member B. A cannot list or select the other key, including by guessed ID. Neither member can cross accounts.
3. B selects both keys in a new session. A real gateway request uses one key. A controlled upstream `429` before output uses the next key exactly once. A partial stream is never replayed.
4. Remove one key from the session. The next request uses the remaining key. Delete that key from the account. Read-back shows no grant or usable pool member; no legacy fallback occurs.
5. Revoke B's grant while the session is running. The next gateway call refuses the revoked secret.
6. Rotate one key; the resource ID and session selection stay stable, and the next call uses the new encrypted value.
7. Exercise SDK functions directly, REST flows through HTTP, web controls in Chromium with DOM and request assertions, native Electron, and one real preview session. Run the local and preview gates before requesting merge.

## Implementation sequence

1. Expand the schema with account secret resources, member grants, and session selections. Migrate forward only. Preserve the reverted tables until their data can be audited and retired separately.
2. Add one server authorization resolver for gateway keys. Keep the legacy resolver for flag-off compatibility.
3. Add feature flag and API contracts. Add typed SDK calls with a failing test first. Update public exports, snapshots, and documentation.
4. Add request-level pool selection, shared cooldown, bounded failover, audit records, and explicit failure responses.
5. Build the Secrets and session settings UI from existing components. Add browser journeys and desktop checks.
6. Run local HTTP, SDK, browser, and package gates. Open a draft PR with preview, then prove the same objective through a real preview session. Do not merge without explicit approval.
