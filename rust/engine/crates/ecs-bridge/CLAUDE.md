# vibe-ecs-bridge

Component registry and decoders for Three.js ECS integration.

## Purpose

This crate bridges the gap between TypeScript ECS and Rust by:

- **Type-safe decoding**: Convert JSON components to typed Rust structs
- **Capability tracking**: Know which components affect rendering, require passes, etc.
- **Extensible registry**: Easy to add new component decoders
- **Error handling**: Graceful fallback for unknown/malformed components

## Architecture

### IComponentDecoder Trait

All component decoders implement this trait:

```rust
pub trait IComponentDecoder: Send + Sync {
    fn can_decode(&self, kind: &str) -> bool;
    fn decode(&self, value: &Value) -> Result<Box<dyn Any>>;
    fn capabilities(&self) -> ComponentCapabilities;
    fn component_kinds(&self) -> Vec<ComponentKindId>;
}
```

### ComponentRegistry

Central registry for all decoders:

```rust
let mut registry = ComponentRegistry::new();
registry.register(TransformDecoder);
registry.register(CameraDecoder);

let decoded = registry.decode("Transform", &json_value)?;
let transform = decoded.downcast_ref::<Transform>().unwrap();
```

### ComponentCapabilities

Describes what a component does:

```rust
pub struct ComponentCapabilities {
    pub affects_rendering: bool,      // Does it impact visual output?
    pub requires_pass: Option<&'static str>,  // Which render pass?
    pub stable: bool,                 // Is the API stable?
}
```

## Supported Components

### Core Components

- **Transform**: position, rotation, scale (Euler or quaternion)
- **Camera**: FOV, near/far planes, projection type, background
- **Light**: type, color, intensity, shadows, direction
- **MeshRenderer**: meshId, materialId, modelPath, shadow flags
- **Material**: id reference

### Adding New Decoders

1. Define the component struct with serde derives:

```rust
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct MyComponent {
    pub value: f32,
}
```

2. Implement `IComponentDecoder`:

```rust
pub struct MyComponentDecoder;

impl IComponentDecoder for MyComponentDecoder {
    fn can_decode(&self, kind: &str) -> bool {
        kind == "MyComponent"
    }

    fn decode(&self, value: &Value) -> Result<Box<dyn Any>> {
        let component: MyComponent = serde_json::from_value(value.clone())?;
        Ok(Box::new(component))
    }

    fn capabilities(&self) -> ComponentCapabilities {
        ComponentCapabilities::rendering("geometry")
    }

    fn component_kinds(&self) -> Vec<ComponentKindId> {
        vec![ComponentKindId::new("MyComponent")]
    }
}
```

3. Register in `create_default_registry()`:

```rust
registry.register(MyComponentDecoder);
```

## Default Registry

Use `create_default_registry()` to get a fully populated registry:

```rust
use vibe_ecs_bridge::decoders::create_default_registry;

let registry = create_default_registry();
```

## Design Decisions

### Why Box<dyn Any>?

- Allows registry to return heterogeneous types
- Caller downcasts to expected type
- Alternative would require generic registry methods (less flexible)

### Why duplicate component definitions?

- Currently duplicated from main engine for isolation
- Plan: Move component definitions here, have engine import them
- Ensures ecs-bridge is self-contained during transition

### Why capability metadata?

- Render graph needs to know which passes depend on which components
- Allows conditional compilation of features (e.g., shadows)
- Documents component purposes for future developers

## Test Coverage

All decoders have unit tests:

- Decoding valid JSON
- Handling missing/optional fields
- Capability flags
- Registry integration

Run tests:

```bash
cargo test -p vibe-ecs-bridge
```

## Future Work

- Generate decoders from TypeScript Zod schemas
- Component migration system for schema changes
- Performance: pre-decode all components at load time
- SceneDiff decoding for live updates
