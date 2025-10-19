# Primitive Mesh Integration Audit

**TypeScript Editor → Rust Engine Primitive Mesh Integration**

This document audits which primitive meshes are supported between the TypeScript/Three.js editor and the Rust/three-d engine.

---

## ✅ Fully Integrated Primitives

| Primitive     | TypeScript (Three.js)               | Rust Implementation                                                   | Status  |
| ------------- | ----------------------------------- | --------------------------------------------------------------------- | ------- |
| **Cube/Box**  | `BoxGeometry(1,1,1)`                | `vibe_assets::create_cube()` + `three_d::CpuMesh::cube()`             | 🟢 100% |
| **Sphere**    | `SphereGeometry(0.5, 32, 32)`       | `vibe_assets::create_sphere(32, 32)` + `three_d::CpuMesh::sphere(16)` | 🟢 100% |
| **Plane**     | `PlaneGeometry(1,1)`                | `vibe_assets::create_plane(1.0)` + `three_d::CpuMesh::square()`       | 🟢 100% |
| **Cylinder**  | `CylinderGeometry(0.5, 0.5, 1, 32)` | `vibe_assets::create_cylinder(0.5, 1.0, 32)`                          | 🟢 100% |
| **Cone**      | `ConeGeometry(0.5, 1, 32)`          | `vibe_assets::create_cone(0.5, 1.0, 32)`                              | 🟢 100% |
| **Capsule**   | `CapsuleGeometry(0.3, 0.4, 4, 16)`  | `vibe_assets::create_capsule(0.3, 0.4, 16)`                           | 🟢 100% |
| **Torus**     | `TorusGeometry(0.5, 0.2, 16, 100)`  | `vibe_assets::create_torus(0.5, 0.2, 16, 100)`                        | 🟢 100% |
| **TorusKnot** | `TorusKnotGeometry` (custom)        | `vibe_assets::create_torus_knot(...)`                                 | 🟢 100% |

---

## 🟡 Partially Integrated (Fallback to Basic Shapes)

These primitives are referenced in the TypeScript editor but map to simpler shapes on the Rust side:

| Primitive     | TypeScript Geometry                | Current Rust Fallback         | Status                      |
| ------------- | ---------------------------------- | ----------------------------- | --------------------------- |
| **Wall**      | `BoxGeometry(2, 1, 0.1)`           | Falls back to cube            | 🟡 Needs dimension override |
| **Trapezoid** | `CylinderGeometry(0.3, 0.7, 1, 4)` | Could use `create_cylinder()` | 🟡 Needs param mapping      |
| **Prism**     | `CylinderGeometry(0.5, 0.5, 1, 6)` | Could use `create_cylinder()` | 🟡 Needs param mapping      |
| **Pyramid**   | `ConeGeometry(0.5, 1, 4)`          | Could use `create_cone()`     | 🟡 Needs param mapping      |

---

## 🔴 Missing Primitives (Platonic Solids)

These primitives exist in Three.js but have no Rust implementation:

| Primitive        | TypeScript Geometry            | Vertices | Faces | Rust Status |
| ---------------- | ------------------------------ | -------- | ----- | ----------- |
| **Tetrahedron**  | `TetrahedronGeometry(0.5, 0)`  | 4        | 4     | ❌ Missing  |
| **Octahedron**   | `OctahedronGeometry(0.5, 0)`   | 6        | 8     | ❌ Missing  |
| **Dodecahedron** | `DodecahedronGeometry(0.5, 0)` | 20       | 12    | ❌ Missing  |
| **Icosahedron**  | `IcosahedronGeometry(0.5, 0)`  | 12       | 20    | ❌ Missing  |

**Impact**: Medium

- Not frequently used in games
- Can fallback to sphere for physics
- Needed for complete editor parity

---

## ⚪ Missing Custom Shapes (Low Priority)

These are custom parametric shapes in the TypeScript editor. They are **NOT critical** for engine functionality but needed for full editor parity:

### Architectural Shapes

- **Ramp** - Inclined plane geometry
- **Stairs** - Step geometry
- **SpiralStairs** - Helical staircase

### Decorative Shapes

- **Star** - Extruded star polygon
- **Heart** - Heart-shaped extrusion
- **Diamond** - Faceted gem shape
- **Cross** - 3D cross shape

### Parametric Shapes

- **Helix** - Spiral curve
- **MobiusStrip** - Twisted ribbon
- **Tube** - Curved tube along path

### Nature Shapes

- **Tree** - Procedural tree
- **Rock** - Irregular rock shape
- **Bush** - Spherical foliage cluster
- **Grass** - Blade cluster

**Status**: ❌ Not implemented
**Recommendation**: Only implement if actively used in scenes. Use GLTF models instead for complex shapes.

---

## 📊 Integration Coverage

### By Category

| Category               | Total | Implemented | Coverage               |
| ---------------------- | ----- | ----------- | ---------------------- |
| **Basic Primitives**   | 8     | 8           | 100% ✅                |
| **Platonic Solids**    | 4     | 0           | 0% ❌                  |
| **Derived Primitives** | 4     | 0           | 0% (fallback works) 🟡 |
| **Custom Shapes**      | 14    | 0           | 0% ⚪                  |

### Overall Coverage

- **Critical Primitives**: 8/8 (100%) ✅
- **Standard Primitives**: 8/12 (67%) 🟡
- **All Primitives**: 8/26 (31%) 🔴

**Note**: The 100% coverage of critical primitives means the engine can render all common 3D shapes. Missing primitives are either rare (Platonic solids) or decorative (custom shapes).

---

## 🎯 Implementation Strategy (DRY Approach)

### Option 1: Port Three.js Geometry Algorithms (RECOMMENDED)

**Strategy**: Copy Three.js geometry generation code, adapt to Rust

**Pros**:

- ✅ **Exact visual parity** with TypeScript editor
- ✅ **Well-tested** algorithms (Three.js is battle-tested)
- ✅ **Detailed documentation** in Three.js source
- ✅ **Parametric control** matches editor exactly

**Cons**:

- ⚠️ Requires manual porting (not code generation)
- ⚠️ Need to understand Three.js vertex/index generation

**Implementation**:

1. Reference Three.js source: `node_modules/three/src/geometries/`
2. Port vertex generation logic to Rust
3. Use existing `vibe_assets::Mesh` structure
4. Add to `primitives.rs` or separate files

**Example** (Platonic Solids):

```rust
// Port from THREE.PolyhedronGeometry (base class for all platonic solids)
pub fn create_polyhedron(vertices: &[[f32; 3]], indices: &[u32], radius: f32, detail: u32) -> Mesh {
    // Three.js approach:
    // 1. Take base vertex positions
    // 2. Subdivide faces if detail > 0
    // 3. Project to sphere surface at radius
    // 4. Calculate normals and UVs
    // ... (see THREE.PolyhedronGeometry source)
}

// Then create specific solids:
pub fn create_tetrahedron(radius: f32, detail: u32) -> Mesh {
    const VERTICES: [[f32; 3]; 4] = [
        [1.0, 1.0, 1.0], [-1.0, -1.0, 1.0],
        [-1.0, 1.0, -1.0], [1.0, -1.0, -1.0],
    ];
    const INDICES: [u32; 12] = [2, 1, 0, 0, 3, 2, 1, 3, 0, 2, 3, 1];
    create_polyhedron(&VERTICES, &INDICES, radius, detail)
}
```

**References**:

- Three.js PolyhedronGeometry: `node_modules/three/src/geometries/PolyhedronGeometry.js`
- Three.js TetrahedronGeometry: `node_modules/three/src/geometries/TetrahedronGeometry.js`
- Three.js OctahedronGeometry: `node_modules/three/src/geometries/OctahedronGeometry.js`
- Three.js DodecahedronGeometry: `node_modules/three/src/geometries/DodecahedronGeometry.js`
- Three.js IcosahedronGeometry: `node_modules/three/src/geometries/IcosahedronGeometry.js`

---

### Option 2: Use three-d Built-in Primitives

**Strategy**: Leverage three-d's existing primitive implementations

**Current Support** (from three-d crate):

- ✅ `CpuMesh::cube()` - Used for cube
- ✅ `CpuMesh::sphere(subdivisions)` - Used for sphere
- ✅ `CpuMesh::square()` - Used for plane
- ✅ `CpuMesh::cylinder(...)` - Available but not exposed yet
- ❌ No platonic solids
- ❌ No custom shapes

**Pros**:

- ✅ Less code to write/maintain
- ✅ Optimized by three-d authors

**Cons**:

- ⚠️ May not match Three.js dimensions/UVs exactly
- ⚠️ Missing many shapes we need
- ⚠️ Less control over parameters

**Recommendation**: Use for basic shapes only (cube, sphere, plane). Port Three.js for everything else.

---

### Option 3: Hybrid Approach (BEST BALANCE)

**Strategy**: Combine both approaches based on primitive complexity

| Primitive Type                                   | Implementation Strategy                                            |
| ------------------------------------------------ | ------------------------------------------------------------------ |
| **Basic Primitives** (cube, sphere, plane)       | ✅ Use three-d built-ins (already done)                            |
| **Cylindrical Shapes** (cylinder, cone, capsule) | ✅ Custom implementation (already done, follows Three.js)          |
| **Torus Shapes**                                 | ✅ Custom implementation (already done, follows Three.js)          |
| **Platonic Solids**                              | 🔶 Port from Three.js `PolyhedronGeometry`                         |
| **Custom Shapes**                                | ⚪ **Low Priority** - Only implement if needed for specific scenes |

**Rationale**:

- Basic shapes are simple enough that three-d's implementations work fine
- Complex parametric shapes (cylinder, torus) need exact Three.js matching → custom code
- Platonic solids share common base (PolyhedronGeometry) → can be DRY
- Custom shapes are decorative and better handled via GLTF models

---

## 📝 Recommended Implementation Plan

### Phase 1: Platonic Solids (HIGH PRIORITY)

**Why**: Complete basic primitive set, needed for editor parity

1. **Create `primitives_platonic.rs`**:

   - Port Three.js `PolyhedronGeometry` base implementation
   - Create builder pattern for subdivision/radius control
   - Implement all 4 platonic solids

2. **Integration**:

   - Add to `vibe_assets::lib.rs` exports
   - Update `primitive_mesh.rs` to recognize new meshIds
   - Add fallback scaling in `primitive_base_scale()`

3. **Testing**:
   - Unit tests for vertex counts
   - Visual tests against Three.js reference
   - Physics collider tests

**Estimated Effort**: 8-12 hours

**Three.js Reference Code**:

```javascript
// node_modules/three/src/geometries/PolyhedronGeometry.js
class PolyhedronGeometry extends BufferGeometry {
  constructor(vertices, indices, radius = 1, detail = 0) {
    // Base algorithm for all platonic solids
    // 1. Subdivide triangular faces
    // 2. Push vertices to sphere surface
    // 3. Calculate UVs
    // 4. Calculate normals
  }
}
```

---

### Phase 2: Derived Primitives (MEDIUM PRIORITY)

**Why**: Improve editor UX, avoid fallbacks

1. **Wall / Trapezoid / Prism / Pyramid**:

   - These are just parameter variations of existing shapes
   - Add dimension override system to `MeshRenderer.meshId`
   - OR: Add dedicated `meshId` patterns like `"wall:2x1x0.1"`

2. **Example**:

```rust
pub fn create_primitive_mesh(mesh_id: Option<&str>) -> CpuMesh {
    if let Some(id) = mesh_id {
        match id {
            "wall" => create_box_with_dimensions(2.0, 1.0, 0.1),
            "pyramid" => create_cone(0.5, 1.0, 4), // 4 radial segments
            "prism" => create_cylinder(0.5, 1.0, 6), // 6 radial segments
            "trapezoid" => create_truncated_cone(0.3, 0.7, 1.0, 4),
            // ...
        }
    }
}
```

**Estimated Effort**: 2-4 hours

---

### Phase 3: Custom Shapes (LOW PRIORITY / AS-NEEDED)

**Why**: Only if actively used in scenes, otherwise use GLTF models

**Recommendation**: **Don't implement** unless specific scenes need them

**Alternative**:

1. Export custom shapes from TypeScript editor as GLTF models
2. Load via `vibe_assets::load_gltf()` (already implemented)
3. Avoids maintaining complex procedural geometry code

**If Needed**:

- Port one shape at a time based on usage
- Follow existing pattern: `primitives_custom.rs`
- Use `CustomShapeRegistry` similar to TypeScript side

---

## 🔧 Code Organization

### Current Structure (Good, Keep This)

```
rust/engine/crates/assets/src/
├── primitives.rs              # Basic primitives (cube, sphere, plane)
├── primitives_cylinders.rs    # Cylindrical family (cylinder, cone, capsule)
├── primitives_torus.rs        # Torus family (torus, torus knot)
├── primitives_platonic.rs     # 🔶 TO CREATE: Platonic solids
├── vertex.rs                  # Vertex structure
├── vertex_builder.rs          # DRY vertex utilities
├── geometry_math.rs           # Math helpers (circle points, UVs, etc.)
└── lib.rs                     # Public exports
```

### DRY Utilities (Already Implemented ✅)

Located in `vertex_builder.rs`:

- ✅ `vertex_pnu()` - Create vertex with position, normal, UV
- ✅ `quad_indices()` - Generate quad indices
- ✅ `triangle_fan_indices()` - Generate fan indices
- ✅ `ring_strip_indices()` - Generate ring strip indices
- ✅ `cap_indices()` - Generate cap indices

Located in `geometry_math.rs`:

- ✅ `circle_points_xz()` - Generate circle points on XZ plane
- ✅ `cylindrical_uv()` - Calculate cylindrical UV mapping
- ✅ `normalize()` - Normalize vector

**These utilities follow the DRY principle and are already used in cylinder/torus/capsule implementations.**

---

## 📚 Three.js Source Reference

### How to Port a Geometry from Three.js

1. **Locate Source**:

   ```bash
   node_modules/three/src/geometries/XxxGeometry.js
   ```

2. **Understand Structure**:

   - `vertices` array (position data)
   - `indices` array (triangle indices)
   - `normals` array (normal vectors)
   - `uvs` array (texture coordinates)

3. **Port to Rust**:

   - Convert Float32Array → `Vec<f32>`
   - Convert Uint32Array → `Vec<u32>`
   - Use existing `Vertex` struct
   - Use `vibe_assets::Mesh::new(vertices, indices)`

4. **Match Parameters**:
   - Three.js uses `radius`, `detail` for platonic solids
   - Rust should accept same parameters
   - Default values should match Three.js defaults

### Example: OctahedronGeometry.js → create_octahedron()

**Three.js**:

```javascript
const vertices = [1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1];
const indices = [0, 2, 4, 0, 4, 3, 0, 3, 5, 0, 5, 2, 1, 2, 5, 1, 5, 3, 1, 3, 4, 1, 4, 2];
```

**Rust**:

```rust
pub fn create_octahedron(radius: f32, detail: u32) -> Mesh {
    const VERTICES: [[f32; 3]; 6] = [
        [1.0, 0.0, 0.0], [-1.0, 0.0, 0.0], [0.0, 1.0, 0.0],
        [0.0, -1.0, 0.0], [0.0, 0.0, 1.0], [0.0, 0.0, -1.0],
    ];
    const INDICES: [u32; 24] = [
        0, 2, 4,  0, 4, 3,  0, 3, 5,  0, 5, 2,
        1, 2, 5,  1, 5, 3,  1, 3, 4,  1, 4, 2,
    ];
    create_polyhedron(&VERTICES, &INDICES, radius, detail)
}
```

---

## ✅ Verification Checklist

Before marking a primitive as "fully integrated":

- [ ] Rust implementation generates correct vertex count
- [ ] Rust implementation generates correct face count
- [ ] Visual comparison with Three.js output (same radius/dimensions)
- [ ] UV mapping matches Three.js (texture coordinates)
- [ ] Normal vectors match Three.js (lighting looks identical)
- [ ] Physics collider matches visual geometry
- [ ] Performance is acceptable (< 1ms generation time for standard resolution)
- [ ] Unit tests cover edge cases (zero radius, high detail, etc.)

---

## 🎯 Summary

### Current Status

- ✅ **100% coverage** of critical primitives (cube, sphere, plane, cylinder, cone, capsule, torus)
- 🟡 **67% coverage** of standard primitives (missing platonic solids)
- ⚪ **0% coverage** of custom shapes (low priority, use GLTF instead)

### Recommended Next Steps

1. **Implement Platonic Solids** (8-12 hours):

   - Port Three.js `PolyhedronGeometry` base class
   - Implement Tetrahedron, Octahedron, Dodecahedron, Icosahedron
   - Add unit tests

2. **Add Derived Primitive Support** (2-4 hours):

   - Support Wall, Pyramid, Prism, Trapezoid via parameter mapping
   - Update `create_primitive_mesh()` to handle variations

3. **Document Custom Shape Strategy** (1 hour):
   - Recommend GLTF export from editor for complex shapes
   - Only implement custom shapes if actively used

### DRY Principles Applied

✅ **Already Following DRY**:

- `CylindricalBuilder` handles cylinder, cone, and capsule (shared 95% of code)
- `vertex_builder.rs` provides reusable vertex/index utilities
- `geometry_math.rs` provides shared math helpers
- Torus and TorusKnot use shared ring generation logic

🔶 **Recommended DRY Approach for Platonic Solids**:

- Create `PolyhedronBuilder` base class
- All 4 platonic solids use same subdivision/projection algorithm
- Only vertex positions and indices differ

---

## 📖 References

- **Three.js Geometry Source**: `node_modules/three/src/geometries/`
- **Three.js Docs**: https://threejs.org/docs/#api/en/geometries
- **Current Rust Implementation**: `rust/engine/crates/assets/src/primitives*.rs`
- **Integration Point**: `rust/engine/src/renderer/primitive_mesh.rs`

---

**Last Updated**: 2025-10-18
**Audit Version**: 1.0
**Engine Progress**: 75% complete
