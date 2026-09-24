/**
 * Every API route has an audit label, and every label has a route.
 *
 * The audit log names a request by its route's label from
 * `@kortix/shared/audit-labels` (`gateway.key.delete`, "Deleted LLM gateway
 * key"). A route without one is written as `METHOD /template`, which a
 * customer cannot read. This file fails for such a route, so adding a route
 * means adding its one-line label in `packages/shared/src/audit-route-labels.ts`.
 *
 * The live table is `app.routes` under this suite's env, which mounts the
 * self-host `/v1/setup/*` router. The committed manifest adds the cloud-only
 * routes (the manifest is generated with billing on). Catch-all `app.all`
 * handlers are told from middleware by arity: a handler takes `(c)`, a
 * middleware `(c, next)`.
 */
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { AUDIT_ROUTE_LABELS } from '@kortix/shared/audit-labels';

const { app } = await import('../index');

type RouteRow = { method: string; path: string; handler: (...args: unknown[]) => unknown };

const liveKeys = new Set<string>();
for (const route of (app as unknown as { routes: RouteRow[] }).routes) {
  const method = route.method.toUpperCase();
  if (method !== 'ALL') liveKeys.add(`${method} ${route.path}`);
  else if (route.handler.length < 2) liveKeys.add(`ALL ${route.path}`);
}

const manifest = JSON.parse(
  readFileSync(new URL('../../../../tests/spec/routes.generated.json', import.meta.url), 'utf8'),
) as { routes: Array<{ method: string; path: string }> };
const manifestKeys = new Set(manifest.routes.map((route) => `${route.method} ${route.path}`));

const indexSource = readFileSync(new URL('../index.ts', import.meta.url), 'utf8');
const entrypointKeys = new Set(
  [...indexSource.matchAll(/setInboundAuditEntrypoint\(\s*'[a-z_]+',\s*'([^']+)'\s*\)/g)].map(
    (match) => `ENTRY ${match[1]}`,
  ),
);

const labelled = new Set(Object.keys(AUDIT_ROUTE_LABELS));

describe('audit route labels', () => {
  test('the live route table and the manifest were both read', () => {
    expect(liveKeys.size).toBeGreaterThan(600);
    expect(manifestKeys.size).toBeGreaterThan(600);
    expect(entrypointKeys.size).toBeGreaterThan(0);
  });

  test('every live route has a label', () => {
    expect([...liveKeys].filter((key) => !labelled.has(key)).sort()).toEqual([]);
  });

  test('every manifest route has a label', () => {
    expect([...manifestKeys].filter((key) => !labelled.has(key)).sort()).toEqual([]);
  });

  test('every entrypoint the server dispatches before Hono has a label', () => {
    expect([...entrypointKeys].filter((key) => !labelled.has(key)).sort()).toEqual([]);
  });

  test('every label names a route that exists', () => {
    const known = new Set([...liveKeys, ...manifestKeys, ...entrypointKeys]);
    expect([...labelled].filter((key) => !known.has(key)).sort()).toEqual([]);
  });
});
