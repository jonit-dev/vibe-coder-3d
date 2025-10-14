# Rust Engine Development Guidelines

## Overview

This folder contains the native Rust engine that renders 3D scenes using wgpu. It consumes JSON scene files exported by the TypeScript editor and renders them with native GPU acceleration.

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
- **Prefer explicit over implicit**: Be clear about types, lifetimes, and error handling
- **Run `cargo fmt`** before committing - formatting is non-negotiable
- **Run `cargo clippy`** and address warnings - they often catch real issues
- **No `unwrap()` in production paths** - use proper error handling with `Result<T, E>`
- **Use structured logging**: `log::info!()`, `log::debug()`, etc. - no `println!()` except in CLI output

### Error Handling

```rust
// ❌ BAD - panics on error
let data = std::fs::read_to_string(path).unwrap();

// ✅ GOOD - returns Result
fn load_file(path: &Path) -> Result<String, std::io::Error> {
    std::fs::read_to_string(path)
}

// ✅ GOOD - context on error
use anyhow::{Context, Result};
fn load_scene(path: &Path) -> Result<SceneData> {
    let json = std::fs::read_to_string(path)
        .context("Failed to read scene file")?;
    serde_json::from_str(&json)
        .context("Failed to parse scene JSON")
}
```

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

## Common Patterns

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

## Current Status

### ✅ Implemented

- Scene loading from JSON
- Transform, MeshRenderer, Camera components
- Basic ECS architecture
- Primitive mesh rendering (cube, sphere, plane)
- Material system with PBR properties
- Camera system with view/projection matrices
- 102 unit tests with full coverage
- wgpu rendering pipeline

### 🚧 In Progress

- GLTF model loading
- Entity hierarchy (parent-child transforms)
- Dynamic lighting system

### 📋 Planned

- Physics integration (Rapier3D)
- Audio system
- Scripting runtime
- Advanced rendering (shadows, post-processing)

## Resources

- [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)
- [wgpu Examples](https://github.com/gfx-rs/wgpu/tree/master/examples)
- [Learn wgpu](https://sotrh.github.io/learn-wgpu/)
- [Rust Book](https://doc.rust-lang.org/book/)

## Questions?

- Check `README.md` for quickstart and commands
- Check `IMPLEMENTATION.md` for architecture details
- Check `INTEGRATION_AUDIT.md` for TS ↔ Rust integration status
- Read inline code comments for specific implementation details
