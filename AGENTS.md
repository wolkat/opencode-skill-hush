# opencode-skill-hush

OpenCode plugin that suppresses verbose skill content and command template display in the TUI.

## Structure

- `src/index.ts` -- Plugin entry point, exports `ContentHushPlugin`
- `src/hooks/skill.ts` -- `tool.execute.after` handler for skill tool
- `src/hooks/command.ts` -- `command.execute.before` handler for commands
- `src/hooks/chat.ts` -- `chat.message` handler for command templates arriving via chat
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
- `npm run test:watch` -- Run vitest in watch mode
- `npm run build` -- Compile TypeScript to `dist/`

## Constraints

- Vitest must stay on `^1.6.1` (not ^4.x) to match the installed version; mismatches break npm imports.
