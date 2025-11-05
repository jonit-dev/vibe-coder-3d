## Most Critical Rule

- Don't trust, verify. Whenever you finish your code, add tests to prove it works or sping the `visual-debugger` agent to actually visualize the changes. If changes are only visible sequentially, feel free to take screenshots and analize differences.
- Only stop your iterations when related tests are PASSING and the visual debugger shows expected results.

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
- Dont immediately jump into problems. Gather context first by reading related files until you understand the problem.
- Always consider performance implications of your changes.
- Don't request approval—just do it.
- Named exports only; no barrel `index.ts`.
- Declare components inline: `export const …`.
- Don't run `yarn dev`; ask me to.
- Prefix interfaces with I
- Favor using Zod
- Use zustand for state management
- Unless explicitly oriented, do not keep deprecated code or write legacy versions of it. Just cleanup.

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

---

## Development & Debugging Workflow

### Running Scenes

**TypeScript Editor (Web):**

```bash
yarn dev  # Starts at http://localhost:5173
# Scenes auto-load from localStorage or default scene
# Scenes located in: src/game/scenes/*.tsx
```

**Rust Engine (Native):**

```bash
# Basic run
yarn rust:engine --scene testphysics

# With debug mode (colliders, FPS, grid)
yarn rust:engine --scene testphysics --debug

# Custom window size
yarn rust:engine --scene testphysics --width 1920 --height 1080

# Scenes located in: rust/game/scenes/tests/*.json
```

### Debugging Tools

**TypeScript Editor:**

- **Status Bar** (bottom): FPS, memory, entity count, script perf, triangle budget, LOD quality
- **Debug Section** (inspector): Entity/component details, real-time property editing
- **Logger**: Use `Logger.create('Name')` for structured logging (see Logging Guidelines)
- **Browser DevTools**: Full log output in dev mode, filtered in production

**Rust Engine Debug Mode:**

```bash
yarn rust:engine --scene testphysics --debug
```

- **F1**: Toggle HUD (FPS, frame time, physics stats, GPU timings)
- **F2**: Toggle collider gizmos (yellow outlines)
- **F3**: Toggle debug camera (orbital controller)
- **F4**: Toggle GPU profiler
- Ground grid and axes visualization
- Verbose logging: `RUST_LOG=debug yarn rust:engine --scene testphysics`
- Stack traces: `RUST_BACKTRACE=1 yarn rust:engine --scene testphysics`

**Editor Keyboard Shortcuts:**

- **Ctrl+N**: Add Object
- **Ctrl+S**: Save Scene (saves both .tsx and .json)
- **Ctrl+/**: Toggle Chat
- **Delete**: Delete Selected

### Taking Screenshots

```bash
# Basic screenshot (saves to rust/engine/screenshots/<scene>.jpg)
yarn rust:screenshot --scene testphysics

# Custom path and quality
cargo run -- --scene testphysics --screenshot \
  --screenshot_path output/test.jpg \
  --screenshot_quality 85 \
  --screenshot_scale 0.8
```

### Common Debugging Workflows

**Debug Physics:**

```bash
yarn rust:engine --scene testphysics --debug
# Press F2 for colliders, F3 for orbit cam, F1 for stats
```

**Debug Scripts:**

```bash
RUST_LOG=debug yarn rust:engine --scene testscripting --verbose
# Scripts: rust/game/scripts/tests/*.lua
```

**Debug Rendering:**

```bash
yarn rust:screenshot --scene testmaterials  # Capture state
yarn rust:engine --scene testmaterials --debug  # F4 for GPU timings
```

**Performance Profiling:**

```bash
yarn rust:engine --scene testphysics --debug
# F1: FPS/frame time, F4: GPU breakdown
# Monitor triangle count in TS editor status bar
```

### Quick Development Cycle

```bash
# 1. Start editor
yarn dev

# 2. Edit scene in browser, save with Ctrl+S
#    → Saves to src/game/scenes/<name>.tsx (compressed)
#    → Also saves to rust/game/scenes/tests/<name>.json (full dump)

# 3. Test in Rust engine
yarn rust:engine --scene <name> --debug

# 4. Iterate on Rust code
cd rust/engine && cargo check  # Fast error check
yarn rust:build                # Incremental build (1-5s)
yarn rust:engine --scene <name>

# 5. Code quality
yarn lint && yarn typecheck    # TypeScript
cd rust/engine && cargo clippy && cargo fmt  # Rust
```

### Key File Locations

- **TypeScript scenes**: `src/game/scenes/*.tsx` (compressed, for editor)
- **Rust scenes**: `rust/game/scenes/tests/*.json` (full, for engine)
- **Lua scripts**: `rust/game/scripts/*.lua` (production), `rust/game/scripts/tests/*.lua` (tests)
- **Screenshots**: `rust/engine/screenshots/`
- **Docs**: `docs/` (see `docs/0-navigation.md`)
- **Rust README**: `rust/engine/README.md`
- **Debug Mode PRD**: `docs/PRDs/rust/rust-debug-mode-prd.md`
