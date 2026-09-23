import { beforeEach, describe, expect, mock, test } from 'bun:test';

type Call = { fn: string; args: unknown[] };
let apiCalls: Call[] = [];
let nextActivityId: string | null = 'act-1';
/** Per-call results for updateCard; `true` once the queue is empty. */
let updateAccepts: boolean[] = [];

const record = (fn: string) => (...args: unknown[]) => {
  apiCalls.push({ fn, args });
};

mock.module('../channels/teams-api', () => ({
  sendCard: async (...a: unknown[]) => {
    record('sendCard')(...a);
    return nextActivityId;
  },
  updateCard: async (...a: unknown[]) => {
    record('updateCard')(...a);
    return updateAccepts.length ? updateAccepts.shift()! : true;
  },
  sendTyping: async (...a: unknown[]) => record('sendTyping')(...a),
  sendText: async (...a: unknown[]) => {
    record('sendText')(...a);
    return 'act-x';
  },
  sendActivity: async (...a: unknown[]) => {
    record('sendActivity')(...a);
    return 'act-x';
  },
  updateActivity: async () => true,
  cardActivity: (c: unknown) => ({ type: 'message', attachments: [{ contentType: 'x', content: c }] }),
}));

mock.module('../config', () => ({ config: { FRONTEND_URL: 'https://app', MICROSOFT_APP_ID: 'x' } }));
mock.module('../channels/slack/util', () => ({ sessionWebUrl: () => 'https://app/session' }));
mock.module('../channels/install-store', () => ({
  saveTeamsServiceUrl: async () => {},
  loadTeamsTenantForProject: async () => 'tenant-1',
}));

let dbResults: unknown[][] = [];
let dbWrites: Array<{ op: string; payload?: unknown }> = [];

function makeChain(op: string): any {
  const chain: any = {};
  for (const m of ['from', 'where', 'limit', 'onConflictDoUpdate', 'returning']) chain[m] = () => chain;
  chain.values = (payload: unknown) => {
    dbWrites.push({ op: `${op}.values`, payload });
    return chain;
  };
  chain.set = (payload: unknown) => {
    dbWrites.push({ op: `${op}.set`, payload });
    return chain;
  };
  chain.then = (resolve: (rows: unknown[]) => unknown) => Promise.resolve(resolve(dbResults.shift() ?? []));
  chain.catch = () => chain;
  chain.finally = () => chain;
  return chain;
}

mock.module('../shared/db', () => ({
  db: {
    select: () => makeChain('select'),
    insert: () => makeChain('insert'),
    update: () => makeChain('update'),
    delete: () => {
      dbWrites.push({ op: 'delete' });
      return makeChain('delete');
    },
  },
  hasDatabase: () => true,
}));

const { relayTurnAnswer, relayTurnEnd, relayTurnStep } = await import('../channels/teams/turn');

function streamRow(over: Record<string, unknown> = {}) {
  return {
    sessionId: 'sess-1',
    projectId: 'proj-1',
    teamId: 'tenant-1',
    channel: 'conv-1',
    triggerTs: 'msg-1',
    messageTs: null,
    finalized: false,
    steps: [],
    originatingEvent: { type: 'message', id: 'msg-1', conversation: { id: 'conv-1' } },
    channelRef: { platform: 'teams', serviceUrl: 'https://smba/', conversationId: 'conv-1' },
    expiresAt: new Date(Date.now() + 60_000),
    updatedAt: new Date(),
    ...over,
  };
}

beforeEach(() => {
  apiCalls = [];
  dbWrites = [];
  dbResults = [];
  nextActivityId = 'act-1';
  updateAccepts = [];
});

const { TEAMS_CARD_BUDGET_BYTES, TRUNCATION_NOTE, cardBytes } = await import('../channels/teams/cards');
const cardOf = (call: Call | undefined) => call?.args[2] as Record<string, unknown>;
const answerRows = (over: Record<string, unknown> = {}) => [
  [streamRow({ messageTs: 'act-1', steps: [{ type: 'task_update', id: 'step-0', title: 'A', status: 'in_progress' }], ...over })],
  [{ sessionId: 'sess-1' }],
  [],
];

// Teams refuses a message over about 28 KB. A long answer used to be cut at
// 11,000 characters with no mark — and one whose card was still too large
// (tables, code, anything not ASCII) was refused and never shown at all,
// leaving the live card on its last step.
describe('a long answer', () => {
  test('is cut to fit the card, at a line, and says so', async () => {
    const answer = Array.from({ length: 900 }, (_, i) => `Line ${i}: ${'детали '.repeat(8)}`).join('\n');
    dbResults = answerRows();

    expect(await relayTurnAnswer('sess-1', answer)).toBe(true);

    const card = cardOf(apiCalls.find((c) => c.fn === 'updateCard'));
    expect(cardBytes(card)).toBeLessThanOrEqual(TEAMS_CARD_BUDGET_BYTES);
    const json = JSON.stringify(card);
    expect(json).toContain('Line 0:');
    expect(json).toContain(TRUNCATION_NOTE);
    expect(json).not.toContain('Line 899:');
  });

  test('an answer that fits is delivered whole, with no note', async () => {
    dbResults = answerRows();

    await relayTurnAnswer('sess-1', 'Short answer.');

    const json = JSON.stringify(cardOf(apiCalls.find((c) => c.fn === 'updateCard')));
    expect(json).toContain('Short answer.');
    expect(json).not.toContain(TRUNCATION_NOTE);
  });

  test('a cut inside a code block closes the fence before the note', async () => {
    const answer = ['Here is the log:', '```', ...Array.from({ length: 3000 }, (_, i) => `12:00:${i} worker ${i} ok`)].join('\n');
    dbResults = answerRows();

    await relayTurnAnswer('sess-1', answer);

    const blocks = (cardOf(apiCalls.find((c) => c.fn === 'updateCard')).body as Array<{ text?: string }>) ?? [];
    // The note renders as its own text, not as a line of the code block.
    expect(blocks.some((b) => b.text === TRUNCATION_NOTE)).toBe(true);
  });
});

describe('a refused final card', () => {
  test('the answer is posted as text, and the live card is closed', async () => {
    updateAccepts = [false, true];
    dbResults = answerRows();

    expect(await relayTurnAnswer('sess-1', 'The deploy finished at 12:04.')).toBe(true);

    expect(apiCalls.map((c) => c.fn)).toEqual(['updateCard', 'updateCard', 'sendText']);
    expect(JSON.stringify(cardOf(apiCalls[1]))).toContain('The answer is in the next message.');
    expect(apiCalls[2]!.args[1]).toContain('The deploy finished at 12:04.');
    expect(apiCalls[2]!.args[1]).toContain('Open session in Kortix');
  });

  test('a card the agent built that Teams refuses still leaves a reply', async () => {
    updateAccepts = [false, true];
    dbResults = answerRows();

    await relayTurnAnswer('sess-1', '', { type: 'AdaptiveCard', version: '9.9', body: [] });

    const sent = apiCalls.find((c) => c.fn === 'sendText');
    expect(sent?.args[1]).toContain('could not show');
  });

  test('an accepted card posts nothing else', async () => {
    dbResults = answerRows();

    await relayTurnAnswer('sess-1', 'All good.');

    expect(apiCalls.map((c) => c.fn)).toEqual(['updateCard']);
  });
});

describe('a long plan', () => {
  test('keeps the newest steps and counts the rest, so the card stays under the limit', async () => {
    const steps = Array.from({ length: 120 }, (_, i) => ({
      type: 'task_update',
      id: `step-${i}`,
      title: `Step ${i} — ${'checking the next shard of the index '.repeat(3)}`,
      status: 'complete',
      details: 'x'.repeat(300),
    }));
    dbResults = [[streamRow({ messageTs: 'act-1', steps })], []];

    await relayTurnStep('sess-1', 'The newest step');

    const card = cardOf(apiCalls.find((c) => c.fn === 'updateCard'));
    expect(cardBytes(card)).toBeLessThanOrEqual(TEAMS_CARD_BUDGET_BYTES);
    const json = JSON.stringify(card);
    expect(json).toContain('The newest step');
    expect(json).toMatch(/… \d+ earlier steps/);
    expect(json).not.toContain('Step 0 —');
  });

  test('a short plan shows every step and no count', async () => {
    dbResults = [[streamRow({ messageTs: 'act-1', steps: [{ type: 'task_update', id: 'step-0', title: 'A', status: 'complete' }] })], []];

    await relayTurnStep('sess-1', 'B');

    const json = JSON.stringify(cardOf(apiCalls.find((c) => c.fn === 'updateCard')));
    expect(json).not.toContain('earlier step');
  });
});

describe('relayTurnStep', () => {
  test('first step posts a new plan card and persists the message id', async () => {
    dbResults = [[streamRow()], []];
    const ok = await relayTurnStep('sess-1', 'Reading logs');
    expect(ok).toBe(true);
    expect(apiCalls.map((c) => c.fn)).toEqual(['sendCard']);
    const saved = dbWrites.find((w) => w.op === 'insert.values')?.payload as { messageTs?: string };
    expect(saved?.messageTs).toBe('act-1');
  });

  test('a later step repaints the existing card in place (no new post)', async () => {
    dbResults = [[streamRow({ messageTs: 'act-1', steps: [{ type: 'task_update', id: 'step-0', title: 'A', status: 'in_progress' }] })], []];
    const ok = await relayTurnStep('sess-1', 'Drafting');
    expect(ok).toBe(true);
    expect(apiCalls.map((c) => c.fn)).toEqual(['updateCard']);
  });

  test('drops when no open turn exists', async () => {
    dbResults = [[]];
    expect(await relayTurnStep('sess-x', 'x')).toBe(false);
    expect(apiCalls).toHaveLength(0);
  });
});

describe('relayTurnAnswer', () => {
  test('finalizes into the live card and deletes the turn', async () => {
    dbResults = [
      [streamRow({ messageTs: 'act-1', steps: [{ type: 'task_update', id: 'step-0', title: 'A', status: 'in_progress' }] })],
      [{ sessionId: 'sess-1' }],
      [],
    ];
    const ok = await relayTurnAnswer('sess-1', 'Here is the answer.');
    expect(ok).toBe(true);
    expect(apiCalls.map((c) => c.fn)).toEqual(['updateCard']);
    expect(dbWrites.some((w) => w.op === 'delete')).toBe(true);
  });

  test('loses the finalize race → no render', async () => {
    dbResults = [[streamRow({ messageTs: 'act-1' })], []];
    expect(await relayTurnAnswer('sess-1', 'x')).toBe(false);
    expect(apiCalls).toHaveLength(0);
  });

  // Same defect as the Slack side: STREAM_TTL_MS is refreshed only by a step
  // relay, so a quiet stretch of real agent work longer than 15 minutes used to
  // delete the row here and drop the answer. The GC sweep is the only reaper.
  test('a row past expires_at still delivers its answer', async () => {
    dbResults = [
      [streamRow({ messageTs: 'act-1', expiresAt: new Date(Date.now() - 60_000) })],
      [{ sessionId: 'sess-1' }],
      [],
    ];
    expect(await relayTurnAnswer('sess-1', 'Late answer.')).toBe(true);
    expect(apiCalls.map((c) => c.fn)).toEqual(['updateCard']);
  });
});

describe('relayTurnEnd', () => {
  test('idle with a live card closes it cleanly', async () => {
    dbResults = [
      [streamRow({ messageTs: 'act-1', steps: [{ type: 'task_update', id: 'step-0', title: 'A', status: 'in_progress' }] })],
      [{ sessionId: 'sess-1' }],
      [],
    ];
    const ok = await relayTurnEnd('sess-1', 'idle');
    expect(ok).toBe(true);
    expect(apiCalls.map((c) => c.fn)).toEqual(['updateCard']);
  });
});
