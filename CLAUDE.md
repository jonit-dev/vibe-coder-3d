**Rules**

- Import via TS path aliases (see tsconfig).
- Yarn only; Tailwind for CSS.
- Stick to SRP / DRY / KISS principles
- Prefix interfaces with `I`.
- Keep components small; put logic in hooks.
- Respect naming/folder conventions; explore code when unsure.
- use tree command to explore the codebase
- Do not generate .backup files.

**Critical**

- React: focus on hook usage + prevent re-rendering
- Don't request approval—just do it.
- Named exports only; no barrel `index.ts`.
- Declare components inline: `export const …`.
- Don't run `yarn dev`; ask me to.
- Prefix interfaces with I
- Favor using Zod
- Use zustand for state management

**Technical Debt Prevention**

- NO console.log/warn/error in production code - use @core/lib/logger instead
- NO singleton pattern - use dependency injection or React context
- Components MUST be <200 lines - split if larger
- ALWAYS use proper TypeScript types - no `any` types
- Error handling MUST be consistent with try-catch patterns
- React components MUST use React.memo for expensive renders
- useEffect dependencies MUST be minimal and specific

**Logging Guidelines**

- Use structured logging via @core/lib/logger: `const logger = Logger.create('ComponentName')`
- Replace console.log with logger.debug(), console.warn with logger.warn(), console.error with logger.error()
- Example: `logger.info('Scene loaded', { entities: entityCount, materials: materialCount })`
- Logger automatically handles production filtering and structured output
- Use namespaces to organize logs by module/component

**Documentation**

- When discovering important patterns, architectural decisions, or learnings during development, document them in nested folder CLAUDE.md files
- Update existing nested CLAUDE.md files when new insights are gained about that area of the codebase
- Keep documentation focused on implementation details, gotchas, and architectural decisions specific to that folder/module
