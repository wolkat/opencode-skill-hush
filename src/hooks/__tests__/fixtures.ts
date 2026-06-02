import type { Hooks } from "@opencode-ai/plugin"
import type { Part, TextPart } from "@opencode-ai/sdk"
import type { PluginInput } from "@opencode-ai/plugin"

// Typed input/output fixtures for hook tests.
// Using satisfies ensures mismatches surface at test-authoring time,
// not silently passing with stale shapes via `as any`.

// --- command.execute.before ---

type CommandBeforeInput = Parameters<NonNullable<Hooks["command.execute.before"]>>[0]
type CommandBeforeOutput = Parameters<NonNullable<Hooks["command.execute.before"]>>[1]

export function makeCommandInput(
  overrides: Partial<CommandBeforeInput> = {},
): CommandBeforeInput {
  return {
    command: "commit",
    sessionID: "s1",
    arguments: "feat: add something",
    ...overrides,
  }
}

export function makeCommandOutput(
  parts: Part[] = [],
): CommandBeforeOutput {
  return { parts }
}

// --- chat.message ---

type ChatMessageInput = Parameters<NonNullable<Hooks["chat.message"]>>[0]
type ChatMessageOutput = Parameters<NonNullable<Hooks["chat.message"]>>[1]

export function makeChatInput(
  overrides: Partial<ChatMessageInput> = {},
): ChatMessageInput {
  return {
    sessionID: "s1",
    ...overrides,
  }
}

export function makeChatOutput(
  parts: Part[] = [],
): ChatMessageOutput {
  return { message: {} as ChatMessageOutput["message"], parts }
}

// --- tool.execute.after ---

type ToolAfterInput = Parameters<NonNullable<Hooks["tool.execute.after"]>>[0]
type ToolAfterOutput = Parameters<NonNullable<Hooks["tool.execute.after"]>>[1]

export function makeToolAfterInput(
  overrides: Partial<ToolAfterInput> = {},
): ToolAfterInput {
  return {
    tool: "skill",
    sessionID: "s1",
    callID: "c1",
    args: { name: "test-skill" },
    ...overrides,
  }
}

export function makeToolAfterOutput(
  overrides: Partial<ToolAfterOutput> = {},
): ToolAfterOutput {
  return {
    title: "...",
    output: "...",
    metadata: {},
    ...overrides,
  }
}

// --- TextPart helper ---

export function textPart(text: string, overrides: Partial<TextPart> = {}): TextPart {
  return {
    id: overrides.id ?? `part-${Math.random().toString(36).slice(2, 8)}`,
    sessionID: overrides.sessionID ?? "s1",
    messageID: overrides.messageID ?? `msg-${Math.random().toString(36).slice(2, 8)}`,
    type: "text",
    text,
    ...overrides,
  } satisfies TextPart
}

// --- Mock client factory ---

type MockClientLogEntry = {
  service: string
  level: string
  message: string
  extra?: Record<string, unknown>
}

export type MockClient = PluginInput["client"] & {
  logs: MockClientLogEntry[]
}

export function createMockClient(): MockClient {
  const logs: MockClientLogEntry[] = []
  return {
    app: {
      log: (payload: { body: MockClientLogEntry }) => {
        logs.push(payload.body)
        return { catch: () => {} }
      },
    },
    logs,
  } satisfies MockClient
}