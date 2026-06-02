import type { Hooks, PluginInput } from "@opencode-ai/plugin"
import type { TextPart } from "@opencode-ai/sdk"

const MIN_TEMPLATE_LENGTH = 50

function isCommandTemplate(text: string): boolean {
  if (text.length < MIN_TEMPLATE_LENGTH) return false
  const firstLine = text.split("\n")[0]
  if (!/^#\s+/.test(firstLine)) return false
  // Require <skill_content> tag regardless of H2 presence — skill templates
  // may lack subsections but should still be suppressed.
  if (/<skill_content/i.test(text)) return true
  if (!/^##\s/m.test(text)) return false
  // Require a slash-command prefix to avoid false positives on user-written
  // markdown with H1+H2 structure.
  const heading = firstLine.replace(/^#\s+/, "").trim()
  if (heading.startsWith("/")) return true
  return false
}

function extractHeading(text: string): string {
  return text.split("\n")[0].replace(/^#\s+/, "").trim()
}

export const createChatMessageHandler = (
  client?: PluginInput["client"],
): NonNullable<Hooks["chat.message"]> => {
  return async (_input, output) => {
    for (let i = 0; i < output.parts.length; i++) {
      const part = output.parts[i]

      if (part.type !== "text") continue
      if (part.synthetic === true || typeof part.text !== "string") continue

      if (isCommandTemplate(part.text)) {
        const heading = extractHeading(part.text)

        if (client) {
          client.app.log({
            body: {
              service: "hush",
              level: "info",
              message: `chat.message: suppressing command template "${heading}" (${part.text.length} chars)`,
              extra: {
                heading,
                textLength: part.text.length,
              },
            },
          }).catch((err: unknown) => {
            console.error("[hush] chat.message log failed:", err)
          })
        }

        output.parts[i] = {
          ...part,
          text: `[Command: ${heading}]`,
          synthetic: true,
        } satisfies TextPart
      }
    }
  }
}