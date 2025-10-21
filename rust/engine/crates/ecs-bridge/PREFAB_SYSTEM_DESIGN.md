# Prefab Instantiation System Design

## Overview

Implement prefab instantiation in the Rust engine to support entity templates and reusable scene hierarchies.

## Architecture

### 1. Data Structures

#### PrefabEntity (Recursive Structure)

```rust
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct PrefabEntity {
    pub name: String,
    pub components: HashMap<String, Value>,
    #[serde(default)]
    pub children: Vec<PrefabEntity>,
}
```

**Purpose**: Represents a single entity in a prefab hierarchy with nested children.

#### PrefabDefinition

```rust
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct PrefabDefinition {
    pub id: String,
    pub name: String,
    #[serde(default = "default_version")]
    pub version: u32,
    pub root: PrefabEntity,
    #[serde(default)]
    pub metadata: HashMap<String, Value>,
    #[serde(default)]
    pub dependencies: Vec<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub description: Option<String>,
}
```

**Purpose**: Complete prefab template definition matching TypeScript schema.

#### PrefabRegistry

```rust
pub struct PrefabRegistry {
    prefabs: HashMap<String, PrefabDefinition>,
}

impl PrefabRegistry {
    pub fn new() -> Self;
    pub fn register(&mut self, prefab: PrefabDefinition);
    pub fn get(&self, prefab_id: &str) -> Option<&PrefabDefinition>;
    pub fn has(&self, prefab_id: &str) -> bool;
    pub fn list(&self) -> Vec<&PrefabDefinition>;
}
```

**Purpose**: In-memory storage for prefab templates loaded from scene.

### 2. Instantiation Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│ Scene Loading                                               │
│ 1. Parse scene.prefabs → PrefabDefinition[]                │
│ 2. Register prefabs in PrefabRegistry                       │
│ 3. Load regular entities                                    │
│ 4. For each entity with PrefabInstance:                     │
│    a. Look up prefab in registry                           │
│    b. Instantiate prefab entities                          │
│    c. Apply override patches                                │
│    d. Add to scene                                          │
└─────────────────────────────────────────────────────────────┘
```

### 3. Key Functions

#### parse_prefabs

```rust
pub fn parse_prefabs(prefabs_value: &Value) -> Result<Vec<PrefabDefinition>>
```

**Input**: `scene.prefabs` JSON value (array of prefab definitions)
**Output**: Vector of `PrefabDefinition`
**Error Handling**: Skip invalid prefabs with warnings, continue loading

#### instantiate_prefab

```rust
pub fn instantiate_prefab(
    prefab: &PrefabDefinition,
    parent_id: Option<String>,
    override_patch: Option<&Value>,
    scene: &mut Scene,
    registry: &ComponentRegistry,
) -> Result<Vec<Entity>>
```

**Purpose**: Clone entities from prefab template, apply overrides, add to scene

**Steps**:

1. Clone `prefab.root` entity tree
2. Generate new entity IDs and persistent IDs
3. Apply override patch (if provided) using JSON merge
4. Decode components using ComponentRegistry
5. Set parent-child relationships (parentPersistentId)
6. Return instantiated entities

#### apply_override_patch

```rust
pub fn apply_override_patch(
    entity: &mut PrefabEntity,
    patch: &Value,
) -> Result<()>
```

**Purpose**: Merge override patch into entity components

**Algorithm**:

```
For each key in patch:
  If key matches component name:
    Deep merge patch value into component
  If key is "children":
    Recursively apply patches to child entities by index
```

**Example**:

```json
// Original entity
{
  "name": "Cube",
  "components": {
    "Transform": { "scale": [1, 1, 1] },
    "MeshRenderer": { "materialId": "default" }
  }
}

// Override patch
{
  "Transform": { "scale": [2, 2, 2] },
  "MeshRenderer": { "materialId": "red" }
}

// Result
{
  "name": "Cube",
  "components": {
    "Transform": { "scale": [2, 2, 2] },  // ✅ Overridden
    "MeshRenderer": { "materialId": "red" }  // ✅ Overridden
  }
}
```

### 4. Integration Points

#### Scene Loader (threed_renderer.rs or scene_loader.rs)

```rust
// 1. Load prefabs early in scene loading
if let Some(prefabs_value) = &scene.prefabs {
    let prefab_definitions = parse_prefabs(prefabs_value)?;
    let mut prefab_registry = PrefabRegistry::new();
    for prefab in prefab_definitions {
        prefab_registry.register(prefab);
    }
}

// 2. Process PrefabInstance components after loading entities
for entity in &scene.entities {
    if let Some(prefab_instance) = get_component::<PrefabInstance>(entity, "PrefabInstance", &registry) {
        let prefab = prefab_registry.get(&prefab_instance.prefabId)
            .ok_or_else(|| anyhow!("Prefab not found: {}", prefab_instance.prefabId))?;

        let instances = instantiate_prefab(
            prefab,
            entity.persistent_id.clone(),
            prefab_instance.overridePatch.as_ref(),
            &mut scene,
            &registry,
        )?;

        // Add instantiated entities to scene
        scene.entities.extend(instances);
    }
}
```

### 5. Coordinate System

**Prefab Entity Transforms**:

- Prefab entities have local transforms relative to parent
- Instantiated entities inherit parent transform from entity with PrefabInstance
- SceneGraph propagates transforms down hierarchy

**Example**:

```
Entity with PrefabInstance
  position: [5, 0, 0]
  ↓ instantiates prefab "tree"
  └─ Trunk (child of instance)
       position: [0, 0, 0]  // Local to parent
       ↓ World position: [5, 0, 0]  // Propagated
     └─ Leaves (child of trunk)
          position: [0, 2, 0]  // Local to parent
          ↓ World position: [5, 2, 0]  // Propagated
```

### 6. Test Cases

#### Test 1: Simple Prefab Instantiation

```json
{
  "prefabs": [
    {
      "id": "simple-cube",
      "name": "Simple Cube",
      "version": 1,
      "root": {
        "name": "Cube",
        "components": {
          "Transform": { "position": [0, 0, 0], "scale": [1, 1, 1] },
          "MeshRenderer": { "meshId": "cube", "materialId": "default" }
        },
        "children": []
      }
    }
  ],
  "entities": [
    {
      "id": 1,
      "name": "Instance 1",
      "components": {
        "Transform": { "position": [2, 0, 0] },
        "PrefabInstance": { "prefabId": "simple-cube" }
      }
    }
  ]
}
```

**Expected Result**: 2 entities total

- Entity 1: Original with PrefabInstance
- Entity 2: Instantiated cube at world position [2, 0, 0] (parent is Entity 1)

#### Test 2: Prefab with Hierarchy

```json
{
  "prefabs": [
    {
      "id": "tree",
      "name": "Tree",
      "version": 1,
      "root": {
        "name": "Trunk",
        "components": {
          "Transform": { "position": [0, 0, 0], "scale": [0.5, 2, 0.5] },
          "MeshRenderer": { "meshId": "cylinder", "materialId": "brown" }
        },
        "children": [
          {
            "name": "Leaves",
            "components": {
              "Transform": { "position": [0, 2, 0], "scale": [2, 2, 2] },
              "MeshRenderer": { "meshId": "sphere", "materialId": "green" }
            },
            "children": []
          }
        ]
      }
    }
  ],
  "entities": [
    {
      "id": 1,
      "name": "Tree Instance",
      "components": {
        "Transform": { "position": [5, 0, 0] },
        "PrefabInstance": { "prefabId": "tree" }
      }
    }
  ]
}
```

**Expected Result**: 3 entities total

- Entity 1: Original with PrefabInstance at [5, 0, 0]
- Entity 2: Trunk (child of Entity 1) at local [0, 0, 0], world [5, 0, 0]
- Entity 3: Leaves (child of Entity 2) at local [0, 2, 0], world [5, 2, 0]

#### Test 3: Override Patch

```json
{
  "prefabs": [
    {
      "id": "colored-cube",
      "name": "Colored Cube",
      "version": 1,
      "root": {
        "name": "Cube",
        "components": {
          "Transform": { "scale": [1, 1, 1] },
          "MeshRenderer": { "meshId": "cube", "materialId": "default" }
        },
        "children": []
      }
    }
  ],
  "entities": [
    {
      "id": 1,
      "name": "Red Cube",
      "components": {
        "Transform": { "position": [0, 0, 0] },
        "PrefabInstance": {
          "prefabId": "colored-cube",
          "overridePatch": {
            "Transform": { "scale": [2, 2, 2] },
            "MeshRenderer": { "materialId": "red" }
          }
        }
      }
    }
  ]
}
```

**Expected Result**:

- Instantiated cube has scale [2, 2, 2] (overridden)
- Instantiated cube has materialId "red" (overridden)

### 7. Error Handling

| Error Condition              | Handling Strategy                               |
| ---------------------------- | ----------------------------------------------- |
| Prefab not found             | Log error, skip instantiation, continue loading |
| Invalid prefab JSON          | Log warning, skip prefab, continue loading      |
| Circular dependencies        | Detect and log error, skip prefab               |
| Missing components           | Use default values, log warning                 |
| Override patch merge failure | Log warning, use original values                |
| Version mismatch             | Log warning, attempt instantiation anyway       |

### 8. Performance Considerations

**Optimizations**:

1. **Lazy Instantiation**: Only instantiate when first referenced
2. **Prefab Caching**: Store prefab registry for entire scene lifetime
3. **Component Cloning**: Use `serde_json::Value::clone()` for cheap deep copies
4. **Batch Processing**: Process all PrefabInstances in single pass

**Memory**:

- Prefab definitions stored once in registry
- Each instance creates new entities (not shared)
- Total memory = prefab definitions + (instances × entity size)

### 9. Future Enhancements

**Phase 2** (Not in initial implementation):

1. **Nested prefabs**: Prefab instances within prefabs
2. **Prefab variants**: Base prefab + variant patches
3. **Prefab pooling**: Reuse entity IDs for dynamic spawning/despawning
4. **Hot reload**: Update instances when prefab definition changes
5. **Prefab dependencies**: Resolve dependency graph
6. **Validation**: Zod-style schema validation for prefabs

### 10. Implementation Checklist

- [ ] Create `PrefabEntity`, `PrefabDefinition` structs in `decoders.rs`
- [ ] Create `PrefabRegistry` in new file `crates/ecs-bridge/src/prefab_registry.rs`
- [ ] Implement `parse_prefabs()` function
- [ ] Implement `instantiate_prefab()` function
- [ ] Implement `apply_override_patch()` using `json_patch` or manual merge
- [ ] Add prefab loading to scene loader
- [ ] Add prefab instantiation pass after entity loading
- [ ] Write unit tests for all functions
- [ ] Create test scenes with prefabs
- [ ] Update INTEGRATION_AUDIT.md when complete

### 11. Dependencies

**Crates**:

- `serde_json`: JSON value manipulation and cloning
- `anyhow`: Error handling
- No new external dependencies needed

**Internal**:

- `vibe-scene`: Entity, Scene types
- `vibe-ecs-bridge`: ComponentRegistry, decoders

### 12. File Structure

```
rust/engine/crates/ecs-bridge/src/
├── lib.rs                  (re-export prefab types)
├── decoders.rs             (add PrefabEntity, PrefabDefinition structs)
├── prefab_registry.rs      (NEW - PrefabRegistry implementation)
└── prefab_instantiator.rs  (NEW - instantiation logic)
```

## Summary

This design provides:

- ✅ Full prefab definition support matching TypeScript schema
- ✅ Entity cloning with hierarchy support
- ✅ Override patch system for customization
- ✅ Integration with existing scene loading pipeline
- ✅ Comprehensive test coverage
- ✅ Error handling and performance optimization
- ✅ Clear implementation checklist

**Estimated Effort**: 15-20 hours
**Complexity**: Medium (recursive structures, JSON manipulation, scene graph integration)
