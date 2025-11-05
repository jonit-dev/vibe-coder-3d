// Library interface for vibe-coder-engine
//
// This allows integration tests to access internal modules

pub mod debug;
pub mod io;
pub mod renderer;
pub mod spatial;
pub use renderer::{load_light, EnhancedDirectionalLight, EnhancedSpotLight, LoadedLight};

// BVH testing modules
#[cfg(test)]
pub mod bvh_integration_test;
#[cfg(test)]
pub mod bvh_performance_test;

// BVH demonstration modules
pub mod bvh_demo;
pub mod bvh_integration_demo;
