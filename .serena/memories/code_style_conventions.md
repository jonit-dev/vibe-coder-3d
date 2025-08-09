# Code Style and Conventions

## TypeScript Path Aliases

Always use TypeScript path aliases as defined in tsconfig.json:

- `@/*` maps to `src/*`
- `@core/*` maps to `src/core/*`
- `@editor/*` maps to `src/editor/*`

## Component Conventions

- **Named exports only**: Use `export const ComponentName = ...` - no default exports
- **No barrel index.ts files**: Import directly from source files
- **Interface prefixes**: All interfaces must be prefixed with 'I' (e.g., `IButtonProps`)
- **Inline component declarations**: Declare components inline with export const pattern

## React Patterns

- Use functional components with hooks
- Keep components small and extract logic into custom hooks
- Focus on preventing unnecessary re-rendering
- Use React.memo, useMemo, useCallback when appropriate

## Architecture Principles

- Follow Single Responsibility Principle (SRP)
- Don't Repeat Yourself (DRY)
- Keep It Simple Stupid (KISS)
- Favor Zod for schema validation when applicable

## Styling

- Use Tailwind CSS for all styling
- Follow existing naming and folder conventions

## ECS Component Patterns

- Use ComponentFactory.create() for component definitions
- Implement proper BitECS field mappings for performance
- Use event-driven system integration (avoid polling)
- Use Manager Components for Three.js/external system integration
- Follow complete ECS integration pipeline

## File Organization

- Never create unnecessary files - only create what's essential
- Always prefer editing existing files over creating new ones
- Respect existing naming and folder conventions
