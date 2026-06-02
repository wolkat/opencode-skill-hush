import type { Hooks } from "@opencode-ai/plugin"

export type SkillHushOptions = {
  showLineCount?: boolean
}

export const createSkillAfterHandler = (
  options: SkillHushOptions,
): NonNullable<Hooks["tool.execute.after"]> => {
  return async (input, output) => {
    if (input.tool !== "skill") return

    const name = (input.args?.name as string | undefined) || "unknown"
    const lineCount = output.output ? output.output.split("\n").length : 0
    const lines = options.showLineCount && lineCount > 0
      ? ` (${lineCount} lines)`
      : ""

    output.title = `skill: ${name}`
    output.output = `[Skill "${name}" loaded${lines}]`
  }
}
