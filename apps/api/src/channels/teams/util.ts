export function stripTeamsMentions(text: string): string {
  return text
    .replace(/<at[^>]*>.*?<\/at>/gi, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface TeamsCommand {
  verb: string;
  arg: string;
}

const COMMAND_VERBS = new Set([
  'login',
  'connect',
  'logout',
  'disconnect',
  'whoami',
  'who',
  'help',
  'status',
  'config',
  'settings',
  'models',
  'model',
  'agents',
  'agent',
  'projects',
  'use',
  'switch',
]);

export function parseTeamsCommand(text: string | undefined): TeamsCommand | null {
  const stripped = stripTeamsMentions(text ?? '').trim();
  if (!stripped.startsWith('/')) return null;
  const body = stripped.slice(1).trim();
  if (!body) return null;
  const [first, ...rest] = body.split(/\s+/);
  const verb = first.toLowerCase();
  if (!COMMAND_VERBS.has(verb)) return null;
  return { verb, arg: rest.join(' ').trim() };
}

/**
 * Whether this activity @-mentions the bot. Teams lists mentions in
 * `entities[]` with `type: 'mention'`; the bot is `activity.recipient`.
 */
export function isBotMentioned(activity: {
  entities?: Array<Record<string, unknown>>;
  recipient?: { id?: string };
}): boolean {
  const botId = activity.recipient?.id;
  if (!botId) return false;
  for (const entity of activity.entities ?? []) {
    if (entity.type !== 'mention') continue;
    const mentioned = entity.mentioned as { id?: string } | undefined;
    if (mentioned?.id === botId) return true;
  }
  return false;
}

export type TeamsConversationScope = 'personal' | 'groupChat' | 'channel';

/** Personal chats deliver every message to the bot; channels and group chats only mentions — unless RSC grants more. */
export function conversationScope(activity: {
  conversation?: { conversationType?: string };
}): TeamsConversationScope {
  const t = (activity.conversation?.conversationType ?? '').toLowerCase();
  if (t === 'channel') return 'channel';
  if (t === 'groupchat') return 'groupChat';
  return 'personal';
}
