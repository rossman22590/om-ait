import { AsyncLocalStorage } from 'node:async_hooks';
import type { Database } from '@kortix/db';

export function contextualDatabase(base: Database) {
  const context = new AsyncLocalStorage<Database>();
  const db = new Proxy(base, {
    get(target, property) {
      const current = context.getStore() ?? target;
      const value = Reflect.get(current, property);
      return typeof value === 'function' ? value.bind(current) : value;
    },
  });
  const transaction = <T>(action: () => Promise<T>): Promise<T> =>
    db.transaction(tx => context.run(tx as unknown as Database, action));
  return { db, transaction };
}
