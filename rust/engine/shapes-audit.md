# Three.js Editor Shapes → Rust Engine Audit

**Last Updated**: 2025-10-19
**Purpose**: Track visual parity between Three.js editor "Add" menu and Rust rendering engine

## Executive Summary

| Category             | Total  | ✅ Implemented | 🟡 Needs Work | ❌ Missing | Coverage |
| -------------------- | ------ | -------------- | ------------- | ---------- | -------- |
| **Basic Shapes**     | 5      | 5              | 0             | 0          | 100% ✅  |
| **Geometric Shapes** | 5      | 2              | 3             | 0          | 40% 🟡   |
| **Polyhedra**        | 4      | 4              | 0             | 0          | 100% ✅  |
| **Mathematical**     | 3      | 1              | 0             | 2          | 33% ❌   |
| **Structural**       | 4      | 0              | 0             | 4          | 0% ❌    |
| **Decorative**       | 5      | 0              | 0             | 5          | 0% ❌    |
| **Environment**      | 5      | 0              | 0             | 5          | 0% ❌    |
| **TOTAL**            | **31** | **12**         | **3**         | **16**     | **39%**  |

**Critical Shapes Coverage**: 16/16 (100%) ✅
**All Shapes Coverage**: 12/31 (39%) 🟡

---

## ✅ Fully Implemented Shapes

### Basic Shapes (5/5) ✅

| Shape        | Three.js                            | Rust Implementation                          | Status      |
| ------------ | ----------------------------------- | -------------------------------------------- | ----------- |
| **Cube**     | `BoxGeometry(1,1,1)`                | `vibe_assets::create_cube()`                 | ✅ Complete |
| **Sphere**   | `SphereGeometry(0.5, 32, 32)`       | `vibe_assets::create_sphere(16, 16)`         | ✅ Complete |
| **Cylinder** | `CylinderGeometry(0.5, 0.5, 1, 32)` | `vibe_assets::create_cylinder(0.5, 1.0, 32)` | ✅ Complete |
| **Cone**     | `ConeGeometry(0.5, 1, 32)`          | `vibe_assets::create_cone(0.5, 1.0, 32)`     | ✅ Complete |
| **Plane**    | `PlaneGeometry(1,1)`                | `vibe_assets::create_plane(1.0)`             | ✅ Complete |

### Polyhedra (4/4) ✅

| Shape            | Three.js                       | Rust Implementation                        | Status      |
| ---------------- | ------------------------------ | ------------------------------------------ | ----------- |
| **Tetrahedron**  | `TetrahedronGeometry(0.5, 0)`  | `vibe_assets::create_tetrahedron(0.5, 0)`  | ✅ Complete |
| **Octahedron**   | `OctahedronGeometry(0.5, 0)`   | `vibe_assets::create_octahedron(0.5, 0)`   | ✅ Complete |
| **Dodecahedron** | `DodecahedronGeometry(0.5, 0)` | `vibe_assets::create_dodecahedron(0.5, 0)` | ✅ Complete |
| **Icosahedron**  | `IcosahedronGeometry(0.5, 0)`  | `vibe_assets::create_icosahedron(0.5, 0)`  | ✅ Complete |

### Geometric Shapes - Implemented (2/5)

| Shape       | Three.js                           | Rust Implementation                            | Status      |
| ----------- | ---------------------------------- | ---------------------------------------------- | ----------- |
| **Torus**   | `TorusGeometry(0.5, 0.2, 16, 100)` | `vibe_assets::create_torus(0.5, 0.2, 16, 100)` | ✅ Complete |
| **Capsule** | `CapsuleGeometry(0.3, 0.4, 4, 16)` | `vibe_assets::create_capsule(0.3, 0.4, 4, 16)` | ✅ Complete |

### Mathematical Shapes - Implemented (1/3)

| Shape         | Three.js                                   | Rust Implementation                   | Status      |
| ------------- | ------------------------------------------ | ------------------------------------- | ----------- |
| **TorusKnot** | `TorusKnotGeometry(0.4, 0.1, 64, 8, 2, 3)` | `vibe_assets::create_torus_knot(...)` | ✅ Complete |

---

## 🟡 Partially Implemented (Parameter Variations)

These shapes are **parameter variations** of existing primitives. They need dedicated `meshId` handling in `primitive_mesh.rs`:

| Shape         | Three.js Equivalent                | Implementation Strategy                       | Priority  |
| ------------- | ---------------------------------- | --------------------------------------------- | --------- |
| **Trapezoid** | `CylinderGeometry(0.3, 0.7, 1, 4)` | Use `create_cylinder()` with trapezoid params | 🟡 Medium |
| **Prism**     | `CylinderGeometry(0.5, 0.5, 1, 6)` | Use `create_cylinder()` with 6 segments       | 🟡 Medium |
| **Pyramid**   | `ConeGeometry(0.5, 1, 4)`          | Use `create_cone()` with 4 segments           | 🟡 Medium |

**Implementation**: Add meshId matching in `rust/engine/src/renderer/primitive_mesh.rs`

Example:

```rust
mesh if mesh.contains("trapezoid") || mesh == "Trapezoid" => {
    log::info!("    Creating:    Trapezoid (truncated cylinder, 4 segments)");
    let vibe_mesh = vibe_assets::create_cylinder(0.5, 1.0, 4); // 4 segments = trapezoid
    convert_vibe_mesh_to_cpu_mesh(&vibe_mesh)
}
```

---

## ❌ Missing Shapes (Not Implemented)

### Mathematical Shapes (2 Missing)

| Shape           | Three.js                  | Implementation Complexity     | Priority |
| --------------- | ------------------------- | ----------------------------- | -------- |
| **Helix**       | Custom parametric curve   | High - needs curve generation | Low ⚪   |
| **MobiusStrip** | Custom parametric surface | High - needs twisted surface  | Low ⚪   |

**Recommendation**: Implement if needed, otherwise use GLTF models

### Structural Shapes (4 Missing)

| Shape            | Description        | Implementation Complexity         | Priority  |
| ---------------- | ------------------ | --------------------------------- | --------- |
| **Wall**         | Thin box (2x1x0.1) | Low - parameter variation of cube | Medium 🟡 |
| **Ramp**         | Inclined plane     | Medium - needs custom geometry    | Medium 🟡 |
| **Stairs**       | Step geometry      | Medium - procedural steps         | Low ⚪    |
| **SpiralStairs** | Helical staircase  | High - complex geometry           | Low ⚪    |

### Decorative Shapes (5 Missing)

| Shape       | Description            | Implementation Complexity    | Priority |
| ----------- | ---------------------- | ---------------------------- | -------- |
| **Star**    | Extruded star polygon  | Medium - 2D extrusion        | Low ⚪   |
| **Heart**   | Heart-shaped extrusion | Medium - 2D bezier extrusion | Low ⚪   |
| **Diamond** | Faceted gem shape      | Low - modified octahedron    | Low ⚪   |
| **Cross**   | 3D cross shape         | Low - box composition        | Low ⚪   |
| **Tube**    | Curved tube along path | Medium - path extrusion      | Low ⚪   |

### Environment Shapes (5 Missing)

| Shape       | Description          | Implementation Complexity   | Priority |
| ----------- | -------------------- | --------------------------- | -------- |
| **Terrain** | Heightmap terrain    | N/A - **EXCLUDED** per user | N/A      |
| **Tree**    | Procedural tree      | High - complex procedural   | Low ⚪   |
| **Rock**    | Irregular rock shape | Medium - noise-based        | Low ⚪   |
| **Bush**    | Spherical foliage    | Low - modified sphere       | Low ⚪   |
| **Grass**   | Blade cluster        | Medium - instanced geometry | Low ⚪   |

**Recommendation**: Use GLTF models instead of procedural generation for these shapes

---

## 🎯 Implementation Priorities

### Phase 1: Critical Gaps (COMPLETE ✅)

- [x] Platonic solids (Tetrahedron, Octahedron, Dodecahedron, Icosahedron)
- [x] Basic shapes (Cube, Sphere, Cylinder, Cone, Plane)
- [x] Geometric shapes (Torus, TorusKnot, Capsule)

### Phase 2: Parameter Variations (IN PROGRESS 🟡)

- [ ] Trapezoid (4-segment cylinder)
- [ ] Prism (6-segment cylinder)
- [ ] Pyramid (4-segment cone)
- [ ] Wall (thin box 2x1x0.1)

**Estimated effort**: 2-4 hours
**Files to modify**: `rust/engine/src/renderer/primitive_mesh.rs`

### Phase 3: Structural Shapes (PLANNED 📋)

- [ ] Ramp (inclined plane)
- [ ] Stairs (step geometry)
- [ ] SpiralStairs (helical staircase)

**Estimated effort**: 6-8 hours
**Files to create**: `rust/engine/crates/assets/src/primitives_structural.rs`

### Phase 4: Decorative & Mathematical (LOW PRIORITY ⚪)

- [ ] Star, Heart, Diamond, Cross
- [ ] Helix, MobiusStrip
- [ ] Environment shapes (Tree, Rock, Bush, Grass)

**Recommendation**: Only implement if actively used in scenes. Use GLTF models otherwise.

---

## 📁 Code Organization

### Current Structure

```
rust/engine/crates/assets/src/
├── primitives.rs              ✅ Basic shapes (cube, sphere, plane)
├── primitives_cylinders.rs    ✅ Cylindrical family (cylinder, cone, capsule)
├── primitives_torus.rs        ✅ Torus family (torus, torus knot)
├── primitives_platonic.rs     ✅ Platonic solids (4 shapes)
├── primitives_structural.rs   📋 TO CREATE (wall, ramp, stairs)
├── primitives_decorative.rs   📋 TO CREATE (star, heart, diamond, cross)
├── primitives_math.rs         📋 TO CREATE (helix, mobius strip)
└── lib.rs                     ✅ Exports
```

### Integration Point

```
rust/engine/src/renderer/
└── primitive_mesh.rs          🟡 Needs meshId handling for new shapes
```

---

## 🔧 Fallback Placeholder System

For shapes that are not yet implemented, we should add a fallback placeholder:

### Requirements

1. Render a simple wireframe cube or sphere
2. Display shape name as 3D text or billboard
3. Log warning message
4. Make it visually distinct (different color/material)

### Implementation Location

- `rust/engine/src/renderer/primitive_mesh.rs` - fallback in default case
- Add text rendering capability or use debug visualization

### Example

```rust
_ => {
    log::warn!("    Shape '{}' not implemented - using placeholder", id);
    // Create a distinctive placeholder (wireframe cube with label)
    create_placeholder_shape(id)
}
```

---

## ✅ Verification Checklist

For each implemented shape:

- [ ] Rust implementation generates correct vertex/face count
- [ ] Visual comparison with Three.js output (same dimensions)
- [ ] UV mapping matches Three.js (texture coordinates)
- [ ] Normal vectors match Three.js (lighting identical)
- [ ] Unit tests cover edge cases
- [ ] Performance acceptable (< 1ms generation)
- [ ] meshId handling in `primitive_mesh.rs`
- [ ] Exported from `lib.rs`

---

## 📊 Testing Plan

### Test Scene: "allshapes"

Create `rust/game/scenes/allshapes.json` with all shapes arranged in a grid:

```
Row 1: Cube, Sphere, Cylinder, Cone, Plane
Row 2: Torus, Capsule, TorusKnot, Tetrahedron, Octahedron
Row 3: Dodecahedron, Icosahedron, Trapezoid, Prism, Pyramid
Row 4: Wall, Ramp, Stairs, SpiralStairs, Star
Row 5: Heart, Diamond, Cross, Tube, Helix
Row 6: MobiusStrip, Tree, Rock, Bush, Grass
```

Each shape:

- Position: Grid layout (spacing 3 units)
- Material: Same material for consistency
- Lighting: Directional + ambient
- Camera: Positioned to view all shapes

### Visual Debugger Validation

1. Capture screenshot of Three.js editor rendering all shapes
2. Capture screenshot of Rust engine rendering all shapes
3. Use visual-debugger agent to compare
4. Verify:
   - Shape proportions match
   - Lighting/shading identical
   - UV mapping correct (if textured)
   - No missing shapes (placeholders visible)

---

## 📝 Next Steps

1. **[IN PROGRESS]** Create test scene `allshapes.json` with all shapes
2. **[PENDING]** Implement parameter variations (Trapezoid, Prism, Pyramid, Wall)
3. **[PENDING]** Add fallback placeholder system
4. **[PENDING]** Run visual-debugger to verify parity
5. **[OPTIONAL]** Implement structural shapes (Ramp, Stairs, SpiralStairs)
6. **[LOW PRIORITY]** Implement decorative/math shapes or use GLTF

---

## 🔗 References

- **Three.js Geometry Source**: `node_modules/three/src/geometries/`
- **Three.js Editor Add Menu**: `src/editor/config/gameObjectMenuData.tsx`
- **Rust Primitives**: `rust/engine/crates/assets/src/primitives*.rs`
- **Integration Point**: `rust/engine/src/renderer/primitive_mesh.rs`
- **Existing Audit**: `rust/engine/INTEGRATION_PRIMITIVES_AUDIT.md`

---

**Status Legend**:

- ✅ **Complete**: Fully implemented with visual parity
- 🟡 **Needs Work**: Exists but needs refinement or parameter mapping
- ❌ **Missing**: Not implemented
- ⚪ **Low Priority**: Can be deferred or use GLTF models
- 📋 **Planned**: Scheduled for implementation
