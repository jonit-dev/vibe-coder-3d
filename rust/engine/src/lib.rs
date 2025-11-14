// Library interface for vibe-coder-engine
//
// This allows integration tests to access internal modules

pub mod debug;
pub mod io;
pub mod renderer;
pub mod spatial;
pub mod terrain;
pub use renderer::{load_light, EnhancedDirectionalLight, EnhancedSpotLight, LoadedLight};

// BVH testing module (integration tests)
#[cfg(test)]
pub mod bvh_integration_test;
