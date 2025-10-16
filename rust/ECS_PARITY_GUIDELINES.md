# ECS Feature Parity Guidelines

This document defines the standards for maintaining feature parity between the TypeScript/Three.js ECS implementation and the Rust engine.

## Core Principle

**The Rust engine must interpret JSON scene files EXACTLY as the TypeScript editor does.**

Any divergence in behavior is a bug. The goal is to make Three.js → Rust conversions as easy and error-free as possible through standardized abstractions.

## Critical: Transform Coordinate System Conversions

### The Degrees vs Radians Bug

**Most Common Integration Bug**: TypeScript stores rotations in **DEGREES**, Rust math libraries expect **RADIANS**.

**ALWAYS use `vibe_ecs_bridge::transform_utils` for ALL transform conversions.**

### Standardized Utilities (Required)

Located in `rust/engine/crates/ecs-bridge/src/transform_utils.rs`:

| Function | Purpose | Default if None/Missing |
|----------|---------|------------------------|
| `rotation_to_quat(&[f32])` | Rotation → Quaternion | Handles 3-elem (Euler degrees) or 4-elem (quat) |
| `rotation_to_quat_opt(Option<&Vec<f32>>)` | Optional rotation | `Quat::IDENTITY` |
| `position_to_vec3(&[f32; 3])` | Position → Vec3 | N/A (required) |
| `position_to_vec3_opt(Option<&[f32; 3]>)` | Optional position | `Vec3::ZERO` |
| `scale_to_vec3(&[f32; 3])` | Scale → Vec3 | N/A (required) |
| `scale_to_vec3_opt(Option<&[f32; 3]>)` | Optional scale | `Vec3::ONE` |

### Example: CORRECT vs WRONG

```rust
// ✅ CORRECT - uses standardized utilities
use vibe_ecs_bridge::{rotation_to_quat_opt, position_to_vec3_opt, scale_to_vec3_opt};

let position = position_to_vec3_opt(transform.position.as_ref());
let rotation = rotation_to_quat_opt(transform.rotation.as_ref()); // Handles degrees → radians!
let scale = scale_to_vec3_opt(transform.scale.as_ref());

// ❌ WRONG - manual conversion (error-prone)
let rotation = transform.rotation.as_ref().map(|r| {
    Quat::from_euler(glam::EulerRot::XYZ, r[0], r[1], r[2]) // WRONG! Treats as radians
});

// ❌ WRONG - manual degrees to radians (easy to forget)
let rotation = transform.rotation.as_ref().map(|r| {
    Quat::from_euler(
        glam::EulerRot::XYZ,
        r[0].to_radians(),  // Manual conversion - can be missed in refactoring
        r[1].to_radians(),
        r[2].to_radians()
    )
});
```

### Real Bug Example

A plane with rotation `[-90, 0, 0]` degrees:
- ✅ **Correct**: `-90°` → `-π/2 radians` → horizontal floor
- ❌ **Wrong**: `-90` as radians → `-5156°` rotation → slanted ramp

Result: Physics objects slid downhill instead of falling straight down!

## Component Parity Requirements

### 1. Component Structure

Every TypeScript component must have a corresponding Rust struct in `vibe-ecs-bridge/src/decoders.rs`:

```rust
// TypeScript: src/core/lib/ecs/components/TransformComponent.ts
export interface ITransformData {
  position?: [number, number, number];
  rotation?: [number, number, number]; // Euler degrees
  scale?: [number, number, number];
}

// Rust: rust/engine/crates/ecs-bridge/src/decoders.rs
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Transform {
    #[serde(default)]
    pub position: Option<[f32; 3]>,
    #[serde(default)]
    pub rotation: Option<Vec<f32>>,  // Euler degrees OR quaternion
    #[serde(default)]
    pub scale: Option<[f32; 3]>,
}
```

**Rules:**
- Field names MUST match TypeScript exactly (use camelCase even if Rust warns)
- Optional fields must be `Option<T>` with `#[serde(default)]`
- Default values must match TypeScript defaults

### 2. Component Decoder

Every component needs a decoder implementing `IComponentDecoder`:

```rust
pub struct TransformDecoder;

impl IComponentDecoder for TransformDecoder {
    fn can_decode(&self, kind: &str) -> bool {
        kind == "Transform"
    }

    fn decode(&self, value: &Value) -> Result<Box<dyn Any>> {
        let component: Transform = serde_json::from_value(value.clone())?;
        Ok(Box::new(component))
    }

    fn capabilities(&self) -> ComponentCapabilities {
        ComponentCapabilities::none() // Or ComponentCapabilities::rendering("pass_name")
    }

    fn component_kinds(&self) -> Vec<ComponentKindId> {
        vec![ComponentKindId::new("Transform")]
    }
}
```

**Must be registered** in `create_default_registry()`:

```rust
pub fn create_default_registry() -> ComponentRegistry {
    let mut registry = ComponentRegistry::new();
    registry.register(TransformDecoder);
    // ... other decoders
    registry
}
```

### 3. Unit Tests (Required)

Every decoder MUST have tests:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_transform_decoder() {
        let json = json!({
            "position": [1.0, 2.0, 3.0],
            "rotation": [-90.0, 0.0, 0.0],
            "scale": [2.0, 2.0, 2.0]
        });

        let decoder = TransformDecoder;
        let decoded = decoder.decode(&json).unwrap();
        let transform = decoded.downcast_ref::<Transform>().unwrap();

        assert_eq!(transform.position, Some([1.0, 2.0, 3.0]));
        assert_eq!(transform.rotation, Some(vec![-90.0, 0.0, 0.0]));
        assert_eq!(transform.scale, Some([2.0, 2.0, 2.0]));
    }

    #[test]
    fn test_transform_defaults() {
        let json = json!({});

        let decoder = TransformDecoder;
        let decoded = decoder.decode(&json).unwrap();
        let transform = decoded.downcast_ref::<Transform>().unwrap();

        assert_eq!(transform.position, None);
        assert_eq!(transform.rotation, None);
        assert_eq!(transform.scale, None);
    }

    #[test]
    fn test_rotation_conversion() {
        let transform = Transform {
            rotation: Some(vec![-90.0, 0.0, 0.0]),
            ..Default::default()
        };

        // Use standardized utility
        let quat = rotation_to_quat_opt(transform.rotation.as_ref());

        // Verify correct conversion (-90° → -π/2 rad)
        let expected = Quat::from_euler(glam::EulerRot::XYZ, -PI/2.0, 0.0, 0.0);
        assert!((quat.x - expected.x).abs() < 0.001);
        assert!((quat.y - expected.y).abs() < 0.001);
        assert!((quat.z - expected.z).abs() < 0.001);
        assert!((quat.w - expected.w).abs() < 0.001);
    }
}
```

## System Integration Parity

### Scene Graph Transform Propagation

**TypeScript**: Parent-child hierarchy with world transform propagation
**Rust**: Must match exactly using `vibe-scene-graph`

```rust
// ✅ CORRECT - uses standardized utilities
use vibe_ecs_bridge::{position_to_vec3_opt, rotation_to_quat_opt, scale_to_vec3_opt};

fn extract_local_transform(entity: &Entity, registry: &ComponentRegistry) -> Mat4 {
    if let Some(transform) = get_component::<Transform>(entity, "Transform", registry) {
        let position = position_to_vec3_opt(transform.position.as_ref());
        let rotation = rotation_to_quat_opt(transform.rotation.as_ref());
        let scale = scale_to_vec3_opt(transform.scale.as_ref());
        Mat4::from_scale_rotation_translation(scale, rotation, position)
    } else {
        Mat4::IDENTITY
    }
}
```

**Transform Matrix Order**: Scale-Rotation-Translation (SRT) - matches Three.js

### Physics Integration

**TypeScript**: Uses @react-three/rapier
**Rust**: Uses rapier3d directly via `vibe-physics`

**Critical Parity Points:**

1. **Collider-only entities** (no RigidBody):
   ```typescript
   // TypeScript: Creates implicit static body
   <RigidBody type="fixed">
     <mesh>
       <MeshCollider />
     </mesh>
   </RigidBody>
   ```
   ```rust
   // Rust: Must create Fixed body automatically
   let rapier_body = PhysicsRigidBodyBuilder::new(RigidBodyType::Fixed)
       .position(position)
       .rotation(rotation) // Uses standardized utility!
       .build();
   ```

2. **Transform application**:
   ```rust
   // ✅ CORRECT
   let position = position_to_vec3_opt(transform.position.as_ref());
   let rotation = rotation_to_quat_opt(transform.rotation.as_ref()); // degrees → radians
   let scale = scale_to_vec3_opt(transform.scale.as_ref());

   let body = PhysicsRigidBodyBuilder::new(body_type)
       .position(position)
       .rotation(rotation)  // Already in radians!
       .build();
   ```

3. **Scale affects collider size**:
   ```rust
   // ✅ CORRECT - scale is applied to collider dimensions
   let half_extents = Vec3::new(width, height, depth) * 0.5 * scale;
   ```

### Rendering Parity

**Material Properties**: Must match Three.js MeshStandardMaterial

| TypeScript Property | Rust Field | Notes |
|-------------------|-----------|-------|
| `color` | `base_color` | RGB as [f32; 3] |
| `emissive` | `emissive` | RGB as [f32; 3] |
| `metalness` | `metallic` | 0.0 - 1.0 |
| `roughness` | `roughness` | 0.0 - 1.0 |
| `map` | `base_color_texture` | Optional texture path |

**Camera Properties**: Must match Three.js PerspectiveCamera

| TypeScript Property | Rust Field | Notes |
|-------------------|-----------|-------|
| `fov` | `fov_degrees` | Degrees! Convert with `.to_radians()` when building projection |
| `near` | `near` | Near clip plane |
| `far` | `far` | Far clip plane |
| `aspect` | Calculated | From window size |

## Parity Verification Checklist

### When Adding New Component

- [ ] TypeScript component defined in `src/core/lib/ecs/components/`
- [ ] Rust struct in `vibe-ecs-bridge/src/decoders.rs`
- [ ] Field names match EXACTLY (including camelCase)
- [ ] Optional fields use `Option<T>` with `#[serde(default)]`
- [ ] Decoder implements `IComponentDecoder`
- [ ] Decoder registered in `create_default_registry()`
- [ ] Unit tests for decoder (valid data, defaults, edge cases)
- [ ] If contains transforms: uses standardized utilities
- [ ] Integration test with real scene file
- [ ] Documented in `vibe-ecs-bridge/CLAUDE.md`

### When Adding New System

- [ ] System processes components identically to TypeScript
- [ ] Transform extraction uses standardized utilities
- [ ] Coordinate system matches (right-handed, Y-up)
- [ ] Default values match TypeScript
- [ ] Error handling matches (warn vs error)
- [ ] Unit tests cover TypeScript edge cases
- [ ] Integration test validates parity with editor

### When Modifying Transform Handling

- [ ] Uses `vibe_ecs_bridge::transform_utils` exclusively
- [ ] Never manually converts degrees → radians
- [ ] Never uses `Quat::from_euler()` directly with Euler angles
- [ ] Documents coordinate system assumptions
- [ ] Tests verify correct degree → radian conversion
- [ ] Tests include real rotation values from scenes (e.g., -90° plane)

## Common Parity Violations

### ❌ Manual Transform Conversion

```rust
// WRONG - manual conversion
let quat = Quat::from_euler(glam::EulerRot::XYZ, rot[0], rot[1], rot[2]);

// CORRECT - standardized utility
let quat = rotation_to_quat(&rot);
```

### ❌ Incorrect Default Values

```rust
// WRONG - defaults don't match TypeScript
#[derive(Deserialize)]
pub struct Light {
    pub intensity: f32, // No default! TypeScript has intensity = 1.0
}

// CORRECT - matches TypeScript defaults
#[derive(Deserialize)]
pub struct Light {
    #[serde(default = "default_intensity")]
    pub intensity: f32,
}

fn default_intensity() -> f32 { 1.0 }
```

### ❌ Missing Optional Handling

```rust
// WRONG - assumes field exists
let position = entity.get_position().unwrap(); // Panics if None!

// CORRECT - handles None gracefully
let position = position_to_vec3_opt(entity.position.as_ref()); // Returns Vec3::ZERO if None
```

### ❌ Field Name Mismatch

```rust
// WRONG - Rust naming convention
pub struct MeshRenderer {
    pub mesh_id: Option<String>, // TypeScript uses meshId
}

// CORRECT - matches TypeScript exactly
pub struct MeshRenderer {
    #[allow(non_snake_case)]
    pub meshId: Option<String>,
}
```

## Testing Strategy

### Unit Tests (Required)

Test decoders in isolation:

```bash
cargo test -p vibe-ecs-bridge
```

### Integration Tests (Required)

Test with real scene files from TypeScript editor:

```bash
# Validate scene first
yarn validate:scene rust/game/scenes/testphysics.json

# Run Rust engine
yarn rust:engine --scene testphysics
```

**Expected behavior**: Exact visual/physics match with Three.js editor

### Regression Tests

When a parity bug is fixed:

1. Add unit test reproducing the bug
2. Verify fix resolves test failure
3. Add integration test with real scene data
4. Document in relevant CLAUDE.md

Example: The degrees/radians bug now has:
- Unit tests in `transform_utils.rs` (test_rotation_conversion_degrees)
- Integration test scene: `testphysics.json`
- Documentation in 3 CLAUDE.md files

## Resources

- **TypeScript Components**: `src/core/lib/ecs/components/`
- **Rust Decoders**: `rust/engine/crates/ecs-bridge/src/decoders.rs`
- **Transform Utils**: `rust/engine/crates/ecs-bridge/src/transform_utils.rs`
- **Physics Integration**: `rust/engine/crates/physics/src/scene_integration.rs`
- **Scene Graph**: `rust/engine/crates/scene-graph/src/lib.rs`

## Quick Reference: Standardized Utilities

```rust
use vibe_ecs_bridge::{
    position_to_vec3, position_to_vec3_opt,
    rotation_to_quat, rotation_to_quat_opt,
    scale_to_vec3, scale_to_vec3_opt,
};

// Extract transform from entity
let position = position_to_vec3_opt(transform.position.as_ref()); // → Vec3::ZERO if None
let rotation = rotation_to_quat_opt(transform.rotation.as_ref()); // → Quat::IDENTITY if None
let scale = scale_to_vec3_opt(transform.scale.as_ref());           // → Vec3::ONE if None

// Build transform matrix (SRT order)
let matrix = Mat4::from_scale_rotation_translation(scale, rotation, position);
```

**Remember**: These utilities handle ALL coordinate system conversions automatically. Use them everywhere!
