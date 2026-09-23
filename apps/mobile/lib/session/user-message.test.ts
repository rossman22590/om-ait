import { describe, expect, test } from 'bun:test';

import {
  WEB_SPACING_PX,
  interruptedTurnIds,
  isUserMessageEdited,
  parseUserMessageText,
  queuedPromptStatusLabel,
  rewindHiddenMessageIds,
  userMessageMetaItems,
  webSpace,
} from './user-message';

describe('webSpace', () => {
  test('one web spacing step is 0.23rem = 3.68px', () => {
    expect(WEB_SPACING_PX).toBeCloseTo(3.68, 5);
  });

  test('converts web spacing steps to rendered pixels', () => {
    expect(webSpace(2)).toBeCloseTo(7.36, 5);
    expect(webSpace(2.5)).toBeCloseTo(9.2, 5);
    expect(webSpace(3.5)).toBeCloseTo(12.88, 5);
    expect(webSpace(28)).toBeCloseTo(103.04, 5);
  });
});

describe('parseUserMessageText', () => {
  test('plain text passes through', () => {
    const parsed = parseUserMessageText('hello');
    expect(parsed.text).toBe('hello');
    expect(parsed.replyContext).toBeNull();
    expect(parsed.files).toEqual([]);
    expect(parsed.sessions).toEqual([]);
  });

  test('extracts <file> upload tags into files and strips them', () => {
    const raw =
      'see this\n\n<file path="/workspace/uploads/a.png" mime="image/png" filename="a.png">\nThis file has been uploaded and is available at the path above.\n</file>';
    const parsed = parseUserMessageText(raw);
    expect(parsed.text).toBe('see this');
    expect(parsed.files).toEqual([
      { path: '/workspace/uploads/a.png', mime: 'image/png', filename: 'a.png' },
    ]);
  });

  test('unescapes XML attributes in file tags', () => {
    const raw = '<file path="/w/R&amp;D.pdf" mime="application/pdf" filename="R&amp;D.pdf">x</file>';
    expect(parseUserMessageText(raw).files[0]?.filename).toBe('R&D.pdf');
  });

  test('strips two <file> tags and keeps the prose around them', () => {
    const raw =
      'before <file path="/w/a.png" mime="image/png" filename="a.png">A</file> middle <file path="/w/b.pdf" filename="b.pdf">B</file> after';
    const parsed = parseUserMessageText(raw);
    expect(parsed.text).toBe('before  middle  after');
    expect(parsed.files).toEqual([
      { path: '/w/a.png', mime: 'image/png', filename: 'a.png' },
      { path: '/w/b.pdf', mime: '', filename: 'b.pdf' },
    ]);
  });

  test('keeps a <file> tag that names neither path nor filename', () => {
    const raw = 'x <file note="y">z</file>';
    expect(parseUserMessageText(raw)).toMatchObject({ text: raw, files: [] });
  });

  test('keeps an unclosed <file> tag as typed', () => {
    const raw = 'look <file path="/w/a"> nothing closes it';
    expect(parseUserMessageText(raw)).toMatchObject({ text: raw, files: [] });
  });

  // The old `<file>` regex was quadratic on whitespace that never reaches `>`.
  // This ~440k-character message froze it for ~20 s under Bun on a laptop.
  // The trailing `x` keeps the first `.trim()` from removing the whitespace.
  test('a pathological <file> opener does not freeze the parser', () => {
    const evil = `${'<file\t'.repeat(40_000)}<file${'\t'.repeat(200_000)}x`;
    const started = performance.now();
    const parsed = parseUserMessageText(evil);
    expect(performance.now() - started).toBeLessThan(100);
    expect(parsed.files).toEqual([]);
  });

  test('extracts reply context', () => {
    const parsed = parseUserMessageText('<reply_context>quoted bit</reply_context>\nmy answer');
    expect(parsed.replyContext).toBe('quoted bit');
    expect(parsed.text).toBe('my answer');
  });

  test('extracts session refs and strips their header', () => {
    const raw =
      'look at @Old run\n\nReferenced sessions (use the session_context tool to fetch details when needed):\n<session_ref id="ses_1" title="Old run" />';
    const parsed = parseUserMessageText(raw);
    expect(parsed.text).toBe('look at @Old run');
    expect(parsed.sessions).toEqual([{ id: 'ses_1', title: 'Old run' }]);
  });

  test('strips file_ref, agent_ref, project_ref and kortix_system blocks', () => {
    const raw =
      'hi @a.ts\n\nReferenced files (read them):\n<file_ref path="a.ts" name="a.ts" />\n<agent_ref name="build" />\n<project_ref name="x" />\n<kortix_system type="ctx">secret</kortix_system>';
    expect(parseUserMessageText(raw).text).toBe('hi @a.ts');
  });
});

describe('isUserMessageEdited', () => {
  test('true when a visible text part carries metadata.edited', () => {
    expect(
      isUserMessageEdited([{ type: 'text', text: 'x', metadata: { edited: true } }]),
    ).toBe(true);
  });

  test('ignores synthetic, ignored, and empty parts', () => {
    expect(
      isUserMessageEdited([
        { type: 'text', text: 'x', synthetic: true, metadata: { edited: true } },
        { type: 'text', text: 'y', ignored: true, metadata: { edited: true } },
        { type: 'text', text: '  ', metadata: { edited: true } },
        { type: 'file', metadata: { edited: true } },
      ]),
    ).toBe(false);
  });
});

describe('userMessageMetaItems', () => {
  const now = Date.UTC(2026, 8, 17, 12, 0, 0);

  test('relative time, then "edited"', () => {
    expect(userMessageMetaItems({ timestamp: now - 5 * 60_000, edited: true, now })).toEqual([
      '5 minutes ago',
      'edited',
    ]);
  });

  test('under a minute reads "just now"', () => {
    expect(userMessageMetaItems({ timestamp: now - 10_000, edited: false, now })).toEqual([
      'just now',
    ]);
  });

  test('no timestamp and not edited is empty', () => {
    expect(userMessageMetaItems({ timestamp: null, edited: false, now })).toEqual([]);
  });
});

describe('queuedPromptStatusLabel', () => {
  test('a plainly queued bubble has no label', () => {
    expect(queuedPromptStatusLabel('queued')).toBeNull();
  });

  test('an interrupted bubble explains itself', () => {
    expect(queuedPromptStatusLabel('interrupted')).toBe('Queued — runs with your next message');
  });
});

type T = { userMessage: { info: { id: string } }; assistantMessages: { info: { error?: unknown } }[] };
const turn = (id: string, assistant: { error?: unknown }[] = []): T => ({
  userMessage: { info: { id } },
  assistantMessages: assistant.map((info) => ({ info })),
});
const aborted = { name: 'MessageAbortedError', data: { message: 'aborted' } };

describe('interruptedTurnIds', () => {
  test('turns after an aborted turn with no answer are interrupted', () => {
    const turns = [turn('a', [{}]), turn('b', [{ error: aborted }]), turn('c'), turn('d')];
    expect([...interruptedTurnIds(turns, false)]).toEqual(['c', 'd']);
  });

  test('nothing is interrupted while the session works', () => {
    const turns = [turn('b', [{ error: aborted }]), turn('c')];
    expect(interruptedTurnIds(turns, true).size).toBe(0);
  });

  test('nothing is interrupted when the newest turn with content was not aborted', () => {
    const turns = [turn('b', [{}]), turn('c')];
    expect(interruptedTurnIds(turns, false).size).toBe(0);
  });

  test('nothing is interrupted when the last turn has content', () => {
    const turns = [turn('b', [{ error: aborted }])];
    expect(interruptedTurnIds(turns, false).size).toBe(0);
  });
});

describe('rewindHiddenMessageIds', () => {
  const msg = (id: string, created?: number) => ({ info: { id, time: created ? { created } : undefined } });

  test('the boundary and every later message, in created order', () => {
    const messages = [msg('m3', 30), msg('m1', 10), msg('m2', 20), msg('m4', 40)];
    expect(rewindHiddenMessageIds(messages, 'm2')).toEqual(['m2', 'm3', 'm4']);
  });

  test('created time wins over id order', () => {
    const messages = [msg('z', 10), msg('a', 20)];
    expect(rewindHiddenMessageIds(messages, 'z')).toEqual(['z', 'a']);
  });

  test('an unknown boundary hides nothing', () => {
    expect(rewindHiddenMessageIds([msg('a', 1)], 'nope')).toEqual([]);
  });
});

// ── Linear-time parsing ──────────────────────────────────────────────────────
//
// Every tag in a user message used to be read with a lazy regex that scanned
// the rest of the message again for each tag that never closed. This is the
// regex version of parseUserMessageText, kept ONLY as a parity oracle.
function legacyParse(raw: string) {
  const unescape = (v: string) => v.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  let text = (raw ?? '').replace(/<kortix_system[^>]*>[\s\S]*?<\/kortix_system>/gi, '');
  text = text.replace(/\n{3,}/g, '\n\n').trim();
  let replyContext: string | null = null;
  const reply = text.match(/<reply_context>([\s\S]*?)<\/reply_context>/);
  if (reply) {
    replyContext = reply[1]!.trim();
    text = text.replace(/<reply_context>[\s\S]*?<\/reply_context>\s*/, '').trim();
  }
  const files: { path: string; mime: string; filename: string }[] = [];
  text = text
    .replace(/<file\s+([^>]*?)>\s*[\s\S]*?<\/file>/g, (whole, attrs: string) => {
      const pick = (key: string) => {
        const m = attrs.match(new RegExp(`\\b${key}="([^"]*?)"`));
        return m ? unescape(m[1]!) : undefined;
      };
      const path = pick('path');
      const filename = pick('filename');
      if (path === undefined && filename === undefined) return whole;
      files.push({ path: path ?? '', mime: pick('mime') ?? '', filename: filename ?? '' });
      return '';
    })
    .trim();
  text = text
    .replace(/<project_ref\b[\s\S]*?\/>/g, '')
    .replace(/\n*Referenced projects \([^)]*\):\n?/g, '')
    .replace(/<file_ref\b[\s\S]*?\/>/g, '')
    .replace(/\n*Referenced files \([^)]*\):\n?/g, '')
    .replace(/<agent_ref\b[\s\S]*?\/>/g, '')
    .replace(/\n*Referenced agents \([^)]*\):\n?/g, '')
    .trim();
  const sessions: { id: string; title: string }[] = [];
  text = text
    .replace(/<session_ref\s+id="([^"]*?)"\s+title="([^"]*?)"\s*\/>/g, (_, id: string, title: string) => {
      sessions.push({ id, title });
      return '';
    })
    .replace(/\n*Referenced sessions \(use the session_context tool to fetch details when needed\):\n?/g, '')
    .trim();
  return { text, replyContext, files, sessions };
}

/** Deterministic PRNG (mulberry32), so a failing case reproduces. */
function random(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('parseUserMessageText returns exactly what the regex version returned', () => {
  test('on 3000 random messages', () => {
    const tokens = ['<kortix_system type="a">', '</kortix_system>', '<KORTIX_SYSTEM', '</Kortix_System>', '<reply_context>',
      '</reply_context>', 'quoted', '<file path="/w/a.png" mime="image/png" filename="a.png">', '<file note="x">', '</file>',
      '<file', '<project_ref name="p"/>', '<project_ref', '<file_ref path="a.ts" name="a"/>', '<agent_ref name="build"/>', '/>',
      '\nReferenced projects (x):\n', 'Referenced files (', '):', '\nReferenced agents (a):', '<session_ref id="s" title="t" />',
      '\nReferenced sessions (use the session_context tool to fetch details when needed):\n', '\n', '\n\n\n', ' ', 'hello', '>'];
    const next = random(71);
    let tagged = 0;
    for (let i = 0; i < 3000; i++) {
      let text = '';
      const length = Math.floor(next() * 18);
      for (let j = 0; j < length; j++) text += tokens[Math.floor(next() * tokens.length)];
      const expected = legacyParse(text);
      expect(parseUserMessageText(text)).toEqual(expected);
      if (expected.text !== text.trim()) tagged++;
    }
    expect(tagged).toBeGreaterThan(1500);
  });
});

describe('no user message can freeze the app', () => {
  const within = (label: string, run: () => unknown) =>
    test(label, () => {
      const started = performance.now();
      run();
      expect(performance.now() - started).toBeLessThan(100);
    });

  // Each took ~1 s with Bun on a laptop, and quadrupled per doubling. Hermes
  // on a phone is slower.
  within('16k <kortix_system> openers that never close', () => parseUserMessageText('<kortix_system>'.repeat(16_000)));
  within('16k <reply_context> openers that never close', () => parseUserMessageText('<reply_context>'.repeat(16_000)));
  within('16k <project_ref openers that never close', () => parseUserMessageText('<project_ref x>'.repeat(16_000)));
  within('20k <file_ref openers that never close', () => parseUserMessageText('<file_ref x>'.repeat(20_000)));
  // Removing the refs joins their blank lines into one 60k-newline run, and
  // `\n*Referenced …` retried every newline of it.
  within('30k project refs, each after a blank line', () => parseUserMessageText('\n\n<project_ref x/>'.repeat(30_000)));
  within('30k session refs, each after a blank line', () =>
    parseUserMessageText('\n\n<session_ref id="a" title="b" />'.repeat(30_000)));
});
