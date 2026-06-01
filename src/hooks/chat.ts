import type { Hooks, PluginInput } from "@opencode-ai/plugin"
import type { Part } from "@opencode-ai/sdk"

const MIN_TEMPLATE_LENGTH = 50

function isCommandTemplate(text: string): boolean {
  if (text.length < MIN_TEMPLATE_LENGTH) return false
  const firstLine = text.split("\n")[0]
  if (!/^#\s+/.test(firstLine)) return false
  if (!/^##\s/m.test(text)) return false
  return true
}

function extractHeading(text: string): string {
  return text.split("\n")[0].replace(/^#\s+/, "").trim()
}

export const createChatMessageHandler = (
  client?: PluginInput["client"],
): NonNullable<Hooks["chat.message"]> => {
  return async (_input, output) => {
    for (let i = 0; i < output.parts.length; i++) {
      const part = output.parts[i] as any

      if (
        part.type !== "text" ||
        part.synthetic === true ||
        typeof part.text !== "string"
      ) {
        continue
      }

      if (isCommandTemplate(part.text)) {
        client?.app?.log({
          body: {
            service: "hush",
            level: "info",
            message: `chat.message: suppressing command template "${extractHeading(part.text)}" (${part.text.length} chars)`,
            extra: {
              heading: extractHeading(part.text),
              textLength: part.text.length,
            },
          },
        }).catch(() => {})

        output.parts[i] = {
          ...part,
          text: `[Command: ${extractHeading(part.text)}]`,
          synthetic: true,
        } as Part
      }
    }
  }
}