# Codebase Structure

## Root Structure

```
├── src/
├── public/
├── docs/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── eslint.config.js
```

## Main Source Structure (src/)

### Core Engine (`src/core/`)

- **hooks/** - Core engine hooks (useAudio, useEntity, useEvent, etc.)
- **lib/ecs/** - Entity Component System implementation
  - **components/** - ECS component definitions and registry
  - **components/definitions/** - Individual component definitions
- **systems/** - ECS systems (transform, camera, light, material)
- **components/** - Core engine React components
- **state/** - Global state management (Zustand stores)
- **types/** - Core TypeScript type definitions

### Editor (`src/editor/`)

- **components/** - Editor UI components
  - **panels/** - Main editor panels (Viewport, Inspector, Hierarchy)
  - **shared/** - Reusable UI components
  - **inspector/** - Inspector-specific components
    - **adapters/** - Bridge ECS data to UI components
    - **sections/** - UI sections for component editing
  - **menus/** - Dropdown and context menus
- **hooks/** - Editor-specific hooks
- **store/** - Editor state management

### Key Files

- **ComponentRegistry.ts** - Central ECS component registration system
- **ComponentDefinitions.ts** - All component definitions and registration
- **IComponent.ts** - Component type definitions and KnownComponentTypes enum
- **AddComponentMenu.tsx** - Component addition interface

## Integration Patterns

### ECS Component Integration

1. Create component definition in `src/core/lib/ecs/components/definitions/`
2. Register in `ComponentDefinitions.ts`
3. Add to `KnownComponentTypes` enum in `IComponent.ts`
4. Create UI adapter in `src/editor/components/inspector/adapters/`
5. Create UI section in appropriate panel folder
6. Update `useEntityComponents.ts` for convenience methods

### UI Component Patterns

- Place in appropriate `src/editor/components/` subfolder
- Use TypeScript path aliases for imports
- Follow naming conventions and SRP principles
- Extract logic to custom hooks when appropriate
