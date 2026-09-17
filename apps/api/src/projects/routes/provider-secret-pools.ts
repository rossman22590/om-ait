import { createRoute, z } from '@hono/zod-openapi';
import { accountSecretGrants, accountSecretResources, sessionProviderSecretPools } from '@kortix/db';
import { and, eq, inArray } from 'drizzle-orm';
import { auth, errors, json } from '../../openapi';
import { db } from '../../shared/db';
import { requireFeatureFlag } from '../../feature-flags/gate';
import { projectLlmGatewayEnabled } from '../../llm-gateway/enablement';
import { resolveCatalogUpstream } from '../../llm-gateway/models/provider-registry';
import { PROJECT_ACTIONS } from '../../iam';
import { agentMayUseEnv } from '../../iam/agent-scope';
import { loadProjectForUser, loadVisibleSession, assertProjectCapability } from '../lib/access';
import { mayChangeSessionModel } from '../lib/session-model-change';
import { resolveSessionAgentGrant } from '../lib/secret-grant';
import { DEFAULT_AGENT_SENTINEL } from '../agents';
import { projectsApp } from '../lib/app';

const Params = z.object({ projectId: z.string().uuid(), sessionId: z.string().uuid(), providerId: z.string().min(1).max(100) });
const Pool = z.object({ provider_id: z.string(), configured: z.boolean(), secret_ids: z.array(z.string()) });
const Input = z.object({ secret_ids: z.array(z.string().uuid()).max(10).nullable() }).strict();

export async function validateProviderSecretPool(input: {
  accountId: string; projectId: string; repoUrl: string; defaultBranch: string | null;
  manifestPath: string | null; agentName: string; userId: string;
  providerId: string; ids: string[];
}): Promise<{ status: 400 | 403 | 409; error: string } | null> {
  const provider = input.providerId === 'codex'
    ? { envVar: 'CODEX_AUTH_JSON' }
    : resolveCatalogUpstream(input.providerId);
  if (!provider) return { status: 400, error: 'Unknown provider' };
  if (input.ids.length > 10 || new Set(input.ids).size !== input.ids.length) {
    return { status: 400, error: 'Invalid or duplicate secret id' };
  }
  if (!input.ids.length) return null;
  let grant;
  try {
    grant = await resolveSessionAgentGrant({
      projectId: input.projectId, repoUrl: input.repoUrl, defaultBranch: input.defaultBranch,
      manifestPath: input.manifestPath, sessionAgent: input.agentName,
    });
  } catch {
    return { status: 409, error: 'Agent grant unavailable' };
  }
  if (!agentMayUseEnv(grant, provider.envVar)) return { status: 403, error: 'Agent cannot use this provider secret' };
  const rows = await db.select({ id: accountSecretResources.secretId }).from(accountSecretResources)
    .innerJoin(accountSecretGrants, and(eq(accountSecretGrants.secretId, accountSecretResources.secretId), eq(accountSecretGrants.accountId, accountSecretResources.accountId)))
    .where(and(
      eq(accountSecretResources.accountId, input.accountId),
      eq(accountSecretResources.providerId, input.providerId),
      eq(accountSecretResources.name, provider.envVar),
      eq(accountSecretResources.consumer, 'llm_gateway'),
      eq(accountSecretResources.active, true),
      eq(accountSecretGrants.userId, input.userId),
      inArray(accountSecretResources.secretId, input.ids),
    ));
  return rows.length === input.ids.length ? null : { status: 403, error: 'Secret unavailable or not granted' };
}

projectsApp.openapi(createRoute({
  method: 'get', path: '/{projectId}/sessions/{sessionId}/provider-secret-pools/{providerId}',
  tags: ['sessions'], summary: 'Read the selected provider secret pool', ...auth,
  request: { params: Params }, responses: { 200: json(Pool, 'Session pool'), ...errors(403, 404) },
}), async (c: any) => {
  const { projectId, sessionId, providerId } = c.req.param();
  const loaded = await loadProjectForUser(c, projectId, 'read');
  if (!loaded) return c.json({ error: 'Not found' }, 404);
  const visible = await loadVisibleSession(loaded, sessionId, null, null);
  if (!visible) return c.json({ error: 'Not found' }, 404);
  const gate = requireFeatureFlag(c, loaded.row.metadata, 'pooled_provider_secrets');
  if (gate) return gate;
  const [pool] = await db.select({ ids: sessionProviderSecretPools.secretIds }).from(sessionProviderSecretPools)
    .where(and(eq(sessionProviderSecretPools.sessionId, sessionId), eq(sessionProviderSecretPools.providerId, providerId))).limit(1);
  return c.json({ provider_id: providerId, configured: Boolean(pool), secret_ids: pool?.ids ?? [] });
});

projectsApp.openapi(createRoute({
  method: 'put', path: '/{projectId}/sessions/{sessionId}/provider-secret-pools/{providerId}',
  tags: ['sessions'], summary: 'Replace one session provider secret pool', ...auth,
  request: { params: Params, body: { content: { 'application/json': { schema: Input } } } },
  responses: { 200: json(Pool, 'Session pool'), ...errors(400, 403, 404, 409) },
}), async (c: any) => {
  const { projectId, sessionId, providerId } = c.req.param();
  const loaded = await loadProjectForUser(c, projectId, 'session');
  if (!loaded) return c.json({ error: 'Not found' }, 404);
  await assertProjectCapability(c, loaded.userId, loaded.row.accountId, projectId, PROJECT_ACTIONS.PROJECT_SESSION_STOP);
  const visible = await loadVisibleSession(loaded, sessionId, null, null);
  if (!visible) return c.json({ error: 'Not found' }, 404);
  if (!mayChangeSessionModel(visible)) return c.json({ error: 'Only the session owner or a project manager can select provider secrets' }, 403);
  const gate = requireFeatureFlag(c, loaded.row.metadata, 'pooled_provider_secrets');
  if (gate) return gate;
  if (!projectLlmGatewayEnabled(loaded.row.metadata)) return c.json({ error: 'Provider pools require the LLM gateway' }, 409);
  const parsed = Input.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: 'Invalid secret ids' }, 400);
  const ids = parsed.data.secret_ids;
  if (ids === null) {
    await db.delete(sessionProviderSecretPools).where(and(eq(sessionProviderSecretPools.sessionId, sessionId), eq(sessionProviderSecretPools.providerId, providerId)));
    return c.json({ provider_id: providerId, configured: false, secret_ids: [] });
  }
  const invalid = await validateProviderSecretPool({
    accountId: loaded.row.accountId, projectId, repoUrl: loaded.row.repoUrl,
    defaultBranch: loaded.row.defaultBranch, manifestPath: loaded.row.manifestPath,
    agentName: visible.row.agentName ?? DEFAULT_AGENT_SENTINEL, userId: loaded.userId,
    providerId, ids,
  });
  if (invalid) return c.json({ error: invalid.error }, invalid.status);
  await db.insert(sessionProviderSecretPools).values({ sessionId, providerId, secretIds: ids, updatedAt: new Date() })
    .onConflictDoUpdate({ target: [sessionProviderSecretPools.sessionId, sessionProviderSecretPools.providerId], set: { secretIds: ids, updatedAt: new Date() } });
  return c.json({ provider_id: providerId, configured: true, secret_ids: ids });
});
