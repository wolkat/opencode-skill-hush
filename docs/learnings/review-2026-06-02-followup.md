# Code Review: opencode-skill-hush (Follow-Up)

**Date:** 2026-06-02
**Files:** src/index.ts, src/hooks/chat.ts, src/hooks/command.ts, src/hooks/skill.ts, src/hooks/__tests__/*.test.ts, README.md, AGENTS.md, package.json, tsconfig.json
**Focus:** all (security, performance, correctness, maintainability)
**Base:** HEAD d332501 + uncommitted working directory changes
**LOC:** 145 source / 224 test / 369 total (at HEAD)

## Context

This review re-examines the codebase after the initial review (review-2026-06-02.md). The working directory contains uncommitted fixes for 4 of the original 10 findings. This report assesses both the committed state and the uncommitted working directory state, identifies remaining defects, and flags new issues introduced by the partial fixes.

## Repair Verification

Findings from review-2026-06-02.md and their current status:

| # | Original Finding | Status |
|---|------------------|--------|
| 1 | CRITICAL: Stale docs omit chat.message hook | **PARTIALLY FIXED** in working tree (see Finding 1 below) |
| 2 | CRITICAL: as any in production code | **FIXED** in working tree (not committed) |
| 3 | MEDIUM: Silent .catch(() => {}) | **FIXED** in working tree (not committed) |
| 4 | MEDIUM: isCommandTemplate false-positive risk | **NOT ADDRESSED** (see Finding 4) |
| 5 | MEDIUM: Unconditional computation when client undefined | **NOT ADDRESSED** (see Finding 5) |
| 6 | MEDIUM: Zero test coverage for client logging | **NOT ADDRESSED** (see Finding 6) |
| 7 | MEDIUM: README local plugin references src/index.ts | **FIXED** in working tree (not committed) |
| 8 | LOW: Pervasive as any in tests | **NOT ADDRESSED** (see Finding 8) |
| 9 | LOW: Inconsistent Part construction | **NOT ADDRESSED** (see Finding 9) |
| 10 | LOW: argsPreview logs user command arguments | **NOT ADDRESSED** (see Finding 10) |

---

## Findings

### [CRITICAL] Incomplete fix: README still says "Two hooks" while table lists three

- **File:** README.md:110 (working tree)
- **Issue:** The previous review noted that the README and AGENTS.md omitted the chat.message hook. The working tree adds chat.ts to the Structure section and the How it Works table, BUT the header text still reads "Two hooks, one plugin:" while three hooks are listed below. Anyone scanning the docs will read "Two hooks" and count two in the table column, or worse, assume the third row is an addendum.
- **Fix:** Change "Two hooks, one plugin:" to "Three hooks, one plugin:"

### [CRITICAL] command.ts creates Part with empty string IDs

- **File:** src/hooks/command.ts:31-37 (both HEAD and working tree)
- **Issue:** The command handler constructs a replacement Part with `id: ""` and `messageID: ""`. The `TextPart` type defines these as required `string` fields used for part identity and message correlation. Empty string IDs violate the semantic contract:
  1. **React key collisions:** If two commands fire in the same session, both parts get `key=""`, causing React reconciliation failures.
  2. **Part lookup failures:** If the TUI tries to locate a part by ID (for updates, streaming, or delta merging), `""` will never match a real part.
  3. **Message correlation breakage:** `messageID: ""` severs the parent-child link between the Part and its Message, making the replacement part appear orphaned.
  
  The chat handler (chat.ts) correctly preserves these fields via spread (`...part`), but the command handler discards them. This is a correctness defect, not just an inconsistency.

- **Fix:** Preserve the original metadata where available, or generate unique IDs:
  ```typescript
  output.parts.push({
    ...output.parts[0] ?? {},
    id: crypto.randomUUID(),
    sessionID: input.sessionID,
    messageID: output.parts[0]?.messageID ?? "",
    type: "text",
    text: "[Command: " + input.command + "]",
    synthetic: true,
  } satisfies TextPart)
  ```

### [MEDIUM] Uncommitted review fixes in working directory

- **File:** src/hooks/chat.ts, src/hooks/command.ts, README.md, AGENTS.md (working tree diff)
- **Issue:** Four findings from the initial review (CRITICAL #2 as-any, MEDIUM #3 silent catch, MEDIUM #7 README src ref, partial #1 docs) have been fixed in the working directory but NOT committed. The published npm package and anyone cloning HEAD will get the old code with `as any`, silent `.catch(() => {})`, and incomplete documentation. These fixes are invisible outside this working tree.
- **Fix:** Commit the working directory changes. The fixes are correct and should not remain uncommitted.

### [MEDIUM] isCommandTemplate heuristic still has false-positive risk on user markdown

- **File:** src/hooks/chat.ts:6-12 (both HEAD and working tree)
- **Issue:** The detection heuristic requires text >= 50 chars, starts with an H1 (`# heading`), and contains an H2 (`## subheading`). This matches any markdown with H1+H2 structure, including legitimate user messages. A user writing "# My Project Idea\n\n## Overview\n\nI think we should..." (>=50 chars) will see their message silently replaced with "[Command: My Project Idea]". There is no escape mechanism, no allowlist, and no per-command opt-out.
- **Fix:** Tighten the heuristic. Options: (1) require the H1 to start with `/` (command prefix), (2) check for `<skill_content>` tags in the body, (3) add a `blockCommands`/`allowCommands` config option, or (4) require the first H2 to match a known command section pattern.

### [MEDIUM] Unconditional string processing when client is undefined

- **File:** src/hooks/command.ts:8-12 (working tree)
- **Issue:** `beforeLen` and `beforePreview` are always computed even when `client` is `undefined` and the `client?.app?.log()` call short-circuits to `undefined`. In tests, `createCommandBeforeHandler()` is called without a client, so this string processing (filter + map + join) runs purely to be discarded. The intent is unclear -- a reader must trace the optional chain to understand the dead code path.
- **Fix:** Guard the computation:
  ```typescript
  if (client) {
    const beforeLen = output.parts.length
    const beforePreview = output.parts.filter(...)
    client.app.log({...}).catch(...)
  }
  ```

### [MEDIUM] Zero test coverage for client logging paths

- **File:** src/hooks/__tests__/command.test.ts, src/hooks/__tests__/chat.test.ts
- **Issue:** All tests across both files call handlers without a `client` parameter. The `client?.app?.log()` code path is never exercised by tests. Any bug in log payload structure, method invocation, or error handling will not be caught.
- **Fix:** Add at least one test per handler that passes a mock `client` with a spy on `app.log()`, verifying the log call is made with the expected payload shape.

### [MEDIUM] Triple extractHeading computation in hot path

- **File:** src/hooks/chat.ts:33-37, 45 (working tree)
- **Issue:** When a command template is detected, `extractHeading(part.text)` is called three times: once in the log message string, once in the `extra.heading` field, and once in the replacement text. Each call performs `text.split("\\n")[0].replace(/^#\\s+/, "").trim()`. While the overhead is negligible for any single call, the pattern suggests the result should be computed once and reused.
- **Fix:** Cache the heading:
  ```typescript
  const heading = extractHeading(part.text)
  // use heading variable in all three locations
  ```

### [LOW] Type-unsafe options cast in plugin entry point

- **File:** src/index.ts:17 (both HEAD and working tree)
- **Issue:** `(options as ContentHushOptions ?? {})` casts `Record<string, unknown>` to `ContentHushOptions` with no runtime validation. A typo like `{suppressSkils: true}` silently falls through to defaults. The Plugin SDK provides no option validation mechanism, so this is a broader SDK issue, but the plugin could add its own validation.
- **Fix:** Parse options with explicit checks or use a schema validator (zod is already a transitive dependency via the plugin SDK). For a minimal fix, add runtime type guards:
  ```typescript
  const raw = options ?? {}
  const opts: Required<ContentHushOptions> = {
    suppressSkills: typeof raw.suppressSkills === 'boolean' ? raw.suppressSkills : true,
    suppressCommands: typeof raw.suppressCommands === 'boolean' ? raw.suppressCommands : true,
    showLineCount: typeof raw.showLineCount === 'boolean' ? raw.showLineCount : false,
  }
  ```

### [LOW] Pervasive as any in test files weakens type contract testing

- **File:** All 3 test files (21 `as any` occurrences total, unchanged in working tree)
- **Issue:** Every handler invocation uses `input as any, output as any`. If the OpenCode plugin API changes the shape of input or output (renaming `args`, removing `parts`, etc.), the tests will still compile and pass with stale shapes, giving false confidence.
- **Fix:** Create typed test fixtures that satisfy the actual hook interfaces. Use `satisfies` or explicit type annotations so mismatches surface at test-authoring time.

### [LOW] Inconsistent Part construction between command and chat handlers

- **File:** src/hooks/command.ts:31-37 vs src/hooks/chat.ts:43-47 (working tree)
- **Issue:** The command handler constructs a Part from scratch with empty `id` and `messageID`, while the chat handler spreads the original part and overrides only `text` and `synthetic`. This inconsistency means the command handler discards all original metadata (including valid IDs), while the chat handler preserves it. The Part with empty IDs is not just inconsistent but functionally defective (see CRITICAL finding above).
- **Fix:** Adopt the spread pattern for both handlers. Construct replacement parts by spreading the original and overriding only changed fields.

### [LOW] argsPreview logs user command arguments at info level

- **File:** src/hooks/command.ts:21 (both HEAD and working tree)
- **Issue:** The log payload includes `argsPreview: (input.arguments ?? "").slice(0, 60)`, capturing the first 60 characters of whatever the user typed after a slash command. This could contain sensitive content (passwords, tokens, private messages) persisted in logs.
- **Fix:** Remove `argsPreview` from the log payload or restrict it to `debug` level. The command name (`input.command`) already provides sufficient context for suppression verification.

## Summary

- 2 critical, 5 medium, 4 low findings
- 4 findings from the original review remain uncommitted in the working directory
- 1 new critical finding (empty string Part IDs) not identified in the original review
- The "Two hooks" text in README was not updated alongside the table -- a partial fix that introduced a new inconsistency

### Finding Distribution

| Severity | Count | New This Review |
|----------|-------|-----------------|
| CRITICAL | 2     | 1 (empty Part IDs) |
| MEDIUM   | 5     | 2 (triple computation, uncommitted fixes) |
| LOW      | 4     | 1 (type-unsafe options cast) |

### Resolution Priority

1. **Commit working directory fixes** -- The as-any, silent-catch, and doc fixes are correct and should be committed immediately
2. **Fix empty Part IDs in command handler** -- Use the spread pattern or generate unique IDs
3. **Update "Two hooks" -> "Three hooks" in README** -- One-line text fix
4. **Tighten isCommandTemplate heuristic** -- Add `/` prefix or `<skill_content>` tag requirement
5. **Add client logging test coverage** -- Mock client in at least one test per handler
6. **Guard unconditional computation** -- Wrap log preparation in `if (client)` block