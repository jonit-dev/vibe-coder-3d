# vibe-physics

Rapier3D physics integration for the Vibe engine.

## Purpose

This crate bridges the gap between Three.js physics (via ECS components) and Rapier3D by:

- **Scene integration**: Populating PhysicsWorld from Scene entities
- **Rigid body management**: Dynamic, static, and kinematic bodies
- **Collider support**: Box, sphere, capsule, cylinder, and trimesh colliders
- **Transform synchronization**: Keeping physics transforms in sync with rendering
- **Material properties**: Friction, restitution, and density

## Critical: Coordinate System Conversions

**ALWAYS use `vibe_ecs_bridge::transform_utils` for rotation conversions!**

TypeScript/JSON stores rotations in **DEGREES**, but Rapier3D (via glam) expects **RADIANS**.

```rust
use vibe_ecs_bridge::{rotation_to_quat_opt, position_to_vec3_opt, scale_to_vec3_opt};

// ✅ CORRECT - uses standardized utilities
let position = position_to_vec3_opt(transform.position.as_ref());
let rotation = rotation_to_quat_opt(transform.rotation.as_ref()); // Handles degrees → radians
let scale = scale_to_vec3_opt(transform.scale.as_ref());

// ❌ WRONG - manual conversion (THE BUG WE FIXED)
let rotation = Quat::from_euler(glam::EulerRot::XYZ, rot[0], rot[1], rot[2]); // WRONG! Treats as radians
```

See `/rust/CLAUDE.md` "Transform Coordinate System Conventions" for full details.

## Architecture

### PhysicsWorld

Main physics simulation container:

```rust
pub struct PhysicsWorld {
    rigid_body_set: RigidBodySet,
    collider_set: ColliderSet,
    integration_params: IntegrationParameters,
    physics_pipeline: PhysicsPipeline,
    // ...
}
```

**Key Methods:**
- `new()` - Create empty world
- `add_entity()` - Add rigid body + colliders for an entity
- `step()` - Advance simulation by delta time
- `get_entity_transform()` - Read physics transform back
- `stats()` - Get counts for debugging

### Scene Integration

`populate_physics_world()` in `scene_integration.rs` converts Scene entities to physics:

```rust
pub fn populate_physics_world(
    world: &mut PhysicsWorld,
    scene: &Scene,
    registry: &ComponentRegistry,
) -> Result<usize>
```

**Process:**
1. Iterate all scene entities
2. Check for RigidBody or MeshCollider components
3. Extract Transform (using standardized utilities!)
4. Build Rapier rigid body from RigidBody component
5. Build Rapier colliders from MeshCollider component
6. Add to PhysicsWorld with entity ID mapping

**Critical**: Uses `vibe_ecs_bridge::transform_utils` for all conversions!

### Component Mapping

| TypeScript Component | Rust Type | Notes |
|---------------------|-----------|-------|
| `RigidBody` | `vibe_ecs_bridge::RigidBody` | bodyType, mass, gravityScale, canSleep |
| `MeshCollider` | `vibe_ecs_bridge::MeshCollider` | colliderType, size, physicsMaterial, isTrigger |
| `Transform` | `vibe_ecs_bridge::Transform` | position, rotation (degrees!), scale |

### Rigid Body Types

```rust
pub enum RigidBodyType {
    Dynamic,   // Affected by forces, gravity, collisions
    Static,    // Immovable (ground, walls)
    Kinematic, // Moved by code, affects others but not affected
    Fixed,     // Alias for Static
}
```

Conversion from TypeScript:

```rust
impl RigidBodyType {
    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "dynamic" => RigidBodyType::Dynamic,
            "static" | "fixed" => RigidBodyType::Static,
            "kinematic" => RigidBodyType::Kinematic,
            _ => {
                log::warn!("Unknown body type '{}', defaulting to Dynamic", s);
                RigidBodyType::Dynamic
            }
        }
    }
}
```

### Collider Types

```rust
pub enum ColliderType {
    Box,      // Rectangular box
    Sphere,   // Sphere
    Capsule,  // Capsule (pill shape)
    Cylinder, // Cylinder
    Trimesh,  // Triangle mesh (for complex shapes)
}
```

**Size Parameters:**

Different colliders use different size fields from `MeshCollider.size`:

| Collider | Uses | Notes |
|----------|------|-------|
| Box | width, height, depth | Half-extents (Rapier convention) |
| Sphere | radius | Full radius |
| Capsule | capsuleRadius, capsuleHeight | Height is total (includes caps) |
| Cylinder | radius, height | Half-height (Rapier convention) |

**Scale Application:**

Scale is applied AFTER base size is determined:

```rust
let half_extents = Vec3::new(width, height, depth) * 0.5 * scale;
ColliderBuilder::cuboid(half_extents.x, half_extents.y, half_extents.z)
```

### Physics Material

```rust
pub struct PhysicsMaterial {
    pub friction: f32,      // 0.0 = ice, 1.0 = rubber
    pub restitution: f32,   // 0.0 = no bounce, 1.0 = perfect bounce
    pub density: f32,       // kg/m³ (only for Dynamic bodies)
}
```

Default values match Three.js Rapier integration:

```rust
impl Default for PhysicsMaterial {
    fn default() -> Self {
        Self {
            friction: 0.5,
            restitution: 0.0,
            density: 1.0,
        }
    }
}
```

## Three.js Integration

### Matching Three.js Behavior

**Critical Rules:**

1. **Rotation Units**: Three.js stores Euler angles in DEGREES
   - ✅ Use `rotation_to_quat_opt()` - handles conversion automatically
   - ❌ Never manually convert - easy to forget `.to_radians()`

2. **Collider-Only Entities**: Three.js MeshCollider without RigidBody
   - Creates implicit Fixed (static) body
   - Implemented in `populate_physics_world()` lines 44-50

3. **Disabled Components**: `enabled: false` in JSON
   - Skip during population
   - Implemented via early continue

4. **Scale Application**: Transform.scale affects collider size
   - Applied as multiplier to base size
   - Matches Three.js behavior

### Example Scene Entity

TypeScript/JSON:

```json
{
  "id": 1,
  "name": "Ground",
  "components": {
    "Transform": {
      "position": [0, 0, 0],
      "rotation": [0, 0, 0],
      "scale": [10, 1, 10]
    },
    "MeshCollider": {
      "enabled": true,
      "colliderType": "box",
      "size": {"width": 1, "height": 1, "depth": 1},
      "physicsMaterial": {"friction": 0.7}
    }
  }
}
```

Rust conversion:

```rust
// Extract transform using standardized utilities
let position = position_to_vec3_opt(transform.position.as_ref()); // [0, 0, 0]
let rotation = rotation_to_quat_opt(transform.rotation.as_ref()); // IDENTITY
let scale = scale_to_vec3_opt(transform.scale.as_ref());           // [10, 1, 10]

// Build collider with scale applied
let size = ColliderSize { width: 1.0, height: 1.0, depth: 1.0, ... };
// Effective half-extents: [1.0 * 10, 1.0 * 1, 1.0 * 10] * 0.5 = [5, 0.5, 5]
let collider = ColliderBuilder::new(ColliderType::Box)
    .size(size)
    .scale(scale)
    .build()?;
```

## Testing

### Unit Tests

All core functionality has tests in `scene_integration.rs`:

```bash
cargo test -p vibe-physics
```

**Test Coverage:**
- ✅ Populate world with rigid body + collider
- ✅ Skip disabled entities
- ✅ Collider-only creates Fixed body
- ✅ Transform extraction (degrees → radians)
- ✅ Error handling for invalid data

### Integration Testing

Test with real scene files:

```bash
cd /home/jonit/projects/vibe-coder-3d
yarn rust:engine --scene testphysics
```

Expected behavior (matches Three.js):
- Cube and sphere fall straight down (gravity)
- Land on red plane and stop (collision + friction)
- No sliding/rolling (objects stabilize)

## Common Pitfalls

### ❌ Forgetting Degrees → Radians

**Symptom**: Objects appear rotated incorrectly, physics colliders don't match visuals

**Cause**: Using rotation values directly without conversion

```rust
// ❌ WRONG - treats degrees as radians
let quat = Quat::from_euler(glam::EulerRot::XYZ, rot[0], rot[1], rot[2]);

// ✅ CORRECT - uses standardized utility
let quat = rotation_to_quat_opt(transform.rotation.as_ref());
```

**How We Fixed It**: See `/rust/CLAUDE.md` "Transform Coordinate System Conventions"

### ❌ Incorrect Scale Application

**Symptom**: Colliders too large or too small

**Cause**: Forgetting to apply Transform.scale or applying it twice

```rust
// ✅ CORRECT - ColliderBuilder handles scale internally
ColliderBuilder::new(ColliderType::Box)
    .size(size)
    .scale(scale)  // Applied once here
    .build()?

// ❌ WRONG - manual scaling in size calculation
let width = component.size.width * scale.x;  // Don't do this!
```

### ❌ Half-Extents vs Full Size

**Symptom**: Box colliders are 2x too large

**Cause**: Rapier uses half-extents, Three.js uses full size

```rust
// ✅ CORRECT - ColliderBuilder handles conversion
pub fn build(self) -> Result<Collider> {
    match self.collider_type {
        ColliderType::Box => {
            let half_extents = Vec3::new(width, height, depth) * 0.5 * scale;
            SharedShape::cuboid(half_extents.x, half_extents.y, half_extents.z)
        }
    }
}
```

## Future Work

- [ ] Continuous collision detection (CCD) for fast-moving objects
- [ ] Joint/constraint support (hinges, fixed, etc.)
- [ ] Raycasting for interaction
- [ ] Physics material presets (ice, rubber, metal)
- [ ] Performance: broad-phase optimization for large scenes
- [ ] Debug visualization (collider wireframes)

## Resources

- [Rapier3D Documentation](https://rapier.rs/docs/user_guides/rust/getting_started)
- [Three.js Rapier Integration](https://github.com/pmndrs/react-three-rapier)
- [glam Math Library](https://docs.rs/glam/latest/glam/)
