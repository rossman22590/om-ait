/**
 * The two blocking interactions a turn can raise: a permission request before
 * a tool runs, and a question the agent asks the user. Both are OpenCode wire
 * objects (`PermissionRequest`, `QuestionRequest`) answered over the same
 * routes the product already calls (`/permission/:id/reply`,
 * `/question/:id/reply|reject`, `/kortix/opencode/act`).
 */
import { randomUUID } from 'node:crypto'
import type { WireFrame } from './transcript'

export type PermissionReply = 'once' | 'always' | 'reject'

export interface PermissionRequestWire {
  id: string
  sessionID: string
  permission: string
  patterns: string[]
  metadata: Record<string, unknown>
  always: string[]
  tool?: { messageID: string; callID: string }
}

export interface QuestionOption {
  label: string
  description: string
}

export interface QuestionInfo {
  question: string
  header: string
  options: QuestionOption[]
  multiple?: boolean
  custom?: boolean
}

export interface QuestionRequestWire {
  id: string
  sessionID: string
  questions: QuestionInfo[]
  tool?: { messageID: string; callID: string }
}

/** `allow` | `ask` | `deny` per tool name, `*` as the default. */
export type PermissionRule = 'allow' | 'ask' | 'deny'
export type PermissionPolicy = Record<string, PermissionRule>

/**
 * Compile the manifest's compiled `permission` block (OpenCode's
 * PermissionConfig: `{ [tool]: 'allow'|'ask'|'deny' | { [pattern]: rule } }`)
 * into a per-tool rule. Pattern objects take their `*` entry; anything
 * unrecognised is `allow`, OpenCode's default for a tool without a rule.
 */
export function compilePermissionPolicy(raw: unknown): PermissionPolicy {
  const policy: PermissionPolicy = {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return policy
  for (const [tool, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value === 'allow' || value === 'ask' || value === 'deny') policy[tool] = value
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      const star = (value as Record<string, unknown>)['*']
      if (star === 'allow' || star === 'ask' || star === 'deny') policy[tool] = star
    }
  }
  return policy
}

export class PermissionBroker {
  private readonly pending = new Map<string, { request: PermissionRequestWire; resolve: (reply: PermissionReply) => void }>()
  private readonly alwaysAllowed = new Set<string>()

  constructor(
    private readonly sessionID: string,
    private readonly publish: (frame: WireFrame) => void,
    private policy: PermissionPolicy = {},
  ) {}

  setPolicy(policy: PermissionPolicy): void {
    this.policy = policy
  }

  rule(tool: string): PermissionRule {
    if (this.alwaysAllowed.has(tool)) return 'allow'
    return this.policy[tool] ?? this.policy['*'] ?? 'allow'
  }

  /** Resolves with the user's reply; never rejects. */
  ask(input: { tool: string; args: unknown; ref?: { messageID: string; callID: string } }): Promise<PermissionReply> {
    const request: PermissionRequestWire = {
      id: `perm_${randomUUID().replace(/-/g, '').slice(0, 24)}`,
      sessionID: this.sessionID,
      permission: input.tool,
      patterns: [input.tool],
      metadata: input.args && typeof input.args === 'object' ? (input.args as Record<string, unknown>) : {},
      always: [input.tool],
      ...(input.ref ? { tool: input.ref } : {}),
    }
    return new Promise<PermissionReply>((resolve) => {
      this.pending.set(request.id, { request, resolve })
      this.publish({ type: 'permission.asked', properties: { ...request } })
    })
  }

  reply(id: string, reply: PermissionReply): boolean {
    const entry = this.pending.get(id)
    if (!entry) return false
    this.pending.delete(id)
    if (reply === 'always') this.alwaysAllowed.add(entry.request.permission)
    this.publish({ type: 'permission.replied', properties: { sessionID: this.sessionID, requestID: id, reply } })
    entry.resolve(reply)
    return true
  }

  list(): PermissionRequestWire[] {
    return [...this.pending.values()].map((entry) => entry.request)
  }

  /** A turn that ends (abort, error) releases every request it left open. */
  rejectAll(): void {
    for (const id of [...this.pending.keys()]) this.reply(id, 'reject')
  }
}

export class QuestionBroker {
  private readonly pending = new Map<string, { request: QuestionRequestWire; resolve: (answers: string[][] | null) => void }>()

  constructor(
    private readonly sessionID: string,
    private readonly publish: (frame: WireFrame) => void,
    private readonly onAsked?: (request: QuestionRequestWire) => void,
  ) {}

  /** Resolves with the answers, or null when rejected; never rejects. */
  ask(questions: QuestionInfo[], ref?: { messageID: string; callID: string }): Promise<string[][] | null> {
    const request: QuestionRequestWire = {
      id: `que_${randomUUID().replace(/-/g, '').slice(0, 24)}`,
      sessionID: this.sessionID,
      questions,
      ...(ref ? { tool: ref } : {}),
    }
    return new Promise((resolve) => {
      this.pending.set(request.id, { request, resolve })
      this.publish({ type: 'question.asked', properties: { ...request } })
      this.onAsked?.(request)
    })
  }

  reply(id: string, answers: string[][]): boolean {
    const entry = this.pending.get(id)
    if (!entry) return false
    this.pending.delete(id)
    this.publish({ type: 'question.replied', properties: { sessionID: this.sessionID, requestID: id, answers } })
    entry.resolve(answers)
    return true
  }

  reject(id: string): boolean {
    const entry = this.pending.get(id)
    if (!entry) return false
    this.pending.delete(id)
    this.publish({ type: 'question.rejected', properties: { sessionID: this.sessionID, requestID: id } })
    entry.resolve(null)
    return true
  }

  list(): QuestionRequestWire[] {
    return [...this.pending.values()].map((entry) => entry.request)
  }

  rejectAll(): void {
    for (const id of [...this.pending.keys()]) this.reject(id)
  }
}
