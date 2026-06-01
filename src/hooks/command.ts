import type { Hooks } from "@opencode-ai/plugin"
import type { Part } from "@opencode-ai/sdk"

export const createCommandBeforeHandler = (): NonNullable<
  Hooks["command.execute.before"]
> => {
  return async (input, output) => {
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
