# vibe-ecs-bridge

Component registry and decoders for Three.js ECS integration.

## Purpose

This crate bridges the gap between TypeScript ECS and Rust by:

- **Type-safe decoding**: Convert JSON components to typed Rust structs
- **Capability tracking**: Know which components affect rendering, require passes, etc.
- **Extensible registry**: Easy to add new component decoders
- **Error handling**: Graceful fallback for unknown/malformed components

## Architecture

### IComponentDecoder Trait

All component decoders implement this trait:

```rust
pub trait IComponentDecoder: Send + Sync {
    fn can_decode(&self, kind: &str) -> bool;
    fn decode(&self, value: &Value) -> Result<Box<dyn Any>>;
    fn capabilities(&self) -> ComponentCapabilities;
    fn component_kinds(&self) -> Vec<ComponentKindId>;
}
```

### ComponentRegistry

Central registry for all decoders:

```rust
let mut registry = ComponentRegistry::new();
registry.register(TransformDecoder);
registry.register(CameraDecoder);

let decoded = registry.decode("Transform", &json_value)?;
let transform = decoded.downcast_ref::<Transform>().unwrap();
```

### ComponentCapabilities

Describes what a component does:

```rust
pub struct ComponentCapabilities {
    pub affects_rendering: bool,      // Does it impact visual output?
    pub requires_pass: Option<&'static str>,  // Which render pass?
    pub stable: bool,                 // Is the API stable?
}
```

## Supported Components

### Core Components

- **Transform**: position, rotation, scale (Euler or quaternion)
- **Camera**: FOV, near/far planes, projection type, background
- **Light**: type, color, intensity, shadows, direction
- **MeshRenderer**: meshId, materialId, modelPath, shadow flags
- **Material**: id reference

### Adding New Decoders

1. Define the component struct with serde derives:

```rust
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct MyComponent {
    pub value: f32,
}
```

2. Implement `IComponentDecoder`:

```rust
pub struct MyComponentDecoder;

impl IComponentDecoder for MyComponentDecoder {
    fn can_decode(&self, kind: &str) -> bool {
        kind == "MyComponent"
    }

    fn decode(&self, value: &Value) -> Result<Box<dyn Any>> {
        let component: MyComponent = serde_json::from_value(value.clone())?;
        Ok(Box::new(component))
    }

    fn capabilities(&self) -> ComponentCapabilities {
        ComponentCapabilities::rendering("geometry")
    }

    fn component_kinds(&self) -> Vec<ComponentKindId> {
        vec![ComponentKindId::new("MyComponent")]
    }
}
```

3. Register in `create_default_registry()`:

```rust
registry.register(MyComponentDecoder);
```

## Default Registry

Use `create_default_registry()` to get a fully populated registry:

```rust
use vibe_ecs_bridge::decoders::create_default_registry;

let registry = create_default_registry();
```

## Design Decisions

### Why Box<dyn Any>?

- Allows registry to return heterogeneous types
- Caller downcasts to expected type
- Alternative would require generic registry methods (less flexible)

### Why duplicate component definitions?

- Currently duplicated from main engine for isolation
- Plan: Move component definitions here, have engine import them
- Ensures ecs-bridge is self-contained during transition

### Why capability metadata?

- Render graph needs to know which passes depend on which components
- Allows conditional compilation of features (e.g., shadows)
- Documents component purposes for future developers

## Test Coverage

All decoders have unit tests:

- Decoding valid JSON
- Handling missing/optional fields
- Capability flags
- Registry integration

Run tests:

```bash
cargo test -p vibe-ecs-bridge
```

## Transform Coordinate System Conventions

### Critical: Degrees vs Radians

**THE BUG WE FIXED**: TypeScript/JSON stores rotation as Euler angles in **DEGREES**, but Rust math libraries (glam) expect **RADIANS**.

This is THE most common bug when integrating Three.js data with Rust physics/rendering.

### Standardized Conversion Utilities

All transform conversion utilities are in `src/transform_utils.rs`:

| Function | Purpose | Handles |
|----------|---------|---------|
| `rotation_to_quat(rotation: &[f32])` | Convert rotation to quaternion | Auto-detects Euler (3-elem) vs Quat (4-elem), converts degrees→radians |
| `rotation_to_quat_opt(rotation: Option<&Vec<f32>>)` | Optional rotation | Returns `Quat::IDENTITY` if None |
| `position_to_vec3(position: &[f32; 3])` | Convert position array | Direct conversion to Vec3 |
| `position_to_vec3_opt(position: Option<&[f32; 3]>)` | Optional position | Returns `Vec3::ZERO` if None |
| `scale_to_vec3(scale: &[f32; 3])` | Convert scale array | Direct conversion to Vec3 |
| `scale_to_vec3_opt(scale: Option<&[f32; 3]>)` | Optional scale | Returns `Vec3::ONE` if None |

### Usage Example

```rust
use vibe_ecs_bridge::{rotation_to_quat_opt, position_to_vec3_opt, scale_to_vec3_opt};

fn extract_transform(entity: &Entity, registry: &ComponentRegistry) -> (Vec3, Quat, Vec3) {
    if let Some(transform) = get_component::<Transform>(entity, "Transform", registry) {
        // ✅ CORRECT - uses standardized utilities
        let position = position_to_vec3_opt(transform.position.as_ref());
        let rotation = rotation_to_quat_opt(transform.rotation.as_ref()); // Handles degrees → radians!
        let scale = scale_to_vec3_opt(transform.scale.as_ref());
        (position, rotation, scale)
    } else {
        (Vec3::ZERO, Quat::IDENTITY, Vec3::ONE)
    }
}

// ❌ WRONG - manual conversion is error-prone
fn extract_transform_wrong(entity: &Entity) -> Quat {
    let rot = entity.get_rotation(); // Returns [x, y, z] in DEGREES
    Quat::from_euler(glam::EulerRot::XYZ, rot[0], rot[1], rot[2]) // WRONG! Treats as radians
}
```

### Why This Matters

**Real Bug Example**: A plane with rotation `[-90, 0, 0]` degrees:
- ✅ **Correct**: `-90°` → `-π/2 radians` → horizontal plane (floor)
- ❌ **Wrong**: `-90` as radians → `-5156°` rotation → slanted plane (ramp)

This caused physics objects to slide downhill instead of falling straight down!

### TypeScript Side (Reference)

For context, here's how Three.js stores rotations:

```typescript
// src/core/lib/ecs/components/TransformComponent.ts
export interface ITransformData {
  position: [number, number, number];
  rotation: [number, number, number]; // Euler angles in DEGREES
  scale: [number, number, number];
}
```

### Coordinate System

- **Right-handed coordinate system** (matches Three.js)
- **Y-up** (Y axis is vertical)
- **+Z is forward** in default camera orientation
- **+X is right**
- **Euler order**: XYZ (matches Three.js default)

### Adding New Transform-Related Code

**Checklist when writing new code that reads transforms:**

1. ✅ Import standardized utilities: `use vibe_ecs_bridge::{rotation_to_quat_opt, ...};`
2. ✅ Use utilities for ALL conversions (position, rotation, scale)
3. ✅ Never manually convert degrees → radians
4. ✅ Document that your code uses standardized conversions
5. ✅ Add unit tests that verify correct conversion

### Testing

All utilities have comprehensive tests in `src/transform_utils.rs`:

```bash
cargo test -p vibe-ecs-bridge transform_utils
```

Key test cases:
- ✅ 90° Euler → π/2 radians quaternion
- ✅ -90° Euler (plane rotation) → correct horizontal orientation
- ✅ Quaternion passthrough (no conversion)
- ✅ Zero rotation → identity quaternion
- ✅ Invalid array lengths → identity with warning

### Migration: Reviewing Existing Code

**Red flags to look for:**

```rust
// 🚨 RED FLAG - manual degrees to radians
let quat = Quat::from_euler(
    glam::EulerRot::XYZ,
    rotation[0].to_radians(),  // Manual conversion
    rotation[1].to_radians(),
    rotation[2].to_radians()
);

// 🚨 RED FLAG - missing conversion entirely
let quat = Quat::from_euler(glam::EulerRot::XYZ, rotation[0], rotation[1], rotation[2]);

// ✅ CORRECT - standardized utility
let quat = rotation_to_quat(&rotation);
```

**Where to check:**
- Any code reading `Transform` component
- Physics integration (`vibe-physics`)
- Scene graph (`vibe-scene-graph`)
- Rendering code that directly reads transforms
- GLTF/model loaders that apply transforms

## Future Work

- Generate decoders from TypeScript Zod schemas
- Component migration system for schema changes
- Performance: pre-decode all components at load time
- SceneDiff decoding for live updates
- Auto-generate transform utilities from TypeScript type definitions
