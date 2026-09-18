import { describe, expect, test } from 'bun:test';

import type { Auth } from '../api/auth.ts';
import type { DefaultProjectRef, Host } from '../api/config.ts';
import { stripAnsi } from '../style.ts';
import {
  EXPERIMENTAL_NOTICE,
  type TuiDeps,
  parseTuiFlags,
  resolvedHostFromAuth,
  runTui,
} from './tui.ts';

const AUTH: Auth = {
  api_base: 'https://api.kortix.com',
  token: 'kortix_pat_live',
  user_id: 'user_1',
  user_email: 'ada@kortix.com',
  account_id: 'acc_1',
  logged_in_at: '2026-09-18T00:00:00.000Z',
};

const HOST_RECORD: Host = {
  url: 'https://api.kortix.com',
  token: 'kortix_pat_live',
  user_id: 'user_1',
  user_email: 'ada@kortix.com',
  account_id: 'acc_1',
  default_project: { project_id: 'proj_config', account_id: 'acc_1' },
  logged_in_at: '2026-09-18T00:00:00.000Z',
};

interface Harness {
  deps: Partial<TuiDeps>;
  out: string[];
  err: string[];
  /** Every `runTui(...)` the renderer was asked for. Empty = never imported. */
  rendered: unknown[];
  /** Every code the command tried to leave the process with. */
  exits: number[];
  importCount: () => number;
}

function harness(overrides: Partial<TuiDeps> & { exitCode?: number } = {}): Harness {
  const out: string[] = [];
  const err: string[] = [];
  const rendered: unknown[] = [];
  const exits: number[] = [];
  let imports = 0;
  const { exitCode = 0, ...rest } = overrides;
  const deps: Partial<TuiDeps> = {
    loadAuth: () => AUTH,
    loadAuthForHost: (name) => (name === 'cloud' ? AUTH : null),
    activeHostName: () => 'cloud',
    getHost: (name) => (name === 'cloud' ? HOST_RECORD : null),
    defaultProject: (): DefaultProjectRef | null => ({
      project_id: 'proj_active',
      account_id: 'acc_1',
    }),
    hasEnvTokenHost: () => false,
    importTui: async () => {
      imports += 1;
      return {
        runTui: async (options) => {
          rendered.push(options);
          return exitCode;
        },
      };
    },
    // The real dep is `process.exit`. A test that let that run would take the
    // whole test process with it.
    exit: (code) => exits.push(code),
    stdout: (text) => out.push(text),
    stderr: (text) => err.push(text),
    ...rest,
  };
  return { deps, out, err, rendered, exits, importCount: () => imports };
}

describe('kortix tui — flags', () => {
  test('parses every flag and leaves nothing behind', () => {
    expect(parseTuiFlags(['--host', 'cloud', '--project', 'p1', '--session', 's1'])).toEqual({
      help: false,
      host: 'cloud',
      project: 'p1',
      session: 's1',
    });
  });

  test('accepts the --flag=value form', () => {
    expect(parseTuiFlags(['--project=p2', '--session=s2'])).toEqual({
      help: false,
      project: 'p2',
      session: 's2',
    });
  });

  test('-h and --help both ask for help', () => {
    expect(parseTuiFlags(['-h']).help).toBe(true);
    expect(parseTuiFlags(['--help']).help).toBe(true);
  });

  test('a flag with no value is an error, not a silent undefined', () => {
    expect(() => parseTuiFlags(['--project'])).toThrow('--project requires a value');
  });

  test('a bare positional is rejected — tui takes options only', () => {
    expect(() => parseTuiFlags(['abc123'])).toThrow('unexpected argument "abc123"');
    expect(() => parseTuiFlags(['--nope'])).toThrow('unknown option "--nope"');
  });
});

describe('kortix tui — Auth → ResolvedHost', () => {
  test('mounts the backend URL on /v1 and carries the host identity', () => {
    expect(
      resolvedHostFromAuth({
        name: 'cloud',
        auth: AUTH,
        defaultProjectId: 'proj_config',
        fromEnvToken: false,
      }),
    ).toEqual({
      name: 'cloud',
      backendUrl: 'https://api.kortix.com/v1',
      token: 'kortix_pat_live',
      accountId: 'acc_1',
      defaultProjectId: 'proj_config',
      userEmail: 'ada@kortix.com',
      source: 'config',
    });
  });

  test('never doubles an api_base that already ends in /v1', () => {
    const resolved = resolvedHostFromAuth({
      name: 'local-dev',
      auth: { ...AUTH, api_base: 'http://localhost:8008/v1' },
      fromEnvToken: false,
    });
    expect(resolved.backendUrl).toBe('http://localhost:8008/v1');
    expect(resolved.defaultProjectId).toBeUndefined();
  });

  test('a KORTIX_TOKEN shell is named as the env source, so a rejection can say so', () => {
    expect(resolvedHostFromAuth({ name: 'sandbox', auth: AUTH, fromEnvToken: true })).toMatchObject(
      { source: 'env', envVar: 'KORTIX_TOKEN' },
    );
  });
});

describe('kortix tui — run', () => {
  test('--help prints usage and never loads the renderer', async () => {
    const h = harness();
    expect(await runTui(['--help'], h.deps)).toBe(0);
    const text = stripAnsi(h.out.join(''));
    expect(text).toContain('Usage: kortix tui [options]');
    expect(text).toContain('--host <name>');
    expect(text).toContain('--project <id>');
    expect(text).toContain('--session <id>');
    expect(text).toContain('Experimental');
    expect(text).toContain('https://kortix.com/docs/tui');
    expect(h.importCount()).toBe(0);
    expect(h.err.join('')).toBe('');
  });

  test('a bad flag exits 2 with the help on stderr and no renderer', async () => {
    const h = harness();
    expect(await runTui(['--wat'], h.deps)).toBe(2);
    expect(stripAnsi(h.err.join(''))).toContain('unknown option "--wat"');
    expect(stripAnsi(h.err.join(''))).toContain('Usage: kortix tui');
    expect(h.importCount()).toBe(0);
  });

  test("--host names an unknown host → exit 1 with the CLI's standard message", async () => {
    const h = harness();
    expect(await runTui(['--host', 'ghost'], h.deps)).toBe(1);
    expect(stripAnsi(h.err.join(''))).toContain('Host "ghost" is not logged in.');
    expect(stripAnsi(h.err.join(''))).toContain('kortix hosts login ghost');
    expect(h.importCount()).toBe(0);
  });

  test("--host reads THAT host's record, not the active default project", async () => {
    const h = harness();
    expect(await runTui(['--host', 'cloud'], h.deps)).toBe(0);
    expect(h.rendered).toEqual([
      {
        host: {
          name: 'cloud',
          backendUrl: 'https://api.kortix.com/v1',
          token: 'kortix_pat_live',
          accountId: 'acc_1',
          defaultProjectId: 'proj_config',
          userEmail: 'ada@kortix.com',
          source: 'config',
        },
        projectId: null,
        sessionId: null,
      },
    ]);
  });

  test('with no --host it uses the active host and ITS default project', async () => {
    const h = harness();
    expect(await runTui([], h.deps)).toBe(0);
    expect(h.rendered).toHaveLength(1);
    expect(h.rendered[0]).toMatchObject({
      host: { name: 'cloud', defaultProjectId: 'proj_active', source: 'config' },
    });
  });

  test('--project and --session become the initial project and session', async () => {
    const h = harness();
    expect(await runTui(['--project', 'p9', '--session', 's9'], h.deps)).toBe(0);
    expect(h.rendered[0]).toMatchObject({ projectId: 'p9', sessionId: 's9' });
  });

  test('a KORTIX_TOKEN shell resolves the synthetic sandbox host', async () => {
    const h = harness({ activeHostName: () => 'sandbox', hasEnvTokenHost: () => true });
    expect(await runTui([], h.deps)).toBe(0);
    expect(h.rendered[0]).toMatchObject({
      host: { name: 'sandbox', source: 'env', envVar: 'KORTIX_TOKEN' },
    });
  });

  test('not logged in opens the TUI login screen instead of failing', async () => {
    const h = harness({ loadAuth: () => null, defaultProject: () => null });
    expect(await runTui([], h.deps)).toBe(0);
    expect(h.rendered[0]).toMatchObject({ host: null });
    expect(h.importCount()).toBe(1);
  });

  test('the experimental notice reaches stderr before the renderer starts', async () => {
    const seen: string[] = [];
    const h = harness();
    const deps: Partial<TuiDeps> = {
      ...h.deps,
      stderr: (text) => seen.push(`stderr:${text.trim()}`),
      importTui: async () => {
        seen.push('import');
        return { runTui: async () => 0 };
      },
      exit: (code) => seen.push(`exit:${code}`),
    };
    expect(await runTui([], deps)).toBe(0);
    expect(seen).toEqual([`stderr:${EXPERIMENTAL_NOTICE}`, 'import', 'exit:0']);
    expect(EXPERIMENTAL_NOTICE).toBe(
      'kortix tui is experimental — keys: ? · docs: https://kortix.com/docs/tui',
    );
  });

  test("the command's exit code is whatever the TUI resolved", async () => {
    const h = harness({ exitCode: 7 });
    expect(await runTui([], h.deps)).toBe(7);
    // And it leaves the process itself: the renderer's live queries keep Bun's
    // event loop alive, so a drain would hang the shell after the terminal is
    // already restored.
    expect(h.exits).toEqual([7]);
  });

  test('a path that never starts the renderer never exits the process', async () => {
    const help = harness();
    expect(await runTui(['--help'], help.deps)).toBe(0);
    expect(help.exits).toEqual([]);

    const bad = harness();
    expect(await runTui(['--host', 'ghost'], bad.deps)).toBe(1);
    expect(bad.exits).toEqual([]);
  });
});
