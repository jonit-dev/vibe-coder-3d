pub mod camera;
#[cfg(test)]
mod camera_behavior_test;
#[cfg(test)]
mod camera_test;
pub mod depth_texture;
#[cfg(test)]
mod integration_test;
#[cfg(test)]
mod lighting_test;
pub mod material_uniform;
// Material, MeshCache, and Vertex now from vibe-assets crate
// Removed: pub mod material; - using vibe_assets::Material instead
// #[cfg(test)]
// mod material_test;
pub mod mesh_cache; // Keep for backward compat with tests
pub mod pipeline;
#[cfg(test)]
mod pipeline_test;
pub mod primitives; // Keep for backward compat with tests
#[cfg(test)]
mod primitives_test;
pub mod renderer;
pub mod scene_renderer;
pub mod vertex; // Keep for backward compat with tests
#[cfg(test)]
mod vertex_test;

pub use camera::Camera;
pub use material_uniform::MaterialUniform;
// Re-export from vibe-assets crate
pub use pipeline::RenderPipeline;
pub use renderer::Renderer;
pub use scene_renderer::SceneRenderer;
pub use vibe_assets::{Material, MaterialCache, Mesh, MeshCache, Vertex};
