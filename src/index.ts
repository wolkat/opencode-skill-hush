import type { Plugin } from "@opencode-ai/plugin"
import { createSkillAfterHandler } from "./hooks/skill.js"
import { createCommandBeforeHandler } from "./hooks/command.js"
import { createChatMessageHandler } from "./hooks/chat.js"

export type ContentHushOptions = {
  suppressSkills?: boolean
  suppressCommands?: boolean
  showLineCount?: boolean
}

export const ContentHushPlugin: Plugin = async (ctx, options) => {
  const opts: Required<ContentHushOptions> = {
    suppressSkills: true,
    suppressCommands: true,
    showLineCount: false,
    ...(options as ContentHushOptions ?? {}),
  }

  return {
    ...(opts.suppressSkills
      ? { "tool.execute.after": createSkillAfterHandler(opts) }
      : {}),
    ...(opts.suppressCommands
      ? {
          "command.execute.before": createCommandBeforeHandler(ctx.client),
          "chat.message": createChatMessageHandler(ctx.client),
        }
      : {}),
  }
}

export default ContentHushPlugin
