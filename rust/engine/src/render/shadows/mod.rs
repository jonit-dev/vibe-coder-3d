/// Shadow mapping system for the rendering engine
///
/// This module implements shadow mapping for directional and spot lights,
/// providing feature parity with Three.js shadow rendering.
///
/// Key features:
/// - Directional light shadows with orthographic projection
/// - Spot light shadows with perspective projection
/// - PCF (Percentage Closer Filtering) for soft shadows
/// - Configurable shadow map size, bias, and radius
/// - Support for castShadows and receiveShadows mesh flags

pub mod directional;
pub mod resources;
pub mod spot;

pub use directional::calculate_directional_light_matrix;
pub use resources::{ShadowConfig, ShadowMap, ShadowResources};
pub use spot::{calculate_spot_cone_params, calculate_spot_light_matrix};
