import type { Hooks, PluginInput } from "@opencode-ai/plugin"
import type { TextPart } from "@opencode-ai/sdk"

export const createCommandBeforeHandler = (
  client?: PluginInput["client"],
): NonNullable<Hooks["command.execute.before"]> => {
  return async (input, output) => {
    if (client) {
      const beforeLen = output.parts.length
      const beforePreview = output.parts
        .filter((p): p is TextPart => p.type === "text")
        .map((p) => p.text.slice(0, 80))
        .join(" | ")

      client.app.log({
        body: {
          service: "hush",
          level: "info",
          message: `command.execute.before fired for "${input.command}"`,
          extra: {
            sessionId: input.sessionID,
            partsBeforeLength: beforeLen,
            partsBeforePreview: beforePreview.slice(0, 200),
          },
        },
      }).catch((err: unknown) => {
        console.error("[hush] command.execute.before log failed:", err)
      })
    }

    const originalTextPart = output.parts.find(
      (p): p is TextPart => p.type === "text",
    )
    output.parts.length = 0
    output.parts.push({
      id: originalTextPart?.id ?? crypto.randomUUID(),
      sessionID: input.sessionID,
      messageID: originalTextPart?.messageID ?? "",
      type: "text",
      text: `[Command: ${input.command}]`,
      synthetic: true,
    } satisfies TextPart)
  }
}