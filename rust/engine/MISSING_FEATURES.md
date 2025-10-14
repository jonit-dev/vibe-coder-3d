# Missing Features - Rust Engine vs Three.js

This document tracks all features present in the Three.js implementation that are not yet implemented in the Rust engine.

## 🟢 Camera Features

### ✅ Currently Implemented
- [x] FOV, near, far planes
- [x] Perspective projection
- [x] Orthographic projection
- [x] Orthographic size
- [x] Background color (RGBA)
- [x] Camera position from Transform
- [x] Aspect ratio handling

### ❌ Missing - Basic Features
- [ ] **clearFlags** - Different clear modes (parsed but not applied)
  - `skybox` - Render skybox as background
  - `solidColor` - Use backgroundColor (currently hardcoded)
  - `depthOnly` - Only clear depth buffer
  - `dontClear` - Don't clear at all
  - **Priority:** MEDIUM
  - **Effort:** 2 hours
  - **Files:** `scene_renderer.rs`, `camera.rs`

- [ ] **Depth Buffer** - Currently no depth testing (causes z-fighting)
  - Create depth texture
  - Add depth attachment to render pass
  - Enable depth testing in pipeline
  - **Priority:** HIGH
  - **Effort:** 3-4 hours
  - **Files:** `pipeline.rs`, `scene_renderer.rs`

- [ ] **Camera Rotation** - Only position is applied, rotation ignored
  - Apply rotation from Transform to camera target
  - Convert quaternion to look-at target
  - **Priority:** HIGH
  - **Effort:** 2 hours
  - **Files:** `app.rs`, `camera.rs`

### ❌ Missing - Advanced Features
- [ ] **Skybox Rendering**
  - Load skybox cubemap texture
  - Render skybox shader
  - Apply skybox transform properties (scale, rotation, repeat, offset, intensity, blur)
  - **Priority:** LOW
  - **Effort:** 8-10 hours
  - **Dependencies:** Texture loading, clearFlags

- [ ] **Viewport Rectangle** - Multi-camera split screen
  - `viewportRect.x`, `viewportRect.y`, `viewportRect.width`, `viewportRect.height`
  - Scissor rect or viewport in render pass
  - **Priority:** LOW
  - **Effort:** 3 hours

- [ ] **HDR & Tone Mapping**
  - `hdr` boolean
  - `toneMapping` enum (none, linear, reinhard, cineon, aces)
  - `toneMappingExposure` value
  - **Priority:** LOW
  - **Effort:** 6-8 hours
  - **Dependencies:** HDR render targets

- [ ] **Post-Processing**
  - `enablePostProcessing` boolean
  - `postProcessingPreset` enum (none, cinematic, realistic, stylized)
  - **Priority:** VERY LOW
  - **Effort:** 20+ hours

- [ ] **Camera Follow System**
  - `controlMode` (locked, free)
  - `followTarget` entity ID
  - `followOffset` vector
  - `enableSmoothing` boolean
  - `smoothingSpeed` value
  - `rotationSmoothing` value
  - **Priority:** VERY LOW
  - **Effort:** 4-6 hours

- [ ] **Camera Depth** - Render order for multiple cameras
  - `depth` value for sorting cameras
  - **Priority:** VERY LOW
  - **Effort:** 2 hours

## 🟡 Lighting Features

### ✅ Currently Implemented
- [x] Directional lights (direction, color, intensity)
- [x] Ambient lights (color, intensity)
- [x] Point lights (position, color, intensity, range, attenuation)
- [x] Dynamic light extraction from scene
- [x] Up to 1 directional + 1 ambient + 2 point lights

### ❌ Missing
- [ ] **Spot Lights**
  - Direction, angle, penumbra
  - Cone attenuation
  - **Priority:** MEDIUM
  - **Effort:** 4-6 hours
  - **Files:** `shader.wgsl`, `pipeline.rs`, `scene_renderer.rs`

- [ ] **More Light Slots**
  - Currently limited to 1 directional + 1 ambient + 2 point
  - Should support at least 4 point lights, 2 spot lights
  - **Priority:** LOW
  - **Effort:** 2-3 hours
  - **Limitation:** Shader uniform size

- [ ] **Shadow Mapping**
  - `castShadow` boolean (parsed but not used)
  - Shadow map generation pass
  - Shadow sampling in fragment shader
  - `shadowMapSize`, `shadowBias`, `shadowRadius` properties
  - **Priority:** MEDIUM
  - **Effort:** 12-16 hours
  - **Complexity:** HIGH

## 🔴 Rendering Features

### ✅ Currently Implemented
- [x] Primitive meshes (cube, sphere, plane)
- [x] PBR materials (color, metallic, roughness)
- [x] Material caching
- [x] Instanced rendering
- [x] Batched draw calls by mesh

### ❌ Missing
- [ ] **GLTF Model Loading**
  - Load meshes from `modelPath`
  - Parse GLTF vertex data
  - Cache loaded models
  - **Priority:** HIGH
  - **Effort:** 8-12 hours
  - **Files:** `assets/mod.rs`, `mesh_cache.rs`

- [ ] **Texture Support**
  - Albedo/base color texture
  - Normal maps
  - Metallic/roughness maps
  - Emissive textures
  - AO maps
  - Texture loading and caching
  - **Priority:** HIGH
  - **Effort:** 10-14 hours
  - **Files:** `material.rs`, `shader.wgsl`, `pipeline.rs`

- [ ] **Entity Hierarchy**
  - Build parent-child tree from `parentPersistentId`
  - Propagate transforms down hierarchy
  - Render in correct order
  - **Priority:** MEDIUM
  - **Effort:** 6-8 hours
  - **Files:** `scene_renderer.rs`, new `hierarchy.rs`

- [ ] **MeshRenderer Properties**
  - `castShadows` - parsed but not used (needs shadow mapping)
  - `receiveShadows` - parsed but not used (needs shadow mapping)
  - **Dependencies:** Shadow mapping

## ⚫ Component Features Not Implemented

- [ ] **RigidBody** - Physics component
  - Needs physics engine integration (Rapier3D)
  - **Priority:** MEDIUM
  - **Effort:** 20+ hours

- [ ] **MeshCollider** - Collision shapes
  - Needs physics engine integration
  - **Priority:** MEDIUM
  - **Effort:** 8-10 hours

- [ ] **Script** - Script execution
  - Needs scripting runtime
  - **Priority:** LOW
  - **Effort:** 30+ hours

- [ ] **Sound** - Audio playback
  - Needs audio engine integration
  - **Priority:** LOW
  - **Effort:** 10-15 hours

- [ ] **Terrain** - Heightmap terrain
  - Needs terrain system
  - **Priority:** VERY LOW
  - **Effort:** 20+ hours

- [ ] **CustomShape** - User-defined geometry
  - **Priority:** LOW
  - **Effort:** 6-8 hours

- [ ] **Instanced** - Component-driven instancing
  - **Priority:** MEDIUM
  - **Effort:** 8-10 hours

- [ ] **PrefabInstance** - Prefab system
  - **Priority:** LOW
  - **Effort:** 12-16 hours

## 📊 Priority Summary

### 🔥 Critical (Required for visual parity)
1. **Depth Buffer** - 3-4 hours - Prevents z-fighting
2. **Camera Rotation** - 2 hours - Camera not looking at correct target
3. **GLTF Loading** - 8-12 hours - Can't render actual 3D models
4. **Texture Support** - 10-14 hours - Materials look flat without textures

**Estimated Total:** ~23-32 hours (3-4 days)

### ⚡ High Priority (Nice to have)
1. **Spot Lights** - 4-6 hours
2. **Entity Hierarchy** - 6-8 hours
3. **Shadow Mapping** - 12-16 hours
4. **clearFlags** - 2 hours

**Estimated Total:** ~24-32 hours (3-4 days)

### 📋 Medium Priority (Polish)
1. **Physics Integration** - 30+ hours
2. **More Light Slots** - 2-3 hours
3. **Viewport Rectangle** - 3 hours

### 🌟 Low Priority (Advanced features)
1. **Skybox** - 8-10 hours
2. **HDR & Tone Mapping** - 6-8 hours
3. **Post-Processing** - 20+ hours
4. **Camera Follow** - 4-6 hours
5. **Audio** - 10-15 hours

## 🎯 Recommended Implementation Order

### Phase 1: Visual Parity (Week 1)
1. Add depth buffer (fixes overlapping objects)
2. Add camera rotation (fixes camera orientation)
3. Add clearFlags basic support (solidColor mode)
4. Add GLTF model loading
5. Add basic texture support (albedo only)

**Outcome:** Rust engine renders scenes correctly with proper depth and textures

### Phase 2: Lighting & Shadows (Week 2)
1. Add spot light support
2. Implement shadow mapping
3. Add more light slots
4. Add entity hierarchy

**Outcome:** Rust engine matches Three.js lighting quality including shadows

### Phase 3: Advanced Rendering (Week 3)
1. Full texture support (normal, metallic, roughness, emissive, AO)
2. Skybox rendering
3. HDR & tone mapping
4. Viewport rectangle

**Outcome:** Rust engine has feature parity with Three.js rendering

### Phase 4: Physics & Scripting (Week 4+)
1. Physics integration
2. Audio system
3. Scripting runtime
4. Post-processing

**Outcome:** Full game engine feature parity

## 📝 Notes

### Scene Export Compatibility
The TypeScript editor exports all these properties to JSON, but the Rust engine currently ignores most of them. The data is already in the scene files - we just need to parse and apply it.

### Testing Strategy
For each feature:
1. Create test scene in Three.js editor with the feature
2. Export to JSON
3. Load in Rust engine
4. Verify visual parity
5. Add automated tests

### Performance Targets
- **60 FPS** on mid-range hardware (GTX 1060)
- **< 16ms** frame time
- **< 2s** startup time
- **< 100MB** memory for basic scenes
