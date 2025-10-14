# vibe-scene

Stable scene model providing typed entity/component abstractions.

## Purpose

This crate defines the core scene data model that is:

- **Stable**: EntityId and ComponentKindId won't change across refactors
- **Serializable**: Full serde support for JSON scene loading
- **Query-friendly**: Methods for finding entities and components
- **Three.js compatible**: Preserves camelCase field names for JS interop

## Key Types

### EntityId

Stable 64-bit entity identifier derived from `persistentId` strings via hashing.

```rust
let id = EntityId::from_persistent_id("entity-123");
```

### ComponentKindId

String-based component type identifier.

```rust
let kind = ComponentKindId::new("Transform");
```

### Scene

Top-level scene container with metadata, entities, materials, etc.

```rust
let scene: Scene = serde_json::from_str(json)?;
let entity = scene.find_entity_by_persistent_id("player")?;
```

### Entity

Individual entity with components stored as `HashMap<String, Value>`.

```rust
let transform: Transform = entity.get_component("Transform")?;
```

## Design Decisions

### Why hash persistentId into u64?

- Provides stable numeric IDs for indexing and lookups
- Avoids string comparisons in hot paths
- Same persistent ID always produces same EntityId

### Why keep camelCase fields?

- Maintains 1:1 compatibility with TypeScript JSON exports
- Avoids serde rename complexity
- Rust warnings are acceptable for interop

### Why store components as JSON Value?

- Flexible - unknown components don't break parsing
- Decoders handle typed extraction on-demand
- Preserves extensibility for editor features

## Test Coverage

All public APIs have unit tests:

- EntityId hashing and equality
- Entity component access (has/get)
- Scene queries by ID and component type
- Round-trip serialization

Run tests:

```bash
cargo test -p vibe-scene
```

## Future Extensions

- Index entities by component type for faster queries
- Component versioning for migration
- Diff/patch support for live updates
