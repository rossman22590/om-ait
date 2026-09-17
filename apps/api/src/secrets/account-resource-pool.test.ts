import { expect, mock, test } from 'bun:test';

const update = mock(() => { throw new Error('A passive model check must not rotate the pool'); });
mock.module('../shared/db', () => ({ db: {
  update,
  select: () => ({ from: () => ({ where: () => ({ limit: async () => [{ secretIds: [], nextIndex: 7 }] }) }) }),
} }));
mock.module('../config', () => ({ config: {} }));
mock.module('../iam', () => ({
  actorForUser: () => ({ type: 'user' }),
  authorize: async () => ({ allowed: false }),
  PROJECT_ACTIONS: { PROJECT_READ: 'project.read' },
}));
const { resolveDefaultCodexAccountSecret, resolveSessionProviderSecrets } = await import('./account-resource');

test('passive model validation reads a configured pool without advancing its starting key', async () => {
  const result = await resolveSessionProviderSecrets({ accountId: 'account', projectId: 'project', userId: 'member',
    sessionId: 'session', providerId: 'anthropic', name: 'ANTHROPIC_API_KEY', advanceIndex: false });
  expect(result).toEqual({ configured: true, coolingDown: false, secrets: [] });
  expect(update).not.toHaveBeenCalled();
});

test('revoked project access blocks the default ChatGPT connection before reading its value', async () => {
  expect(await resolveDefaultCodexAccountSecret('account', 'project', 'member')).toBeNull();
});
