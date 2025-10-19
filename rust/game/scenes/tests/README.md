# Rust Engine Visual Test Scenes

This directory contains focused test scenes to visually validate implemented features in the Rust engine. Each scene targets a specific feature area for easy visual inspection and regression testing.

## Running Test Scenes

```bash
# From the rust/engine directory
cargo run --bin vibe-engine -- --scene ../../game/scenes/tests/testlighting.json

# Or with full path
cargo run --bin vibe-engine -- --scene /path/to/vibe-coder-3d/rust/game/scenes/tests/testlighting.json
```

## Available Test Scenes

### Phase 2: Core Render Features

#### `testlighting.json` - Light Types & Parameters

Tests directional, ambient, point, and spot lights with various colors, intensities, attenuation (range/decay), and angles.

**Cross-Reference**: See [INTEGRATION_AUDIT.md § Light Component](../../engine/INTEGRATION_AUDIT.md#light-component) (100% parity)

**Expected Visual:**

- Four different light types illuminating objects
- Color variations visible on lit surfaces
- Attenuation falloff visible on point/spot lights
- Spot light cone angle and penumbra effects

#### `testshadows.json` - Shadow Rendering

Tests shadow casters/receivers, directional vs spot shadows, bias, PCF radius, and map sizes.

**Cross-Reference**: See [INTEGRATION_AUDIT.md § Shadow Mapping](../../engine/INTEGRATION_AUDIT.md#8--shadow-mapping---fully-implemented) (100% complete)

**Expected Visual:**

- Crisp shadows from directional light
- Soft shadows with PCF blur
- No shadow acne (proper bias)
- Objects with `castShadow=false` don't cast shadows

#### `testmaterials.json` - Solid Materials

Tests solid color materials with varying metalness/roughness and emissive properties.

**Cross-Reference**: See [INTEGRATION_AUDIT.md § Material System](../../engine/INTEGRATION_AUDIT.md#1-material-system---pbr-with-textures) (95% complete)

**Expected Visual:**

- Metallic vs non-metallic surfaces
- Rough vs smooth surface reflections
- Emissive materials glowing (additive contribution)

#### `testmaterials-textures.json` - Textured Materials

Tests albedo, normal, metallic/roughness, emissive, and occlusion textures with `normalScale` parameter.

**Cross-Reference**: See [INTEGRATION_AUDIT.md § Texture System](../../engine/INTEGRATION_AUDIT.md#6--texture-system---fully-implemented) (100% except UV transforms)

**Expected Visual:**

- Albedo textures correctly applied
- Normal maps adding surface detail
- Metallic/roughness maps varying surface properties
- Emissive textures glowing
- Missing textures fall back to solid color

### Phase 3: Camera & Skybox

#### `testcamera.json` - Camera Parameters

Tests perspective vs orthographic projection, FOV/near/far, background color, and follow target with smoothing.

**Cross-Reference**: See [INTEGRATION_AUDIT.md § Camera Component](../../engine/INTEGRATION_AUDIT.md#camera-component) (100% parsing, 40% rendering)

**Expected Visual:**

- Perspective camera shows depth perspective
- Orthographic camera shows parallel projection
- Background color fills non-skybox areas
- Follow target smoothly tracks entity

#### `testmulticamera.json` - Multi-Camera Split Screen

Tests two cameras with distinct `viewportRect` settings for split-screen rendering.

**Cross-Reference**: See [INTEGRATION_AUDIT.md § Multi-camera rendering](../../engine/INTEGRATION_AUDIT.md#recommendations-by-priority) (Priority 3)

**Expected Visual:**

- Two viewports visible side-by-side or top/bottom
- Each viewport renders correctly
- Scissor test prevents viewport bleed
- Independent camera settings per viewport

#### `testskybox.json` - Skybox Parameters

Tests skyboxTexture, intensity, blur, scale, and rotation parameters.

**Cross-Reference**: See [INTEGRATION_AUDIT.md § Camera Component](../../engine/INTEGRATION_AUDIT.md#camera-component) (Skybox fully rendered)

**Expected Visual:**

- Skybox texture visible as background
- Intensity affects brightness
- Blur creates atmospheric effect
- Rotation changes skybox orientation

### Phase 4: Assets & GLTF

#### `testgltf.json` - GLTF Model Loading

Tests simple GLB loading via `modelPath`, verifying mesh conversion and material application.

**Cross-Reference**: See [INTEGRATION_AUDIT.md § GLTF Model Loading](../../engine/INTEGRATION_AUDIT.md#7--gltf-model-loading---fully-implemented) (100% complete)

**Expected Visual:**

- GLTF model loads and renders
- Materials from GLTF applied correctly
- Mesh geometry accurate

### Phase 5: Physics & Colliders

#### `testrigidbody.json` - Rigid Body Types

Tests fixed/kinematic/dynamic bodies, gravityScale, canSleep, and mass.

**Cross-Reference**: See [INTEGRATION_AUDIT.md § RigidBody Component](../../engine/INTEGRATION_AUDIT.md#rigidbody-component) (100% complete)

**Expected Visual:**

- Fixed bodies don't move
- Dynamic bodies fall with gravity
- Kinematic bodies move when scripted
- Mass affects collision response

#### `testcolliders.json` - Collider Shapes

Tests box/sphere/capsule colliders with center offsets, triggers vs solid, and physics materials (friction/restitution).

**Cross-Reference**: See [INTEGRATION_AUDIT.md § MeshCollider Component](../../engine/INTEGRATION_AUDIT.md#meshcollider-component) (100% complete)

**Expected Visual:**

- Different collider shapes interact correctly
- Triggers generate contacts without physical response
- Friction affects sliding behavior
- Restitution affects bounciness

### Phase 6: Hierarchy & Prefabs

#### `testhierarchy.json` - Parent/Child Transforms

Tests parent/child transform propagation, rotation/scale inheritance, and world transform correctness.

**Cross-Reference**: See [INTEGRATION_AUDIT.md § Parent-Child Hierarchy](../../engine/INTEGRATION_AUDIT.md#3--parent-child-hierarchy---completed) (100% complete)

**Expected Visual:**

- Child transforms relative to parent
- Parent rotation/scale affects children
- World transforms computed correctly

#### `testprefabs.json` - Prefab Structure

Tests prefab structure parsing (feature pending, observational test).

**Cross-Reference**: See [INTEGRATION_AUDIT.md § Prefabs](../../engine/INTEGRATION_AUDIT.md#scene-structure) (Parsed, instantiation pending)

**Expected Visual:**

- Scene loads without crashing
- Prefab structure present in scene data

## Scene Schema

All scenes follow the schema defined in `testphysics.json`:

```json
{
  "metadata": { "name": "testname", "version": 1, "timestamp": "..." },
  "entities": [...],
  "materials": [...]
}
```

Key components:

- `PersistentId`: Unique entity identifier
- `Transform`: Position/rotation/scale (rotation in degrees)
- `Camera`: Projection, FOV, viewport
- `Light`: Type, color, intensity, shadows
- `MeshRenderer`: Mesh/material references
- `RigidBody`: Physics body type
- `MeshCollider`: Collision shape

## Known Limitations

| Limitation        | Notes                                                  |
| ----------------- | ------------------------------------------------------ |
| UV Transform      | Offset/repeat parsed but not fully supported in render |
| GLTF Feature Flag | Requires `gltf-support` feature enabled                |
| Prefabs           | Parsed but instantiation pending                       |

## Cross-References

See `rust/engine/INTEGRATION_AUDIT.md` for detailed feature parity status and implementation notes.

## Contributing

When adding new test scenes:

1. Follow the naming convention: `test<feature>.json`
2. Keep scenes focused on one feature area
3. Include expected visual outcome above
4. Use minimal assets (small textures/models)
5. Cross-reference relevant sections of INTEGRATION_AUDIT.md
