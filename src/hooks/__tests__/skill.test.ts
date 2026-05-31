import { describe, it, expect } from "vitest"
import { createSkillAfterHandler } from "../skill.js"

describe("createSkillAfterHandler", () => {
  it("skips non-skill tools", async () => {
    const handler = createSkillAfterHandler({})
    const input = { tool: "bash", sessionID: "s1", callID: "c1" }
    const output = { title: "original", output: "content", metadata: {} }

    await handler(input as any, output as any)

    expect(output.title).toBe("original")
    expect(output.output).toBe("content")
  })

  it("replaces skill title and output with placeholder", async () => {
    const handler = createSkillAfterHandler({})
    const input = {
      tool: "skill",
      sessionID: "s1",
      callID: "c1",
      args: { name: "bmad-advanced-elicitation" },
    }
    const output = {
      title: "Loaded skill: bmad-advanced-elicitation",
      output: "<skill_content name=\"bmad-advanced-elicitation\">\nfull content here\n</skill_content>",
      metadata: { name: "bmad-advanced-elicitation" },
    }

    await handler(input as any, output as any)

    expect(output.title).toBe("skill: bmad-advanced-elicitation")
    expect(output.output).toBe('[Skill "bmad-advanced-elicitation" loaded]')
  })

  it("includes line count when showLineCount is true", async () => {
    const handler = createSkillAfterHandler({ showLineCount: true })
    const input = {
      tool: "skill",
      sessionID: "s1",
      callID: "c1",
      args: { name: "test-skill" },
    }
    const output = {
      title: "Loaded skill: test-skill",
      output: "line1\nline2\nline3",
      metadata: {},
    }

    await handler(input as any, output as any)

    expect(output.title).toBe("skill: test-skill")
    expect(output.output).toBe('[Skill "test-skill" loaded (3 lines)]')
  })

  it("handles missing args name gracefully", async () => {
    const handler = createSkillAfterHandler({})
    const input = { tool: "skill", sessionID: "s1", callID: "c1" }
    const output = { title: "...", output: "...", metadata: {} }

    await handler(input as any, output as any)

    expect(output.title).toBe("skill: unknown")
    expect(output.output).toBe('[Skill "unknown" loaded]')
  })
})
