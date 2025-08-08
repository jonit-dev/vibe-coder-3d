# Core Module Guidelines

**Purpose**: Core game engine functionality and ECS (Entity Component System) architecture.

**Key Principles**:

- Pure engine logic - no UI dependencies
- Favor composition over inheritance
- Stateless utilities where possible
- Performance-critical code optimized

**Structure**:

- `lib/ecs/` - Entity Component System implementation
- `components/` - Core game components (cameras, lighting, physics)
- `engine/` - Core engine systems and initialization
- `state/` - Global state management
- `systems/` - Game systems (rendering, physics, etc.)
- `types/` - Core type definitions
- `hooks/` - Engine-specific React hooks

**Naming Conventions**:

- Components: `XxxComponent.ts`
- Systems: `XxxSystem.ts`
- Hooks: `useXxx.ts`
- Types: `IXxx.ts` for interfaces

**Dependencies**:

- No editor dependencies
- React hooks for state integration only
- Three.js for 3D operations
