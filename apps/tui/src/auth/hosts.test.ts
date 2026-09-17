import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { resolveHost } from './hosts.ts';

/**
 * `@kortix/cli`'s config module reads `KORTIX_CONFIG_FILE` on every call and
 * gives a custom path a fresh empty config, so these tests never touch the
 * developer's real `~/.config/kortix/config.json`.
 */
const scratchDirs: string[] = [];

function writeConfig(config: unknown): string {
  const dir = mkdtempSync(join(tmpdir(), 'kortix-tui-hosts-'));
  scratchDirs.push(dir);
  const path = join(dir, 'config.json');
  writeFileSync(path, JSON.stringify(config), { mode: 0o600 });
  process.env.KORTIX_CONFIG_FILE = path;
  return path;
}

afterEach(() => {
  delete process.env.KORTIX_CONFIG_FILE;
  for (const dir of scratchDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const CONFIG = {
  active: 'local-dev',
  hosts: {
    'local-dev': {
      url: 'http://localhost:17408',
      token: 'config-token',
      user_id: 'u1',
      user_email: 'dev@kortix.test',
      account_id: 'acct-config',
      default_project: { project_id: 'proj-config', account_id: 'acct-config' },
      logged_in_at: '2026-09-17T00:00:00.000Z',
    },
  },
};

describe('resolveHost', () => {
  test('returns null when nothing is configured', () => {
    writeConfig({ active: 'cloud', hosts: {} });
    expect(resolveHost({})).toBeNull();
  });

  test('returns null when the active host has no token', () => {
    writeConfig({
      active: 'cloud',
      hosts: {
        cloud: {
          url: 'https://api.kortix.com',
          token: '',
          user_id: '',
          user_email: '',
          account_id: '',
          logged_in_at: '2026-09-17T00:00:00.000Z',
        },
      },
    });
    expect(resolveHost({})).toBeNull();
  });

  test('reads the active host from the CLI config', () => {
    writeConfig(CONFIG);
    const host = resolveHost({});
    expect(host).not.toBeNull();
    expect(host?.name).toBe('local-dev');
    expect(host?.source).toBe('config');
    expect(host?.token).toBe('config-token');
    expect(host?.backendUrl).toBe('http://localhost:17408/v1');
    expect(host?.accountId).toBe('acct-config');
    expect(host?.defaultProjectId).toBe('proj-config');
    expect(host?.userEmail).toBe('dev@kortix.test');
  });

  test('KORTIX_API_KEY + KORTIX_API_URL beat the config', () => {
    writeConfig(CONFIG);
    const host = resolveHost({
      KORTIX_API_URL: 'http://localhost:9999',
      KORTIX_API_KEY: 'env-token',
    });
    expect(host?.source).toBe('env');
    expect(host?.name).toBe('env');
    expect(host?.token).toBe('env-token');
    expect(host?.backendUrl).toBe('http://localhost:9999/v1');
  });

  test('KORTIX_TOKEN is honored too (CLI parity)', () => {
    writeConfig({ active: 'cloud', hosts: {} });
    const host = resolveHost({ KORTIX_API_URL: 'http://localhost:9999', KORTIX_TOKEN: 'sandbox' });
    expect(host?.token).toBe('sandbox');
    expect(host?.source).toBe('env');
  });

  test('an env token with no env URL falls back to the cloud base', () => {
    writeConfig({ active: 'cloud', hosts: {} });
    expect(resolveHost({ KORTIX_API_KEY: 'env-token' })?.backendUrl).toBe(
      'https://api.kortix.com/v1',
    );
  });

  test('a backend URL that already carries /v1 is not doubled', () => {
    writeConfig({ active: 'cloud', hosts: {} });
    expect(
      resolveHost({ KORTIX_API_KEY: 't', KORTIX_API_URL: 'http://localhost:17408/v1' })?.backendUrl,
    ).toBe('http://localhost:17408/v1');
  });

  test('an env URL alone cannot create a host', () => {
    writeConfig({ active: 'cloud', hosts: {} });
    expect(resolveHost({ KORTIX_API_URL: 'http://localhost:9999' })).toBeNull();
  });
});
