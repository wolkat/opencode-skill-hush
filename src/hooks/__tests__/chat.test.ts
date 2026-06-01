import { describe, it, expect } from "vitest"
import { createChatMessageHandler } from "../chat.js"

describe("createChatMessageHandler", () => {
  it("suppresses text parts that look like command templates", async () => {
    const handler = createChatMessageHandler()
    const input = { sessionID: "s1" }
    const parts = [
      {
        type: "text",
        text: "# Save Session Learnings\n\nAnalyze the current session.\n\n## What to Extract\n\nSome content here.\n\n## Your Task\n\nDo things.",
      },
    ] as any[]
    const output = { message: {}, parts }

    await handler(input as any, output as any)

    expect(output.parts).toBe(parts)
    expect(output.parts).toHaveLength(1)
    expect(output.parts[0].text).toBe("[Command: Save Session Learnings]")
    expect(output.parts[0].synthetic).toBe(true)
  })

  it("preserves array identity via in-place mutation", async () => {
    const handler = createChatMessageHandler()
    const input = { sessionID: "s1" }
    const originalArray = [
      {
        type: "text",
        text: "# /todo - Scan repos\n\n## Quick Start\n\nRun todo-scan.\n\n## Your Task\n\nExecute the scan.",
      },
    ] as any[]
    const output = { message: {}, parts: originalArray }

    await handler(input as any, output as any)

    expect(output.parts).toBe(originalArray)
    expect(output.parts[0].text).toBe("[Command: /todo - Scan repos]")
  })

  it("skips short text parts that are not templates", async () => {
    const handler = createChatMessageHandler()
    const input = { sessionID: "s1" }
    const parts = [{ type: "text", text: "Hello world" }] as any[]
    const output = { message: {}, parts }

    await handler(input as any, output as any)

    expect(output.parts[0].text).toBe("Hello world")
    expect(output.parts[0].synthetic).toBeUndefined()
  })

  it("skips text parts without H2 sections even if they start with #", async () => {
    const handler = createChatMessageHandler()
    const input = { sessionID: "s1" }
    const longText = "# Quick note\n\n" + "Some text. ".repeat(20)
    const parts = [{ type: "text", text: longText }] as any[]
    const output = { message: {}, parts }

    await handler(input as any, output as any)

    expect(output.parts[0].text).toBe(longText)
  })

  it("skips parts already marked as synthetic", async () => {
    const handler = createChatMessageHandler()
    const input = { sessionID: "s1" }
    const parts = [
      {
        type: "text",
        text: "# Save\n\n## Task\n\nDo it.",
        synthetic: true,
      },
    ] as any[]
    const output = { message: {}, parts }

    await handler(input as any, output as any)

    expect(output.parts[0].text).toBe("# Save\n\n## Task\n\nDo it.")
    expect(output.parts[0].synthetic).toBe(true)
  })

  it("skips non-text parts", async () => {
    const handler = createChatMessageHandler()
    const input = { sessionID: "s1" }
    const parts = [
      { type: "file", url: "file:///test.txt", filename: "test.txt", mime: "text/plain" },
    ] as any[]
    const output = { message: {}, parts }

    await handler(input as any, output as any)

    expect(output.parts[0].type).toBe("file")
  })

  it("handles mixed parts: suppresses templates, leaves others", async () => {
    const handler = createChatMessageHandler()
    const input = { sessionID: "s1" }
    const parts = [
      { type: "text", text: "Brief user message" },
      {
        type: "text",
        text: "# /retro - Retrospective\n\nAnalyze session.\n\n## Step 1\n\nGather data.\n\n## Step 2\n\nExtract learnings.",
      },
      { type: "text", text: "Another short message" },
    ] as any[]
    const output = { message: {}, parts }

    await handler(input as any, output as any)

    expect(output.parts[0].text).toBe("Brief user message")
    expect(output.parts[1].text).toBe("[Command: /retro - Retrospective]")
    expect(output.parts[1].synthetic).toBe(true)
    expect(output.parts[2].text).toBe("Another short message")
  })
})