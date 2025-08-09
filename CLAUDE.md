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
- Don’t request approval—just do it.
- Named exports only; no barrel `index.ts`.
- Declare components inline: `export const …`.
- Don’t run `yarn dev`; ask me to.
- Prefix interfaces with I
- Favor using Zod
