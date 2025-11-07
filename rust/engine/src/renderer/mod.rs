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
pub mod audio_loader;
pub mod camera_follow;
pub mod camera_loader;
pub mod coordinate_conversion;
pub mod debug_lines;
pub mod debug_rendering;
pub mod enhanced_lights;
pub mod instanced_loader;
pub mod light_loader;
pub mod lighting;
pub mod lod_manager;
pub mod lod_selector;
pub mod material_manager;
pub mod material_overrides;
pub mod material_update;
pub mod mesh_filtering;
pub mod mesh_loader;
pub mod physics_sync;
pub mod post_processing;
pub mod primitive_mesh;
pub mod scene_utilities;
pub mod skybox;
pub mod terrain_generator;
pub mod texture_cache;
pub mod transform_utils;
pub mod visibility;
pub mod bvh_debug;

// Re-export commonly used types
pub use camera_follow::update_camera_follow;
pub use camera_loader::{create_camera, load_camera, CameraConfig};
pub use debug_lines::DebugLineRenderer;
pub use enhanced_lights::{EnhancedDirectionalLight, EnhancedSpotLight};
pub use instanced_loader::load_instanced;
pub use light_loader::{load_light, LoadedLight};
pub use lod_manager::{get_lod_path_internal, normalize_to_original_path, LODConfig, LODManager, LODQuality};
pub use lod_selector::LODSelector;
pub use material_manager::MaterialManager;
pub use material_overrides::apply_material_overrides;
pub use mesh_loader::load_mesh_renderer;
pub use post_processing::{apply_post_processing, ColorGradingEffect, PostProcessSettings};
pub use skybox::SkyboxRenderer;
pub use terrain_generator::generate_terrain;
pub use texture_cache::TextureCache;
pub use visibility::{VisibilityCuller, FallbackVisibilityCuller};
pub use bvh_debug::BvhDebugLogger;

// Re-export Material from vibe-assets for convenience
pub use vibe_assets::Material;
