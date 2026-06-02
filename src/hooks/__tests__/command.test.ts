import { describe, it, expect } from "vitest"
import { createCommandBeforeHandler } from "../command.js"
import { makeCommandInput, makeCommandOutput, textPart, createMockClient } from "./fixtures.js"

describe("createCommandBeforeHandler", () => {
  it("replaces parts with command placeholder via in-place mutation", async () => {
    const handler = createCommandBeforeHandler()
    const input = makeCommandInput()
    const output = makeCommandOutput([textPart("original template")])
    const originalRef = output.parts

    await handler(input, output)

    expect(output.parts).toBe(originalRef)
    expect(output.parts).toHaveLength(1)
    expect(output.parts[0]).toMatchObject({
      type: "text",
      text: "[Command: commit]",
      synthetic: true,
    })
  })

  it("preserves id and messageID from original text part", async () => {
    const handler = createCommandBeforeHandler()
    const input = makeCommandInput()
    const output = makeCommandOutput([
      textPart("original template", { id: "part-abc-123", messageID: "msg-456" }),
    ])

    await handler(input, output)

    expect(output.parts).toHaveLength(1)
    expect(output.parts[0].id).toBe("part-abc-123")
    expect(output.parts[0].messageID).toBe("msg-456")
    expect(output.parts[0].text).toBe("[Command: commit]")
    expect(output.parts[0].synthetic).toBe(true)
  })

  it("generates UUID for id and messageID when no original text part exists", async () => {
    const handler = createCommandBeforeHandler()
    const input = makeCommandInput({ command: "", arguments: "" })
    const output = makeCommandOutput([])

    await handler(input, output)

    expect(output.parts).toHaveLength(1)
    expect(output.parts[0].id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )
    expect(output.parts[0].messageID).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )
    expect(output.parts[0]).toMatchObject({
      type: "text",
      text: "[Command: ]",
      synthetic: true,
    })
  })

  it("logs via client when provided", async () => {
    const mockClient = createMockClient()
    const handler = createCommandBeforeHandler(mockClient)
    const input = makeCommandInput({ command: "review", sessionID: "s-review-1" })
    const output = makeCommandOutput([
      textPart("template content", { id: "p1", messageID: "m1", sessionID: "s-review-1" }),
    ])

    await handler(input, output)

    expect(mockClient.logs).toHaveLength(1)
    expect(mockClient.logs[0]).toMatchObject({
      service: "hush",
      level: "info",
      message: 'command.execute.before fired for "review"',
      extra: {
        sessionId: "s-review-1",
        partsBeforeLength: 1,
      },
    })
  })

  it("does not compute log payload when client is undefined", async () => {
    const handler = createCommandBeforeHandler()
    const input = makeCommandInput()
    const output = makeCommandOutput([textPart("template")])

    await handler(input, output)

    expect(output.parts).toHaveLength(1)
    expect(output.parts[0].text).toBe("[Command: commit]")
  })
})