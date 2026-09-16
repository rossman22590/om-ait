import { connectorConnections, connectors, connectionCredentials } from '@kortix/db';
import type { OAuth2ClientCredentials } from '@kortix/api-contract';
/**
 * Connector credentials. A connector is project-wide visible — the only
 * ACCESS gate is the agent-side `[[agents]].connectors` grant (iam/agent-scope.ts),
 * not anything stored on the connector itself. Credentials (connection_credentials)
 * are one row per (connector, user) — user NULL is the shared project
 * credential, the only mode written today (`per_user` — a set user, each
 * member's own — was removed 2026-07-05; every caller here passes
 * `userId: null`). Values are encrypted with the project key and resolved
 * server-side only. See docs/specs/connector.md §5–6.
 */
import { and, eq, inArray, isNull, or, sql } from 'drizzle-orm';
import { decryptProjectSecret, encryptProjectSecret } from '../projects/secrets';
import { db } from '../shared/db';
import { isUniqueViolation } from '../shared/postgres-errors';
import {
  acquireOAuth2ClientCredentialsToken,
  createStoredOAuth2Credential,
  resolveStoredOAuth2Credential,
  type OAuth2AccessToken,
} from './oauth2';
import { resolveStoredDelegatedCredential } from './oauth2-delegated';

/* ─── credentials (split per user) ────────────────────────────────────────── */

function userClause(userId: string | null) {
  return userId ? eq(connectionCredentials.userId, userId) : isNull(connectionCredentials.userId);
}

interface CredentialRow {
  credentialId: string;
  kind: string;
  valueEnc: string;
  projectId: string;
}

interface OAuth2CredentialRuntime {
  acquire?: (config: OAuth2ClientCredentials) => Promise<OAuth2AccessToken>;
}

async function resolveCredentialRow(
  row: CredentialRow,
  runtime: OAuth2CredentialRuntime = {},
): Promise<string | null> {
  if (row.kind !== 'oauth2_client_credentials' && row.kind !== 'oauth2_delegated') {
    try {
      return decryptProjectSecret(row.projectId, row.valueEnc);
    } catch {
      return null;
    }
  }
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${row.credentialId}::text, 0))`,
    );
    const [current] = await tx
      .select({
        kind: connectionCredentials.kind,
        valueEnc: connectionCredentials.valueEnc,
      })
      .from(connectionCredentials)
      .where(eq(connectionCredentials.credentialId, row.credentialId))
      .limit(1);
    if (!current) return null;
    let value: string;
    try {
      value = decryptProjectSecret(row.projectId, current.valueEnc);
    } catch {
      return null;
    }
    if (
      current.kind !== 'oauth2_client_credentials' &&
      current.kind !== 'oauth2_delegated'
    ) {
      return value;
    }
    const resolved =
      current.kind === 'oauth2_delegated'
        ? await resolveStoredDelegatedCredential(value)
        : await resolveStoredOAuth2Credential(value, runtime);
    if (resolved.updatedValue) {
      await tx
        .update(connectionCredentials)
        .set({
          valueEnc: encryptProjectSecret(row.projectId, resolved.updatedValue),
          updatedAt: new Date(),
        })
        .where(eq(connectionCredentials.credentialId, row.credentialId));
    }
    return resolved.accessToken;
  });
}

/** Resolve a credential value/binding (decrypted) for (connector, user|shared). */
export async function resolveCredentialValue(
  connectorId: string,
  userId: string | null,
  runtime: OAuth2CredentialRuntime = {},
): Promise<string | null> {
  const defaultConnectionId = await defaultConnectionIdForConnector(connectorId);
  const [row] = await db
    .select({
      credentialId: connectionCredentials.credentialId,
      kind: connectionCredentials.kind,
      valueEnc: connectionCredentials.valueEnc,
      projectId: connectors.projectId,
    })
    .from(connectionCredentials)
    .innerJoin(
      connectors,
      eq(connectors.connectorId, connectionCredentials.connectorId),
    )
    .where(
      and(
        eq(connectionCredentials.connectorId, connectorId),
        userClause(userId),
        defaultConnectionId
          ? or(
              eq(connectionCredentials.connectionId, defaultConnectionId),
              isNull(connectionCredentials.connectionId),
            )
          : isNull(connectionCredentials.connectionId),
      ),
    )
    .limit(1);
  if (!row) return null;
  return resolveCredentialRow(row, runtime);
}

export async function credentialExists(
  connectorId: string,
  userId: string | null,
): Promise<boolean> {
  const defaultConnectionId = await defaultConnectionIdForConnector(connectorId);
  const [row] = await db
    .select({ id: connectionCredentials.credentialId })
    .from(connectionCredentials)
    .where(
      and(
        eq(connectionCredentials.connectorId, connectorId),
        userClause(userId),
        defaultConnectionId
          ? or(
              eq(connectionCredentials.connectionId, defaultConnectionId),
              isNull(connectionCredentials.connectionId),
            )
          : isNull(connectionCredentials.connectionId),
      ),
    )
    .limit(1);
  return !!row;
}

export async function connectorIdsWithSharedCredentials(
  connectorIds: string[],
): Promise<Set<string>> {
  if (connectorIds.length === 0) return new Set();
  const rows = await db
    .select({ connectorId: connectionCredentials.connectorId })
    .from(connectionCredentials)
    .leftJoin(
      connectorConnections,
      eq(connectorConnections.connectionId, connectionCredentials.connectionId),
    )
    .where(
      and(
        inArray(connectionCredentials.connectorId, connectorIds),
        isNull(connectionCredentials.userId),
        or(
          isNull(connectionCredentials.connectionId),
          // "The default" here means the PROJECT's shared default. Defaults are
          // per-owner now (a member may mark one of their own connections
          // default), so this must exclude member/external rows or a personal
          // connection would count as the connector being team-connected.
          and(
            eq(connectorConnections.isDefault, true),
            eq(connectorConnections.ownerType, 'project'),
          ),
        ),
      ),
    );
  return new Set(rows.map((row) => row.connectorId));
}

/**
 * Which of these connectors does ACTING USER have a credentialed, active
 * member-owned account on?
 *
 * connection-access.ts's reachability rule does not gate on the connector's
 * (retired) authorization strategy: a member reaches their OWN account
 * regardless of whether the connector has a project-wide shared credential.
 * The admin list (`listConnectors`) must agree, or a connector with only
 * private, credentialed accounts reports `needs_auth` to the very people who
 * can already call it — the connector IS connected for them.
 */
export async function connectorIdsWithReachableMemberCredential(
  connectorIds: string[],
  actingUserId: string,
): Promise<Set<string>> {
  if (connectorIds.length === 0 || !actingUserId) return new Set();
  const rows = await db
    .select({ connectorId: connectionCredentials.connectorId })
    .from(connectionCredentials)
    .innerJoin(
      connectorConnections,
      eq(connectorConnections.connectionId, connectionCredentials.connectionId),
    )
    .where(
      and(
        inArray(connectionCredentials.connectorId, connectorIds),
        eq(connectorConnections.ownerType, 'member'),
        eq(connectorConnections.ownerId, actingUserId),
        eq(connectorConnections.status, 'active'),
      ),
    );
  return new Set(rows.map((row) => row.connectorId));
}

async function defaultConnectionIdForConnector(connectorId: string): Promise<string | null> {
  const [connection] = await db
    .select({ connectionId: connectorConnections.connectionId })
    .from(connectorConnections)
    .where(
      and(
        eq(connectorConnections.connectorId, connectorId),
        eq(connectorConnections.isDefault, true),
        // The PROJECT's shared default (per-owner defaults now exist).
        eq(connectorConnections.ownerType, 'project'),
      ),
    )
    .limit(1);
  return connection?.connectionId ?? null;
}

export async function resolveConnectionCredentialValue(
  input: {
    connectorId: string;
    connectionId: string;
  },
  runtime: OAuth2CredentialRuntime = {},
): Promise<string | null> {
  const [row] = await db
    .select({
      credentialId: connectionCredentials.credentialId,
      kind: connectionCredentials.kind,
      valueEnc: connectionCredentials.valueEnc,
      projectId: connectors.projectId,
    })
    .from(connectionCredentials)
    .innerJoin(
      connectors,
      eq(connectors.connectorId, connectionCredentials.connectorId),
    )
    .where(
      and(
        eq(connectionCredentials.connectorId, input.connectorId),
        eq(connectionCredentials.connectionId, input.connectionId),
      ),
    )
    .limit(1);
  if (!row) return null;
  return resolveCredentialRow(row, runtime);
}

export async function connectionCredentialExists(input: {
  connectorId: string;
  connectionId: string;
}): Promise<boolean> {
  const [row] = await db
    .select({ id: connectionCredentials.credentialId })
    .from(connectionCredentials)
    .where(
      and(
        eq(connectionCredentials.connectorId, input.connectorId),
        eq(connectionCredentials.connectionId, input.connectionId),
      ),
    )
    .limit(1);
  return !!row;
}

export async function upsertConnectionCredential(input: {
  projectId: string;
  connectorId: string;
  connectionId: string;
  value: string;
  kind?: 'secret' | 'connection' | 'oauth2_client_credentials' | 'oauth2_delegated';
  createdBy?: string | null;
}): Promise<void> {
  const [connection] = await db
    .select({ connectionId: connectorConnections.connectionId })
    .from(connectorConnections)
    .where(
      and(
        eq(connectorConnections.connectionId, input.connectionId),
        eq(connectorConnections.connectorId, input.connectorId),
        eq(connectorConnections.projectId, input.projectId),
      ),
    )
    .limit(1);
  if (!connection) throw new Error('Connection not found');
  const valueEnc = encryptProjectSecret(input.projectId, input.value);
  const [existing] = await db
    .select({ credentialId: connectionCredentials.credentialId })
    .from(connectionCredentials)
    .where(eq(connectionCredentials.connectionId, input.connectionId))
    .limit(1);
  if (existing) {
    await db
      .update(connectionCredentials)
      .set({ valueEnc, kind: input.kind ?? 'secret', updatedAt: new Date() })
      .where(eq(connectionCredentials.credentialId, existing.credentialId));
  } else {
    await db.insert(connectionCredentials).values({
      connectorId: input.connectorId,
      connectionId: input.connectionId,
      userId: null,
      kind: input.kind ?? 'secret',
      valueEnc,
      createdBy: input.createdBy ?? null,
    });
  }
  await db
    .update(connectorConnections)
    .set({ status: 'active', updatedAt: new Date() })
    .where(eq(connectorConnections.connectionId, input.connectionId));
}

export async function upsertConnectionOAuth2Credential(
  input: {
    projectId: string;
    connectorId: string;
    connectionId: string;
    oauth2: OAuth2ClientCredentials;
    createdBy?: string | null;
  },
  runtime: OAuth2CredentialRuntime = {},
): Promise<void> {
  const token = runtime.acquire
    ? await runtime.acquire(input.oauth2)
    : await acquireOAuth2ClientCredentialsToken(input.oauth2);
  await upsertConnectionCredential({
    projectId: input.projectId,
    connectorId: input.connectorId,
    connectionId: input.connectionId,
    value: createStoredOAuth2Credential(input.oauth2, token),
    kind: 'oauth2_client_credentials',
    createdBy: input.createdBy,
  });
}

/**
 * The calling member's OWN connection on a `user`-strategy connector.
 *
 * A `user` connector has no project-wide account to share, so
 * `ensureDefaultConnection` (which only ever looks at `ownerType: 'project'`)
 * could never serve it. That gap is why a Private connector had no self-serve
 * authorization at all: every connect path refused the strategy outright, the
 * session card rendered prose with no button, and the only way to get an
 * account in was `POST /projects/:id/connections/me` from the settings screen.
 *
 * Idempotent per (connector, member): the member's default connection if they
 * already hold one, otherwise a fresh `member`-owned row marked default for
 * that owner. Defaults are per-owner, so this never collides with the project's.
 */
export async function ensureMemberConnection(input: {
  projectId: string;
  connectorId: string;
  userId: string;
  label?: string;
}): Promise<string> {
  const ownedByCaller = and(
    eq(connectorConnections.connectorId, input.connectorId),
    eq(connectorConnections.ownerType, 'member'),
    eq(connectorConnections.ownerId, input.userId),
  );
  const [existing] = await db
    .select({ connectionId: connectorConnections.connectionId })
    .from(connectorConnections)
    .where(and(ownedByCaller, eq(connectorConnections.isDefault, true)))
    .limit(1);
  if (existing) return existing.connectionId;

  const [connector] = await db
    .select()
    .from(connectors)
    .where(
      and(
        eq(connectors.connectorId, input.connectorId),
        eq(connectors.projectId, input.projectId),
      ),
    )
    .limit(1);
  if (!connector) throw new Error('Connector not found while creating its member connection');

  let created: { connectionId: string } | undefined;
  try {
    [created] = await db
      .insert(connectorConnections)
      .values({
        accountId: connector.accountId,
        projectId: connector.projectId,
        connectorId: connector.connectorId,
        ownerType: 'member',
        ownerId: input.userId,
        label: input.label ?? 'Private connection',
        status: 'active',
        isDefault: true,
        metadata: { connector_slug: connector.slug },
        createdBy: input.userId,
      })
      .returning({ connectionId: connectorConnections.connectionId });
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
  }
  if (created) return created.connectionId;

  // Raced with a concurrent connect by the same member. Any row they own is
  // the answer — the default one if the race produced it.
  const [raced] = await db
    .select({ connectionId: connectorConnections.connectionId })
    .from(connectorConnections)
    .where(ownedByCaller)
    .limit(1);
  if (!raced) throw new Error('Member connection could not be created or found');
  return raced.connectionId;
}

export async function ensureDefaultConnection(input: {
  projectId: string;
  connectorId: string;
  createdBy?: string | null;
}): Promise<string> {
  const [existing] = await db
    .select({ connectionId: connectorConnections.connectionId })
    .from(connectorConnections)
    .where(
      and(
        eq(connectorConnections.connectorId, input.connectorId),
        eq(connectorConnections.isDefault, true),
        // The PROJECT's shared default — defaults are per-owner now, so a
        // member's own default connection must never be picked up here.
        eq(connectorConnections.ownerType, 'project'),
      ),
    )
    .limit(1);
  if (existing) return existing.connectionId;

  const [connector] = await db
    .select()
    .from(connectors)
    .where(
      and(
        eq(connectors.connectorId, input.connectorId),
        eq(connectors.projectId, input.projectId),
      ),
    )
    .limit(1);
  if (!connector) throw new Error('Connector not found while creating its default connection');
  let created: { connectionId: string } | undefined;
  try {
    [created] = await db
      .insert(connectorConnections)
      .values({
        accountId: connector.accountId,
        projectId: connector.projectId,
        connectorId: connector.connectorId,
        ownerType: 'project',
        ownerId: null,
        label: connector.name,
        status: 'active',
        isDefault: true,
        metadata: { migrated_from_legacy: false, connector_slug: connector.slug },
        createdBy: input.createdBy ?? null,
      })
      .returning({ connectionId: connectorConnections.connectionId });
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
  }
  if (created) return created.connectionId;
  const [raced] = await db
    .select({ connectionId: connectorConnections.connectionId })
    .from(connectorConnections)
    .where(
      and(
        eq(connectorConnections.connectorId, input.connectorId),
        eq(connectorConnections.isDefault, true),
        // The PROJECT's shared default — defaults are per-owner now, so a
        // member's own default connection must never be picked up here.
        eq(connectorConnections.ownerType, 'project'),
      ),
    )
    .limit(1);
  if (!raced) throw new Error('Default connection could not be created');
  return raced.connectionId;
}

/** Store/replace a credential. `userId=null` = shared; set = that member's own. */
export async function upsertCredential(opts: {
  projectId: string;
  connectorId: string;
  userId: string | null;
  value: string;
  kind?: 'secret' | 'connection' | 'oauth2_client_credentials' | 'oauth2_delegated';
  createdBy?: string | null;
}): Promise<void> {
  const connectionId = await ensureDefaultConnection(opts);
  const valueEnc = encryptProjectSecret(opts.projectId, opts.value);
  const [existing] = await db
    .select({ id: connectionCredentials.credentialId })
    .from(connectionCredentials)
    .where(
      and(
        eq(connectionCredentials.connectorId, opts.connectorId),
        userClause(opts.userId),
        or(eq(connectionCredentials.connectionId, connectionId), isNull(connectionCredentials.connectionId)),
      ),
    )
    .limit(1);
  if (existing) {
    await db
      .update(connectionCredentials)
      .set({ connectionId, valueEnc, kind: opts.kind ?? 'secret', updatedAt: new Date() })
      .where(eq(connectionCredentials.credentialId, existing.id));
  } else {
    await db.insert(connectionCredentials).values({
      connectorId: opts.connectorId,
      connectionId,
      userId: opts.userId,
      kind: opts.kind ?? 'secret',
      valueEnc,
      createdBy: opts.createdBy ?? null,
    });
  }
  // Reflect "connected" in the connector status.
  await db
    .update(connectors)
    .set({ status: 'active', updatedAt: new Date() })
    .where(eq(connectors.connectorId, opts.connectorId));
}

export async function upsertOAuth2Credential(
  opts: {
    projectId: string;
    connectorId: string;
    userId: string | null;
    oauth2: OAuth2ClientCredentials;
    createdBy?: string | null;
  },
  runtime: OAuth2CredentialRuntime = {},
): Promise<void> {
  const token = runtime.acquire
    ? await runtime.acquire(opts.oauth2)
    : await acquireOAuth2ClientCredentialsToken(opts.oauth2);
  await upsertCredential({
    projectId: opts.projectId,
    connectorId: opts.connectorId,
    userId: opts.userId,
    value: createStoredOAuth2Credential(opts.oauth2, token),
    kind: 'oauth2_client_credentials',
    createdBy: opts.createdBy,
  });
}

/**
 * Remove a credential — disconnect. `userId=null` = shared; set = that member's
 * own. If no credentials remain for the connector, flip its status back to
 * `needs_auth` so it shows as needing connection again.
 */
export async function deleteCredential(connectorId: string, userId: string | null): Promise<void> {
  const defaultConnectionId = await defaultConnectionIdForConnector(connectorId);
  await db
    .delete(connectionCredentials)
    .where(
      and(
        eq(connectionCredentials.connectorId, connectorId),
        userClause(userId),
        defaultConnectionId
          ? or(
              eq(connectionCredentials.connectionId, defaultConnectionId),
              isNull(connectionCredentials.connectionId),
            )
          : isNull(connectionCredentials.connectionId),
      ),
    );
  if (!(await credentialExists(connectorId, userId))) {
    await db
      .update(connectors)
      .set({ status: 'needs_auth', updatedAt: new Date() })
      .where(eq(connectors.connectorId, connectorId));
  }
}
