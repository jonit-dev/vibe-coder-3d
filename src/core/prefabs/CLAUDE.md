# Prefabs System Guidelines

**Architecture Overview**:

The Prefabs System provides Unity-like prefab functionality for reusable, configurable game object templates with full serialization and runtime instantiation support.

**Core Components**:

- `PrefabRegistry`: Central registry for prefab management and discovery
- `PrefabManager`: Runtime instantiation and lifecycle management
- `PrefabSerializer`: Complete serialization/deserialization with dependency resolution
- `PrefabApplier`: Runtime override application and variant creation
- `PrefabPool`: Efficient instance pooling for performance

**Key Features**:

- **Nested Prefabs**: Support for complex prefab hierarchies
- **Property Overrides**: Runtime and editor-based property modifications
- **Variant System**: Create specialized versions of base prefabs
- **Instance Tracking**: Monitor and update all prefab instances
- **Serialization**: Full scene serialization with dependency management

**Integration Points**:

- **ECS Integration**: Prefab instances tracked as ECS entities
- **Asset Pipeline**: Prefabs referenced in asset manifests
- **Editor Integration**: Visual prefab authoring and management
- **Scene System**: Seamless scene integration and loading

**Usage Patterns**:

```typescript
// Runtime prefab instantiation
const playerInstance = prefabManager.instantiate('PlayerCharacter', {
  position: [0, 0, 0],
  overrides: [
    { targetPath: 'Transform.position.y', value: 5 },
    { targetPath: 'MeshRenderer.materialId', value: 'CustomMaterial' },
  ],
});

// Editor prefab creation
const prefab = prefabRegistry.create({
  name: 'Enemy',
  rootEntity: enemyEntity,
  overrides: [],
  metadata: {
    category: 'characters',
    tags: ['enemy', 'ai'],
    usage: 'character',
  },
});
```

**Performance Considerations**:

- Instance pooling prevents frequent allocation/deallocation
- Lazy loading of prefab dependencies
- Efficient hierarchy traversal for nested prefabs
- Memory management with WeakMap-based instance tracking

**Override System**:

- **Property Overrides**: Modify specific component properties
- **Component Overrides**: Add, remove, or modify components
- **Entity Overrides**: Modify entity hierarchy structure
- **Nested Overrides**: Support for deeply nested prefab modifications

**Testing Strategy**:

- Unit tests for all core components
- Integration tests for complex prefab hierarchies
- Performance tests for large numbers of instances
- Serialization round-trip validation
- Override application verification

**See Also**: [Prefabs System Architecture](../../../docs/architecture/2-25-prefabs-system.md)
