# Game Module Guidelines

**Purpose**: Game-specific content, assets, and runtime systems.

**Structure**:

- `assets/` - Game assets (models, textures, audio, skyboxes)
- `components/` - Game-specific components
- `config/` - Game configuration and asset definitions
- `prefabs/` - Reusable entity templates
- `scenes/` - Game scene definitions
- `scripts/` - Game logic scripts
- `systems/` - Game-specific systems

**Asset Management**:

- Organize assets by type in dedicated folders
- Use descriptive naming conventions
- Include metadata for asset optimization
- Support for GLB/GLTF models with animations

**Game Components**:

- Extend core ECS components with game-specific behavior
- Keep components data-only, logic in systems
- Use Zod schemas for validation
- Support serialization for save/load

**Performance**:

- Asset streaming and LOD systems
- Efficient memory management
- Frame rate optimization
- Resource cleanup on scene transitions
