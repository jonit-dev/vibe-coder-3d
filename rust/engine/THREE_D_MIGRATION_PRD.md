# Product Requirements Document: three-d Migration

**Project:** Vibe Coder 3D Rust Engine
**Version:** 1.0
**Date:** 2025-10-18
**Status:** Draft
**Owner:** Engine Team

---

## Executive Summary

Migrate the Rust rendering engine from raw wgpu to the three-d library to achieve visual parity with Three.js editor output while reducing code complexity and maintenance burden.

### Problem Statement

The current wgpu-based renderer cannot replicate Three.js visual quality because:

- Custom WGSL shader uses simplified Blinn-Phong lighting (not PBR)
- Missing critical PBR components: Cook-Torrance BRDF, GGX distribution, Fresnel, IBL
- Estimated 60-80 hours of shader development needed to reach parity
- Ongoing maintenance complexity for custom rendering pipeline

### Proposed Solution

Replace raw wgpu rendering layer with three-d library while preserving all domain logic (scene loading, physics, ECS).

### Success Metrics

| Metric                      | Target             | Current (wgpu) |
| --------------------------- | ------------------ | -------------- |
| Visual parity with Three.js | 95%+               | ~60%           |
| Rendering code LOC          | <500 lines         | ~3000 lines    |
| PBR material support        | Full Cook-Torrance | Basic Phong    |
| Development time to parity  | 12-20 hours        | 60-80 hours    |
| Shader maintenance          | 0 (library)        | High (custom)  |

---

## Goals and Non-Goals

### Goals

1. **Visual Parity**: Achieve 95%+ visual match with Three.js `meshStandardMaterial`
2. **Code Simplification**: Reduce rendering code from ~3000 to <500 lines
3. **Feature Completeness**: Full PBR, shadows, IBL, tone mapping out-of-box
4. **Preserve Domain Logic**: Keep all scene loading, physics, ECS code unchanged
5. **Maintainability**: Eliminate custom shader development/debugging

### Non-Goals

1. Custom render passes (use three-d's built-in renderer)
2. Advanced post-processing (deferred for future)
3. Custom shader effects (rely on three-d's material system)
4. WASM support in initial version (focus on native first)

---

## Architecture

### Current Architecture (wgpu)

```
┌─────────────────────────────────────────────────┐
│ app.rs (Application Lifecycle)                  │
└────────────┬────────────────────────────────────┘
             │
    ┌────────▼────────┐
    │ renderer.rs     │  (wgpu setup: device, queue, surface)
    └────────┬────────┘
             │
    ┌────────▼────────────┐
    │ scene_renderer.rs   │  (Scene → GPU resources)
    └────┬─────┬─────┬────┘
         │     │     │
    ┌────▼──┐ │ ┌───▼──────┐
    │pipeline│ │ │materials │
    │(5 files)│ │ │lights   │
    └────┬───┘ │ │shadows  │
         │     │ └──────────┘
    ┌────▼─────▼─┐
    │ shader.wgsl│ (500+ lines)
    └────────────┘
```

**Lines of Code (Rendering):**

- `src/render/*.rs`: ~2500 lines
- `shader.wgsl`: ~500 lines
- **Total: ~3000 lines**

### Target Architecture (three-d)

```
┌─────────────────────────────────────────────────┐
│ app.rs (Application Lifecycle)                  │
└────────────┬────────────────────────────────────┘
             │
    ┌────────▼──────────┐
    │ threed_renderer.rs│  (Scene → three-d objects)
    └────────┬──────────┘
             │
    ┌────────▼────────┐
    │ three-d library │  (PBR, lighting, shadows)
    └─────────────────┘
```

**Lines of Code (Rendering):**

- `threed_renderer.rs`: ~400 lines
- **Total: ~400 lines** (87% reduction)

### What Stays Unchanged

All domain logic remains intact:

```
✅ vibe-scene (crate)         - Scene data model
✅ vibe-ecs-bridge (crate)    - Component registry
✅ vibe-scene-graph (crate)   - Transform hierarchy
✅ vibe-physics (crate)       - Rapier3D integration
✅ src/io/                    - JSON scene loading
✅ src/ecs/                   - Component definitions
✅ src/util/                  - Frame timing, etc.
```

**Estimated preservation: 65-70% of codebase**

---

## Technical Specification

### Architectural Considerations

#### Rendering Context Lifecycle

- `three-d::Window::new` is not required; reuse the existing `winit::window::Window` and create a `three-d::WindowedContext` via `three-d::Context::from_winit_window`.
- Keep the `Context` on the renderer and clone it where needed; the type is internally reference-counted so sharing across systems is cheap and safe.
- Keep swapchain resizing centralized: winit resize event → `threed_renderer.resize` → update `camera.set_viewport`, `context.resize`.
- Configure the framebuffer for sRGB output (`FrameOutputSettings { color_space: ColorSpace::Srgb, .. }`) to match Three.js defaults.

#### Scene Graph Synchronization

- Maintain an authoritative transform matrix in `vibe-scene-graph`; convert it to `three_d::Mat4` once per frame and push into the GPU via `Gm::set_transformation`.
- Use a staging structure:
  ```rust
  struct RenderInstance {
      gm: Gm<Mesh, PhysicalMaterial>,
      world_uid: EntityId,
  }
  ```
  Map ECS entity → `RenderInstance`, allowing constant-time updates when components change.
- Batch transform updates by processing the `TransformChanged` component flag rather than iterating every entity.

#### Resource Lifetime Management

- Introduce caches for meshes (`HashMap<MeshKey, CpuMesh>`) and textures (`HashMap<TextureKey, Arc<Texture2D>>`) to avoid recreating GPU buffers each frame.
- Implement lazy loading: decode GLTF/PNG on background thread → send `RenderCommand::RegisterMesh/RegisterTexture` through crossbeam channel → apply on render thread to keep UI responsive.
- Align destruction with ECS removal: when an entity is despawned, enqueue a `RenderCommand::Drop(entity_id)` and call `Scene::retain` on the caches to reclaim GPU memory.

#### Render Loop Integration

- Run all three-d draw calls on the existing render thread. The `render` method should:
  1. Poll window events (already handled by app loop).
  2. Drain render commands (resource uploads, removals).
  3. Update camera state from input systems.
  4. Build a `Screen` with the current `FrameOutput` and render primary pass, then optional overlays.
- Use off-screen `RenderTarget`s for picking or minimaps before blitting into the window `FrameOutput`.

#### Debug & Editor Overlays

- Compose multiple render targets using `Screen::write` with `ClearState::none()` to render debug wireframes after the main pass without clearing color/depth.
- Build gizmos as `InstancedMesh<ColorMaterial>` to draw hundreds of helpers at minimal cost.

#### Asset Pipeline & Format Support

- Prefer GLTF/GLB assets to maximize three-d compatibility; leverage `three_d_asset::io::load_async` which returns `Loaded` enum (Scene, Texture, Animation).
- Normalize texture coordinate conventions (flip V) when importing Three.js exports; configure via `CpuMesh::flip_tex_coord_y`.
- For KTX2/BC compressed textures, run preprocessing step using `toktx` and let three-d upload via `Texture2D::new` with minimal CPU copies.
- Maintain an asset manifest that maps logical IDs to file paths and metadata (color space, wrap mode) to ensure deterministic resource creation across runs.

#### Multithreading Notes

- `three-d` types are `Send` but not `Sync`. Confine GPU mutation to the render thread and exchange data via channels.
- Background asset decoding should emit CPU representations (`CpuMesh`, `CpuTexture`). The render thread performs `Mesh::new(context, &cpu_mesh)` to finalize.

#### Frame Lifecycle Flow

1. **Input Phase**: winit event loop dispatches input → ECS `InputSystem` updates camera/controller components.
2. **Simulation Phase**: Physics and gameplay systems advance world state, mutating `Transform`, `Visibility`, and animation components.
3. **Render Command Phase**: Systems produce `RenderCommand`s (spawn mesh, update material, drop entity) and push them into a lock-free queue for the renderer.
4. **Render Sync Phase**: At the start of each frame, `ThreeDRenderer::sync` drains the command queue, mutating caches and GPU resources.
5. **Camera & Light Update**: Renderer reads ECS camera/light resources, rebuilds `Camera` matrices, light arrays, and shadow cascades.
6. **Draw Phase**: Renderer writes main scene to the window `Screen`, then emits overlays (debug, UI) using additive passes.
7. **Post-Frame Metrics**: Collect GPU statistics, frame timings, and publish them into the ECS diagnostics resource.
8. **Present Phase**: Swapchain presents the composed frame; loop back to winit poll.

```
Input → Simulation → Render Commands → Renderer Sync → Draw → Diagnostics → Present
```

#### Teardown Flow

- Flush pending render commands to ensure GPU resources free deterministically.
- Drop renderer-owned caches before tearing down the `Context` to avoid wgpu validation errors.
- Reset ECS render resources (`RenderInstance`, `TextureHandle`) to prevent stale references when hot-reloading scenes.

### Dependencies

#### Add to `Cargo.toml`

```toml
[dependencies]
three-d = "0.17"  # Core rendering library
three-d-asset = "0.7"  # Asset loading utilities
```

#### Remove from `Cargo.toml`

```toml
# These become optional/deprecated
wgpu-profiler = "0.16"  # (defer profiling to later)
glyphon = "0.5"         # (three-d has built-in text)
```

### Core Components

#### 1. ThreeDRenderer (New)

**File:** `src/threed_renderer.rs`

**Responsibilities:**

- Initialize `three-d::Context` from winit window
- Convert `SceneData` → `three-d::Mesh` + `PhysicalMaterial`
- Manage camera, lights, shadow maps
- Render loop integration

**Key Types:**

```rust
pub struct ThreeDRenderer {
    context: Context,
    camera: Camera,
    screen: Screen,
    meshes: Vec<Gm<Mesh, PhysicalMaterial>>,
    lights: Vec<DirectionalLight>,
    point_lights: Vec<PointLight>,
    spot_lights: Vec<SpotLight>,
}

impl ThreeDRenderer {
    pub fn new(window: Arc<Window>) -> Result<Self>;
    pub fn load_scene(&mut self, scene: &SceneData);
    pub fn render(&mut self, physics: &PhysicsWorld) -> Result<()>;
    pub fn resize(&mut self, width: u32, height: u32);
}
```

#### 1.a. Renderer Initialization Flow

```rust
pub fn init_renderer(window: Arc<Window>) -> Result<ThreeDRenderer> {
    let context = Context::from_winit_window(window.clone(), Default::default())?;
    let camera = Camera::new_perspective(
        &context,
        window.inner_size().width,
        window.inner_size().height,
        Degrees(50.0),
        0.1,
        10_000.0,
    );
    let screen = Screen::new(&context, window)?;
    Ok(ThreeDRenderer { context, camera, screen, ..Default::default() })
}
```

#### 2. Material Conversion

**Mapping: vibe-scene Material → three-d PhysicalMaterial**

| Scene Property                     | three-d Property                   | Notes                                                |
| ---------------------------------- | ---------------------------------- | ---------------------------------------------------- |
| `color`                            | `albedo`                           | Direct mapping                                       |
| `metalness`                        | `metallic`                         | Direct mapping                                       |
| `roughness`                        | `roughness`                        | Direct mapping                                       |
| `emissive` + `emissiveIntensity`   | `emissive`                         | Combine color × intensity                            |
| `normalScale`                      | `normal_scale`                     | Direct mapping                                       |
| `occlusionStrength`                | `occlusion_strength`               | Direct mapping                                       |
| Albedo texture                     | `albedo_texture`                   | Load via `three-d-asset`                             |
| Normal texture                     | `normal_texture`                   | Load via `three-d-asset`                             |
| `clearcoat` / `clearcoatRoughness` | `clearcoat`, `clearcoat_roughness` | Supported since three-d 0.17                         |
| `ior`                              | `index_of_refraction`              | Default to 1.5 if missing                            |
| `envMapIntensity`                  | `environment_intensity`            | Requires `LightingModel::Physical`                   |
| `alphaMode`                        | `albedo_transparency` + blending   | Map `MASK` threshold to `material_data.alpha_cutoff` |

**Implementation:**

```rust
fn create_material(
    context: &Context,
    material_data: &MaterialData,
    textures: &HashMap<String, Texture2D>,
) -> PhysicalMaterial {
    let cpu_material = CpuMaterial {
        albedo: Color::from_hex(&material_data.color).unwrap_or(Color::WHITE),
        metallic: material_data.metalness.unwrap_or(0.0),
        roughness: material_data.roughness.unwrap_or(0.7),
        ior: material_data.ior.unwrap_or(1.5),
        clearcoat: material_data.clearcoat.unwrap_or(0.0),
        clearcoat_roughness: material_data.clearcoat_roughness.unwrap_or(0.0),
        // ... texture assignments
        ..Default::default()
    };
    PhysicalMaterial::new(context, &cpu_material)
}
```

**Color Space Tips:**

- Tag base-color textures as sRGB: `Texture2D::new(context, &cpu_texture, Format::RgbaSrgb)?`.
- Keep normal/metallic/roughness maps in linear space to avoid banding.
- Align UV conventions by flipping V (`CpuTexture::flip_v()`) when assets come from Three.js exporter.

#### 3. Lighting System

**Architectural Notes:**

- Build lights once per frame using the scene's authoritative data; `three-d` lights are lightweight and cheap to recreate.
- Store cascaded shadow configuration in `RendererConfig`; map Three.js shadow parameters (`shadow.bias`, `shadow.radius`) to `DirectionalLight::set_shadow_bias` and `DirectionalLight::set_shadow_blur`.
- For ambient term, prefer `LightingModel::Physical { environment: Some(ibl_map) }` over a flat color once HDR environment maps land.

**Mapping: Scene Lights → three-d Lights**

| Light Type       | three-d Type       | Properties                                    |
| ---------------- | ------------------ | --------------------------------------------- |
| DirectionalLight | `DirectionalLight` | color, intensity, direction                   |
| PointLight       | `PointLight`       | color, intensity, position, attenuation       |
| SpotLight        | `SpotLight`        | color, intensity, position, direction, cutoff |
| AmbientLight     | `AmbientLight`     | color, intensity                              |

**Shadow Support:**

```rust
// Directional shadows (CSM)
let mut dir_light = DirectionalLight::new(
    &context,
    intensity,
    color,
    &direction
);
dir_light.enable_shadows(&camera_view); // Automatic shadow map generation
```

#### 4. Environment Lighting & Tone Mapping

- Load HDR environment maps via `three_d::io::load_async` and pre-filter using `Environment::new` + `Environment::irradiance`.
- Mirror Three.js tone mapping pipeline by enabling ACES/Filmic tone mapping in the renderer settings and rendering into an sRGB swapchain (gamma ≈ 2.2).
- Configure exposure per scene by reading `SceneData.environment.exposure` and applying it to the renderer settings (e.g., `ForwardRendererSettings::exposure`).
- Falling back to LDR: generate a diffuse cubemap by sampling the texture onto `CpuTexture::Cubemap` and use `AmbientLight`.
- Cache irradiance/prefiltered maps to disk (`.cache/environment/<hash>.ktx2`) so subsequent runs skip expensive precomputation.

#### 5. Instancing & Batching

- Group meshes by `(geometry_id, material_id)` and render them with `InstancedMesh<PhysicalMaterial>`.
- Maintain `InstanceBatch` structures with `transforms: Vec<Mat4>`; update the buffer via `gm.set_instance_transformations(&transforms)` once per frame.
- Use instancing for collider wireframes and duplicated props to stay within draw-call budget.
- For skeletal animations, rely on `three_d::SkeletalAnimation` which internally batches skinned vertices.

#### 6. Debug Rendering

**Physics Collider Visualization:**

```rust
// Create line mesh for collider wireframes
fn render_collider_debug(
    context: &Context,
    physics_world: &PhysicsWorld,
) -> Gm<Mesh, ColorMaterial> {
    let mut positions = Vec::new();
    let mut indices = Vec::new();

    // Extract collider edges from physics world
    for (_, collider) in physics_world.colliders.iter() {
        append_collider_lines(collider, &mut positions, &mut indices);
    }

    // Create three-d line mesh
    let cpu_mesh = CpuMesh {
        positions: Positions::F32(positions),
        indices: Indices::U32(indices),
        ..Default::default()
    };

    Gm::new(
        Mesh::new(context, &cpu_mesh),
        ColorMaterial::new_opaque(context, &Color::GREEN)
    )
}
```

#### 7. Input & Camera Controls

- Reuse existing `CameraController` system; translate controller output into `Camera::set_view` / `Camera::set_position`.
- For editor orbit mode leverage `Camera::set_view_at` to focus on selected entity and `Camera::set_up` to maintain roll.
- Hook picking to mouse events: convert cursor position to NDC, call `camera.pixel_ray(x, y, &screen.viewport())`, test intersection against physics world, then highlight the hit mesh.

#### 8. Render Diagnostics

- Wrap `renderer.render` in a lightweight profiler toggled by `--profile-gpu`, forwarding data from `context.statistics()`.
- Expose the final color attachment to ImGui/egui by sampling the `Screen` color texture so GPU timings and resource counts are visible in-engine.

---

## End-to-End Implementation Flow

### 1. Initialization

| Step                    | Owner           | Output                                                       |
| ----------------------- | --------------- | ------------------------------------------------------------ |
| Load window config      | App bootstrap   | `Arc<Window>`                                                |
| Create `ThreeDRenderer` | Renderer module | `ThreeDRenderer` instance with context, screen, camera       |
| Spawn render thread     | Engine runtime  | Channel handles (`render_tx`, `render_rx`)                   |
| Register ECS resources  | ECS bootstrap   | `RenderCommandQueue`, `RendererConfig`, environment settings |

### 2. Asset Ingestion

1. Scene loader parses JSON/GLTF → `SceneData`.
2. Asset worker resolves external references (textures, cubemaps).
3. Worker emits CPU assets to render thread (`RenderCommand::RegisterMesh`, `::RegisterTexture`).
4. Renderer serializes CPU assets into GPU (`Mesh::new`, `Texture2D::new`) and stores handles in caches.
5. ECS entities receive `RenderHandle` components referencing cache keys.

### 3. Runtime Frame

```
ECS Systems ──► Render Commands ──► Renderer Sync ──► three-d Draw ──► Present
```

- ECS publishes component deltas (transform/material/visibility) as commands.
- Renderer applies deltas, updates instancing buffers, refreshes lights.
- `ForwardRenderer::render` draws opaque geometry, followed by transparent passes and overlays (`Screen::write`).
- Final frame is presented; diagnostics (FPS, draw calls) fed back into ECS telemetry for HUD display.

### 4. Hot Reload & Scene Switching

- On scene reload, issue `RenderCommand::ClearScene`, drop instancing batches, and rebuild assets from the new `SceneData`.
- Persist reusable assets (materials, textures) in the cache keyed by content hash to minimize reload hitches.
- Ensure physics-to-render sync resets to identity transforms during reload to avoid stale matrices.

### 5. Shutdown

1. Stop winit event loop and signal render thread through channel (`RenderCommand::Shutdown`).
2. Drain caches, ensuring `GpuResource::drop` executes on render thread.
3. Drop `Context` last to allow wgpu to release surfaces gracefully.
4. Persist diagnostics (frame timings, asset load stats) for regression tracking.

### Implementation Checklist

- ☐ Wire up `ThreeDRenderer` initialization in app bootstrap and confirm window/context creation.
- ☐ Establish render command queue and background asset loader threads.
- ☐ Port material/light conversion code paths and validate against sample scenes.
- ☐ Implement instancing batches plus transform sync for dynamic entities.
- ☐ Integrate environment lighting (HDR import, tone mapping, exposure).
- ☐ Hook physics debug overlays, picking, and editor gizmos.
- ☐ Replace hud/debug UI draw calls to rely on three-d screen overlays.
- ☐ Remove legacy wgpu modules once parity tests pass and feature flag toggles verified.

### Subsystem Responsibilities

| Subsystem            | Key Contracts                                                                 | Owner / Modules                          |
| -------------------- | ----------------------------------------------------------------------------- | ---------------------------------------- |
| Asset Loader         | Parse scene files, emit CPU meshes/textures, enqueue render commands          | `vibe-io`, `asset_worker.rs`             |
| Render Command Queue | Lossless transport of `RenderCommand` from ECS to renderer                    | `render::command`, crossbeam channel     |
| Renderer Core        | Maintain context, caches, camera, lights, execute draw passes                 | `threed_renderer.rs`                     |
| ECS Bridge           | Map entities/components to render handles, publish transform/material changes | `vibe-ecs-bridge`, `render_sync.rs`      |
| Physics Integration  | Provide collider meshes, picking rays, debug overlays                         | `vibe-physics`, `physics_debug.rs`       |
| Diagnostics          | Collect GPU stats, frame timings, expose to HUD/logging                       | `diagnostics.rs`, ImGui/egui integration |

### Render Command Protocol

```rust
enum RenderCommand {
    RegisterMesh { id: MeshKey, mesh: CpuMesh },
    RegisterTexture { id: TextureKey, texture: CpuTexture },
    RegisterMaterial { id: MaterialKey, material: MaterialData },
    SpawnEntity { entity: EntityId, mesh: MeshKey, material: MaterialKey },
    UpdateTransform { entity: EntityId, transform: Mat4 },
    UpdateMaterial { entity: EntityId, overrides: MaterialOverrides },
    SetVisibility { entity: EntityId, visible: bool },
    DespawnEntity { entity: EntityId },
    ClearScene,
    Shutdown,
}
```

- Commands are appended on the simulation thread; renderer drains them during `sync`.
- Use `SmallVec` batching (`Vec<RenderCommandChunk>`) to reduce channel contention.
- Provide metrics (`commands_processed/frame`) to diagnose missed updates.

### Data Flow Reference

1. **Scene Load Path**: Disk → CPU asset cache → `RenderCommand::Register*` → GPU resource caches → `RenderInstance`.
2. **Frame Update Path**: ECS components → `RenderCommand` deltas → renderer sync → instancing buffers → draw.
3. **Input Picking Path**: Mouse event → `camera.pixel_ray` → physics query → highlight entity (`UpdateMaterial`/`SetVisibility`).
4. **Diagnostics Path**: `Context::statistics` → diagnostics resource → HUD overlay/log file.

```
Disk Assets ─► Asset Worker ─► Render Commands ─► Renderer ─► three-d GPU
          ▲                                              │
          └────────────── ECS / Physics / Input ◄────────┘
```

---

## Migration Plan

### Phase 1: Proof of Concept (2-4 hours) ✅ COMPLETE

**Goal:** Render a simple scene with three-d to validate approach

**Tasks:**

1. ✅ Add three-d dependency to `Cargo.toml`
2. ✅ Create `src/threed_renderer.rs` with basic implementation
3. ✅ Render primitive shapes (cube, sphere, plane)
4. ✅ Test camera controls and basic lighting
5. ✅ Compare visual output with Three.js screenshot

**Success Criteria:**

- ✅ Engine compiles and runs
- ✅ Primitives render with PBR materials
- ✅ Lighting looks similar to Three.js
- ✅ No major blockers identified

**Completion Notes:**

- POC scene renders successfully with red cube
- PBR materials working (PhysicalMaterial with metalness/roughness)
- Camera system functional (position/target based)
- winit 0.28 compatibility verified (three-d requirement)
- Feature flag system implemented (`threed-only`) to avoid winit conflicts with old wgpu renderer

### Phase 2: Feature Parity (4-6 hours) 🚧 IN PROGRESS

**Goal:** Match all current wgpu renderer features

**Tasks:**

1. ✅ Implement scene loading (`SceneData` → three-d objects)
   - ✅ Entity → three-d object conversion
   - ✅ Transform component parsing (position/rotation/scale)
   - ✅ MeshRenderer component support (primitive meshes: cube, sphere, plane)
   - ✅ Camera component conversion (FOV, near/far planes, position/target)
   - ✅ Material caching system (HashMap by material ID)
   - ✅ All light types (directional, point, spot, ambient)
   - ✅ Case-insensitive light type matching
2. ⏳ Port material system with texture support
   - ✅ Basic PBR materials (color, metalness, roughness)
   - ⏳ Texture loading and binding
   - ⏳ Normal maps, metallic/roughness maps
3. ✅ Port all light types (directional, point, spot, ambient)
4. ⏳ Implement shadow mapping
5. ⏳ Port debug HUD and collider visualization
6. ⏳ Introduce mesh/texture caches and render-command channel
7. ⏳ Implement instancing for duplicated meshes
8. ✅ Handle resize events

**Success Criteria:**

- ✅ All scene files load and render
- ✅ Materials match JSON definitions
- ⏳ Shadows work correctly
- ⏳ Debug mode shows colliders + HUD
- ⏳ Renderer stays under 200 draw calls on `complex.json`

**Completion Notes (Phase 2.1):**

- Scene loading fully implemented in `threed_renderer.rs::load_scene()`
- Component parsing: Transform (with degrees→radians conversion), MeshRenderer, Camera, Light
- Primitive mesh generation: cube, sphere, plane based on meshId hints
- Material system: Parses JSON materials, caches by ID, applies color/metalness/roughness
- Light system: All 4 types supported (DirectionalLight, PointLight, SpotLight, AmbientLight)
- Bug fixes:
  - Fixed light type case sensitivity (JSON: "directional" vs code: "DirectionalLight")
  - Fixed camera direction vector (was backward: (0,0,-1), now forward: (0,0,1))
  - Fixed degrees→radians rotation conversion
- Test scenes loading successfully: POC test scene, testlighting.json, simple-test.json

### Phase 3: Visual Validation (2-3 hours)

**Goal:** Achieve 95%+ visual parity with Three.js

**Tasks:**

1. Load test scenes in both Three.js editor and Rust engine
2. Screenshot comparison for each scene
3. Tune material parameters (roughness, metallic defaults)
4. Adjust lighting intensity to match Three.js
5. Fix any color space issues (gamma, tone mapping)
6. Validate HDR environment map pre-filter results

**Success Criteria:**

- ✅ Materials look identical to Three.js
- ✅ Lighting intensity matches
- ✅ Shadows have similar quality
- ✅ No obvious visual regressions
- ✅ HDR environment maps prefilter correctly (`Environment::load` + `Irradiance::new`)

### Phase 4: Physics Integration (2-3 hours)

**Goal:** Maintain physics system integration

**Tasks:**

1. Update physics transform sync for three-d meshes
2. Port collider debug rendering
3. Test physics simulation with new renderer
4. Verify performance (60 FPS target)

**Success Criteria:**

- ✅ Physics objects update visually
- ✅ Collider gizmos render correctly
- ✅ No performance degradation
- ✅ Picking ray → physics world mapping tested (`camera.pixel_ray`)

### Phase 5: Cleanup (1-2 hours)

**Goal:** Remove deprecated wgpu code

**Tasks:**

1. Delete `src/render/` directory (old wgpu code)
2. Remove unused wgpu dependencies
3. Update documentation
4. Add migration notes to CLAUDE.md

**Success Criteria:**

- ✅ No dead code remaining
- ✅ Clean compilation without warnings
- ✅ Documentation updated

---

## Testing Strategy

### Visual Regression Tests

**Process:**

1. Load each scene in `rust/game/scenes/`
2. Capture screenshot with wgpu renderer (baseline)
3. Capture screenshot with three-d renderer
4. Compare using image diff tools
5. Document any differences

**Test Scenes:**

- `testphysics.json` - Physics primitives with materials
- `GLTFTest.json` - GLTF model loading
- `CameraTestScene.json` - Camera configurations
- `complex.json` - Multiple lights + shadows

### Performance Benchmarks

**Metrics:**

- Frame time (target: <16ms)
- FPS (target: 60+)
- Memory usage (baseline: wgpu current)
- Draw call count (target: <200 for complex scene)
- GPU timings from `Context::statistics` (main pass <8ms)

**Test Cases:**

1. Simple scene (10 entities)
2. Medium scene (100 entities)
3. Complex scene (500+ entities)

### Compatibility Tests

**Platforms:**

- ✅ Linux (primary development)
- ⏳ Windows (secondary)
- ⏳ macOS (tertiary)
- ⏳ Steam Deck verification (Vulkan, low-power GPU)

**Graphics APIs (via three-d/wgpu):**

- Vulkan (Linux primary)
- DirectX 12 (Windows)
- Metal (macOS)

---

## Risk Assessment

### Technical Risks

| Risk                                     | Probability | Impact | Mitigation                                                                        |
| ---------------------------------------- | ----------- | ------ | --------------------------------------------------------------------------------- |
| three-d API limitations                  | Medium      | High   | Validate POC first; keep wgpu as fallback                                         |
| Performance regression                   | Low         | Medium | Benchmark before/after; three-d uses wgpu backend                                 |
| GLTF loading incompatibility             | Low         | Medium | three-d has built-in GLTF support                                                 |
| Physics debug rendering issues           | Low         | Low    | Can use three-d's line rendering primitives                                       |
| Missing wgpu features                    | Medium      | High   | Audit three-d feature set in POC phase                                            |
| Resource lifetime bugs (dangling meshes) | Medium      | Medium | Enforce command queue for asset creation/destruction; add asserts in debug builds |

### Schedule Risks

| Risk                                  | Probability | Impact | Mitigation                                      |
| ------------------------------------- | ----------- | ------ | ----------------------------------------------- |
| POC reveals blockers                  | Medium      | High   | Allocate 4 hours for POC; abort if major issues |
| Visual parity unachievable            | Low         | High   | three-d uses same PBR as Three.js               |
| Migration takes longer than estimated | Medium      | Medium | Keep wgpu code until three-d fully validated    |

---

## Success Criteria

### Must Have (P0)

- ✅ Engine renders all existing scenes
- ✅ Materials use full PBR (Cook-Torrance BRDF)
- ✅ Visual output matches Three.js 95%+
- ✅ Shadows work for directional/spot lights
- ✅ Physics debug rendering works
- ✅ Performance: 60 FPS on target hardware

### Should Have (P1)

- ✅ Code reduction: <500 LOC for rendering
- ✅ Environment lighting (IBL) support
- ✅ Normal mapping works correctly
- ✅ Tone mapping matches Three.js

### Nice to Have (P2)

- ⏳ Post-processing effects (bloom, SSAO)
- ⏳ Multiple shadow cascades (CSM)
- ⏳ Advanced debug visualizations

---

## Rollback Plan

If migration fails or reveals critical blockers:

1. **Keep wgpu code** - Don't delete until three-d validated
2. **Feature flag** - Use Cargo features to toggle renderers
   ```toml
   [features]
   default = ["threed-renderer"]
   threed-renderer = ["dep:three-d"]
   wgpu-renderer = []
   ```
3. **Abort criteria:**
   - POC cannot render basic scene (<4 hours)
   - Missing critical three-d features (e.g., instancing)
   - Performance regression >20%
   - Cannot achieve 80%+ visual parity

---

## Post-Migration

### Documentation Updates

- Update `rust/CLAUDE.md` with three-d conventions
- Add three-d material system documentation
- Document any three-d-specific patterns

### Future Enhancements

Enabled by three-d migration:

- **IBL Support** - Environment maps for realistic reflections
- **Post-Processing** - Bloom, SSAO, motion blur
- **Advanced Shadows** - Cascaded shadow maps (CSM)
- **Deferred Rendering** - For many lights
- **Editor Features** - Easier to add gizmos, overlays
- **GPU Picking** - Use `RenderTarget::read_color` for accurate selection
- **Procedural Materials** - Leverage node-based `CpuMaterial` generation for editor previews

---

## Appendix A: Code Comparison

### wgpu (Current)

```rust
// Create render pipeline (100+ lines)
let shader = device.create_shader_module(...);
let pipeline_layout = device.create_pipeline_layout(...);
let render_pipeline = device.create_render_pipeline(&RenderPipelineDescriptor {
    layout: Some(&pipeline_layout),
    vertex: VertexState { /* ... */ },
    fragment: Some(FragmentState { /* ... */ }),
    primitive: PrimitiveState { /* ... */ },
    depth_stencil: Some(DepthStencilState { /* ... */ }),
    multisample: MultisampleState { /* ... */ },
    // ... 50 more lines
});

// Render loop (50+ lines per frame)
let encoder = device.create_command_encoder(...);
let mut render_pass = encoder.begin_render_pass(&RenderPassDescriptor {
    color_attachments: &[/* ... */],
    depth_stencil_attachment: Some(/* ... */),
    // ... manual state management
});
render_pass.set_pipeline(&pipeline);
render_pass.set_bind_group(0, &camera_bind_group, &[]);
render_pass.set_bind_group(1, &texture_bind_group, &[]);
// ... 30 more lines
```

### three-d (Target)

```rust
// Create material (3 lines)
let material = PhysicalMaterial::new(&context, &CpuMaterial {
    albedo: Color::RED,
    metallic: 0.5,
    roughness: 0.3,
    ..Default::default()
});

// Render loop (1 line per mesh)
mesh.render(&camera, &lights)?;
```

---

## Appendix B: Visual Quality Comparison

### Missing from wgpu (Current)

| Feature                 | Impact on Visuals                    | three-d Support |
| ----------------------- | ------------------------------------ | --------------- |
| Cook-Torrance BRDF      | Realistic metal/dielectric materials | ✅ Built-in     |
| GGX Normal Distribution | Correct specular highlights          | ✅ Built-in     |
| Fresnel (Schlick)       | Angle-dependent reflections          | ✅ Built-in     |
| Image-Based Lighting    | Realistic ambient/reflections        | ✅ Built-in     |
| Energy Conservation     | Physically correct lighting          | ✅ Built-in     |
| Proper Gamma Correction | Color accuracy                       | ✅ Built-in     |

### Visual Difference Examples

**Metallic Materials:**

- wgpu: Uniform specular highlight (incorrect)
- three-d: Anisotropic specular based on roughness (correct)

**Edge Lighting (Fresnel):**

- wgpu: Missing edge brightening
- three-d: Realistic edge highlights on curved surfaces

**Rough Surfaces:**

- wgpu: Sharp specular (wrong)
- three-d: Diffuse specular lobe (correct)

---

## Timeline

| Phase               | Duration        | Completion Date |
| ------------------- | --------------- | --------------- |
| POC                 | 2-4 hours       | Day 1           |
| Feature Parity      | 4-6 hours       | Day 1-2         |
| Visual Validation   | 2-3 hours       | Day 2           |
| Physics Integration | 2-3 hours       | Day 2-3         |
| Cleanup             | 1-2 hours       | Day 3           |
| **TOTAL**           | **12-20 hours** | **3 days**      |

---

## Approvals

- [ ] Technical Lead - Architecture Review
- [ ] Product Owner - Requirements Validation
- [ ] QA Lead - Testing Strategy

---

**Next Steps:**

1. Review and approve this PRD
2. Begin Phase 1 (POC) implementation
3. Schedule go/no-go decision after POC (4 hours)
