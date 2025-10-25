// Library interface for vibe-coder-engine
//
// This allows integration tests to access internal modules

pub mod debug;
pub mod io;
pub mod renderer;
pub use renderer::{load_light, EnhancedDirectionalLight, EnhancedSpotLight, LoadedLight};
