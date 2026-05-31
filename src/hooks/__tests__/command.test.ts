import { describe, it, expect } from "vitest"
import { createCommandBeforeHandler } from "../command.js"

describe("createCommandBeforeHandler", () => {
  it("replaces parts with command placeholder", async () => {
    const handler = createCommandBeforeHandler()
    const input = {
      command: "commit",
      sessionID: "s1",
      arguments: "feat: add something",
    }
    const output = { parts: [{ type: "text", text: "original template" }] }

    await handler(input as any, output as any)

    expect(output.parts).toHaveLength(1)
    expect(output.parts[0]).toMatchObject({
      type: "text",
      text: "[Command: commit]",
      synthetic: true,
    })
  })

  it("handles empty command name", async () => {
    const handler = createCommandBeforeHandler()
    const input = { command: "", sessionID: "s1", arguments: "" }
    const output = { parts: [] }

    await handler(input as any, output as any)

    expect(output.parts).toHaveLength(1)
    expect(output.parts[0]).toMatchObject({
      type: "text",
      text: "[Command: ]",
      synthetic: true,
    })
  })
})
