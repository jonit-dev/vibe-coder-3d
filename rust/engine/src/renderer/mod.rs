/// Renderer module - Modular three-d rendering system
///
/// This module provides a clean separation of concerns for 3D rendering:
/// - Camera loading and configuration
/// - Coordinate system conversion (Three.js ↔ three-d)
/// - Light component loading
/// - Material management and caching
/// - Mesh rendering and loading
/// - Primitive mesh creation
/// - Transform conversion utilities
pub mod camera_loader;
pub mod coordinate_conversion;
pub mod enhanced_lights;
pub mod light_loader;
pub mod material_manager;
pub mod material_overrides;
pub mod mesh_loader;
pub mod primitive_mesh;
pub mod texture_cache;
pub mod transform_utils;

// Re-export commonly used types
pub use camera_loader::{create_camera, load_camera, CameraConfig};
pub use enhanced_lights::{EnhancedDirectionalLight, EnhancedSpotLight};
pub use light_loader::{load_light, LoadedLight};
pub use material_manager::MaterialManager;
pub use material_overrides::apply_material_overrides;
pub use mesh_loader::load_mesh_renderer;
pub use texture_cache::TextureCache;

// Re-export Material from vibe-assets for convenience
pub use vibe_assets::Material;
