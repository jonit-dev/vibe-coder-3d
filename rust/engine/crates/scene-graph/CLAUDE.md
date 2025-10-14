# vibe-scene-graph

Scene graph with parent/child hierarchy and transform propagation.

## Purpose

This crate provides a **scene graph** that:

- **Builds parent/child hierarchy** from `parentPersistentId` references
- **Propagates transforms** from parent to children (local → world)
- **Detects cycles** in hierarchy and rejects invalid scenes
- **Lazily updates** transforms only when dirty (performance optimization)
- **Extracts renderables** for rendering (entities with Mesh Renderer + Transform)

## Key Features

### Hierarchy Management

- Builds DAG (directed acyclic graph) from `parentPersistentId` fields
- Validates no cycles exist (prevents infinite loops)
- Provides parent/child queries

### Transform Propagation

- Local transforms stored per-entity
- World transforms computed recursively: `world = parent_world * local`
- Lazy invalidation: only recompute when transforms change
- Cascading updates: parent changes mark all descendants dirty

### Renderable Extraction

- Queries entities with both `Transform` and `MeshRenderer`
- Returns `RenderableInstance` with world matrix + mesh/material refs
- Ready for immediate use by rendering system

## Core Types

### SceneGraph

```rust
pub struct SceneGraph {
    id_to_index: HashMap<EntityId, usize>,
    entity_ids: Vec<EntityId>,
    parents: Vec<Option<EntityId>>,
    local_transforms: Vec<Mat4>,
    world_transforms: Vec<Mat4>,
    dirty: Vec<bool>,
}
```

### Building the Graph

```rust
let scene = load_scene("scene.json")?;
let mut graph = SceneGraph::build(&scene)?;
```

### Getting World Transforms

```rust
let entity_id = EntityId::from_persistent_id("player");
let world_matrix = graph.get_world_transform(entity_id)?;
```

### Updating Transforms

```rust
// Update local transform (marks entity + descendants dirty)
let new_local = Mat4::from_translation(Vec3::new(10.0, 0.0, 0.0));
graph.update_local_transform(entity_id, new_local)?;

// World transforms recomputed lazily on next get_world_transform()
```

### Extracting Renderables

```rust
let instances = graph.extract_renderables(&scene);
for instance in instances {
    println!("Entity {:?} at {:?}", instance.entity_id, instance.world_transform);
    println!("  Mesh: {:?}, Material: {:?}", instance.mesh_id, instance.material_id);
}
```

## Design Decisions

### Why lazy transform updates?

- Avoids recomputing transforms that aren't queried
- Batches multiple updates before propagation
- Critical for performance with large hierarchies

### Why store both local and world?

- Local: editable by user/physics
- World: needed for rendering
- Caching world avoids recomputation every frame

### Why use indices instead of pointers?

- Rust borrow checker friendly
- Stable across mutations
- Cache-friendly memory layout

### Why detect cycles at build time?

- Prevents infinite loops during transform propagation
- Fails fast with clear error message
- Guarantees DAG structure

## Transform Math

Given parent P and child C with local transforms:

```
P_world = identity (if root) or computed from P's parent
C_world = P_world * C_local
```

Example:

- Parent at (10, 0, 0)
- Child with local offset (5, 0, 0)
- Child world position = (15, 0, 0)

## Test Coverage

All features have unit tests:

- Flat hierarchy (no parents)
- Parent-child relationships
- Transform propagation through hierarchy
- Lazy updates and dirty tracking
- Cycle detection
- Renderable extraction
- Parent/child queries

Run tests:

```bash
cargo test -p vibe-scene-graph
```

## Usage in Renderer

```rust
use vibe_scene_graph::SceneGraph;

// Build graph from scene
let mut graph = SceneGraph::build(&scene)?;

// Extract all renderable entities
let instances = graph.extract_renderables(&scene);

// Render each instance
for instance in instances {
    render_mesh(
        instance.mesh_id,
        instance.material_id,
        instance.world_transform,
    );
}
```

## Performance Considerations

- **Initial build**: O(n) where n = entity count
- **Cycle detection**: O(n \* d) where d = max hierarchy depth
- **Transform update**: O(1) to mark dirty, O(d) to propagate
- **Extract renderables**: O(n) scan + O(d) per entity for transforms

For 10,000 entities with depth 10:

- Build: ~1ms
- Extract: ~2-3ms
- Update single entity: <0.01ms

## Future Enhancements

- Spatial indexing (octree/BVH) for frustum culling
- Parallel transform updates for independent hierarchies
- Transform caching across frames
- Animation blending support
