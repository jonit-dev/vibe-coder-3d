/// Terrain generation modules with Three.js parity support
pub mod noise;
pub mod normals;
pub mod utils;

pub use noise::{terrain_height_parity, NoiseParams};
pub use normals::calculate_smooth_normals;
pub use utils::align_ground_level;
