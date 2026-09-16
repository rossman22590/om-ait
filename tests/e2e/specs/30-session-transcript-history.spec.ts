import { expect, test } from '@playwright/test';
import { loadEnv } from '../../src/core/env';
import { createDatabaseSession } from '../../src/fixtures/database-project';
import { seedSessionTranscript } from '../../src/fixtures/session-transcript';
import { runDatabaseSql } from '../helpers/database';
import { createApiJsonClient } from '../helpers/http';
import { createManifestProject, fundAccount } from '../helpers/manifest-project';
import {
  createAuthUser,
  deleteAuthUser,
  installBrowserSessionDirect,
  signIn,
} from '../helpers/session-auth';
import {
  dismissOnboarding,
  dismissWelcomeCard,
  featureFlagRow,
  selectAccountForUi,
} from '../helpers/ui';

const api = createApiJsonClient(process.env.E2E_API_URL!);
const authOptions = {
  supabaseUrl: process.env.E2E_SUPABASE_URL!,
  password: 'TranscriptHistory123!',
};

test('30 — saved session history paints while sandbox start and the open bundle are pending', async ({
  page,
}, testInfo) => {
  test.setTimeout(240_000);
  const env = loadEnv();
  const email = `transcript-history-${Date.now()}@example.test`;
  const user = await createAuthUser(email, authOptions);
  const auth = await signIn(email, authOptions);
  let projectId = '';
  let disposeProject = async () => {};
  let releaseReads = () => {};
  let releaseSend = () => {};
  try {
    const accounts = await api<Array<{ account_id: string; personal_account?: boolean }>>(
      auth.access_token,
      'GET',
      '/accounts',
    );
    const accountId = (accounts.find((a) => a.personal_account) ?? accounts[0]).account_id;
    await fundAccount(env.databaseUrl!, accountId);
    const project = await createManifestProject({
      api,
      accessToken: auth.access_token,
      databaseUrl: env.databaseUrl!,
      accountId,
      userId: user.id,
      name: 'Transcript history verification',
    });
    projectId = project.id;
    disposeProject = project.dispose;
    const sessionId = await createDatabaseSession(env, { projectId, accountId, userId: user.id });
    await seedSessionTranscript(env, { projectId, accountId, sessionId });
    await runDatabaseSql(
      "UPDATE kortix.project_sessions SET agent_name='kortix' WHERE session_id=$1",
      [sessionId],
      env.databaseUrl,
    );
    await installBrowserSessionDirect(page, auth, `/projects/${projectId}`, authOptions);
    await selectAccountForUi(page, accountId);
    await dismissOnboarding(page);
    await page.goto(`/projects/${projectId}/settings/feature-flags`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByRole('heading', { name: 'Feature flags', exact: true })).toBeVisible();
    const row = featureFlagRow(page.locator('body'), page, 'Session Transcript History');
    const toggle = row.getByRole('switch');
    await expect(toggle).not.toBeChecked();
    const patched = page.waitForResponse(
      (r) =>
        r.url().endsWith(`/projects/${projectId}/features`) && r.request().method() === 'PATCH',
    );
    await toggle.click();
    const changed = await patched;
    expect(changed.status()).toBe(200);
    expect(changed.request().postDataJSON()).toEqual({
      feature: 'session_transcript_history',
      enabled: true,
    });
    await expect(toggle).toBeChecked();

    const held = new Promise<void>((resolve) => {
      releaseReads = resolve;
    });
    let startRequested = false;
    let startResponded = false;
    let snapshotRequested = false;
    page.on('response', (response) => {
      if (response.url().includes(`/sessions/${sessionId}/start`)) startResponded = true;
    });
    await page.route(`**/sessions/${sessionId}/start*`, async (route) => {
      startRequested = true;
      await held;
      await route.continue().catch(() => {});
    });
    await page.route(`**/sessions/${sessionId}/snapshot*`, async (route) => {
      snapshotRequested = true;
      await held;
      await route.continue().catch(() => {});
    });
    const history = page.waitForResponse(
      (r) =>
        r.url().includes(`/sessions/${sessionId}/transcript?`) && r.url().includes('history=true'),
    );
    await page.goto(`/projects/${projectId}/sessions/${sessionId}`, {
      waitUntil: 'domcontentloaded',
    });
    const response = await history;
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.source).toBe('mirror');
    expect(body.message_count).toBe(2);
    await expect(
      page.getByText('This reply is stored in the database.', { exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Show my saved conversation.', { exact: true })).toBeVisible();
    await expect.poll(() => startRequested).toBe(true);
    await expect.poll(() => snapshotRequested).toBe(true);
    expect(startResponded).toBe(false);
    await dismissWelcomeCard(page);
    for (const close of await page.getByRole('button', { name: 'Close notification' }).all())
      await close.click();
    await page.screenshot({
      animations: 'disabled',
      path: testInfo.outputPath('history-before-sandbox-ready.png'),
      fullPage: true,
    });
    const pendingSend = new Promise<void>((resolve) => {
      releaseSend = resolve;
    });
    await page.route(`**/sessions/${sessionId}/prompts`, async (route) => {
      if (route.request().method() === 'POST') await pendingSend;
      await route.continue().catch(() => {});
    });
    const editor = page.locator('[contenteditable="true"]').first();
    await editor.fill('Continue while the computer starts.');
    const send = page.getByRole('button', { name: 'Send message', exact: true });
    await expect(send).toBeEnabled();
    const submitted = page.waitForRequest(
      (r) => r.url().endsWith(`/sessions/${sessionId}/prompts`) && r.method() === 'POST',
    );
    await send.click();
    const request = await submitted;
    expect(request.postDataJSON().parts).toEqual([
      { type: 'text', text: 'Continue while the computer starts.' },
    ]);
    await expect(page.getByText('Continue while the computer starts.', { exact: true })).toBeVisible();
    await expect(page.getByTestId('session-busy-indicator')).toBeVisible();
    await expect(page.getByTestId('session-busy-indicator')).toContainText('Thinking');
    await expect(
      page.getByText('Starting your computer… your message will send automatically.', { exact: true }),
    ).toBeVisible();
    await expect(editor).toHaveText('');
    expect(startResponded).toBe(false);
    await page.screenshot({ path: testInfo.outputPath('send-before-sandbox-ready.png'), fullPage: true });
    const accepted = page.waitForResponse(
      (r) => r.url().endsWith(`/sessions/${sessionId}/prompts`) && r.request().method() === 'POST',
    );
    releaseSend();
    expect((await accepted).status()).toBe(202);
    const inbox = await api<{ prompts: Array<{ text: string }> }>(
      auth.access_token,
      'GET',
      `/projects/${projectId}/sessions/${sessionId}/prompts`,
    );
    expect(inbox.prompts.some((p) => p.text === 'Continue while the computer starts.')).toBe(true);
    releaseReads();
    await expect(
      page.getByText('This reply is stored in the database.', { exact: true }),
    ).toHaveCount(1);
  } finally {
    releaseReads();
    releaseSend();
    await page.unrouteAll({ behavior: 'ignoreErrors' });
    if (projectId) {
      await runDatabaseSql(
        "UPDATE kortix.project_sessions SET metadata = metadata || jsonb_build_object('deletedAt', now()::text) WHERE project_id = $1",
        [projectId],
        env.databaseUrl,
      );
      await runDatabaseSql(
        'DELETE FROM kortix.session_sandboxes WHERE project_id = $1',
        [projectId],
        env.databaseUrl,
      );
      await disposeProject();
    }
    await deleteAuthUser(user.id, {
      supabaseUrl: authOptions.supabaseUrl,
      envFiles: ['apps/api/.env', 'apps/web/.env'],
    });
  }
});
