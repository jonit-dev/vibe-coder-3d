# Core Library Guidelines

**Purpose**: Foundational utilities and ECS system implementation.

**Key Files**:

- `ecs/` - Complete ECS architecture
- Core utilities and helpers
- Low-level engine abstractions

**ECS Guidelines**:

- Components are pure data containers
- Systems contain all logic
- Entities are lightweight identifiers
- Use ComponentRegistry for type safety

**Performance Notes**:

- Hot paths should be optimized
- Avoid allocations in render loops
- Use object pools where beneficial

**Testing**:

- Unit tests required for all utilities
- ECS system integration tests critical
