import { describe, it, expect } from "vitest"
import { createSkillAfterHandler } from "../skill.js"
import { makeToolAfterInput, makeToolAfterOutput } from "./fixtures.js"

describe("createSkillAfterHandler", () => {
  it("skips non-skill tools", async () => {
    const handler = createSkillAfterHandler({})
    const input = makeToolAfterInput({ tool: "bash" })
    const output = makeToolAfterOutput({ title: "original", output: "content" })

    await handler(input, output)

    expect(output.title).toBe("original")
    expect(output.output).toBe("content")
  })

  it("replaces skill title and output with placeholder", async () => {
    const handler = createSkillAfterHandler({})
    const input = makeToolAfterInput({
      args: { name: "bmad-advanced-elicitation" },
    })
    const output = makeToolAfterOutput({
      title: "Loaded skill: bmad-advanced-elicitation",
      output: '<skill_content name="bmad-advanced-elicitation">\nfull content here\n</skill_content>',
      metadata: { name: "bmad-advanced-elicitation" },
    })

    await handler(input, output)

    expect(output.title).toBe("skill: bmad-advanced-elicitation")
    expect(output.output).toBe('[Skill "bmad-advanced-elicitation" loaded]')
  })

  it("includes line count when showLineCount is true", async () => {
    const handler = createSkillAfterHandler({ showLineCount: true })
    const input = makeToolAfterInput({ args: { name: "test-skill" } })
    const output = makeToolAfterOutput({
      title: "Loaded skill: test-skill",
      output: "line1\nline2\nline3",
    })

    await handler(input, output)

    expect(output.title).toBe("skill: test-skill")
    expect(output.output).toBe('[Skill "test-skill" loaded (3 lines)]')
  })

  it("handles missing args name gracefully", async () => {
    const handler = createSkillAfterHandler({})
    const input = makeToolAfterInput({ args: undefined })
    const output = makeToolAfterOutput()

    await handler(input, output)

    expect(output.title).toBe("skill: unknown")
    expect(output.output).toBe('[Skill "unknown" loaded]')
  })

  it("handles empty string name gracefully", async () => {
    const handler = createSkillAfterHandler({})
    const input = makeToolAfterInput({ args: { name: "" } })
    const output = makeToolAfterOutput()

    await handler(input, output)

    expect(output.title).toBe("skill: unknown")
    expect(output.output).toBe('[Skill "unknown" loaded]')
  })

  it("does not show line count for empty output", async () => {
    const handler = createSkillAfterHandler({ showLineCount: true })
    const input = makeToolAfterInput({ args: { name: "empty-skill" } })
    const output = makeToolAfterOutput({ title: "Empty", output: "" })

    await handler(input, output)

    expect(output.output).toBe('[Skill "empty-skill" loaded]')
  })

  it("does not show line count for undefined output", async () => {
    const handler = createSkillAfterHandler({ showLineCount: true })
    const input = makeToolAfterInput({ args: { name: "null-skill" } })
    const output = makeToolAfterOutput({ title: "Null", output: undefined as unknown as string })

    await handler(input, output)

    expect(output.output).toBe('[Skill "null-skill" loaded]')
  })
})