import type { Hooks, PluginInput } from "@opencode-ai/plugin"
import type { Part } from "@opencode-ai/sdk"

export const createCommandBeforeHandler = (
  client?: PluginInput["client"],
): NonNullable<Hooks["command.execute.before"]> => {
  return async (input, output) => {
    const beforeLen = output.parts.length
    const beforePreview = output.parts
      .filter((p: any) => p.type === "text")
      .map((p: any) => (p.text ?? "").slice(0, 80))
      .join(" | ")

    client?.app?.log({
      body: {
        service: "hush",
        level: "info",
        message: `command.execute.before fired for "${input.command}"`,
        extra: {
          sessionId: input.sessionID,
          argsPreview: (input.arguments ?? "").slice(0, 60),
          partsBeforeLength: beforeLen,
          partsBeforePreview: beforePreview.slice(0, 200),
        },
      },
    }).catch(() => {})

    output.parts.length = 0
    output.parts.push({
      id: "",
      sessionID: input.sessionID,
      messageID: "",
      type: "text",
      text: `[Command: ${input.command}]`,
      synthetic: true,
    } satisfies Part)
  }
}
