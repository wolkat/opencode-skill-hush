import type { Hooks } from "@opencode-ai/plugin"

export type SkillHushOptions = {
  showLineCount?: boolean
}

export const createSkillAfterHandler = (
  options: SkillHushOptions,
): NonNullable<Hooks["tool.execute.after"]> => {
  return async (input, output) => {
    if (input.tool !== "skill") return

    const name = input.args?.name ?? "unknown"
    const lines = options.showLineCount
      ? ` (${(output.output ?? "").split("\n").length} lines)`
      : ""

    output.title = `skill: ${name}`
    output.output = `[Skill "${name}" loaded${lines}]`
  }
}
