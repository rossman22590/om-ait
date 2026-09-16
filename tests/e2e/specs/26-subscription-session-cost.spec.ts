import { expect, test } from "@playwright/test";
import { loadEnv } from "../../src/core/env";
import {
  createDatabaseProject,
  createDatabaseSession,
  deleteDatabaseProject,
} from "../../src/fixtures/database-project";
import { runDatabaseSql } from "../helpers/database";
import { createApiJsonClient } from "../helpers/http";
import {
  createAuthUser,
  deleteAuthUser,
  installBrowserSessionDirect,
  signIn,
} from "../helpers/session-auth";
import { dismissOnboarding, selectAccountForUi } from "../helpers/ui";

const apiBase = process.env.E2E_API_URL || "http://localhost:8008/v1";
const supabaseUrl = process.env.E2E_SUPABASE_URL || "http://127.0.0.1:54321";
const authOptions = { supabaseUrl, password: "SubscriptionCost123!" };
const api = createApiJsonClient(apiBase);

test("26 — ChatGPT session usage excludes historical subscription costs and retains paid API costs", async ({
  page,
}, testInfo) => {
  test.setTimeout(240_000);
  const env = loadEnv();
  if (!env.databaseUrl)
    throw new Error(
      "Database access is required for the historical transcript fixture",
    );
  const email = `subscription-cost-${Date.now()}@example.test`;
  const user = await createAuthUser(email, authOptions);
  const auth = await signIn(email, authOptions);
  let projectId = "";
  try {
    const accounts = await api<
      Array<{ account_id: string; personal_account?: boolean }>
    >(auth.access_token, "GET", "/accounts");
    const accountId = (accounts.find((a) => a.personal_account) ?? accounts[0])
      .account_id;
    const project = await createDatabaseProject(env, {
      accountId,
      userId: user.id,
      name: "Subscription usage regression",
      metadata: { experimental: { llm_gateway: true } },
    });
    projectId = project.id;
    await installBrowserSessionDirect(
      page,
      auth,
      `/projects/${projectId}`,
      authOptions,
    );
    await selectAccountForUi(page, accountId);

    for (const scenario of [
      { name: "historical", step: true, paid: false, expected: "$0.00" },
      { name: "tokens-only", step: false, paid: false, expected: "$0.00" },
      { name: "mixed", step: true, paid: true, expected: "$2.40" },
    ]) {
      const sessionId = await createDatabaseSession(env, {
        projectId,
        accountId,
        userId: user.id,
      });
      const rootId = `ses_${sessionId.replaceAll("-", "")}`;
      const now = Date.now() - 60_000;
      const tokens = {
        input: 118_017,
        output: 123,
        reasoning: 40,
        cache: { read: 12, write: 3 },
      };
      const messages = [
        {
          info: {
            id: "msg_cost_user",
            sessionID: rootId,
            role: "user",
            time: { created: now },
            agent: "kortix",
            model: { providerID: "kortix", modelID: "codex/gpt-5.6-sol" },
          },
          parts: [
            {
              id: "prt_cost_user",
              sessionID: rootId,
              messageID: "msg_cost_user",
              type: "text",
              text: "Explain subscription usage.",
            },
          ],
        },
        ...[false, ...(scenario.paid ? [true] : [])].map((paid, index) => {
          const id = `msg_cost_assistant_${index}`;
          return {
            info: {
              id,
              sessionID: rootId,
              parentID: "msg_cost_user",
              role: "assistant",
              providerID: "kortix",
              modelID: paid ? "openai/gpt-5.6-sol" : "codex/gpt-5.6-sol",
              agent: "kortix",
              mode: "build",
              path: { cwd: "/workspace", root: "/workspace" },
              cost: paid ? 2 : 7.91,
              tokens,
              time: { created: now + index + 1, completed: now + index + 2 },
              finish: "stop",
            },
            parts: [
              {
                id: `prt_text_${index}`,
                sessionID: rootId,
                messageID: id,
                type: "text",
                text: paid
                  ? "Paid API response."
                  : "ChatGPT subscription response.",
              },
              ...(scenario.step
                ? [
                    {
                      id: `prt_step_${index}`,
                      sessionID: rootId,
                      messageID: id,
                      type: "step-finish",
                      reason: "stop",
                      cost: paid ? 2 : 7.91,
                      tokens,
                    },
                  ]
                : []),
            ],
          };
        }),
      ];
      await runDatabaseSql(
        "UPDATE kortix.project_sessions SET status = 'stopped', opencode_session_id = $2 WHERE session_id = $1",
        [sessionId, rootId],
        env.databaseUrl,
      );
      await runDatabaseSql(
        "INSERT INTO kortix.session_transcript_mirrors (session_id, project_id, account_id, opencode_session_id, head_complete) VALUES ($1,$2,$3,$4,true)",
        [sessionId, projectId, accountId, rootId],
        env.databaseUrl,
      );
      for (const message of messages) {
        await runDatabaseSql(
          "INSERT INTO kortix.session_transcript_messages (session_id, message_id, opencode_session_id, role, message_created_at, info, parts) VALUES ($1,$2,$3,$4,$5,$6,$7)",
          [
            sessionId,
            message.info.id,
            rootId,
            message.info.role,
            new Date(message.info.time.created),
            JSON.stringify(message.info),
            JSON.stringify(message.parts),
          ],
          env.databaseUrl,
        );
      }
      // A retained, stopped computer makes the persisted transcript readable.
      await runDatabaseSql(
        "INSERT INTO kortix.session_sandboxes (sandbox_id, session_id, account_id, project_id, status) VALUES ($1::uuid,$1,$2,$3,'stopped')",
        [sessionId, accountId, projectId], env.databaseUrl,
      );
      // The browser reads the persisted mirror through the real authenticated API.
      const snapshot = page.waitForResponse(
        (r) =>
          r.url().includes(`/sessions/${sessionId}/snapshot`) &&
          r.request().method() === "GET" &&
          r.status() === 200,
      );
      await page.goto(`/projects/${projectId}/sessions/${sessionId}`, {
        waitUntil: "domcontentloaded",
      });
      await dismissOnboarding(page);
      const response = await snapshot;
      expect(JSON.stringify(await response.json())).toContain(
        "codex/gpt-5.6-sol",
      );
      await expect(
        page
          .getByText("ChatGPT subscription response.", { exact: true })
          .first(),
      ).toBeVisible({ timeout: 60_000 });
      await page.locator('[data-slot="token-progress"] button').click();
      const dialog = page.getByRole("dialog");
      await expect(
        dialog.getByText("Session usage", { exact: true }),
      ).toBeVisible();
      await expect(
        dialog.getByText("Total cost", { exact: true }).locator(".."),
      ).toContainText(scenario.expected);
      await expect(
        dialog.getByText("Messages", { exact: true }).locator(".."),
      ).toContainText(String(messages.length));
      await expect(dialog.getByText("118,017", { exact: true })).toBeVisible();
      await page.screenshot({
        path: testInfo.outputPath(`${scenario.name}.png`),
      });
      await page.keyboard.press("Escape");
    }
  } finally {
    if (projectId) {
      await runDatabaseSql('DELETE FROM kortix.session_sandboxes WHERE project_id = $1', [projectId], env.databaseUrl);
      await deleteDatabaseProject(env, projectId);
    }
    await deleteAuthUser(user.id, {
      supabaseUrl,
      envFiles: ["apps/api/.env", "apps/web/.env"],
    });
  }
});
