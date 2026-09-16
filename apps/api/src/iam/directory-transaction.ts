import { sql } from 'drizzle-orm';
import { db, withDbTransaction } from '../shared/db';

export function withDirectoryTransaction<T>(accountId: string, action: () => Promise<T>): Promise<T> {
  return withDbTransaction(async () => {
    await db.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${'directory:' + accountId}, 0))`);
    return action();
  });
}
