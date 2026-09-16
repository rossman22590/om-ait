import { describe, expect, test } from 'bun:test';
import {
  projectSessionIdForProjectPrincipal,
  resolveTokenBoundSessionId,
} from '../../connectors/db-deps';
import {
  type ValidatedSessionConnectorBinding,
  canonicalConnectorAlias,
  connectorBindingPayloadConflicts,
  mayUseLegacyDefaultConnection,
  parseSessionConnectorBindings,
  selectEntitledConnectorConnection,
} from './session-connector-bindings';

describe('session connector binding security contracts', () => {
  const connectionA = '11111111-1111-4111-a111-111111111111';
  const connectionB = '22222222-2222-4222-a222-222222222222';

  test('idempotent replay accepts reordered identical bindings and conflicts on connection swap', () => {
    expect(
      connectorBindingPayloadConflicts(
        { email: { connection_id: connectionA }, veyris: { connection_id: connectionB } },
        { veyris: { connection_id: connectionB }, email: { connection_id: connectionA } },
      ),
    ).toBe(false);
    expect(
      connectorBindingPayloadConflicts(
        { veyris: { connection_id: connectionA } },
        { veyris: { connection_id: connectionB } },
      ),
    ).toBe(true);
  });

  test('public email alias canonicalizes and binding input stays typed', () => {
    expect(canonicalConnectorAlias('email')).toBe('kortix_email');
    expect(parseSessionConnectorBindings({ email: { connection_id: connectionA } }).ok).toBe(true);
    expect(parseSessionConnectorBindings({ email: { connection_id: connectionA, token: 'no' } }).ok).toBe(
      false,
    );
  });

  test('caller header can never replace authenticated session identity', () => {
    expect(resolveTokenBoundSessionId('session-a', 'session-a')).toEqual({
      ok: true,
      sessionId: 'session-a',
    });
    expect(resolveTokenBoundSessionId('session-a', 'session-b')).toEqual({ ok: false });
    expect(resolveTokenBoundSessionId(null, 'session-b')).toEqual({ ok: false });
  });

  test('Supabase authentication session identity is not a Kortix project session identity', () => {
    expect(projectSessionIdForProjectPrincipal(undefined, 'supabase-auth-session')).toBeNull();
    expect(
      projectSessionIdForProjectPrincipal('11111111-1111-4111-a111-111111111111', 'kortix-session'),
    ).toBe('kortix-session');
  });

  test('legacy defaults are allowed only when the session has zero durable bindings', () => {
    expect(mayUseLegacyDefaultConnection(false)).toBe(true);
    expect(mayUseLegacyDefaultConnection(true)).toBe(false);
  });
});

/**
 * Account selection is what replaced the per-session connector dropdown. The
 * agent may reach EVERY account it is entitled to and names one at call time,
 * so the two properties that matter are: an unnamed call keeps the old
 * behavior (the default account), and a named-but-unknown account is never
 * silently substituted — that would run "send as Work" against Personal.
 */
describe('selectEntitledConnectorConnection', () => {
  const work = {
    connectionId: '11111111-1111-4111-a111-111111111111',
    connectorId: 'c1',
    alias: 'gmail',
    label: 'Work',
    ownerType: 'project' as const,
    isDefault: true,
    status: 'active' as const,
    metadata: {},
  };
  const personal = { ...work, connectionId: '22222222-2222-4222-a222-222222222222', label: 'Personal', ownerType: 'member' as const, isDefault: false };
  const accounts = [work, personal];

  test('no account named → the default (first) account, exactly as before', () => {
    expect(selectEntitledConnectorConnection(accounts, null)?.label).toBe('Work');
    expect(selectEntitledConnectorConnection(accounts, undefined)?.label).toBe('Work');
    expect(selectEntitledConnectorConnection(accounts, '   ')?.label).toBe('Work');
  });

  test('matches a label case-insensitively — humans type the printed name', () => {
    expect(selectEntitledConnectorConnection(accounts, 'Personal')?.connectionId).toBe(personal.connectionId);
    expect(selectEntitledConnectorConnection(accounts, 'personal')?.connectionId).toBe(personal.connectionId);
    expect(selectEntitledConnectorConnection(accounts, '  PERSONAL ')?.connectionId).toBe(personal.connectionId);
  });

  test('matches a connection id, which is what the connections API prints', () => {
    expect(selectEntitledConnectorConnection(accounts, personal.connectionId)?.label).toBe('Personal');
  });

  test('an unknown account resolves to nothing rather than the default', () => {
    expect(selectEntitledConnectorConnection(accounts, 'Archive')).toBeNull();
  });

  test('no entitled account at all → null for every input', () => {
    expect(selectEntitledConnectorConnection([], null)).toBeNull();
    expect(selectEntitledConnectorConnection([], 'Work')).toBeNull();
  });
});
