import { expect, mock, test } from 'bun:test';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { qk } from './query-keys';
import { useSessionTurnOutcome } from './use-session-working';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// `useSessionWorking` owns the ONE `/turn` poll per session. This hook reads the
// same cache entry and must never start a request of its own.
test('reads last_ended and recent_failures from the shared /turn cache entry and never fetches', async () => {
  const fetchSpy = mock(async () => Response.json({}));
  globalThis.fetch = fetchSpy as unknown as typeof fetch;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const lastEnded = {
    turn_token: 'tok',
    message_id: 'msg_u2',
    end_reason: 'failed',
    ended_at: '2026-09-18T13:42:49.000Z',
    error: { name: 'SandboxMemoryGuard', message: 'sandbox memory at 97%' },
  };

  const recentFailures = [{ message_id: 'msg_u1', ended_at: null, error: { name: 'SandboxMemoryGuard', message: 'sandbox memory at 96%' } }];
  let value: ReturnType<typeof useSessionTurnOutcome>;
  function Probe() { value = useSessionTurnOutcome('p1', 's1'); return null; }
  let root: ReturnType<typeof create>;
  await act(async () => {
    root = create(React.createElement(QueryClientProvider, { client }, React.createElement(Probe)));
  });
  expect(value!).toEqual({ last_ended: undefined, recent_failures: undefined });

  await act(async () => {
    client.setQueryData(qk.project.sessionTurn('p1', 's1'), { turns: [], last_ended: lastEnded, recent_failures: recentFailures, atMs: 1 });
    // React Query notifies observers on the next tick.
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  expect(value!).toEqual({ last_ended: lastEnded, recent_failures: recentFailures });
  expect(fetchSpy.mock.calls.length).toBe(0);

  await act(async () => root!.unmount());
  client.clear();
});
