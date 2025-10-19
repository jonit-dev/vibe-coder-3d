# Rust Engine Development Guidelines

## Overview

This folder contains the native Rust engine that renders 3D scenes using wgpu. It consumes JSON scene files exported by the TypeScript editor and renders them with native GPU acceleration.

## Critical

- Always respect SRP, DRY, KISS, YAGNI principles.
- Must use snake_case for variable naming in Rust!
- **ALWAYS use `vibe_ecs_bridge::transform_utils` for rotation conversions** - TypeScript stores rotations in DEGREES, Rust expects RADIANS

## Code Organization Principles (SRP, DRY, KISS, YAGNI)

### Single Responsibility Principle (SRP)

**Rule**: Each module, struct, or function should have ONE clear responsibility.

```rust
// ❌ BAD - God object doing everything
pub struct Renderer {
    // Rendering
    context: Context,
    meshes: Vec<Mesh>,

    // Material management
    materials: HashMap<String, Material>,

    // Mesh loading
    mesh_cache: HashMap<String, CpuMesh>,

    // Scene parsing
    component_registry: ComponentRegistry,

    // 500+ lines of mixed concerns...
}

// ✅ GOOD - Separated responsibilities
pub struct Renderer {
    context: Context,
    meshes: Vec<Mesh>,
    material_manager: MaterialManager,  // Delegated responsibility
}

pub struct MaterialManager {
    cache: HashMap<String, MaterialData>,
}

impl MaterialManager {
    pub fn create_physical_material(&self, context: &Context, material: &MaterialData) -> PhysicalMaterial {
        // Focused on ONE thing: material creation
    }
}
```

**Guidelines**:
- Keep structs focused on ONE domain (rendering, materials, physics, etc.)
- Extract helper modules when a file exceeds ~300-400 lines
- Each function should do ONE thing and do it well
- Use composition over inheritance (Rust makes this natural)

### Don't Repeat Yourself (DRY)

**Rule**: Extract common code into reusable utilities to avoid duplication.

```rust
// ❌ BAD - Repeated Z-flip coordinate conversion
let position = vec3(pos.x, pos.y, -pos.z);  // Repeated 8 times in the file
let direction = vec3(dir_x, dir_y, -dir_z);  // Same pattern, same mistake risk

// ✅ GOOD - Centralized conversion utilities
// In renderer/coordinate_conversion.rs
pub fn threejs_to_threed_position(pos: GlamVec3) -> Vec3 {
    Vec3::new(pos.x, pos.y, -pos.z)
}

pub fn threejs_to_threed_direction(dir_x: f32, dir_y: f32, dir_z: f32) -> Vec3 {
    Vec3::new(dir_x, dir_y, -dir_z)
}

// Used everywhere consistently
let position = threejs_to_threed_position(pos);
let direction = threejs_to_threed_direction(light.directionX, light.directionY, light.directionZ);
```

**Guidelines**:
- Create utility modules for repeated patterns (coordinate conversion, transform utils, etc.)
- Extract common logging patterns into helper functions
- Use `const` for repeated magic numbers
- Don't copy-paste code - refactor into a shared function

### Keep It Simple, Stupid (KISS)

**Rule**: Prefer simple, clear solutions over complex, clever ones.

```rust
// ❌ BAD - Overly complex with unclear flow
fn load_entity(&mut self, entity: &Entity) -> Result<()> {
    match entity.components.get("MeshRenderer") {
        Some(mr) => match self.component_registry.decode("MeshRenderer", mr) {
            Ok(boxed) => match boxed.downcast::<MeshRenderer>() {
                Ok(mesh_renderer) => {
                    // 50+ lines of mesh creation inline...
                }
                Err(e) => log::warn!("Downcast failed"),
            }
            Err(e) => log::warn!("Decode failed"),
        }
        None => {}
    }
    // Repeat for Light, Camera, Transform...
}

// ✅ GOOD - Simple, clear delegation
fn load_entity(&mut self, entity: &Entity) -> Result<()> {
    let transform = self.get_component::<Transform>(entity, "Transform");

    if let Some(mesh_renderer) = self.get_component::<MeshRenderer>(entity, "MeshRenderer") {
        self.handle_mesh_renderer(entity, &mesh_renderer, transform.as_ref())?;
    }

    if let Some(light) = self.get_component::<LightComponent>(entity, "Light") {
        self.handle_light(&light, transform.as_ref())?;
    }

    Ok(())
}

fn get_component<T: 'static>(&self, entity: &Entity, name: &str) -> Option<T>
where T: serde::de::DeserializeOwned {
    // Complexity hidden in one reusable method
}
```

**Guidelines**:
- Break complex functions into smaller, named helper functions
- Prefer clear variable names over comments explaining unclear names
- Avoid deep nesting (max 3-4 levels)
- Delegate complexity to specialized modules

### You Aren't Gonna Need It (YAGNI)

**Rule**: Don't add functionality until you actually need it.

```rust
// ❌ BAD - Premature optimization and unused features
pub struct MaterialManager {
    cache: HashMap<String, MaterialData>,
    lru_eviction: bool,  // Not needed yet
    max_cache_size: usize,  // Not needed yet
    hit_count: HashMap<String, usize>,  // Not needed yet
    async_loader: Option<AsyncLoader>,  // Not needed yet
}

// ✅ GOOD - Only what's needed now
pub struct MaterialManager {
    cache: HashMap<String, MaterialData>,
}

// Add features when they're actually required:
// - LRU eviction when memory becomes an issue
// - Async loading when load times become a problem
// - Hit counting when profiling shows cache issues
```

**Guidelines**:
- Implement features when they're needed, not "just in case"
- Don't add configuration options for hypothetical use cases
- Avoid "future-proofing" - requirements change, your assumptions will be wrong
- Trust that refactoring is easier than maintaining unused code

### Avoiding Verbose and Convoluted Code

**Rules**:
1. **File Size Limit**: Keep files under 500 lines. If larger, split into submodules.
2. **Function Size Limit**: Functions over 50 lines should be refactored into smaller helpers.
3. **Clear Module Boundaries**: Each module should export a clean, minimal public API.

```rust
// ❌ BAD - 900+ line monolithic file
// src/threed_renderer.rs (before refactoring)
impl ThreeDRenderer {
    fn load_mesh_renderer(&mut self, ...) {
        // 170+ lines of inline mesh creation, material handling, transform conversion...
    }

    fn load_light(&mut self, ...) {
        // 120+ lines of inline light creation with repeated patterns...
    }

    fn load_camera(&mut self, ...) {
        // 100+ lines of inline camera setup...
    }

    fn create_material(&self, ...) {
        // Inline material creation...
    }

    fn primitive_base_scale(...) {
        // Inline utility function...
    }
}

// ✅ GOOD - Modular structure
// src/renderer/
// ├── mod.rs                    (clean re-exports)
// ├── material_manager.rs       (120 lines, focused on materials)
// ├── mesh_loader.rs            (70 lines, focused on mesh loading)
// ├── light_loader.rs           (140 lines, focused on light creation)
// ├── camera_loader.rs          (90 lines, focused on camera setup)
// ├── transform_utils.rs        (200 lines, focused on transform conversions)
// ├── coordinate_conversion.rs  (40 lines, focused on coordinate systems)
// └── primitive_mesh.rs         (60 lines, focused on primitive creation)

// src/threed_renderer.rs (after refactoring - 480 lines)
impl ThreeDRenderer {
    fn handle_mesh_renderer(&mut self, entity: &Entity, mesh_renderer: &MeshRenderer, transform: Option<&Transform>) -> Result<()> {
        let (gm, final_scale) = load_mesh_renderer(&self.context, entity, mesh_renderer, transform, &self.material_manager)?;
        self.meshes.push(gm);
        self.mesh_entity_ids.push(entity.entity_id().unwrap_or(EntityId::new(0)));
        self.mesh_scales.push(final_scale);
        Ok(())
    }

    fn handle_light(&mut self, light: &LightComponent, transform: Option<&Transform>) -> Result<()> {
        if let Some(loaded_light) = load_light(&self.context, light, transform)? {
            match loaded_light {
                LoadedLight::Directional(light) => self.directional_lights.push(light),
                LoadedLight::Point(light) => self.point_lights.push(light),
                LoadedLight::Spot(light) => self.spot_lights.push(light),
                LoadedLight::Ambient(light) => self.ambient_light = Some(light),
            }
        }
        Ok(())
    }
}
```

**Benefits of this approach**:
- Each module can be understood in isolation
- Easy to add new features (e.g., new light types → modify light_loader.rs only)
- Easy to test (each module has focused tests)
- Easy to reuse (material_manager can be used by other systems)
- Reduced cognitive load (work on one concept at a time)

### Refactoring Checklist

When you notice code getting complex, ask:

- [ ] Is this file over 500 lines? → Split into submodules
- [ ] Is this function over 50 lines? → Extract helper functions
- [ ] Am I copy-pasting code? → Create a utility function
- [ ] Does this struct have multiple unrelated responsibilities? → Split into focused structs
- [ ] Am I adding code "just in case"? → Wait until it's actually needed
- [ ] Would a newcomer understand this easily? → Simplify or add clear documentation

## Project Structure

```
rust/
├── engine/              # Main rendering engine (binary crate)
│   ├── src/
│   │   ├── main.rs      # CLI entrypoint
│   │   ├── app.rs       # Application lifecycle
│   │   ├── ecs/         # Entity-Component-System
│   │   ├── render/      # GPU rendering (wgpu)
│   │   ├── io/          # Scene loading
│   │   └── util/        # Utilities (timing, etc.)
│   └── Cargo.toml
└── game/
    ├── scenes/          # JSON scene files
    └── schema/          # TypeScript → Rust schema exports
```

## Core Rules

### Code Style

- **Use idiomatic Rust**: Follow Rust API guidelines and community conventions
- **Use snake_case for variables and functions**: All local variables, function names, and struct fields (except JSON-bound fields) must use snake_case
- **Use PascalCase for types**: Structs, enums, and traits use PascalCase (e.g., `MeshCache`, `GpuMesh`)
- **Use SCREAMING_SNAKE_CASE for constants**: Global constants use uppercase with underscores
- **Prefer explicit over implicit**: Be clear about types, lifetimes, and error handling
- **Run `cargo fmt`** before committing - formatting is non-negotiable
- **Run `cargo clippy`** and address warnings - they often catch real issues
- **No `unwrap()` in production paths** - use proper error handling with `Result<T, E>`
- **Use structured logging**: `log::info!()`, `log::debug()`, etc. - no `println!()` except in CLI output

```rust
// ✅ GOOD - proper naming conventions
const MAX_TEXTURE_SIZE: u32 = 4096;

pub struct MeshCache {
    mesh_map: HashMap<String, GpuMesh>,
}

impl MeshCache {
    pub fn upload_mesh(&mut self, device: &wgpu::Device, mesh_id: &str, mesh: Mesh) {
        let vertex_buffer = device.create_buffer_init(...);
        let index_count = mesh.indices.len() as u32;
    }
}

// ❌ BAD - inconsistent naming
pub struct meshCache {  // Should be PascalCase
    MeshMap: HashMap<String, GpuMesh>,  // Should be snake_case
}

impl meshCache {
    pub fn UploadMesh(&mut self, Device: &wgpu::Device, meshID: &str) {  // Should be snake_case
        let VertexBuffer = ...;  // Should be snake_case
    }
}
```

### Error Handling

Always use `anyhow::Result` for functions that can fail, and add context to errors:

```rust
// ❌ BAD - panics on error
let data = std::fs::read_to_string(path).unwrap();

// ❌ BAD - unclear error messages
fn load_file(path: &Path) -> Result<String> {
    Ok(std::fs::read_to_string(path)?)  // What file? Why did it fail?
}

// ✅ GOOD - context on error
use anyhow::{Context, Result};

fn load_scene(path: &Path) -> Result<SceneData> {
    let json = std::fs::read_to_string(path)
        .with_context(|| format!("Failed to read scene file: {}", path.display()))?;
    serde_json::from_str(&json)
        .context("Failed to parse scene JSON")
}

// ✅ GOOD - GLTF loading with comprehensive error context
fn load_gltf(path: &str) -> Result<Vec<Mesh>> {
    let (document, buffers, _images) = gltf::import(path)
        .with_context(|| format!("Failed to load GLTF file: {}", path))?;

    let positions = reader.read_positions()
        .context("GLTF mesh missing positions")?;

    Ok(meshes)
}
```

**Error Handling Rules:**

- Use `anyhow::Result<T>` for public functions that can fail
- Use `.context()` for static error messages
- Use `.with_context(|| format!(...))` for dynamic error messages (closures avoid allocation on success)
- Never use `unwrap()` or `expect()` in library code (tests are OK)
- Log errors at the point they're handled, not where they're created

### Module Organization

- **One concept per file**: Don't mix concerns (e.g., rendering + physics)
- **Use `mod.rs` for re-exports**: Keep public API clean
- **Prefer small, focused modules**: Easier to test and maintain
- **Test modules go next to source**: `foo.rs` → `foo_test.rs` with `#[cfg(test)]`

```rust
// In mod.rs
pub mod camera;
#[cfg(test)]
mod camera_test;
pub mod material;
#[cfg(test)]
mod material_test;

// Re-export commonly used types
pub use camera::Camera;
pub use material::{Material, MaterialCache};
```

## Testing Guidelines

### Test Coverage Requirements

- **EVERY public function must have tests** - no exceptions
- **Use descriptive test names**: `test_camera_fov_affects_projection` not `test1`
- **Test edge cases**: empty inputs, None values, boundary conditions
- **Test errors**: Verify error paths work correctly

### Test Organization

```rust
// ✅ GOOD - tests in separate module
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_transform_default_values() {
        let transform = Transform::default();
        assert_eq!(transform.position, Some([0.0, 0.0, 0.0]));
    }

    #[test]
    fn test_transform_none_returns_zero() {
        let transform = Transform { position: None, ..Default::default() };
        assert_eq!(transform.position_vec3(), Vec3::ZERO);
    }
}
```

### Running Tests

```bash
# Run all tests
cargo test

# Run specific test
cargo test test_material_cache

# Run tests with output
cargo test -- --nocapture

# Run tests matching pattern
cargo test camera
```

## Performance Guidelines

### Allocation and Borrowing

- **Prefer borrowing over cloning**: Use `&T` when you don't need ownership
- **Use `Cow<T>` for conditional ownership**: Avoid unnecessary clones
- **Batch allocations**: Pre-allocate `Vec` capacity when size is known
- **Avoid allocations in hot loops**: Move allocations outside render loop

```rust
// ❌ BAD - unnecessary clone in loop
for entity in entities {
    let name = entity.name.clone(); // Clones every iteration
    process(name);
}

// ✅ GOOD - borrow instead
for entity in entities {
    if let Some(name) = &entity.name {
        process(name); // No allocation
    }
}
```

### GPU Resource Management

- **Reuse buffers**: Don't recreate buffers every frame
- **Batch draw calls**: Group by mesh/material to minimize state changes
- **Use instancing**: Render multiple entities with same mesh in one draw call
- **Cache GPU resources**: Store uploaded meshes, don't re-upload

```rust
// ✅ GOOD - cache mesh uploads
pub struct MeshCache {
    meshes: HashMap<String, GpuMesh>,
}

impl MeshCache {
    pub fn get_or_upload(&mut self, device: &Device, id: &str, mesh: Mesh) -> &GpuMesh {
        self.meshes.entry(id.to_string()).or_insert_with(|| {
            upload_mesh(device, mesh)
        })
    }
}
```

## Architecture Patterns

### Component Design

- **Components are data-only**: No logic in component structs
- **Use systems for logic**: Separate data from behavior
- **Serialize with serde**: Components must deserialize from JSON
- **Provide sensible defaults**: Use `#[serde(default)]` liberally

```rust
// ✅ GOOD - data-only component
#[derive(Debug, Deserialize, Clone)]
pub struct Transform {
    #[serde(default)]
    pub position: Option<[f32; 3]>,
    #[serde(default)]
    pub rotation: Option<[f32; 4]>,
    #[serde(default)]
    pub scale: Option<[f32; 3]>,
}

impl Transform {
    // Helper methods for conversion, not logic
    pub fn position_vec3(&self) -> Vec3 {
        self.position
            .map(|p| Vec3::new(p[0], p[1], p[2]))
            .unwrap_or(Vec3::ZERO)
    }
}
```

### Renderer Design

- **Separate setup from rendering**: Init in `new()`, render in `render()`
- **Use builder pattern for complex configs**: Makes API more ergonomic
- **Keep render loop simple**: Delegate complexity to helper methods
- **Handle resize gracefully**: Recreate surface-dependent resources

```rust
// ✅ GOOD - separation of concerns
pub struct Renderer {
    device: Device,
    queue: Queue,
    surface: Surface,
    pipeline: RenderPipeline,
}

impl Renderer {
    pub fn new(window: &Window) -> Result<Self> {
        // Setup only
    }

    pub fn render(&mut self, scene: &Scene) -> Result<()> {
        // Rendering only
    }

    pub fn resize(&mut self, width: u32, height: u32) {
        // Handle resize
    }
}
```

## TypeScript Integration

### JSON Schema Compatibility

- **Match TypeScript naming exactly**: Use camelCase for JSON fields (even if Rust warns)
- **Optional fields must be Option<T>**: Match JS undefined behavior
- **Use serde rename if needed**: For Rust naming conventions

```rust
// ✅ GOOD - matches TypeScript exactly
#[derive(Deserialize)]
pub struct MeshRenderer {
    #[serde(default)]
    pub meshId: Option<String>,        // matches TS: meshId?: string
    #[serde(default)]
    pub materialId: Option<String>,    // matches TS: materialId?: string
    #[serde(default = "default_enabled")]
    pub enabled: bool,                 // matches TS: enabled = true
}

fn default_enabled() -> bool { true }
```

### Component Parsing

- **Parse components dynamically**: Use `HashMap<String, Value>` first
- **Deserialize on demand**: Convert to typed component when needed
- **Handle unknown components gracefully**: Warn but don't fail

```rust
// ✅ GOOD - flexible component parsing
pub fn parse_component<T: DeserializeOwned>(
    components: &HashMap<String, Value>,
    name: &str
) -> Option<T> {
    components.get(name)
        .and_then(|v| serde_json::from_value(v.clone()).ok())
}
```

### Critical Data Format Differences

#### Rotation Units: Degrees vs Radians

**CRITICAL:** TypeScript stores rotations as **Euler angles in DEGREES**, but Rust math libraries expect **RADIANS**.

```typescript
// TypeScript (src/core/lib/ecs/components/TransformComponent.ts)
export interface ITransformData {
  position: [number, number, number];
  rotation: [number, number, number]; // Euler angles in DEGREES
  scale: [number, number, number];
}
```

```rust
// ✅ GOOD - Rust Transform converts degrees to radians
pub fn rotation_quat(&self) -> Quat {
    self.rotation
        .as_ref()
        .map(|r| {
            match r.len() {
                3 => {
                    // Euler angles in DEGREES from TypeScript
                    // Convert to radians for glam
                    let x_rad = r[0].to_radians();
                    let y_rad = r[1].to_radians();
                    let z_rad = r[2].to_radians();
                    Quat::from_euler(glam::EulerRot::XYZ, x_rad, y_rad, z_rad)
                }
                4 => {
                    // Quaternion [x, y, z, w] - use directly
                    Quat::from_xyzw(r[0], r[1], r[2], r[3])
                }
                _ => Quat::IDENTITY
            }
        })
        .unwrap_or(Quat::IDENTITY)
}
```

**Why this matters:**

- A plane rotated `-90°` around X in TS must become `-π/2` radians in Rust
- Without conversion, rotations will be ~57x too small (1 radian ≈ 57.3 degrees)
- This causes objects to appear in wrong orientations or not visible at all

#### Vec3/Vec2 Object vs Array Format

TypeScript components may export vectors as either arrays OR objects:

```json
// Array format (older scenes)
"followOffset": [0, 5, -10]

// Object format (editor-generated scenes)
"followOffset": {"x": 0, "y": 5, "z": -10}
"skyboxRepeat": {"u": 1, "v": 1}
```

**Solution:** Use custom deserializers that accept both formats:

```rust
fn deserialize_optional_vec3<'de, D>(deserializer: D) -> Result<Option<[f32; 3]>, D::Error>
where
    D: Deserializer<'de>,
{
    #[derive(Deserialize)]
    #[serde(untagged)]
    enum Vec3Format {
        Array([f32; 3]),
        Object(Vec3Object),
    }

    Ok(
        Option::<Vec3Format>::deserialize(deserializer)?.map(|v| match v {
            Vec3Format::Array(arr) => arr,
            Vec3Format::Object(obj) => [obj.x, obj.y, obj.z],
        }),
    )
}
```

### Scene Validation

Before loading scenes in Rust, validate them with the Node.js script:

```bash
# Validate a scene file
yarn validate:scene rust/game/scenes/testphysics.json

# Or directly
node scripts/validate-scene.cjs rust/game/scenes/testphysics.json
```

The validator checks:

- ✓ Rotation format (degrees vs radians, array vs object)
- ✓ Camera vec3/vec2 fields (array vs object format)
- ✓ Component structure and required fields
- ✓ Material references and definitions

## Common Patterns

### Feature-Gated Code

Use feature flags for optional dependencies and functionality:

```rust
// ✅ GOOD - feature-gated implementation
#[cfg(feature = "gltf-support")]
pub fn load_gltf(path: &str) -> Result<Vec<Mesh>> {
    let (document, buffers, _images) = gltf::import(path)?;
    // ... actual implementation
}

#[cfg(not(feature = "gltf-support"))]
pub fn load_gltf(_path: &str) -> anyhow::Result<Vec<Mesh>> {
    anyhow::bail!("GLTF support not enabled. Compile with --features gltf-support")
}

// In Cargo.toml
[features]
default = []
gltf-support = ["dep:gltf"]

[dependencies]
gltf = { version = "1.4", optional = true }
```

This pattern:

- Keeps binary size small when features aren't needed
- Provides clear error messages when features are missing
- Allows conditional compilation of heavy dependencies

### Resource Caching

```rust
pub struct ResourceCache<T> {
    resources: HashMap<String, T>,
}

impl<T> ResourceCache<T> {
    pub fn new() -> Self {
        Self { resources: HashMap::new() }
    }

    pub fn get(&self, id: &str) -> Option<&T> {
        self.resources.get(id)
    }

    pub fn insert(&mut self, id: String, resource: T) {
        self.resources.insert(id, resource);
    }
}
```

### Builder Pattern

```rust
pub struct CameraBuilder {
    position: Vec3,
    target: Vec3,
    fov: f32,
    aspect: f32,
}

impl CameraBuilder {
    pub fn new() -> Self {
        Self {
            position: Vec3::new(0.0, 2.0, 5.0),
            target: Vec3::ZERO,
            fov: 60.0_f32.to_radians(),
            aspect: 16.0 / 9.0,
        }
    }

    pub fn position(mut self, position: Vec3) -> Self {
        self.position = position;
        self
    }

    pub fn fov(mut self, degrees: f32) -> Self {
        self.fov = degrees.to_radians();
        self
    }

    pub fn build(self) -> Camera {
        Camera { /* ... */ }
    }
}
```

### Default Trait Implementation

Always implement `Default` for cache and manager structs:

```rust
// ✅ GOOD - explicit Default implementation
impl Default for MeshCache {
    fn default() -> Self {
        Self::new()
    }
}

// ✅ ALSO GOOD - derive Default when struct fields all have Default
#[derive(Default)]
pub struct ResourceManager {
    meshes: HashMap<String, GpuMesh>,
    materials: HashMap<String, Material>,
}
```

This allows:

- Users to create instances with `MeshCache::default()`
- Structs containing your type to derive `Default`
- More idiomatic Rust code

## Debugging

### Logging Levels

```rust
use log::{trace, debug, info, warn, error};

trace!("Very detailed information");           // RUST_LOG=trace
debug!("Mesh uploaded: {} vertices", count);   // RUST_LOG=debug
info!("Scene loaded: {}", scene_name);         // RUST_LOG=info
warn!("Material not found, using default");    // RUST_LOG=warn
error!("Failed to load scene: {}", err);       // RUST_LOG=error
```

### Debug Builds

```bash
# Show all logs
RUST_LOG=debug cargo run -- --scene Test

# Show backtrace on panic
RUST_BACKTRACE=1 cargo run -- --scene Test

# Combine both
RUST_BACKTRACE=1 RUST_LOG=debug cargo run -- --scene Test
```

### GPU Debugging

```rust
// Enable wgpu validation (catches GPU errors)
let instance = wgpu::Instance::new(wgpu::InstanceDescriptor {
    backends: wgpu::Backends::all(),
    dx12_shader_compiler: Default::default(),
    flags: wgpu::InstanceFlags::DEBUG | wgpu::InstanceFlags::VALIDATION,
    ..Default::default()
});
```

## Critical Gotchas

### wgpu Lifetime Issues

- **Surface must outlive device**: Create surface before device
- **Buffers must outlive command encoders**: Keep buffers in struct
- **Bind groups reference buffers**: Don't drop buffers with active bind groups

### Serde Deserialization

- **Arrays vs Tuples**: `[f32; 3]` requires array in JSON `[1, 2, 3]`
- **Optional defaults**: Use `#[serde(default)]` for Option<T>
- **Snake case warnings**: Suppress with `#[allow(non_snake_case)]` for JSON compat

### Math Conventions

- **glam uses column-major matrices**: Matches GLSL/WGSL
- **Quaternions are XYZW**: Match the JSON format
- **Radians not degrees**: Convert with `.to_radians()`

## Development Workflow

### Before Committing

```bash
# 1. Format code
cargo fmt

# 2. Run linter
cargo clippy

# 3. Run all tests
cargo test

# 4. Check for errors without building
cargo check
```

### Adding New Components

1. Define struct in `ecs/components/`
2. Add `#[derive(Debug, Deserialize, Clone)]`
3. Use `#[serde(default)]` for optional fields
4. Create `component_test.rs` with comprehensive tests
5. Add to `components/mod.rs`
6. Document TypeScript compatibility

### Adding New Systems

1. Create module in appropriate folder (`render/`, `physics/`, etc.)
2. Define system struct with required resources
3. Implement `new()` for initialization
4. Implement main logic methods
5. Add comprehensive tests
6. Document integration points

## Performance Targets

- **60 FPS minimum**: On mid-range hardware (GTX 1060 equivalent)
- **< 16ms frame time**: Leaves headroom for OS/driver overhead
- **< 100MB memory**: For basic scenes with primitives
- **< 2s startup time**: From launch to first frame

## Build Configuration

### Development

```toml
[profile.dev]
opt-level = 0        # No optimization
debug = true         # Full debug info
incremental = true   # Fast rebuilds
```

### Release

```toml
[profile.release]
opt-level = 3        # Maximum optimization
lto = true           # Link-time optimization
codegen-units = 1    # Better optimization, slower compile
```

## Dependencies Philosophy

- **Prefer mature, maintained crates**: Check last update date
- **Avoid heavy dependencies for simple tasks**: std is often enough
- **Pin major versions**: Use `foo = "1.0"` not `foo = "*"`
- **Review dependency tree**: `cargo tree` to check bloat

## Workspace Crates Architecture

The engine is modularized into workspace crates under `engine/crates/`:

- **vibe-scene**: Core scene model (EntityId, Scene, Entity, ComponentKindId)
- **vibe-ecs-bridge**: Component registry and decoders for Three.js ECS integration
- **vibe-scene-graph**: Parent/child transform hierarchy and world transform propagation
- **vibe-assets**: Mesh/material/texture caches and GLTF loading

### Crate Design Principles

- **Single Responsibility**: Each crate has one clear purpose
- **Minimal Dependencies**: Keep crate dependency graph acyclic and shallow
- **Re-exports**: Main engine crate re-exports public APIs from workspace crates
- **Feature Flags**: Use features for optional dependencies (e.g., `gltf-support`)
- **Comprehensive Tests**: Each crate must have unit tests for all public functions

```rust
// ✅ GOOD - workspace crate organization
// In engine/crates/assets/src/lib.rs
pub use gltf_loader::load_gltf;
pub use material::{Material, MaterialCache};
pub use mesh_cache::{GpuMesh, MeshCache};
pub use texture_cache::{GpuTexture, TextureCache};
pub use vertex::{Vertex, Mesh};

// In engine/Cargo.toml
[dependencies]
vibe-scene = { path = "crates/scene" }
vibe-ecs-bridge = { path = "crates/ecs-bridge" }
vibe-assets = { path = "crates/assets" }
```

## Current Status

### ✅ Implemented

- Scene loading from JSON
- Transform, MeshRenderer, Camera, Light components
- Modular workspace crates architecture (scene, ecs-bridge, scene-graph, assets)
- Component registry system with dynamic decoders
- Primitive mesh rendering (cube, sphere, plane)
- Material system with PBR properties and texture caching
- Camera system with view/projection matrices
- Scene graph with parent-child transform hierarchy
- GLTF model loading (feature-gated)
- Comprehensive unit tests across all crates
- wgpu rendering pipeline

### 🚧 In Progress

- Integrating GLTF assets into rendering pipeline
- Texture loading and binding

### 📋 Planned

- Render graph architecture
- Shadow mapping
- Post-processing effects
- Physics integration (Rapier3D)
- Audio system
- Scripting runtime

## Resources

- [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)
- [wgpu Examples](https://github.com/gfx-rs/wgpu/tree/master/examples)
- [Learn wgpu](https://sotrh.github.io/learn-wgpu/)
- [Rust Book](https://doc.rust-lang.org/book/)

## ECS Feature Parity

When adding or modifying components to maintain parity with TypeScript:

- **Read** `ECS_PARITY_GUIDELINES.md` for comprehensive parity requirements
- **Use** `vibe_ecs_bridge::transform_utils` for ALL transform conversions
- **Test** with real scene files from the TypeScript editor
- **Verify** visual and physics behavior matches Three.js exactly

The parity guidelines document covers:

- Component structure requirements
- Decoder implementation patterns
- Transform coordinate system conversions (degrees vs radians!)
- Testing strategy
- Common parity violations and fixes

## Questions?

- Check `README.md` for quickstart and commands
- Check `IMPLEMENTATION.md` for architecture details
- Check `INTEGRATION_AUDIT.md` for TS ↔ Rust integration status
- Check `ECS_PARITY_GUIDELINES.md` for component parity standards
- Read inline code comments for specific implementation details

## Transform Coordinate System Conventions

### Critical: Degrees vs Radians

**THE BUG WE FIXED**: TypeScript/JSON stores rotation as Euler angles in **DEGREES**, but Rust math libraries (glam) expect **RADIANS**.

**ALWAYS use the standardized conversion utilities from `vibe-ecs-bridge/transform_utils.rs`** to avoid this bug:

```rust
use vibe_ecs_bridge::{rotation_to_quat, position_to_vec3, scale_to_vec3};

// ✅ CORRECT - uses standardized utilities
let rotation = rotation_to_quat(&[-90.0, 0.0, 0.0]); // Handles degrees → radians
let position = position_to_vec3(&[0.0, 1.0, -10.0]);
let scale = scale_to_vec3(&[10.0, 10.0, 1.0]);

// ❌ WRONG - manual conversion is error-prone
let rotation = Quat::from_euler(glam::EulerRot::XYZ, -90.0, 0.0, 0.0); // WRONG! Treats as radians
```

### Why This Matters

**Example Bug**: A plane with rotation `[-90, 0, 0]` degrees:

- ✅ **Correct**: Convert `-90°` → `-π/2 radians` → horizontal plane (floor)
- ❌ **Wrong**: Use `-90` as radians → `-5156°` rotation → slanted plane (ramp)

This caused physics objects to slide downhill instead of falling straight down!

### Standardized Conversion Functions

Located in `rust/engine/crates/ecs-bridge/src/transform_utils.rs`:

| Function                                            | Input                                   | Output | Notes                      |
| --------------------------------------------------- | --------------------------------------- | ------ | -------------------------- |
| `rotation_to_quat(rotation: &[f32])`                | 3-elem (Euler degrees) or 4-elem (quat) | `Quat` | **Auto-detects format**    |
| `rotation_to_quat_opt(rotation: Option<&Vec<f32>>)` | Optional rotation                       | `Quat` | Returns `IDENTITY` if None |
| `position_to_vec3(position: &[f32; 3])`             | XYZ array                               | `Vec3` | Simple conversion          |
| `position_to_vec3_opt(position: Option<&[f32; 3]>)` | Optional position                       | `Vec3` | Returns `ZERO` if None     |
| `scale_to_vec3(scale: &[f32; 3])`                   | XYZ array                               | `Vec3` | Simple conversion          |
| `scale_to_vec3_opt(scale: Option<&[f32; 3]>)`       | Optional scale                          | `Vec3` | Returns `ONE` if None      |

### Where to Use These Utilities

**Required in ALL code that reads Transform components:**

1. ✅ **Scene graph** (`vibe-scene-graph`) - used in `extract_local_transform()`
2. ✅ **Physics system** (`vibe-physics`) - used in `get_transform()`
3. ✅ **Rendering** - if directly reading transforms (usually uses scene graph)
4. ✅ **Any new system** that processes entity transforms

### Euler Rotation Order

Both Three.js and Rust use **XYZ Euler order** by default:

- Three.js: `new THREE.Euler(x, y, z, 'XYZ')`
- Rust: `Quat::from_euler(glam::EulerRot::XYZ, x, y, z)`

This is already handled by `rotation_to_quat()`.

### Coordinate System

- **Right-handed coordinate system** (matches Three.js)
- **Y-up** (Y axis is vertical)
- **+Z is forward** in default camera orientation
- **+X is right**

### Testing Transform Conversions

The `transform_utils` module has comprehensive tests:

```bash
cd rust/engine/crates/ecs-bridge
cargo test transform_utils
```

Key test cases:

- ✅ 90° Euler → π/2 radians quaternion
- ✅ -90° Euler (plane rotation) → correct horizontal orientation
- ✅ Quaternion passthrough (no conversion)
- ✅ Zero rotation → identity quaternion
- ✅ Invalid array lengths → identity with warning

### Adding New Transform-Related Code

When adding new code that processes transforms:

1. **Import standardized utilities:**

   ```rust
   use vibe_ecs_bridge::{rotation_to_quat_opt, position_to_vec3_opt, scale_to_vec3_opt};
   ```

2. **Use them for ALL conversions:**

   ```rust
   let position = position_to_vec3_opt(transform.position.as_ref());
   let rotation = rotation_to_quat_opt(transform.rotation.as_ref());
   let scale = scale_to_vec3_opt(transform.scale.as_ref());
   ```

3. **Never manually convert degrees → radians** - always use `rotation_to_quat()`

4. **Document that your code uses standardized conversions** in comments

### Migration Checklist

When reviewing existing transform code:

- [ ] Does it read rotation from JSON/Transform component?
- [ ] Does it use `rotation_to_quat()` or manual conversion?
- [ ] If manual: Does it call `.to_radians()` on Euler angles?
- [ ] If missing `.to_radians()`: **BUG! Fix immediately**
- [ ] Replace all manual conversions with standardized utilities

## Post-Implementation Verification

**CRITICAL**: After creating any new code (components, systems, utilities, etc.), you MUST verify that:

1. **Engine Integration**: The new code is properly hooked into the engine
   - Components are registered in the component registry
   - Systems are initialized and called in the render/update loop
   - Resources are properly managed (creation, caching, cleanup)
   - New modules are exported in `mod.rs` files

2. **Run Tests**: Execute the full test suite to catch integration issues
   ```bash
   cargo test
   ```

3. **Verification Checklist**:
   - [ ] New components registered in component registry?
   - [ ] New systems called in app.rs update/render loop?
   - [ ] New modules exported in parent mod.rs?
   - [ ] All tests passing?
   - [ ] Code follows naming conventions (snake_case)?
   - [ ] Error handling uses anyhow::Result with context?

**Why This Matters**: Code that isn't properly integrated will silently fail at runtime. Tests catch these issues early.
