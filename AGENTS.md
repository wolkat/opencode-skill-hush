# opencode-skill-hush

OpenCode plugin that suppresses verbose skill content and command template display in the TUI.

## Structure

- `src/index.ts` -- Plugin entry point, exports `ContentHushPlugin`
- `src/hooks/skill.ts` -- `tool.execute.after` handler for skill tool
- `src/hooks/command.ts` -- `command.execute.before` handler for commands
- `src/hooks/__tests__/` -- Unit tests (vitest)

## Getting Started

```bash
npm install
npm run typecheck
npm test
```

## Publishing

```bash
npm run prepublishOnly
npm publish
```

## Commands

- `npm run typecheck` -- Run TypeScript type checking
- `npm test` -- Run vitest unit tests
- `npm run build` -- Compile TypeScript to `dist/`
