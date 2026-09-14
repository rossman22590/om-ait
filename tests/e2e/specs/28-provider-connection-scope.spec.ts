import { expect, test } from '@playwright/test';
import { loadEnv } from '../../src/core/env';
import { createDatabaseProject, deleteDatabaseProject } from '../../src/fixtures/database-project';
import { createApiJsonClient } from '../helpers/http';
import { runDatabaseSql } from '../helpers/database';
import { createAuthUser, deleteAuthUser, installBrowserSessionDirect, signIn } from '../helpers/session-auth';
import { dismissOnboarding, selectAccountForUi } from '../helpers/ui';

const apiBase = process.env.E2E_API_URL || 'http://localhost:8008/v1';
const api = createApiJsonClient(apiBase);
const auth = { supabaseUrl: process.env.E2E_SUPABASE_URL || 'http://127.0.0.1:54321', password: 'ProviderScopeE2e123!' };

test.describe('28 — provider connection scope', () => {
  test('keeps one provider row, saves in the selected scope, and reuses a personal key across projects', async ({ page }) => {
    test.setTimeout(180_000);
    const env = loadEnv();
    const email = `e2e-provider-scope-${Date.now()}@example.test`;
    const user = await createAuthUser(email, auth);
    const session = await signIn(email, auth);
    const projects: string[] = [];
    let readerId: string | undefined;
    let teamId: string | undefined;
    try {
      const accounts = await api<{ account_id: string; personal_account: boolean }[]>(session.access_token, 'GET', '/accounts');
      const account = accounts.find(a => a.personal_account) ?? accounts[0]!;
      for (let i = 0; i < 2; i++) {
        projects.push((await createDatabaseProject(env, { accountId: account.account_id, userId: user.id,
          name: `Provider scope ${i}`, metadata: { experimental: { llm_gateway: true } } })).id);
      }
      await installBrowserSessionDirect(page, session, '/favicon.png', auth);
      await selectAccountForUi(page, account.account_id);
      const open = async (id: string) => {
        await page.goto(`/projects/${id}/customize/models`);
        await dismissOnboarding(page);
        const dismiss = page.getByRole('button', { name: 'Dismiss', exact: true });
        if (await dismiss.isVisible()) await dismiss.click();
      };
      await open(projects[0]!);
      const row = page.locator('[data-provider-row="openai"]');
      const scope = row.getByRole('combobox', { name: 'Connection for OpenAI' });
      const choose = async (name: string) => {
        await scope.click();
        await page.getByRole('option', { name, exact: true }).click();
        await expect(scope).toHaveText(name);
      };
      await expect(row).toHaveCount(1);
      await expect(page.getByRole('button', { name: 'Connect ChatGPT', exact: true })).toHaveCount(1);
      await expect(page.getByRole('region', { name: 'Personal provider connections' })).toHaveCount(0);
      await expect(scope).toHaveText('Project connection');

      // Project mode still writes the original shared secret through the original field.
      const projectSave = page.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith(`/projects/${projects[0]}/secrets`));
      await row.getByRole('textbox', { name: 'OpenAI API key', exact: true }).fill('project-scope-ui-fixture');
      await page.getByRole('heading', { name: 'Models', exact: true }).click();
      expect((await projectSave).status()).toBe(200);

      await choose('My API key');
      const key = row.getByRole('textbox', { name: 'OpenAI API key', exact: true });
      await expect(key).toHaveValue('');
      const personalSave = page.waitForResponse(r => r.request().method() === 'PUT' && r.url().endsWith('/provider-connections/openai'));
      const bind = page.waitForResponse(r => r.request().method() === 'PUT' && r.url().endsWith(`/projects/${projects[0]}/personal-providers/openai`));
      await key.fill('personal-scope-ui-fixture');
      await page.getByRole('heading', { name: 'Models', exact: true }).click();
      const saved = await personalSave;
      expect(saved.status()).toBe(200);
      expect(saved.request().postDataJSON()).toEqual({ api_key: 'personal-scope-ui-fixture' });
      const bound = await bind;
      expect(bound.status()).toBe(200);
      expect(bound.request().postDataJSON()).toEqual({ enabled: true });
      await expect(key).toHaveValue('');
      await expect(key).toHaveAttribute('placeholder', 'Saved — paste a new key to replace it');
      const list = await api<{ items: { connection_id: string; provider_id: string }[] }>(session.access_token, 'GET', '/provider-connections');
      const connection = list.items.find(c => c.provider_id === 'openai')!;
      expect(JSON.stringify(list)).not.toContain('personal-scope-ui-fixture');

      await page.reload();
      await expect(scope).toHaveText('My API key');
      const unbind = page.waitForResponse(r => r.request().method() === 'PUT' && r.url().endsWith(`/projects/${projects[0]}/personal-providers/openai`));
      await choose('Project connection');
      expect((await unbind).request().postDataJSON()).toEqual({ enabled: false });
      await expect(row.getByRole('textbox', { name: 'OpenAI API key', exact: true })).toHaveAttribute('placeholder', 'Saved — paste a new key to replace it');
      expect((await api<{ items: unknown[] }>(session.access_token, 'GET', `/projects/${projects[0]}/personal-providers`)).items).toEqual([]);

      // Reuse needs only a binding. No second credential write occurs.
      await open(projects[1]!);
      const writes: string[] = [];
      page.on('request', r => { if (r.method() === 'PUT' && r.url().endsWith('/provider-connections/openai')) writes.push(r.url()); });
      await choose('My API key');
      const second = await api<{ items: { connection_id: string }[] }>(session.access_token, 'GET', `/projects/${projects[1]}/personal-providers`);
      expect(second.items[0]?.connection_id).toBe(connection.connection_id);
      expect(writes).toEqual([]);
      await expect(key).toHaveAttribute('placeholder', 'Saved — paste a new key to replace it');

      // Subscription is another choice in the same row, never a duplicate block.
      await choose('My ChatGPT subscription');
      await expect(row.getByRole('textbox')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Connect ChatGPT', exact: true })).toHaveCount(1);
      await expect(row).toContainText('Your connection stays private.');
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(scope).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.setViewportSize({ width: 1280, height: 900 });
      await choose('Project connection');
      await api(session.access_token, 'DELETE', '/provider-connections/openai');
      // A connection removed in another tab must fail visibly and preserve project mode.
      await scope.click();
      await page.getByRole('option', { name: 'My API key', exact: true }).click();
      await expect(row.getByRole('alert')).toBeVisible();
      await expect(scope).toHaveText('Project connection');

      const native = await createDatabaseProject(env, { accountId: account.account_id, userId: user.id,
        name: 'Native provider scope', metadata: { experimental: { llm_gateway: false } } });
      projects.push(native.id);
      await open(native.id);
      await expect(row.getByRole('textbox', { name: 'OpenAI API key', exact: true })).toBeVisible();
      await expect(scope).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Connect ChatGPT', exact: true })).toHaveCount(1);
      const readerEmail = `e2e-provider-reader-${Date.now()}@example.test`;
      const reader = await createAuthUser(readerEmail, auth);
      readerId = reader.id;
      const readerSession = await signIn(readerEmail, auth);
      const team = await api<{ account_id: string }>(session.access_token, 'POST', '/accounts', { name: 'Provider scope readers' }, 201);
      teamId = team.account_id;
      await api(session.access_token, 'POST', `/accounts/${teamId}/members`, { email: readerEmail, role: 'member' }, 201);
      const shared = await createDatabaseProject(env, { accountId: teamId, userId: user.id,
        name: 'Reader personal provider', metadata: { experimental: { llm_gateway: true } } });
      projects.push(shared.id);
      await api(session.access_token, 'PUT', `/projects/${shared.id}/access/${readerId}`, { role: 'member' });
      await installBrowserSessionDirect(page, readerSession, '/favicon.png', auth);
      await selectAccountForUi(page, teamId);
      await open(shared.id);
      await expect(scope).toHaveText('Project connection');
      await expect(row.getByRole('textbox')).toHaveCount(0);
      await choose('My API key');
      const readerBind = page.waitForResponse(r => r.request().method() === 'PUT' && r.url().endsWith(`/projects/${shared.id}/personal-providers/openai`));
      await key.fill('reader-personal-ui-fixture');
      await page.getByRole('heading', { name: 'Models', exact: true }).click();
      expect((await readerBind).status()).toBe(200);
      await expect(key).toHaveAttribute('placeholder', 'Saved — paste a new key to replace it');
      await api(readerSession.access_token, 'DELETE', '/provider-connections/openai');
    } finally {
      await api(session.access_token, 'DELETE', '/provider-connections/openai').catch(() => {});
      for (const project of projects) await deleteDatabaseProject(env, project);
      if (teamId) await runDatabaseSql('delete from kortix.accounts where account_id = $1::uuid', [teamId]);
      if (readerId) await deleteAuthUser(readerId, auth);
      await deleteAuthUser(user.id, auth);
    }
  });
});
