import { expect, test } from 'bun:test';
import type { Database } from '@kortix/db';
import { contextualDatabase } from './db-context';

test('transaction context stays isolated across concurrent asynchronous requests', async () => {
  let id = 0;
  const base = {
    id: 0,
    read() { return this.id; },
    async transaction(action: (tx: unknown) => Promise<unknown>) {
      return action({ ...this, id: ++id });
    },
  };
  const context = contextualDatabase(base as unknown as Database);
  const read = () => (context.db as unknown as typeof base).read();
  const values = await Promise.all([1, 2, 3].map(() => context.transaction(async () => {
    const before = read();
    await new Promise(resolve => setTimeout(resolve, 1));
    expect(read()).toBe(before);
    return before;
  })));
  expect(values).toEqual([1, 2, 3]);
  expect(read()).toBe(0);
  await expect(context.transaction(async () => { throw new Error('rollback'); })).rejects.toThrow('rollback');
  expect(read()).toBe(0);
});
