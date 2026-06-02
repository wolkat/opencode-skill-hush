import type { Plugin } from "@opencode-ai/plugin"
import { createSkillAfterHandler } from "./hooks/skill.js"
import { createCommandBeforeHandler } from "./hooks/command.js"
import { createChatMessageHandler } from "./hooks/chat.js"

export type ContentHushOptions = {
  suppressSkills?: boolean
  suppressCommands?: boolean
  showLineCount?: boolean
}

function parseOptions(raw: Record<string, unknown> | undefined): Required<ContentHushOptions> {
  const r = raw ?? {}
  return {
    suppressSkills: typeof r.suppressSkills === "boolean" ? r.suppressSkills : true,
    suppressCommands: typeof r.suppressCommands === "boolean" ? r.suppressCommands : true,
    showLineCount: typeof r.showLineCount === "boolean" ? r.showLineCount : false,
  }
}

export const ContentHushPlugin: Plugin = async (ctx, options) => {
  const opts = parseOptions(options as Record<string, unknown> | undefined)

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
