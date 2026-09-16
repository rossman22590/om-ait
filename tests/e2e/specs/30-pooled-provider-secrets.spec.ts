import { expect, test } from '@playwright/test';
import { loadEnv } from '../../src/core/env';
import { createDatabaseProject, deleteDatabaseProject } from '../../src/fixtures/database-project';
import { createApiJsonClient } from '../helpers/http';
import { createAuthUser, deleteAuthUser, installBrowserSessionDirect, signIn } from '../helpers/session-auth';
import { selectAccountForUi } from '../helpers/ui';

const apiBase = process.env.E2E_API_URL || 'http://localhost:13738/v1';
const supabaseUrl = process.env.E2E_SUPABASE_URL || 'http://localhost:13740';
const databaseUrl = process.env.KE2E_DATABASE_URL || process.env.E2E_DATABASE_URL;
const authOptions = { supabaseUrl, password: 'E2ePooledSecrets123!' };
const api = createApiJsonClient(apiBase);

test.describe('30 — pooled provider secrets', () => {
  test('flag gates the Secrets panel; two keys have distinct IDs and delete independently', async ({ page }) => {
    test.skip(!databaseUrl, 'KE2E_DATABASE_URL is required');
    test.setTimeout(120_000);
    const runId = Date.now().toString(36);
    const email = `e2e-pooled-secrets-${runId}@example.test`;
    const user = await createAuthUser(email, authOptions);
    const session = await signIn(email, authOptions);
    const env = loadEnv();
    let projectId: string | null = null;
    let accountId: string | null = null;
    const createdIds: string[] = [];
    try {
      const accounts = await api<Array<{ account_id: string; personal_account?: boolean; account_role: string }>>(
        session.access_token, 'GET', '/accounts',
      );
      const account = accounts.find((item) => item.personal_account || item.account_role === 'owner');
      if (!account) throw new Error('Seeded user has no account');
      accountId = account.account_id;
      const project = await createDatabaseProject(env, {
        accountId, userId: user.id, name: `Pooled provider secrets ${runId}`,
      });
      projectId = project.id;
      await installBrowserSessionDirect(page, session, `/projects/${projectId}/customize/secrets`, authOptions);
      await selectAccountForUi(page, accountId);
      await page.goto(`/projects/${projectId}/customize/secrets`, { waitUntil: 'domcontentloaded' });
      const panel = page.getByRole('region', { name: 'Shared provider secrets' });
      await expect(panel).toHaveCount(0);

      await api(session.access_token, 'PATCH', `/projects/${projectId}/features`, {
        feature: 'pooled_provider_secrets', enabled: true,
      });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(panel).toBeVisible();
      const welcome = page.getByRole('complementary', { name: 'Welcome from Marko' });
      if (await welcome.isVisible().catch(() => false)) {
        await welcome.getByRole('button', { name: 'Dismiss' }).click();
      }
      for (const label of ['Primary test key', 'Backup test key']) {
        await panel.getByRole('button', { name: 'Add key' }).click();
        const dialog = page.getByRole('dialog', { name: 'Add provider key' });
        await dialog.getByPlaceholder('Primary key').fill(label);
        await dialog.locator('input[type="password"]').fill(`fake-${label.replaceAll(' ', '-')}`);
        const request = page.waitForRequest((candidate) => candidate.method() === 'POST'
          && candidate.url().endsWith(`/v1/accounts/${accountId}/secret-resources`));
        const response = page.waitForResponse((candidate) => candidate.request().method() === 'POST'
          && candidate.url().endsWith(`/v1/accounts/${accountId}/secret-resources`));
        await dialog.getByRole('button', { name: 'Save key' }).click();
        expect((await request).postDataJSON()).toMatchObject({ label, provider_id: 'anthropic', consumer: 'llm_gateway' });
        const saved = await response;
        expect(saved.status()).toBe(201);
        const body = await saved.json() as { secret_id: string; value?: string };
        expect(body.value).toBeUndefined();
        createdIds.push(body.secret_id);
        await expect(panel.getByText(label, { exact: true })).toBeVisible();
      }
      expect(new Set(createdIds).size).toBe(2);
      const listed = await api<{ secrets: Array<{ secret_id: string; label: string; value?: string }> }>(
        session.access_token, 'GET', `/accounts/${accountId}/secret-resources`,
      );
      expect(listed.secrets.map((secret) => secret.secret_id).sort()).toEqual([...createdIds].sort());
      expect(listed.secrets.every((secret) => secret.value === undefined)).toBe(true);

      await panel.getByRole('button', { name: 'Actions for Primary test key' }).click();
      await page.getByRole('menuitem', { name: 'Delete key' }).click();
      await page.getByRole('button', { name: 'Delete key', exact: true }).click();
      await expect(panel.getByText('Primary test key', { exact: true })).toHaveCount(0);
      await expect(panel.getByText('Backup test key', { exact: true })).toBeVisible();
      const after = await api<{ secrets: Array<{ secret_id: string }> }>(
        session.access_token, 'GET', `/accounts/${accountId}/secret-resources`,
      );
      expect(after.secrets.map((secret) => secret.secret_id)).toEqual([createdIds[1]]);
    } finally {
      if (accountId) {
        for (const id of createdIds) {
          await api(session.access_token, 'DELETE', `/accounts/${accountId}/secret-resources/${id}`, undefined, [200, 404]).catch(() => {});
        }
      }
      if (projectId) await deleteDatabaseProject(env, projectId).catch(() => {});
      await deleteAuthUser(user.id, authOptions).catch(() => {});
    }
  });
});
