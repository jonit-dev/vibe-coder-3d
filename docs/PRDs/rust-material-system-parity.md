# PRD: Rust Material System Feature Parity

## Overview

- **Context & Goals**: Achieve full feature parity between the TypeScript material system (Three.js MeshStandardMaterial) and the Rust engine's material rendering pipeline. Enable all material properties defined in the TypeScript schema to render correctly in the native Rust engine with PBR accuracy. This PRD addresses the material-related gaps identified in `rust/engine/INTEGRATION_AUDIT.md` sections 6 (Texture System), 5 (MeshRenderer), and the Priority 1-2 recommendations.
- **Current Pain Points** (from INTEGRATION_AUDIT.md):
  - **Section 6 - Texture System**: Only albedo textures render; normal, metallic/roughness, emissive, and occlusion maps ignored (all 5 texture types missing)
  - **Section 5 - MeshRenderer**: 69% of fields missing (18/26 fields not implemented), including entire inline `material` object and `materials[]` array
  - **Schema Mismatches**: Wrong default roughness value (0.5 vs TS 0.7), extra `opacity` field, redundant `metallic`/`metalness` fields
  - No emissive rendering (materials can't glow)
  - No unlit shader support (bypassing lighting)
  - No texture transforms (offset/repeat)
  - No transparency/alpha support
  - Material properties limited by instance buffer layout
  - Current coverage: Material 13%, MeshRenderer 23% → Target: 100%

## Proposed Solution

- **High-level Summary**:
  - Extend GPU material uniform buffer to support all PBR properties (emissive color/intensity, texture flags, UV transforms)
  - Implement multi-texture binding (5 texture slots: albedo, normal, metallic/roughness, emissive, occlusion)
  - Add normal mapping with tangent space calculation
  - Implement texture transform (UV offset/repeat/scale)
  - Add unlit shader variant for bypass lighting
  - Add alpha blending pipeline for transparency
  - Refactor shader to handle texture sampling with proper fallbacks
  - Fix default roughness mismatch (0.5 → 0.7)
  - Remove non-schema `opacity` field from Rust Material struct

### Architecture & Directory Structure

```
rust/engine/
├── crates/
│   └── assets/
│       └── src/
│           ├── material.rs              # Fix defaults, remove opacity field
│           └── texture_cache.rs         # Multi-texture loading API
└── src/
    └── render/
        ├── pipeline.rs                  # Multi-texture bind group layout
        ├── shader.wgsl                  # Add texture slots, UV transforms, emissive, normal mapping
        ├── shader_unlit.wgsl            # NEW: Unlit shader variant
        ├── material_uniform.rs          # NEW: MaterialUniform GPU buffer
        ├── scene_renderer.rs            # Upload material uniforms, multi-texture binding
        └── vertex.rs                    # Add tangent vectors for normal mapping
```

## Implementation Plan

### Phase 1: Schema Fixes & Material Uniform (1 day)

1. **Fix TypeScript Parity Issues**:

   - In `rust/engine/crates/assets/src/material.rs:89`:
     - Change `default_roughness()` from `0.5` to `0.7` (match TS default)
   - In `rust/engine/crates/assets/src/material.rs:24-25`:
     - Remove `opacity: f32` field (not in TS schema)
   - In `rust/engine/crates/assets/src/material.rs:147-171`:
     - Remove `opacity: 1.0` from `MaterialCache::default_material`

2. **Create Material Uniform Buffer**:

   - New file `rust/engine/src/render/material_uniform.rs`:
     ```rust
     #[repr(C)]
     #[derive(Copy, Clone, Pod, Zeroable)]
     pub struct MaterialUniform {
         pub emissive_color: [f32; 3],
         pub emissive_intensity: f32,
         pub uv_offset: [f32; 2],
         pub uv_repeat: [f32; 2],
         pub normal_scale: f32,
         pub occlusion_strength: f32,
         pub texture_flags: u32,  // Bit flags: albedo, normal, metallic, roughness, emissive, occlusion
         pub shader_type: u32,    // 0 = standard, 1 = unlit
     }
     ```
   - Add to bind group layout (group 2) in `pipeline.rs`

3. **Unit Tests**:
   - Test material deserialization with correct defaults
   - Test MaterialUniform creation from Material struct

### Phase 2: Multi-Texture Binding (1 day)

1. **Extend Bind Group Layout** (`pipeline.rs:243-265`):

   - Change group 1 from single texture to array of 6 textures:
     - Slot 0: Albedo
     - Slot 1: Normal
     - Slot 2: Metallic
     - Slot 3: Roughness
     - Slot 4: Emissive
     - Slot 5: Occlusion
   - Single shared sampler (binding 6)

2. **Update TextureCache** (`crates/assets/src/texture_cache.rs`):

   - Add `load_material_textures()` method that loads all textures for a material
   - Return `MaterialTextures` struct with optional texture references

3. **Update Scene Renderer** (`scene_renderer.rs:445-461`):
   - Load all material textures during scene load
   - Create bind groups with all 6 texture slots (use default white/normal/black as fallbacks)
   - Set texture flags in MaterialUniform based on which textures are present

### Phase 3: Normal Mapping (1.5 days)

1. **Add Tangent Vectors** (`vertex.rs`):

   - Extend `Vertex` struct with `tangent: [f32; 4]` (w component for handedness)
   - Add tangent calculation for primitive meshes (cube, sphere, plane)
   - Extract tangents from GLTF meshes (`gltf_loader.rs`)

2. **Update Vertex Shader** (`shader.wgsl:64-100`):

   - Pass tangent/bitangent to fragment shader
   - Calculate TBN matrix in fragment shader

3. **Normal Mapping in Fragment Shader** (`shader.wgsl:200-271`):

   ```wgsl
   // Sample normal map
   let normal_map = textureSample(normal_texture, texture_sampler, in.uv);
   let tangent_normal = normal_map.rgb * 2.0 - 1.0;
   tangent_normal.xy *= material.normal_scale;

   // Transform to world space
   let world_normal = normalize(tbn * tangent_normal);
   ```

4. **Integration**:
   - Use world_normal for all lighting calculations
   - Fallback to vertex normal when normal map not present

### Phase 4: Texture Transforms (0.5 day)

1. **UV Transform in Vertex Shader** (`shader.wgsl:79-100`):

   ```wgsl
   // Apply texture transform from material uniform
   out.uv = model.uv * material.uv_repeat + material.uv_offset;
   ```

2. **Populate MaterialUniform** (`scene_renderer.rs`):
   - Extract `textureOffsetX/Y` and `textureRepeatX/Y` from Material
   - Upload to GPU buffer

### Phase 5: Emissive Rendering (0.5 day)

1. **Fragment Shader Update** (`shader.wgsl:200-271`):

   ```wgsl
   // Sample emissive texture or use emissive color
   var emissive = material.emissive_color * material.emissive_intensity;
   if (has_emissive_texture(material.texture_flags)) {
       let emissive_sample = textureSample(emissive_texture, texture_sampler, in.uv);
       emissive *= emissive_sample.rgb;
   }

   // Add to final color (after lighting)
   let final_color = base_color * lighting + emissive;
   ```

2. **Material Data Upload**:
   - Parse emissive hex color to RGB in `material.rs`
   - Upload emissive color and intensity to MaterialUniform

### Phase 6: Metallic/Roughness Texture Maps (0.5 day)

1. **Fragment Shader Sampling** (`shader.wgsl`):

   ```wgsl
   // Sample metallic/roughness from textures or use constants
   var metallic = in.metallic_roughness.x;
   var roughness = in.metallic_roughness.y;

   if (has_metallic_texture(material.texture_flags)) {
       let metallic_sample = textureSample(metallic_texture, texture_sampler, in.uv);
       metallic *= metallic_sample.b;  // Blue channel
   }

   if (has_roughness_texture(material.texture_flags)) {
       let roughness_sample = textureSample(roughness_texture, texture_sampler, in.uv);
       roughness *= roughness_sample.g;  // Green channel
   }
   ```

2. **Note**: Many engines pack metallic (B) + roughness (G) into single texture - support both packed and separate

### Phase 7: Occlusion Mapping (0.5 day)

1. **Fragment Shader** (`shader.wgsl`):

   ```wgsl
   var occlusion = 1.0;
   if (has_occlusion_texture(material.texture_flags)) {
       let ao_sample = textureSample(occlusion_texture, texture_sampler, in.uv);
       occlusion = mix(1.0, ao_sample.r, material.occlusion_strength);
   }

   // Apply occlusion to ambient/indirect lighting only
   lighting = lighting * occlusion;
   ```

### Phase 8: Unlit Shader (1 day)

1. **Create Unlit Shader** (`shader_unlit.wgsl`):

   - Copy vertex shader from `shader.wgsl`
   - Fragment shader: `return vec4<f32>(base_color, 1.0);` (no lighting)
   - Support albedo texture sampling and emissive

2. **Shader Variant System** (`pipeline.rs`):

   - Create separate render pipeline for unlit materials
   - Add `unlit_pipeline: wgpu::RenderPipeline` field
   - Switch pipeline based on `material.shader` value in scene_renderer

3. **Scene Renderer Updates** (`scene_renderer.rs:433-481`):
   - Group entities by shader type before rendering
   - Batch standard materials together
   - Batch unlit materials together
   - Minimize pipeline switches

### Phase 9: Alpha Blending & Transparency (1.5 days)

1. **Pipeline Variants** (`pipeline.rs:281-320`):

   - Create `opaque_pipeline` (current pipeline)
   - Create `transparent_pipeline` with alpha blending:
     ```rust
     blend: Some(wgpu::BlendState {
         color: wgpu::BlendComponent {
             src_factor: wgpu::BlendFactor::SrcAlpha,
             dst_factor: wgpu::BlendFactor::OneMinusSrcAlpha,
             operation: wgpu::BlendOperation::Add,
         },
         alpha: wgpu::BlendComponent::OVER,
     })
     ```
   - Disable depth write for transparent pipeline

2. **Material Schema Extension**:

   - Add `transparent: bool` field to Material (inferred from albedo texture alpha or explicit flag)
   - Add `alphaMode: 'opaque' | 'blend' | 'mask'` (match GLTF spec)
   - Add `alphaCutoff: f32` for mask mode

3. **Render Order** (`scene_renderer.rs:388-482`):

   - Sort entities: opaque front-to-back (depth optimization), transparent back-to-front (correct blending)
   - Render opaque with depth write ON
   - Render transparent with depth write OFF

4. **Shader Updates**:
   - Sample albedo alpha channel
   - Discard fragments below alphaCutoff in mask mode
   - Output alpha in fragment shader

### Phase 10: Inline Material Overrides & Multi-Submesh (1 day)

1. **Parse MeshRenderer.material Object** (`decoders.rs`):

   - Extend `MeshRenderer` struct with `material: Option<Material>` field
   - If present, override MaterialCache lookup with inline properties

2. **Scene Renderer Updates** (`scene_renderer.rs`):

   - Check for inline material before MaterialCache lookup
   - Priority: inline material > materialId reference > default material

3. **Multi-Submesh Support**:

   - Add `materials: Option<Vec<String>>` to MeshRenderer
   - For GLTF meshes with multiple primitives, assign materials per submesh
   - Extend rendering loop to handle per-submesh material binding

4. **Fallback Behavior**:
   - If `materials` array length doesn't match submesh count, use first material for all
   - Log warning for material/submesh mismatch

### Phase 11: Testing & Validation (1 day)

1. **Unit Tests**:

   - Material deserialization with all texture fields
   - MaterialUniform buffer layout and alignment
   - Tangent space calculation for primitives

2. **Integration Tests**:

   - Create test scene with material showcasing each feature:
     - Emissive cube (glowing)
     - Normal-mapped sphere
     - Rough/smooth metallic variation
     - Textured plane with UV repeat/offset
     - Transparent glass material
     - Unlit billboard
   - Verify visual output matches Three.js rendering

3. **Performance Testing**:
   - Measure frame time with multi-texture materials
   - Profile GPU usage with bindless textures (future optimization)
   - Document performance characteristics

## Technical Details

### Material Uniform Buffer Layout

```rust
// rust/engine/src/render/material_uniform.rs
#[repr(C)]
#[derive(Copy, Clone, Pod, Zeroable)]
pub struct MaterialUniform {
    pub emissive_color: [f32; 3],       // Offset 0, align 16
    pub emissive_intensity: f32,        // Offset 12
    pub uv_offset: [f32; 2],            // Offset 16
    pub uv_repeat: [f32; 2],            // Offset 24
    pub normal_scale: f32,              // Offset 32
    pub occlusion_strength: f32,        // Offset 36
    pub texture_flags: u32,             // Offset 40 (bit flags)
    pub shader_type: u32,               // Offset 44 (0=standard, 1=unlit)
}

// Texture flags (bitwise OR)
const TEXTURE_ALBEDO: u32    = 1 << 0;
const TEXTURE_NORMAL: u32    = 1 << 1;
const TEXTURE_METALLIC: u32  = 1 << 2;
const TEXTURE_ROUGHNESS: u32 = 1 << 3;
const TEXTURE_EMISSIVE: u32  = 1 << 4;
const TEXTURE_OCCLUSION: u32 = 1 << 5;
```

### Shader WGSL Updates

```wgsl
// Group 1: Textures (6 slots)
@group(1) @binding(0) var albedo_texture: texture_2d<f32>;
@group(1) @binding(1) var normal_texture: texture_2d<f32>;
@group(1) @binding(2) var metallic_texture: texture_2d<f32>;
@group(1) @binding(3) var roughness_texture: texture_2d<f32>;
@group(1) @binding(4) var emissive_texture: texture_2d<f32>;
@group(1) @binding(5) var occlusion_texture: texture_2d<f32>;
@group(1) @binding(6) var texture_sampler: sampler;

// Group 2: Material uniform
@group(2) @binding(0) var<uniform> material: MaterialUniform;

// Helper functions
fn has_albedo_texture(flags: u32) -> bool { return (flags & 1u) != 0u; }
fn has_normal_texture(flags: u32) -> bool { return (flags & 2u) != 0u; }
// ... etc
```

## Data Mapping Parity

### TypeScript → Rust Schema Alignment

| TS Field            | Rust Field               | Status           | Notes                                                  |
| ------------------- | ------------------------ | ---------------- | ------------------------------------------------------ |
| `id`                | `id`                     | ✅ Match         |                                                        |
| `name`              | `name`                   | ✅ Match         |                                                        |
| `shader`            | `shader`                 | ⚠️ Partial       | TS: 'standard'\|'unlit', Rust: only 'standard' renders |
| `materialType`      | `materialType`           | ⚠️ Ignored       | Not used in rendering                                  |
| `color`             | `color`                  | ✅ Match         | Hex string → Vec3 RGB                                  |
| `metalness`         | `metalness` / `metallic` | ⚠️ Redundant     | Rust has both fields (remove `metallic`)               |
| `roughness`         | `roughness`              | ❌ Wrong default | TS: 0.7, Rust: 0.5                                     |
| `emissive`          | `emissive`               | ❌ Not rendered  | Field exists but not used in shader                    |
| `emissiveIntensity` | `emissiveIntensity`      | ❌ Not rendered  | Field exists but not used in shader                    |
| `albedoTexture`     | `albedoTexture`          | ✅ Rendered      | Only texture currently working                         |
| `normalTexture`     | `normalTexture`          | ❌ Not rendered  | Field exists but not loaded/used                       |
| `metallicTexture`   | `metallicTexture`        | ❌ Not rendered  | Field exists but not loaded/used                       |
| `roughnessTexture`  | `roughnessTexture`       | ❌ Not rendered  | Field exists but not loaded/used                       |
| `emissiveTexture`   | `emissiveTexture`        | ❌ Not rendered  | Field exists but not loaded/used                       |
| `occlusionTexture`  | `occlusionTexture`       | ❌ Not rendered  | Field exists but not loaded/used                       |
| `normalScale`       | `normalScale`            | ❌ Not used      | Field exists but not passed to shader                  |
| `occlusionStrength` | `occlusionStrength`      | ❌ Not used      | Field exists but not passed to shader                  |
| `textureOffsetX`    | `textureOffsetX`         | ❌ Not used      | Field exists but not applied to UVs                    |
| `textureOffsetY`    | `textureOffsetY`         | ❌ Not used      | Field exists but not applied to UVs                    |
| `textureRepeatX`    | `textureRepeatX`         | ❌ Not used      | Field exists but not applied to UVs                    |
| `textureRepeatY`    | `textureRepeatY`         | ❌ Not used      | Field exists but not applied to UVs                    |
| (none)              | `opacity`                | ❌ Extra field   | **Remove - not in TS schema**                          |

### MeshRenderer Material Override Fields (Inline)

The TypeScript `MeshRenderer` component has a nested `material` object that allows per-entity material overrides. These fields duplicate the Material schema but apply at the entity level:

| TS Field (MeshRenderer.material.\*) | Current Status | Notes                             |
| ----------------------------------- | -------------- | --------------------------------- |
| `shader`                            | ❌ Not parsed  | Inline shader override            |
| `materialType`                      | ❌ Not parsed  | Solid vs texture type             |
| `color`                             | ❌ Not parsed  | Per-entity color override         |
| `metalness`                         | ❌ Not parsed  | Per-entity metallic override      |
| `roughness`                         | ❌ Not parsed  | Per-entity roughness override     |
| `emissive`                          | ❌ Not parsed  | Per-entity emissive color         |
| `emissiveIntensity`                 | ❌ Not parsed  | Per-entity emission strength      |
| `albedoTexture`                     | ❌ Not parsed  | Per-entity texture override       |
| `normalTexture`                     | ❌ Not parsed  | Per-entity normal map             |
| `metallicTexture`                   | ❌ Not parsed  | Per-entity metallic texture       |
| `roughnessTexture`                  | ❌ Not parsed  | Per-entity roughness texture      |
| `emissiveTexture`                   | ❌ Not parsed  | Per-entity emissive texture       |
| `occlusionTexture`                  | ❌ Not parsed  | Per-entity AO texture             |
| `normalScale`                       | ❌ Not parsed  | Per-entity normal scale           |
| `occlusionStrength`                 | ❌ Not parsed  | Per-entity AO strength            |
| `textureOffsetX`                    | ❌ Not parsed  | Per-entity UV offset X            |
| `textureOffsetY`                    | ❌ Not parsed  | Per-entity UV offset Y            |
| `textureRepeatX`                    | ❌ Not parsed  | Per-entity UV repeat X            |
| `textureRepeatY`                    | ❌ Not parsed  | Per-entity UV repeat Y            |
| `materials` (array)                 | ❌ Not parsed  | Multi-submesh material assignment |

**Note**: Current Rust implementation only uses `materialId` for MaterialCache lookup. The entire inline `material` object and `materials` array are ignored.

### Summary Statistics

- **Total Material Schema Fields**: 23 in TS schema
- **Fully Implemented**: 3 (13%)
- **Partially Implemented**: 3 (13%)
- **Not Implemented**: 17 (74%)

- **Total MeshRenderer Material Fields**: 20 inline override fields + 1 array
- **Fully Implemented**: 0 (0%)
- **Not Implemented**: 21 (100%)

## Edge Cases

| Edge Case                           | Remediation                                                                                                     |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Missing texture files               | Use default textures: white (albedo/emissive), normal (flat blue), black (metallic/occlusion), gray (roughness) |
| Texture dimension mismatch          | Validate all textures have same dimensions; log warning if mismatch                                             |
| Invalid UV coordinates (< 0 or > 1) | Sampler uses `AddressMode::Repeat` for wrapping                                                                 |
| Packed metallic-roughness texture   | Support both packed (single texture, B+G channels) and separate textures                                        |
| sRGB vs Linear color space          | Ensure albedo/emissive textures use `Rgba8UnormSrgb`, normal/roughness use `Rgba8Unorm`                         |
| Tangent handedness                  | Use GLTF tangent.w component for bitangent sign; generate consistent handedness for primitives                  |
| Transparent object sorting          | Sort by distance to camera; update every frame if camera moves                                                  |
| Alpha cutoff precision              | Use `discard` in shader for mask mode; provide alphaCutoff uniform (default 0.5)                                |

## Usage Examples

### Complete PBR Material

```rust
// Scene JSON (from TypeScript editor)
{
  "materials": [
    {
      "id": "mat_pbr_full",
      "name": "Complete PBR",
      "shader": "standard",
      "color": "#ffffff",
      "metalness": 1.0,
      "roughness": 0.3,
      "emissive": "#ff6600",
      "emissiveIntensity": 2.0,
      "albedoTexture": "assets/textures/metal_albedo.png",
      "normalTexture": "assets/textures/metal_normal.png",
      "metallicTexture": "assets/textures/metal_metallic.png",
      "roughnessTexture": "assets/textures/metal_roughness.png",
      "occlusionTexture": "assets/textures/metal_ao.png",
      "normalScale": 1.5,
      "occlusionStrength": 0.8,
      "textureRepeatX": 2.0,
      "textureRepeatY": 2.0
    }
  ]
}
```

**Expected Rendering**:

- Metallic surface with procedural roughness variation
- Normal mapping for surface detail (bolts, scratches)
- Ambient occlusion in crevices
- Orange glow from emissive
- Tiled 2x2 across surface

### Unlit Material (UI/Billboards)

```rust
{
  "materials": [
    {
      "id": "mat_unlit_sprite",
      "name": "UI Sprite",
      "shader": "unlit",
      "albedoTexture": "assets/ui/button.png",
      "emissive": "#ffffff",
      "emissiveIntensity": 1.0
    }
  ]
}
```

**Expected Rendering**:

- No lighting calculations (always full brightness)
- Texture rendered as-is
- Useful for UI, skybox, particles

## Risks & Mitigations

| Risk                                          | Mitigation                                                                  |
| --------------------------------------------- | --------------------------------------------------------------------------- |
| GPU memory usage with 6 textures per material | Implement texture atlasing; share textures across materials; lazy load      |
| Bind group limit on older GPUs                | Profile on min-spec hardware; fallback to simpler materials if needed       |
| Performance hit from multi-texture sampling   | Use texture arrays or bindless textures (future); batch by material         |
| Complexity of tangent calculation             | Use mikktspace algorithm (industry standard); test with GLTF models         |
| Transparent sorting overhead                  | Spatial acceleration structure (octree/BVH); only sort transparent entities |
| sRGB color space bugs                         | Unit tests for gamma correction; visual comparison with Three.js            |

## Timeline

- **Phase 1** (Schema Fixes & Material Uniform): 1 day
- **Phase 2** (Multi-Texture Binding): 1 day
- **Phase 3** (Normal Mapping): 1.5 days
- **Phase 4** (Texture Transforms): 0.5 day
- **Phase 5** (Emissive Rendering): 0.5 day
- **Phase 6** (Metallic/Roughness Textures): 0.5 day
- **Phase 7** (Occlusion Mapping): 0.5 day
- **Phase 8** (Unlit Shader): 1 day
- **Phase 9** (Alpha Blending): 1.5 days
- **Phase 10** (Inline Material Overrides & Multi-Submesh): 1 day
- **Phase 11** (Testing & Validation): 1 day

**Total estimate**: ~10 days (80 hours)

## Acceptance Criteria

- ✅ All 23 TypeScript material schema fields have corresponding Rust implementation
- ✅ All 21 MeshRenderer inline material override fields parsed and applied
- ✅ Multi-submesh material assignment (`MeshRenderer.materials[]`) supported
- ✅ Default roughness matches TS (0.7, not 0.5)
- ✅ `opacity` field removed from Rust Material struct
- ✅ Redundant `metallic` field removed (keep `metalness`)
- ✅ Normal-mapped materials render with correct surface detail
- ✅ Emissive materials glow (additive to lighting)
- ✅ Metallic/roughness textures modulate PBR properties
- ✅ Ambient occlusion darkens indirect lighting
- ✅ Texture UV transforms (offset/repeat) apply correctly
- ✅ Unlit shader bypasses all lighting calculations
- ✅ Transparent materials blend correctly with depth sorting
- ✅ Inline material overrides take precedence over MaterialCache
- ✅ Visual parity test: side-by-side Rust vs Three.js rendering of same material < 5% perceptual difference
- ✅ Performance: 60 FPS with 100 unique PBR materials on mid-range GPU (GTX 1060)

## Conclusion

Achieving material system parity is critical for the Rust engine to render scenes authored in the TypeScript editor without visual degradation. This PRD provides a phased implementation plan that incrementally adds missing features while maintaining stability. The multi-texture binding and material uniform buffer form the architectural foundation, enabling all subsequent features (normal mapping, emissive, texture transforms, transparency). By Phase 10, the Rust engine will render materials with PBR accuracy matching Three.js.

## Dependencies

- **wgpu**: Already integrated
- **image crate**: Already used for texture loading (texture_cache.rs:96)
- **glam**: Already used for math (Vec3, Mat4)
- **GLTF tangent extraction**: Requires `gltf` crate with tangent support (already available)

## Alignment with INTEGRATION_AUDIT.md

This PRD directly addresses the following sections from `rust/engine/INTEGRATION_AUDIT.md`:

### Section 6: Texture System (20-30 hour estimate)

- ✅ **Phase 2**: Multi-texture binding (addresses bind group refactoring)
- ✅ **Phase 3-7**: All 5 texture types (normal, metallic, roughness, emissive, occlusion)
- ✅ **Phase 4**: Texture transforms (UV offset/repeat)
- ✅ **Phase 1**: MaterialUniform for texture flags

### Section 5: MeshRenderer (69% missing fields)

- ✅ **Phase 10**: Inline material overrides (`MeshRenderer.material` object - all 20 fields)
- ✅ **Phase 10**: Multi-submesh materials (`MeshRenderer.materials[]` array)
- ✅ **Phases 2-7**: All texture support (albedo, normal, metallic, roughness, emissive, AO)
- ✅ **Phase 8**: Shader selection (standard vs unlit)
- ✅ **Phase 1**: Schema fixes (roughness default, remove opacity)

### Priority 1 Recommendations (Critical)

- ⚠️ **GLTF model loading**: Not in this PRD (separate task, already partially implemented per recent code changes)
- ✅ **Texture support**: Fully covered (Phases 2-7, 16-30 hours estimated)
- Note: INTEGRATION_AUDIT estimated 16-20 hours for textures; this PRD estimates 20-30 hours with additional features

### Priority 2 Recommendations (High)

- ✅ **Normal mapping**: Phase 3 (1.5 days)
- ⚠️ **Shadow mapping**: Not in this PRD (requires separate render pass architecture)
- ⚠️ **Skybox rendering**: Not material-related (Camera component feature)

### Total Coverage

- **Material Schema**: 13% → 100% (all 23 fields)
- **MeshRenderer Material Fields**: 0% → 100% (all 21 inline override fields)
- **Texture System**: 0% → 100% (all 6 texture slots)
- **Shader Variants**: 50% → 100% (add unlit)

## Future Work (Post-Parity)

- Clearcoat extension (car paint, layered materials)
- Sheen extension (fabric, velvet)
- Transmission extension (glass, refraction)
- Anisotropic reflections (brushed metal)
- Subsurface scattering (skin, wax)
- Parallax occlusion mapping (deep surface detail)
- Bindless textures for reduced draw call overhead
- Texture streaming for large texture sets
- Material instancing (share GPU resources across similar materials)
