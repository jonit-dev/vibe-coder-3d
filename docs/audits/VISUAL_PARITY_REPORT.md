# Visual Parity Report: Rust Renderer vs Three.js Benchmark

**Date:** 2025-01-27  
**Comparison:** Rust rendering engine output vs Three.js benchmark reference

## Executive Summary

The Rust renderer is missing several critical rendering features that prevent visual parity with the Three.js benchmark. The primary issues are: **missing shadows**, **incorrect object positioning**, **missing ground plane grid**, and **flat/unlit appearance**.

---

## Critical Issues

### 1. **Shadows Not Rendering** 🔴 CRITICAL

**Issue:** No shadows are visible in the Rust renderer output, despite shadow generation code being present.

**Expected Behavior (Three.js Benchmark):**

- Both capsule and cube cast distinct shadows on the grid plane
- Shadows are dark grey with soft, slightly diffused edges
- Shadows extend towards bottom-right (indicating top-left light source)
- Capsule shadow is elongated and rounded
- Cube shadow is square-ish

**Current Behavior (Rust Renderer):**

- Complete absence of shadows
- No shadow artifacts visible on ground plane

**Root Cause Analysis:**

- Shadow map generation code exists in `generate_shadow_maps()` (`threed_renderer.rs:2012-2045`)
- Shadow maps are generated for directional lights with `cast_shadow=true`
- However, shadows may not be properly:
  1. **Sampled in shaders** - Shadow maps may not be bound/sampled correctly
  2. **Applied to meshes** - `receiveShadows` flag may not be respected
  3. **Rendered** - Shadow maps may not be included in render passes

**Code References:**

- Shadow generation: `rust/engine/src/threed_renderer.rs:2012-2045`
- Enhanced lights: `rust/engine/src/renderer/enhanced_lights.rs:46-55`
- Shadow shader injection: `rust/engine/src/renderer/enhanced_lights.rs:171-247`

**Impact:** **HIGH** - Shadows are fundamental for depth perception and visual quality.

---

### 2. **Capsule Partially Submerged in Floor** 🔴 CRITICAL

**Issue:** The capsule appears to be "drowned" or embedded into the floor plane, with its base cutting across the floor line rather than resting on top.

**Expected Behavior (Three.js Benchmark):**

- Capsule rests directly on the grid plane
- Base of capsule sits flush with ground surface
- No intersection/embedding visible

**Current Behavior (Rust Renderer):**

- Capsule's lowest visible point is below the floor line
- Floor line cuts across the capsule's lower cylindrical body
- Appears partially submerged

**Root Cause Analysis:**

- **Transform positioning issue**: Capsule Y-position may be incorrect
- **Primitive origin**: Capsule mesh origin may be at center instead of bottom
- **Ground plane positioning**: Ground plane Y-position may be incorrect
- **Coordinate system mismatch**: Possible Y-axis inversion or offset issue

**Code References:**

- Primitive mesh scaling: `rust/engine/src/renderer/primitive_mesh.rs:9-39`
- Capsule creation: `rust/engine/crates/assets/src/primitives_cylinders.rs:234-246`
- Transform conversion: `rust/engine/src/renderer/coordinate_conversion.rs`

**Impact:** **HIGH** - Incorrect object positioning breaks scene composition.

---

### 4. **Flat, Unlit Appearance** 🟡 HIGH PRIORITY

**Issue:** Objects appear uniformly lit with no shading, highlights, or depth cues from lighting.

**Expected Behavior (Three.js Benchmark):**

- Objects show subtle shading with highlights on top-left surfaces
- Surfaces facing light source appear brighter
- Surfaces facing away appear darker
- Three-dimensional appearance with depth perception

**Current Behavior (Rust Renderer):**

- Completely flat, uniform appearance
- No gradients, highlights, or shading variations
- Objects appear 2D despite being 3D geometry

**Root Cause Analysis:**

- **Lighting not applied**: Lights may exist but not affect shading
- **Material properties**: Materials may not respond to light (e.g., emissive-only)
- **Shader issues**: PBR shader may not be sampling lights correctly
- **Light intensity**: Lights may be too weak or ambient-only
- **Normal mapping**: Surface normals may be incorrect

**Code References:**

- Light collection: `rust/engine/src/threed_renderer.rs:1982-1999`
- Material creation: `rust/engine/src/renderer/material_manager.rs`
- PBR rendering: `three-d` library integration

**Impact:** **HIGH** - Flat appearance destroys 3D visual quality.

---

### 5. **Object Positioning Relative to Ground** 🟡 MEDIUM PRIORITY

**Issue:** Objects may not be positioned correctly relative to the ground plane.

**Expected Behavior (Three.js Benchmark):**

- Cube sits flush on grid plane
- Capsule sits flush on grid plane
- Objects are properly spaced horizontally

**Current Behavior (Rust Renderer):**

- Cube appears correctly positioned
- Capsule is partially submerged (see Issue #2)
- Relative positioning may be incorrect

**Root Cause Analysis:**

- **Y-axis positioning**: Object Y-positions may need adjustment
- **Ground plane Y-position**: Ground may be at wrong Y coordinate
- **Primitive origins**: Mesh origins may differ between primitives

**Impact:** **MEDIUM** - Affects scene composition but less critical than shadows.

---

### 6. **Missing Visual Depth Cues** 🟢 LOW PRIORITY

**Issue:** Scene lacks depth perception aids beyond shadows.

**Expected Behavior (Three.js Benchmark):**

- Grid lines provide perspective depth cues
- Shadows provide depth information
- Lighting provides shape definition
- Background is uniform dark grey (no distractions)

**Current Behavior (Rust Renderer):**

- No shadows (removes primary depth cue)
- No grid (removes secondary depth cue)
- Flat lighting (removes shape definition)
- Uniform background (correct, but insufficient without other cues)

**Impact:** **LOW** - Secondary issue that compounds other problems.

---

## Technical Analysis

### Shadow System Architecture

The Rust renderer has shadow infrastructure in place:

1. **Shadow Map Generation** ✅ Implemented

   - `generate_shadow_maps()` filters meshes by `cast_shadows` flag
   - Generates shadow maps for directional and spot lights
   - Uses `EnhancedDirectionalLight` with shadow bias and radius support

2. **Shadow Shader Injection** ✅ Implemented

   - `inject_shadow_enhancements()` modifies shader code
   - Adds PCF (Percentage Closer Filtering) support
   - Injects shadow bias to prevent shadow acne

3. **Shadow Sampling** ❓ Unknown
   - Shader injection code exists but may not be called correctly
   - Shadow maps may not be bound to shader uniforms
   - `receiveShadows` flag may not be respected in rendering

### Lighting System

1. **Light Collection** ✅ Implemented

   - `collect_lights()` gathers all light types
   - Lights are passed to render calls

2. **Light Application** ❓ Unknown
   - Lights are passed to `render()` but may not affect shading
   - Material properties may override lighting
   - Shader may not sample light uniforms correctly

### Transform System

1. **Coordinate Conversion** ✅ Implemented

   - `threejs_to_threed_position()` converts coordinates
   - Transform utilities handle scaling and rotation

2. **Primitive Scaling** ✅ Implemented

   - `primitive_base_scale()` handles primitive normalization
   - Capsule uses `GlamVec3::ONE` (no scaling)

3. **Position Application** ❓ Unknown
   - Transforms are applied but Y-position may be incorrect
   - Ground plane Y-position may conflict with object positions

---

## Recommended Fix Priority

### Phase 1: Critical Fixes (Immediate)

1. **Fix Shadow Rendering** 🔴

   - Verify shadow maps are bound to shader uniforms
   - Ensure `receiveShadows` flag is respected
   - Test shadow map generation and sampling
   - Verify shadow shader injection is working

2. **Fix Capsule Positioning** 🔴
   - Investigate capsule mesh origin (center vs bottom)
   - Adjust capsule Y-position to sit on ground
   - Verify ground plane Y-position
   - Test coordinate system consistency

### Phase 2: High Priority (Next Sprint)

3. **Fix Flat Lighting** 🟡

   - Verify lights are affecting material shading
   - Check PBR shader light sampling
   - Adjust light intensities
   - Test material response to lighting

4. **Add Ground Plane Grid** 🟡
   - Implement grid texture/material for ground
   - Or enable debug grid rendering
   - Match Three.js grid appearance

### Phase 3: Polish (Future)

5. **Improve Visual Quality** 🟢
   - Fine-tune shadow softness
   - Adjust lighting angles and intensities
   - Match color palette exactly
   - Add any missing visual effects

---

## Testing Recommendations

1. **Shadow Test Scene**

   - Create minimal scene with one light, one caster, one receiver
   - Verify shadow map generation logs
   - Check shader uniforms are populated
   - Render shadow map to texture for debugging

2. **Positioning Test Scene**

   - Create scene with capsule at Y=0, ground at Y=0
   - Verify mesh origins
   - Test with different primitive types
   - Compare with Three.js output

3. **Lighting Test Scene**
   - Create scene with single directional light
   - Test with different material properties
   - Verify light direction affects shading
   - Compare brightness values

---

## Code Investigation Checklist

- [ ] Verify `generate_shadow_maps()` is called before rendering
- [ ] Check shadow maps are bound to shader uniforms
- [ ] Verify `receiveShadows` flag affects rendering
- [ ] Test shadow shader injection is working
- [ ] Check capsule mesh origin point
- [ ] Verify ground plane Y-position
- [ ] Test light uniforms in shader
- [ ] Verify material PBR properties
- [ ] Check normal vectors are correct
- [ ] Test coordinate system consistency

---

## Conclusion

The Rust renderer has the infrastructure for shadows and lighting, but critical rendering paths are not functioning correctly. The primary blockers are:

1. **Shadows not rendering** - Most critical visual issue
2. **Capsule positioning** - Breaks scene composition
3. **Flat lighting** - Destroys 3D appearance

Fixing these three issues will bring the renderer significantly closer to visual parity with the Three.js benchmark.
