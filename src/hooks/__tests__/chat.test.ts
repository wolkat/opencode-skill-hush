import { describe, it, expect } from "vitest"
import { createChatMessageHandler } from "../chat.js"
import { makeChatInput, makeChatOutput, textPart, createMockClient } from "./fixtures.js"

describe("createChatMessageHandler", () => {
  it("suppresses text parts that look like slash-command templates", async () => {
    const handler = createChatMessageHandler()
    const input = makeChatInput()
    const output = makeChatOutput([
      textPart("# /todo - Scan repos\n\n## Quick Start\n\nRun todo-scan.\n\n## Your Task\n\nExecute the scan."),
    ])

    await handler(input, output)

    expect(output.parts).toHaveLength(1)
    expect(output.parts[0].text).toBe("[Command: /todo - Scan repos]")
    expect(output.parts[0].synthetic).toBe(true)
  })

  it("suppresses text parts containing <skill_content> tags", async () => {
    const handler = createChatMessageHandler()
    const input = makeChatInput()
    const output = makeChatOutput([
      textPart(
        '# Save Session Learnings\n\n<skill_content name="save-learnings">\nAnalyze the current session.\n</skill_content>\n\n## What to Extract\n\nSome content here.',
      ),
    ])

    await handler(input, output)

    expect(output.parts[0].text).toBe("[Command: Save Session Learnings]")
    expect(output.parts[0].synthetic).toBe(true)
  })

  it("suppresses <skill_content> templates without H2 headings", async () => {
    const handler = createChatMessageHandler()
    const input = makeChatInput()
    const output = makeChatOutput([
      textPart(
        '# Save Session Learnings\n\n<skill_content name="save-learnings">\nAnalyze the current session and extract learnings.\n</skill_content>',
      ),
    ])

    await handler(input, output)

    expect(output.parts[0].text).toBe("[Command: Save Session Learnings]")
    expect(output.parts[0].synthetic).toBe(true)
  })

  it("preserves array identity via in-place mutation", async () => {
    const handler = createChatMessageHandler()
    const input = makeChatInput()
    const parts = [
      textPart("# /retro - Retrospective\n\n## Step 1\n\nGather data.\n\n## Step 2\n\nExtract learnings."),
    ]
    const output = makeChatOutput(parts)

    await handler(input, output)

    expect(output.parts).toBe(parts)
    expect(output.parts[0].text).toBe("[Command: /retro - Retrospective]")
  })

  it("skips short text parts that are not templates", async () => {
    const handler = createChatMessageHandler()
    const input = makeChatInput()
    const output = makeChatOutput([textPart("Hello world")])

    await handler(input, output)

    expect(output.parts[0].text).toBe("Hello world")
    expect(output.parts[0].synthetic).toBeUndefined()
  })

  it("skips user markdown without slash prefix or skill_content tag", async () => {
    const handler = createChatMessageHandler()
    const input = makeChatInput()
    const longText = "# My Project Idea\n\n## Overview\n\nI think we should build something amazing that changes the world."
    const output = makeChatOutput([textPart(longText)])

    await handler(input, output)

    expect(output.parts[0].text).toBe(longText)
    expect(output.parts[0].synthetic).toBeUndefined()
  })

  it("skips text parts without H2 sections even if they start with # slash", async () => {
    const handler = createChatMessageHandler()
    const input = makeChatInput()
    const longText = "# /commit\n\n" + "Just a single command reference. " + "No subsections. ".repeat(5)
    const output = makeChatOutput([textPart(longText)])

    await handler(input, output)

    expect(output.parts[0].text).toBe(longText)
  })

  it("skips parts already marked as synthetic", async () => {
    const handler = createChatMessageHandler()
    const input = makeChatInput()
    const output = makeChatOutput([
      textPart("# /save\n\n## Task\n\nDo it.", { synthetic: true }),
    ])

    await handler(input, output)

    expect(output.parts[0].text).toBe("# /save\n\n## Task\n\nDo it.")
    expect(output.parts[0].synthetic).toBe(true)
  })

  it("skips non-text parts", async () => {
    const handler = createChatMessageHandler()
    const input = makeChatInput()
    const output = makeChatOutput([
      { type: "file", url: "file:///test.txt", filename: "test.txt", mime: "text/plain" } as any,
    ])

    await handler(input, output)

    expect(output.parts[0].type).toBe("file")
  })

  it("handles mixed parts: suppresses templates, leaves others", async () => {
    const handler = createChatMessageHandler()
    const input = makeChatInput()
    const output = makeChatOutput([
      textPart("Brief user message"),
      textPart("# /retro - Retrospective\n\nAnalyze session.\n\n## Step 1\n\nGather data.\n\n## Step 2\n\nExtract learnings."),
      textPart("Another short message"),
    ])

    await handler(input, output)

    expect(output.parts[0].text).toBe("Brief user message")
    expect(output.parts[1].text).toBe("[Command: /retro - Retrospective]")
    expect(output.parts[1].synthetic).toBe(true)
    expect(output.parts[2].text).toBe("Another short message")
  })

  it("logs via client when provided", async () => {
    const mockClient = createMockClient()
    const handler = createChatMessageHandler(mockClient)
    const input = makeChatInput()
    const output = makeChatOutput([
      textPart("# /todo - Scan\n\n## Step 1\n\nScan repos.\n\n## Step 2\n\nReport.", {
        id: "p1",
        messageID: "m1",
      }),
    ])

    await handler(input, output)

    expect(mockClient.logs).toHaveLength(1)
    expect(mockClient.logs[0]).toMatchObject({
      service: "hush",
      level: "info",
      message: expect.stringContaining("/todo - Scan"),
      extra: {
        heading: "/todo - Scan",
        textLength: expect.any(Number),
      },
    })
  })

  it("does not log when client is undefined", async () => {
    const handler = createChatMessageHandler()
    const input = makeChatInput()
    const output = makeChatOutput([
      textPart("# /commit\n\n## Steps\n\nStage all tracked changes and create a commit with a descriptive message."),
    ])

    // Should not throw -- just silently skip logging
    await handler(input, output)

    expect(output.parts[0].text).toBe("[Command: /commit]")
  })
})