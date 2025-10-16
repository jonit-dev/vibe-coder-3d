# Entity Type Parity Audit

**Generated:** 2025-10-15
**Purpose:** Track entity type parity between TypeScript Editor and Rust Engine

This document audits whether all entity types available in the TypeScript/React editor can be successfully read, parsed, and rendered in the Rust engine.

---

## Summary

- **Total Entity Types:** 44
- **Fully Supported:** 3 (6.8%)
- **Partially Supported:** 0 (0%)
- **Not Supported:** 41 (93.2%)

---

## Parity Checklist

| Entity Type | Editor Support | Rust Parser | Rust Primitives | Rust Renderer | Status | Notes |
|------------|----------------|-------------|-----------------|---------------|--------|-------|
| **Basic Shapes** |
| Cube | ✅ | ✅ | ✅ | ✅ | ✅ **FULL** | Supported via `create_cube()` |
| Sphere | ✅ | ✅ | ✅ | ✅ | ✅ **FULL** | Supported via `create_sphere(32, 16)` |
| Cylinder | ✅ | ❌ | ❌ | ❌ | ❌ **NONE** | Editor: `createCylinder()` exists |
| Cone | ✅ | ❌ | ❌ | ❌ | ❌ **NONE** | Editor: `createCone()` exists |
| Plane | ✅ | ✅ | ✅ | ✅ | ✅ **FULL** | Supported via `create_plane(10.0)` |
| **Geometric Shapes** |
| Torus | ✅ | ❌ | ❌ | ❌ | ❌ **NONE** | Editor: `createTorus()` exists |
| Trapezoid | ✅ | ❌ | ❌ | ❌ | ❌ **NONE** | Editor: `createTrapezoid()` exists |
| Prism | ✅ | ❌ | ❌ | ❌ | ❌ **NONE** | Editor: `createPrism()` exists |
| Pyramid | ✅ | ❌ | ❌ | ❌ | ❌ **NONE** | Editor: `createPyramid()` exists |
| Capsule | ✅ | ❌ | ❌ | ❌ | ❌ **NONE** | Editor: `createCapsule()` exists |
| **Polyhedra** |
| Octahedron | ✅ | ❌ | ❌ | ❌ | ❌ **NONE** | Editor: `createOctahedron()` exists |
| Dodecahedron | ✅ | ❌ | ❌ | ❌ | ❌ **NONE** | Editor: `createDodecahedron()` exists |
| Icosahedron | ✅ | ❌ | ❌ | ❌ | ❌ **NONE** | Editor: `createIcosahedron()` exists |
| Tetrahedron | ✅ | ❌ | ❌ | ❌ | ❌ **NONE** | Editor: `createTetrahedron()` exists |
| **Mathematical Shapes** |
| TorusKnot | ✅ | ❌ | ❌ | ❌ | ❌ **NONE** | Editor: `createTorusKnot()` exists |
| Helix | ✅ | ❌ | ❌ | ❌ | ❌ **NONE** | Editor: `createHelix()` exists |
| MobiusStrip | ✅ | ❌ | ❌ | ❌ | ❌ **NONE** | Editor: `createMobiusStrip()` exists |
| **Structural** |
| Wall | ✅ | ❌ | ❌ | ❌ | ❌ **NONE** | Editor: `createWall()` exists |
| Ramp | ✅ | ❌ | ❌ | ❌ | ❌ **NONE** | Editor: `createRamp()` exists |
| Stairs | ✅ | ❌ | ❌ | ❌ | ❌ **NONE** | Editor: `createStairs()` exists |
| SpiralStairs | ✅ | ❌ | ❌ | ❌ | ❌ **NONE** | Editor: `createSpiralStairs()` exists |
| **Decorative** |
| Star | ✅ | ❌ | ❌ | ❌ | ❌ **NONE** | Editor: `createStar()` exists |
| Heart | ✅ | ❌ | ❌ | ❌ | ❌ **NONE** | Editor: `createHeart()` exists |
| Diamond | ✅ | ❌ | ❌ | ❌ | ❌ **NONE** | Editor: `createDiamond()` exists |
| Cross | ✅ | ❌ | ❌ | ❌ | ❌ **NONE** | Editor: `createCross()` exists |
| Tube | ✅ | ❌ | ❌ | ❌ | ❌ **NONE** | Editor: `createTube()` exists |
| **Environment** |
| Terrain | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ **PARTIAL** | MeshCollider has `heightfield` type but no decoder/renderer |
| Tree | ✅ | ❌ | ❌ | ❌ | ❌ **NONE** | Editor: `createTree()` exists |
| Rock | ✅ | ❌ | ❌ | ❌ | ❌ **NONE** | Editor: `createRock()` exists |
| Bush | ✅ | ❌ | ❌ | ❌ | ❌ **NONE** | Editor: `createBush()` exists |
| Grass | ✅ | ❌ | ❌ | ❌ | ❌ **NONE** | Editor: `createGrass()` exists |
| **Special Entities** |
| Camera | ✅ | ✅ | N/A | ✅ | ✅ **FULL** | CameraComponent fully decoded and used |
| CustomModel | ✅ | ⚠️ | N/A | ⚠️ | ⚠️ **PARTIAL** | MeshRenderer has `modelPath` but limited GLTF support |
| **Lights** |
| DirectionalLight | ✅ | ✅ | N/A | ✅ | ✅ **FULL** | Light component with type `directional` |
| PointLight | ✅ | ✅ | N/A | ✅ | ✅ **FULL** | Light component with type `point` |
| SpotLight | ✅ | ✅ | N/A | ✅ | ✅ **FULL** | Light component with type `spot` |
| AmbientLight | ✅ | ✅ | N/A | ✅ | ✅ **FULL** | Light component with type `ambient` |
| **Custom Shapes** |
| CustomShape | ✅ | ❌ | N/A | ❌ | ❌ **NONE** | Editor has CustomShapeComponent, no Rust decoder |
| CattailHeads | ✅ | ❌ | N/A | ❌ | ❌ **NONE** | Custom shape in `src/game/shapes/` |
| CattailReeds | ✅ | ❌ | N/A | ❌ | ❌ **NONE** | Custom shape in `src/game/shapes/` |
| LilyPads | ✅ | ❌ | N/A | ❌ | ❌ **NONE** | Custom shape in `src/game/shapes/` |
| PondFlora | ✅ | ❌ | N/A | ❌ | ❌ **NONE** | Custom shape in `src/game/shapes/` |
| PondRocks | ✅ | ❌ | N/A | ❌ | ❌ **NONE** | Custom shape in `src/game/shapes/` |
| PondWater | ✅ | ❌ | N/A | ❌ | ❌ **NONE** | Custom shape in `src/game/shapes/` |

---

## Component Support

### Supported Components (Rust ECS Bridge)

These components are fully decoded by the Rust engine:

- ✅ **Transform** - position, rotation, scale
- ✅ **Camera** - fov, projection, background, skybox
- ✅ **Light** - type, color, intensity, shadows
- ✅ **MeshRenderer** - meshId, materialId, modelPath, shadows
- ✅ **Material** - id reference
- ✅ **RigidBody** - bodyType, mass, gravity, physics material
- ✅ **MeshCollider** - colliderType, size, trigger, physics material

**Source:** `rust/engine/crates/ecs-bridge/src/decoders.rs`

### Missing Component Decoders

These components exist in TypeScript but have no Rust decoder:

- ❌ **CustomShape** - shapeId, params (for custom parametric shapes)
- ❌ **Terrain** - size, segments, heightScale, noise parameters
- ❌ **PersistentId** - UUID for entity identification (present in scenes)
- ❌ **Script** - Script attachment component
- ❌ **AudioSource** - Audio playback component
- ❌ **Tag** - Entity tagging/metadata

---

## Primitive Mesh Support

### Implemented Primitives (Rust)

**Location:** `rust/engine/crates/assets/src/primitives.rs`

| Primitive | Function | Parameters | Status |
|-----------|----------|------------|--------|
| Cube | `create_cube()` | None | ✅ |
| Sphere | `create_sphere(segments, rings)` | segments: 32, rings: 16 | ✅ |
| Plane | `create_plane(size)` | size: 10.0 | ✅ |

### Missing Primitives

All other geometric shapes from the editor need Rust implementations:

- Cylinder, Cone, Torus, Capsule
- Trapezoid, Prism, Pyramid
- Octahedron, Dodecahedron, Icosahedron, Tetrahedron
- TorusKnot, Helix, MobiusStrip
- Wall, Ramp, Stairs, SpiralStairs
- Star, Heart, Diamond, Cross, Tube
- Tree, Rock, Bush, Grass (environment objects)

---

## Scene Format Support

### Scene Files

Scenes are exported as JSON with the following structure:

```json
{
  "metadata": { "name": "...", "version": 1 },
  "entities": [
    {
      "id": 5,
      "name": "Main Camera",
      "components": {
        "PersistentId": { "id": "uuid" },
        "Transform": { "position": [...], "rotation": [...], "scale": [...] },
        "Camera": { "fov": 20, "isMain": true }
      }
    }
  ],
  "assetReferences": {
    "materials": ["@/materials/default"],
    "inputs": ["@/inputs/defaultInput"],
    "prefabs": ["@/prefabs/trees"]
  }
}
```

### Current Scene Loading

**Rust Scene Loader:** `rust/engine/src/io/loader.rs`

- ✅ Can parse JSON scene structure
- ✅ Loads entities with Transform, Camera, Light, MeshRenderer
- ✅ Supports material references
- ❌ Does not decode PersistentId
- ❌ Does not handle CustomShape components
- ❌ Does not process Terrain components
- ❌ Ignores unknown components (logs warning)

---

## Implementation Priorities

### High Priority (Core Shapes)

These are commonly used and should be implemented first:

1. **Cylinder** - Basic primitive, used frequently
2. **Cone** - Basic primitive
3. **Capsule** - Common for character physics
4. **Torus** - Moderate complexity, useful for demos

### Medium Priority (Geometric/Structural)

5. **Pyramid** - Simple geometric shape
6. **Prism** - Geometric shape
7. **Wall** - Structural building block
8. **Ramp** - Level design element
9. **Stairs** - Level design element

### Low Priority (Decorative/Complex)

10. **Star, Heart, Diamond, Cross** - Decorative shapes
11. **TorusKnot, Helix, MobiusStrip** - Mathematical shapes
12. **Polyhedra** (Octahedron, Dodecahedron, etc.)
13. **Environment** (Tree, Rock, Bush, Grass)

### Critical Missing Features

1. **CustomShape Component Decoder** - Enables parametric custom shapes
2. **Terrain Component Decoder** - Required for terrain entities
3. **GLTF Model Loading** - Feature-gated but incomplete integration

---

## Next Steps

### Immediate Actions

1. **Add Cylinder Primitive** - Implement `create_cylinder(radius, height, segments)` in `rust/engine/crates/assets/src/primitives.rs`
2. **Add Cone Primitive** - Implement `create_cone(radius, height, segments)`
3. **Add Capsule Primitive** - Implement `create_capsule(radius, height, segments)`
4. **Update MeshCache** - Register new primitives in `mesh_cache.rs`

### Component Decoders

5. **Add CustomShape Decoder** - Create `CustomShapeDecoder` in `rust/engine/crates/ecs-bridge/src/decoders.rs`
6. **Add Terrain Decoder** - Create `TerrainDecoder` with heightfield support
7. **Add PersistentId Decoder** - Handle UUID persistence

### Renderer Integration

8. **Test Scene Parsing** - Ensure all decoded meshIds map to primitives
9. **Handle Missing Meshes** - Fallback to cube/error mesh for unknown types
10. **Update Renderer** - Support all new primitive types

---

## Testing Checklist

For each entity type implementation:

- [ ] Can create entity in TypeScript editor
- [ ] Can save scene to JSON
- [ ] Rust parser decodes entity without errors
- [ ] Rust renderer displays entity correctly
- [ ] Transform operations (move/rotate/scale) work
- [ ] Material application works
- [ ] Physics colliders work (if applicable)

---

## References

### TypeScript Source Files

- **Editor Entity Creation:** `src/editor/hooks/useEntityCreation.ts` (lines 93-772)
- **Shape Type Enum:** `src/editor/types/shapes.ts` (lines 1-50)
- **Shape Registry:** `src/core/lib/rendering/shapes/shapeRegistry.ts`
- **Custom Shapes:** `src/game/shapes/*.tsx`

### Rust Source Files

- **Component Decoders:** `rust/engine/crates/ecs-bridge/src/decoders.rs`
- **Primitives:** `rust/engine/crates/assets/src/primitives.rs`
- **Mesh Cache:** `rust/engine/crates/assets/src/mesh_cache.rs`
- **Scene Loader:** `rust/engine/src/io/loader.rs`

### Test Scenes

- **Test Physics Scene:** `rust/game/scenes/testphysics.json`
  - Contains: Camera, Lights, Cube, Plane, Sphere
  - All entities load successfully in Rust
  - Uses RigidBody and MeshCollider components

---

## Validation

To validate a scene before loading in Rust:

```bash
# Validate scene structure and component format
yarn validate:scene rust/game/scenes/testphysics.json
```

This checks:
- Rotation format (degrees vs radians)
- Camera field formats (array vs object)
- Component structure
- Material references

---

## Three.js Geometry Implementation Research

### Research Findings (2025-10-15)

**Sources Analyzed:**
- `src/editor/components/panels/ViewportPanel/components/GeometryRenderer.tsx` (lines 60-140)
- `src/core/systems/InstanceSystem.ts` (lines 240-265)
- `src/editor/components/panels/ViewportPanel/components/CustomGeometries.tsx`

### Three.js Primitive Mappings

**Basic Primitives (Built-in Three.js):**

| Entity Type | Three.js Class | Parameters | Implementation |
|------------|---------------|------------|----------------|
| Cube | `BoxGeometry` | `(1, 1, 1)` | ✅ Rust: `create_cube()` |
| Sphere | `SphereGeometry` | `(0.5, 32, 32)` | ✅ Rust: `create_sphere(32, 16)` |
| Plane | `PlaneGeometry` | `(1, 1)` | ✅ Rust: `create_plane(10.0)` |
| Cylinder | `CylinderGeometry` | `(0.5, 0.5, 1, 32)` | ❌ Missing in Rust |
| Cone | `ConeGeometry` | `(0.5, 1, 32)` | ❌ Missing in Rust |
| Torus | `TorusGeometry` | `(0.5, 0.2, 16, 100)` | ❌ Missing in Rust |
| Capsule | `CapsuleGeometry` | `(0.3, 0.4, 4, 16)` | ❌ Missing in Rust |
| Octahedron | `OctahedronGeometry` | `(0.5, 0)` | ❌ Missing in Rust |
| Dodecahedron | `DodecahedronGeometry` | `(0.5, 0)` | ❌ Missing in Rust |
| Icosahedron | `IcosahedronGeometry` | `(0.5, 0)` | ❌ Missing in Rust |
| Tetrahedron | `TetrahedronGeometry` | `(0.5, 0)` | ❌ Missing in Rust |
| TorusKnot | `TorusKnotGeometry` | `(0.4, 0.1, 64, 8, 2, 3)` | ❌ Missing in Rust |

**Approximated Shapes (Using Built-in Primitives):**

| Entity Type | Approximation | Parameters | Notes |
|------------|---------------|------------|-------|
| Wall | `BoxGeometry` | `(2, 1, 0.1)` | Thin box |
| Trapezoid | `CylinderGeometry` | `(0.3, 0.7, 1, 4)` | 4-sided cylinder |
| Prism | `CylinderGeometry` | `(0.5, 0.5, 1, 6)` | 6-sided cylinder |
| Pyramid | `ConeGeometry` | `(0.5, 1, 4)` | 4-sided cone |

**Custom Geometries (Manual Buffer Geometry):**

These use `BufferGeometry` with custom vertex/index generation:

- **Helix** - `TubeGeometry` along `CatmullRomCurve3`
- **MobiusStrip** - Parametric equations: `x = (r + v*cos(u/2))*cos(u)`
- **Ramp** - 6 vertices, 5 faces (triangular prism)
- **Stairs** - N boxes (8 vertices × 12 triangles each)
- **SpiralStairs** - Steps arranged in spiral pattern
- **Star** - 2D extrusion with 5 points
- **Heart** - Parametric heart curve extrusion
- **Diamond** - 6 vertices forming double pyramid
- **Cross** - 4 box geometries merged
- **Tube** - `TubeGeometry` with custom path
- **Tree** - Cylinder trunk + sphere canopies
- **Rock** - Deformed sphere with noise
- **Bush** - Multiple deformed spheres merged
- **Grass** - Plane array with random rotations

### Architecture Patterns

**TypeScript/R3F Rendering Flow:**

```
1. Entity has MeshRenderer component with meshId
   ↓
2. GeometryRenderer.tsx switches on meshId
   ↓
3a. Built-in: <cylinderGeometry args={[...]} />
3b. Custom: <HelixGeometry /> component
   ↓
4. Geometry cached in scene graph
   ↓
5. Rendered via Three.js WebGL renderer
```

**Current Rust Flow:**

```
1. Scene JSON loaded → Entity with MeshRenderer
   ↓
2. MeshCache checks for meshId
   ↓
3. Only cube/sphere/plane exist
   ↓
4. Other meshIds → fallback to cube or error
```

### Key Observations

**1. Parameter Consistency**

Three.js uses consistent parameter patterns:
- **Radius-based:** sphere, cylinder, cone use radius (0.5 default)
- **Segments:** All curved primitives use segment counts (32, 16, etc.)
- **Size-based:** Box uses width/height/depth

Rust should match these EXACTLY for visual parity.

**2. Vertex Winding Order**

Three.js uses counter-clockwise (CCW) winding for front faces. Rust must match this or faces will be culled incorrectly.

**3. UV Coordinate Mapping**

Three.js has specific UV unwrapping for each primitive. Rust implementations must match UV layouts for correct texture mapping.

**4. Geometry Caching**

TypeScript caches geometries in `geometryCache` Map. Rust should follow same pattern in `MeshCache`.

**5. Approximation Strategy**

Some shapes (Wall, Trapezoid, Prism, Pyramid) are approximated using basic primitives with modified parameters. This is acceptable for initial implementation.

### Implementation Strategy (DRY/SRP Principles)

**Single Responsibility:**
- Each primitive generator = 1 function = 1 file (if complex)
- MeshCache = registration & lookup only
- Scene loader = deserialization & mesh lookup only
- Renderer = draw calls only

**Don't Repeat Yourself:**
- Create `vertex_builder.rs` helper with common vertex generation
- Extract `geometry_math.rs` for shared formulas (circle points, normals, etc.)
- Parametric shapes share `parametric_surface()` function
- UV generation uses `standard_uv_unwrap()` utilities

**Proposed Module Structure:**

```
rust/engine/crates/assets/src/
├── primitives/
│   ├── mod.rs              # Re-exports
│   ├── basic.rs            # cube, sphere, plane (existing)
│   ├── cylinders.rs        # cylinder, cone, capsule
│   ├── torus.rs            # torus, torus_knot
│   ├── polyhedra.rs        # octahedron, dodecahedron, etc.
│   ├── parametric.rs       # helix, mobius_strip
│   ├── structural.rs       # wall, ramp, stairs, spiral_stairs
│   └── decorative.rs       # star, heart, diamond, cross, tube
├── geometry_math.rs        # Shared math utilities
└── vertex_builder.rs       # Vertex generation helpers
```

**Testing Strategy:**

Each primitive must have:
1. **Vertex count test** - Verify expected vertex/index counts
2. **Normal vector test** - Ensure all normals are unit length
3. **UV bounds test** - UVs in [0,1] range
4. **Winding order test** - CCW front faces
5. **Visual regression test** - Compare rendered output to Three.js

### Next Steps (Prioritized)

**Phase 1: High-Priority Primitives (Week 1)**
1. Cylinder - Most used, simple cylinder formula
2. Cone - Slight variation of cylinder
3. Capsule - Cylinder + 2 hemisphere caps
4. Torus - Parametric surface equation

**Phase 2: Polyhedra (Week 2)**
5. Octahedron - 6 vertices, 8 faces
6. Dodecahedron - 20 vertices, 12 pentagonal faces
7. Icosahedron - 12 vertices, 20 triangular faces
8. Tetrahedron - 4 vertices, 4 triangular faces

**Phase 3: Approximated Shapes (Week 3)**
9. Wall - Reuse cube with modified params
10. Trapezoid - Reuse cylinder with 4 segments
11. Prism - Reuse cylinder with 6 segments
12. Pyramid - Reuse cone with 4 segments

**Phase 4: Complex Custom (Week 4)**
13. Ramp, Stairs, SpiralStairs
14. Star, Heart, Diamond, Cross, Tube
15. Tree, Rock, Bush, Grass

**Phase 5: Parametric Surfaces (Week 5)**
16. Helix - Tube along parametric curve
17. MobiusStrip - Parametric surface
18. TorusKnot - Complex parametric torus

### Performance Considerations

**Memory:**
- Pre-compute primitives at startup (like current cube/sphere/plane)
- Store in MeshCache, not per-entity
- GPU buffers created once, reused via instances

**Vertex Optimization:**
- Use indexed drawing (reduce vertex duplication)
- Target ~500-2000 vertices per primitive
- Sphere: 32×16 segments = 512 vertices (good balance)
- Cylinder: 32 segments = 64 vertices (lightweight)

**Startup Time:**
- Lazy initialization: Only create mesh when first used
- Or: Pre-generate all primitives in parallel during startup
- Estimated startup cost: ~10-50ms for all primitives

### Rust-Specific Considerations

**Data Structures:**
```rust
// Shared primitive config
pub struct PrimitiveConfig {
    pub segments: u32,
    pub rings: u32,
    pub radius: f32,
    pub height: f32,
}

// Primitive generator trait (SRP)
pub trait PrimitiveGenerator {
    fn generate(&self, config: &PrimitiveConfig) -> Mesh;
}

// DRY: Reusable builders
pub struct CylindricalBuilder {
    radius_top: f32,
    radius_bottom: f32,
    height: f32,
    segments: u32,
}

impl CylindricalBuilder {
    pub fn cylinder(radius: f32, height: f32, segments: u32) -> Self { /* ... */ }
    pub fn cone(radius: f32, height: f32, segments: u32) -> Self { /* ... */ }
    pub fn build(self) -> Mesh { /* ... */ }
}
```

**Benefits:**
- `cylinder()` and `cone()` share 95% of code via `CylindricalBuilder`
- Easy to add new variants (truncated cone, etc.)
- Testable in isolation

---

## Changelog

### 2025-10-15 - Initial Audit

- Documented 44 entity types from editor
- Identified 3 fully supported primitives (Cube, Sphere, Plane)
- Identified 7 fully supported components
- Created implementation priority list
- 93.2% of entity types not yet supported in Rust

### 2025-10-15 - Three.js Research

- Analyzed Three.js geometry implementations in TypeScript codebase
- Mapped all 44 entity types to Three.js primitives or custom geometries
- Identified built-in vs approximated vs custom geometry patterns
- Documented exact parameters used by editor (e.g., Cylinder: `(0.5, 0.5, 1, 32)`)
- Defined DRY/SRP architecture for Rust implementation
- Created 5-phase implementation roadmap
- Established testing requirements for each primitive

### 2025-10-15 - Phase 1 Implementation COMPLETE

**✅ Shared Utilities (DRY Principle):**
- Created `geometry_math.rs` - Reusable math functions (circle points, normals, UVs)
- Created `vertex_builder.rs` - Vertex/index generation helpers (quads, fans, strips, caps)
- All utilities have comprehensive unit tests

**✅ Phase 1 Primitives Implemented:**
1. **Cylinder** - `create_cylinder(0.5, 1.0, 32)` matches Three.js `CylinderGeometry(0.5, 0.5, 1, 32)`
2. **Cone** - `create_cone(0.5, 1.0, 32)` matches Three.js `ConeGeometry(0.5, 1, 32)`
3. **Capsule** - `create_capsule(0.3, 0.4, 4, 16)` matches Three.js `CapsuleGeometry(0.3, 0.4, 4, 16)`
4. **Torus** - `create_torus(0.5, 0.2, 16, 100)` matches Three.js `TorusGeometry(0.5, 0.2, 16, 100)`
5. **TorusKnot** - `create_torus_knot(0.4, 0.1, 64, 8, 2, 3)` matches Three.js `TorusKnotGeometry(...)`

**Architecture Benefits (DRY/SRP):**
- `CylindricalBuilder` - Cylinder and cone share 95% of code via builder pattern
- Capsule reuses `ring_strip_indices()` helper (DRY)
- All primitives use shared `vertex_pnu()` builder
- Normal/UV generation follows consistent patterns
- Tangent space computed automatically via `Mesh::new()`

**Integration:**
- Updated `mesh_cache.rs` to register all 5 new primitives at startup
- Primitives available via meshId: "cylinder", "cone", "capsule", "torus", "torusKnot"
- Exported via `vibe-assets` crate public API

**Testing:**
- Each primitive has 5+ unit tests (vertex count, normals, UVs, dimensions)
- Geometry math utilities: 5 tests
- Vertex builders: 5 tests
- Total: 30+ new tests covering Phase 1 implementation

**Updated Parity (7 of 44 = 15.9%):**
- Cube ✅, Sphere ✅, Plane ✅ (existing)
- Cylinder ✅, Cone ✅, Capsule ✅, Torus ✅, TorusKnot ✅ (NEW)

**Files Created:**
- `rust/engine/crates/assets/src/geometry_math.rs` (183 lines)
- `rust/engine/crates/assets/src/vertex_builder.rs` (174 lines)
- `rust/engine/crates/assets/src/primitives_cylinders.rs` (456 lines)
- `rust/engine/crates/assets/src/primitives_torus.rs` (314 lines)

**Files Modified:**
- `rust/engine/crates/assets/src/lib.rs` - Added module exports
- `rust/engine/crates/assets/src/mesh_cache.rs` - Registered 5 new primitives
