/**
 * The request audit is unconditional and principal-sourced.
 *
 * `e2e-audit-events.test.ts` pins the row shape for requests the auth
 * middleware identified; every case there must keep passing unchanged. This
 * file pins what changed: a request nobody identified is written as
 * `anonymous` instead of skipped, a self-authenticating route attributes its
 * row by binding a principal, a handler can name the domain action, and a
 * request that entered through an outer scope is written exactly once.
 */
import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { type Context, Hono } from 'hono';
import { runWithContext } from '../lib/request-context';

let auditRows: Array<Record<string, unknown>> = [];

mock.module('../shared/db', () => ({
  db: {
    insert: () => ({
      values: (values: Record<string, unknown>) => {
        auditRows.push(values);
        return {
          returning: async () => [{ eventId: 'audit_test', ...values }],
        };
      },
    }),
    select: () => {
      const chain = {
        from: () => chain,
        where: () => chain,
        then: (resolve: (rows: unknown[]) => unknown) => Promise.resolve(resolve([])),
      };
      return chain;
    },
  },
}));

const { auditApiRequest } = await import('../shared/audit');
const { annotateAuditEvent, attachInboundAuditScope, bindAuditPrincipal } = await import(
  '../shared/audit-scope'
);

const USER = '00000000-0000-4000-a000-000000000001';
const ACCOUNT = '00000000-0000-4000-a000-000000000101';
const PROJECT = '00000000-0000-4000-a000-000000000201';

function gitApp(handler: (c: Context) => Response | Promise<Response>): Hono {
  const app = new Hono();
  app.use('*', auditApiRequest);
  app.post('/v1/git/:projectId/git-receive-pack', handler);
  return app;
}

describe('the request audit writes a row for every request', () => {
  beforeEach(() => {
    auditRows = [];
  });

  test('a request nobody identified is written as anonymous, not skipped', async () => {
    const app = gitApp((c) => c.text('Authentication required', 401));

    const res = await app.request(`/v1/git/${PROJECT}/git-receive-pack`, {
      method: 'POST',
      headers: { 'User-Agent': 'git/2.45.0', 'X-Forwarded-For': '203.0.113.7' },
    });

    expect(res.status).toBe(401);
    expect(auditRows).toHaveLength(1);
    expect(auditRows[0]).toMatchObject({
      accountId: null,
      actorUserId: null,
      actorType: 'anonymous',
      source: 'anonymous',
      outcome: 'denied',
      httpStatus: 401,
      action: 'POST /v1/git/:projectId/git-receive-pack',
      ip: '203.0.113.7',
      userAgent: 'git/2.45.0',
    });
  });

  test('a route outside /v1 is audited too', async () => {
    const app = new Hono();
    app.use('*', auditApiRequest);
    app.post('/scim/v2/Users', (c) => {
      (c as any).set('accountId', ACCOUNT);
      return c.json({ id: 'u1' }, 201);
    });

    const res = await app.request('/scim/v2/Users', { method: 'POST', body: '{}' });

    expect(res.status).toBe(201);
    expect(auditRows).toHaveLength(1);
    expect(auditRows[0]).toMatchObject({
      accountId: ACCOUNT,
      actorType: 'system',
      action: 'POST /scim/v2/Users',
      httpStatus: 201,
    });
  });

  test.each([
    ['OPTIONS', '/v1/projects'],
    ['GET', '/v1/health'],
    ['GET', '/metrics'],
  ])('%s %s writes nothing', async (method, path) => {
    const app = new Hono();
    app.use('*', auditApiRequest);
    app.all('*', (c) => c.text('ok'));

    await app.request(path, { method });

    expect(auditRows).toHaveLength(0);
  });
});

describe('authenticators and handlers write into the request scope', () => {
  beforeEach(() => {
    auditRows = [];
  });

  test('a self-authenticating route attributes its row by binding a principal', async () => {
    const app = gitApp((c) => {
      bindAuditPrincipal({
        accountId: ACCOUNT,
        projectId: PROJECT,
        actorUserId: USER,
        actorType: 'human',
        authoritativeSource: 'human',
        authMethod: { kind: 'git_basic' },
      });
      return c.body(null, 200);
    });

    await app.request(`/v1/git/${PROJECT}/git-receive-pack`, { method: 'POST' });

    expect(auditRows).toHaveLength(1);
    expect(auditRows[0]).toMatchObject({
      accountId: ACCOUNT,
      projectId: PROJECT,
      actorUserId: USER,
      actorType: 'human',
      source: 'human',
      outcome: 'success',
    });
    expect(auditRows[0]?.metadata).toMatchObject({ auth: { kind: 'git_basic' } });
  });

  test('a handler names the domain action; the HTTP identity is kept in metadata', async () => {
    const app = gitApp((c) => {
      bindAuditPrincipal({ accountId: ACCOUNT, actorUserId: USER, actorType: 'human' });
      annotateAuditEvent({
        action: 'git.push',
        resourceType: 'git_repository',
        resourceId: PROJECT,
        metadata: { refs: [{ ref: 'refs/heads/main', kind: 'update' }] },
      });
      return c.body(null, 200);
    });

    await app.request(`/v1/git/${PROJECT}/git-receive-pack`, { method: 'POST' });

    expect(auditRows).toHaveLength(1);
    expect(auditRows[0]).toMatchObject({
      action: 'git.push',
      resourceType: 'git_repository',
      resourceId: PROJECT,
    });
    expect(auditRows[0]?.metadata).toMatchObject({
      http: 'POST /v1/git/:projectId/git-receive-pack',
      refs: [{ ref: 'refs/heads/main', kind: 'update' }],
    });
  });

  test('a refused push can say denied even when git got a 200 with an error report', async () => {
    const app = gitApp((c) => {
      annotateAuditEvent({ action: 'git.push', outcome: 'denied' });
      return c.body(null, 200);
    });

    await app.request(`/v1/git/${PROJECT}/git-receive-pack`, { method: 'POST' });

    expect(auditRows[0]).toMatchObject({ action: 'git.push', outcome: 'denied', httpStatus: 200 });
  });

  test('a project bound without a caller is anonymous, not "system"', async () => {
    // An invalid token against a known project: the project owner should see
    // the attempt, but nothing proved who made it.
    const app = gitApp((c) => {
      bindAuditPrincipal({ accountId: ACCOUNT, projectId: PROJECT });
      return c.text('Invalid PAT', 401);
    });

    await app.request(`/v1/git/${PROJECT}/git-receive-pack`, { method: 'POST' });

    expect(auditRows[0]).toMatchObject({
      accountId: ACCOUNT,
      projectId: PROJECT,
      actorUserId: null,
      actorType: 'anonymous',
      source: 'anonymous',
      outcome: 'denied',
    });
  });

  test('attribution that needs a lookup is resolved when the row is written', async () => {
    const HUMAN = '00000000-0000-4000-a000-000000000002';
    const app = gitApp((c) => {
      bindAuditPrincipal({
        accountId: ACCOUNT,
        actorUserId: USER,
        actorType: 'agent',
        lateAttribution: async () => ({
          actorUserId: HUMAN,
          agentName: 'kortix',
          onBehalfOfUserId: HUMAN,
        }),
      });
      return c.body(null, 200);
    });

    await app.request(`/v1/git/${PROJECT}/git-receive-pack`, { method: 'POST' });

    expect(auditRows[0]).toMatchObject({
      actorType: 'agent',
      actorUserId: HUMAN,
      agentName: 'kortix',
      onBehalfOfUserId: HUMAN,
    });
  });

  test('a lookup that fails keeps what was bound, and the row is still written', async () => {
    const app = gitApp((c) => {
      bindAuditPrincipal({
        accountId: ACCOUNT,
        actorUserId: USER,
        actorType: 'agent',
        lateAttribution: async () => {
          throw new Error('token binding lookup timed out');
        },
      });
      return c.body(null, 200);
    });

    await app.request(`/v1/git/${PROJECT}/git-receive-pack`, { method: 'POST' });

    expect(auditRows).toHaveLength(1);
    expect(auditRows[0]).toMatchObject({ actorType: 'agent', actorUserId: USER });
  });

  test('an unannotated row keeps exactly the metadata it always had', async () => {
    const app = new Hono();
    app.use('*', auditApiRequest);
    app.get('/v1/accounts/:accountId/projects', (c) => {
      (c as any).set('userId', USER);
      (c as any).set('accountId', c.req.param('accountId'));
      (c as any).set('authType', 'supabase');
      return c.json({ projects: [] });
    });

    await app.request(`/v1/accounts/${ACCOUNT}/projects`);

    expect(auditRows[0]?.metadata).toEqual({
      method: 'GET',
      path: '/v1/accounts/:accountId/projects',
    });
  });
});

describe('a request opened by an outer layer is written once, by that layer', () => {
  beforeEach(() => {
    auditRows = [];
  });

  test('the middleware stamps the scope and leaves the write to its owner', async () => {
    const app = new Hono();
    app.use('*', auditApiRequest);
    app.post('/v1/projects/:projectId/secrets', (c) => {
      (c as any).set('userId', USER);
      (c as any).set('accountId', ACCOUNT);
      (c as any).set('authType', 'supabase');
      return c.json({ error: 'upstream' }, 502);
    });

    const scope = await runWithContext('POST', `/v1/projects/${PROJECT}/secrets`, async () => {
      const outer = attachInboundAuditScope({ owner: 'edge', method: 'POST' });
      await app.request(`/v1/projects/${PROJECT}/secrets`, { method: 'POST' });
      return outer;
    });

    expect(auditRows).toHaveLength(0);
    expect(scope.route).toBe('/v1/projects/:projectId/secrets');
    // The honest status, before any wire rewrite turns 502 into 503.
    expect(scope.status).toBe(502);
    expect(scope.hono).toMatchObject({ tokenUserId: USER, accountId: ACCOUNT, authType: 'supabase' });
  });
});
