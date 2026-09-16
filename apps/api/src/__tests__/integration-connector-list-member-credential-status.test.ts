/**
 * The admin connector list (`GET /projects/:id/connectors`, `db-deps.ts`
 * `listConnectors`) must agree with the real reachability rule
 * (connection-access.ts): a connector with no project-wide shared credential
 * but a credentialed, active MEMBER-owned account is connected for the
 * member who owns it — not `needs_auth`.
 *
 * Found live on the merged branch: an `openapi` connector with two
 * member-owned accounts, each holding its own credential, still reported
 * `needs_auth` (secretSet: false) because `listConnectors` only ever checked
 * the project-wide shared credential (`connectorIdsWithSharedCredentials`,
 * userId IS NULL) — it never asked "does the CALLER have their own". Calls
 * through both accounts succeeded via `account:`; the admin list contradicted
 * the gateway.
 *
 * Real-Postgres tenant contract — run with DATABASE_URL pointed at an
 * isolated migrated database (mirrors integration-session-connections.test.ts).
 */
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { accounts, connectionCredentials, connectorConnections, connectors, projects } from '@kortix/db';
import { eq } from 'drizzle-orm';
import { dbConnectorRouterDeps } from '../connectors/db-deps';
import { encryptProjectSecret } from '../projects/secrets';
import { db } from '../shared/db';

const ACCOUNT = crypto.randomUUID();
const PROJECT = crypto.randomUUID();

// CRM: no project-owned connection at all — only two member-owned, credentialed ones.
const CONNECTOR_CRM = crypto.randomUUID();
const CONNECTION_A = crypto.randomUUID();
const CONNECTION_B = crypto.randomUUID();
// A second connector with literally zero connections — the true "zero accounts" case.
const CONNECTOR_NONE = crypto.randomUUID();

const USER_A = crypto.randomUUID();
const USER_B = crypto.randomUUID();
// Neither owns nor can reach any CRM account.
const USER_C = crypto.randomUUID();

beforeAll(async () => {
  await db.insert(accounts).values({ accountId: ACCOUNT, name: 'crm-member-credential-test' });
  await db.insert(projects).values({
    projectId: PROJECT,
    accountId: ACCOUNT,
    name: 'crm-member-credential-test',
    repoUrl: 'https://example.test/crm-member-credential.git',
  });
  await db.insert(connectors).values([
    {
      connectorId: CONNECTOR_CRM,
      accountId: ACCOUNT,
      projectId: PROJECT,
      slug: 'crm',
      name: 'CRM',
      providerType: 'openapi',
      config: { baseUrl: 'https://crm.example.test', auth: { type: 'bearer' } },
    },
    {
      connectorId: CONNECTOR_NONE,
      accountId: ACCOUNT,
      projectId: PROJECT,
      slug: 'no_accounts',
      name: 'No Accounts',
      providerType: 'openapi',
      config: { baseUrl: 'https://no-accounts.example.test', auth: { type: 'bearer' } },
    },
  ]);
  await db.insert(connectorConnections).values([
    {
      connectionId: CONNECTION_A,
      accountId: ACCOUNT,
      projectId: PROJECT,
      connectorId: CONNECTOR_CRM,
      ownerType: 'member',
      ownerId: USER_A,
      status: 'active',
      label: "A's CRM",
    },
    {
      connectionId: CONNECTION_B,
      accountId: ACCOUNT,
      projectId: PROJECT,
      connectorId: CONNECTOR_CRM,
      ownerType: 'member',
      ownerId: USER_B,
      status: 'active',
      label: "B's CRM",
    },
  ]);
  await db.insert(connectionCredentials).values([
    {
      connectorId: CONNECTOR_CRM,
      connectionId: CONNECTION_A,
      valueEnc: encryptProjectSecret(PROJECT, 'crm-a-capability'),
    },
    {
      connectorId: CONNECTOR_CRM,
      connectionId: CONNECTION_B,
      valueEnc: encryptProjectSecret(PROJECT, 'crm-b-capability'),
    },
  ]);
});

afterAll(async () => {
  await db.delete(connectorConnections).where(eq(connectorConnections.projectId, PROJECT));
  await db.delete(connectors).where(eq(connectors.projectId, PROJECT));
  await db.delete(projects).where(eq(projects.projectId, PROJECT));
  await db.delete(accounts).where(eq(accounts.accountId, ACCOUNT));
});

async function crmView(actingUserId?: string) {
  const list = await dbConnectorRouterDeps.listConnectors(PROJECT, actingUserId);
  const crm = list.find((c) => c.slug === 'crm');
  if (!crm) throw new Error('crm connector missing from admin list');
  return crm;
}

describe('admin connector list matches per-caller reachability, not just the shared credential', () => {
  test('two member-owned, credentialed accounts: each owner sees the connector as connected', async () => {
    for (const owner of [USER_A, USER_B]) {
      const crm = await crmView(owner);
      expect(crm.status).not.toBe('needs_auth');
      expect(crm.status).toBe('active');
      expect(crm.secretSet).toBe(true);
      expect(crm.credentialSource).toBe('stored');
    }
  });

  test('a member with no reachable account still sees needs_auth', async () => {
    const crm = await crmView(USER_C);
    expect(crm.status).toBe('needs_auth');
    expect(crm.secretSet).toBe(false);
  });

  test('no acting user at all (no human principal) reports needs_auth — nobody to ask', async () => {
    const crm = await crmView(undefined);
    expect(crm.status).toBe('needs_auth');
    expect(crm.secretSet).toBe(false);
  });

  test('zero accounts on the connector is needs_auth for everyone', async () => {
    const list = await dbConnectorRouterDeps.listConnectors(PROJECT, USER_A);
    const none = list.find((c) => c.slug === 'no_accounts');
    if (!none) throw new Error('no_accounts connector missing from admin list');
    expect(none.status).toBe('needs_auth');
    expect(none.secretSet).toBe(false);
  });
});
