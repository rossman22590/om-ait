import { Client } from 'pg';
import { flow } from '../core/flow';
import { createDatabaseSession } from '../fixtures/database-project';
import { seedSessionTranscript } from '../fixtures/session-transcript';

flow(
  'SESS-30',
  {
    domain: 'sessions',
    requires: ['database'],
    routes: [
      'GET /v1/projects/:projectId/sessions/:sessionId/transcript',
      'PATCH /v1/projects/:projectId/features',
    ],
  },
  async (ctx) => {
    const project = await ctx.fixtures.project();
    const sessionId = await createDatabaseSession(ctx.env, {
      projectId: project.id,
      accountId: ctx.P.OWNER.accountId!,
      userId: ctx.P.OWNER.userId!,
    });
    ctx.track('session', sessionId, { projectId: project.id });
    const fixture = await seedSessionTranscript(ctx.env, {
      projectId: project.id,
      accountId: ctx.P.OWNER.accountId!,
      sessionId,
    });
    const route = '/v1/projects/:projectId/sessions/:sessionId/transcript';
    const options = {
      params: { projectId: project.id, sessionId },
      query: { shape: 'sync', history: 'true' },
    };
    const owner = ctx.client.as(ctx.P.OWNER);
    await ctx.step('the default flag rejects early history with 403', async () => {
      (await owner.get(route, options)).status(403).body().has('$.code', 'feature_disabled');
    });
    await ctx.step(
      'enable history through the project flag API and read completed stored messages while stopped',
      async () => {
        (
          await owner.patch(
            '/v1/projects/:projectId/features',
            { feature: 'session_transcript_history', enabled: true },
            { params: { projectId: project.id } },
          )
        ).status(200);
        (await owner.get(route, options))
          .status(200)
          .body()
          .has('$.source', 'mirror')
          .has('$.available', true)
          .has('$.message_count', 2)
          .has('$.opencode_session_id', fixture.root)
          .has('$.messages[1].info.time.completed', fixture.messages[1].info.time.completed)
          .has('$.messages[1].parts[0].text', 'This reply is stored in the database.');
      },
    );
    await ctx.step(
      'anonymous and nonmember callers cannot read stored session messages',
      async () => {
        (await ctx.client.as(ctx.P.ANON).get(route, options)).status(401);
        (await ctx.client.as(ctx.P.NONMEMBER).get(route, options)).status([403, 404]);
      },
    );
    await ctx.step(
      'a replaced root makes the old transcript unavailable without waking a sandbox',
      async () => {
        const db = new Client({ connectionString: ctx.env.databaseUrl! });
        await db.connect();
        try {
          await db.query(
            'UPDATE kortix.project_sessions SET opencode_session_id = $2 WHERE session_id = $1',
            [sessionId, 'ses_replacement'],
          );
        } finally {
          await db.end();
        }
        (await owner.get(route, options))
          .status(200)
          .body()
          .has('$.available', false)
          .has('$.message_count', 0)
          .has('$.opencode_session_id', 'ses_replacement');
      },
    );
    await ctx.step('disabling the flag denies the opt-in read again', async () => {
      (
        await owner.patch(
          '/v1/projects/:projectId/features',
          { feature: 'session_transcript_history', enabled: false },
          { params: { projectId: project.id } },
        )
      ).status(200);
      (await owner.get(route, options)).status(403);
    });
  },
);
