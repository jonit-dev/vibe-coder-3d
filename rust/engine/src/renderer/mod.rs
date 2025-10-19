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
pub mod light_loader;
pub mod material_manager;
pub mod mesh_loader;
pub mod primitive_mesh;
pub mod transform_utils;

// Re-export commonly used types
pub use camera_loader::{create_camera, load_camera, CameraConfig};
pub use light_loader::{load_light, LoadedLight};
pub use material_manager::{MaterialData, MaterialManager};
pub use mesh_loader::load_mesh_renderer;
