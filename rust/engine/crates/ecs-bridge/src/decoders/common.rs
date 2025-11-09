//! Common types and utilities used across multiple decoder modules

use serde::{Deserialize, Deserializer};

// Re-export LODComponent from vibe-scene
pub use vibe_scene::{LODComponent, LODQuality};

// Helper structs for deserializing object-based vectors
#[derive(Debug, Deserialize, Clone)]
pub struct Vec3Object {
    pub x: f32,
    pub y: f32,
    pub z: f32,
}

#[derive(Debug, Deserialize, Clone)]
pub struct Vec2Object {
    pub u: f32,
    pub v: f32,
}

// Custom deserializers that handle both array and object formats
pub fn deserialize_optional_vec3<'de, D>(deserializer: D) -> Result<Option<[f32; 3]>, D::Error>
where
    D: Deserializer<'de>,
{
    #[derive(Deserialize)]
    #[serde(untagged)]
    enum Vec3Format {
        Array([f32; 3]),
        Object(Vec3Object),
    }

    Ok(
        Option::<Vec3Format>::deserialize(deserializer)?.map(|v| match v {
            Vec3Format::Array(arr) => arr,
            Vec3Format::Object(obj) => [obj.x, obj.y, obj.z],
        }),
    )
}

pub fn deserialize_optional_vec2<'de, D>(deserializer: D) -> Result<Option<[f32; 2]>, D::Error>
where
    D: Deserializer<'de>,
{
    #[derive(Deserialize)]
    #[serde(untagged)]
    enum Vec2Format {
        Array([f32; 2]),
        Object(Vec2Object),
    }

    Ok(
        Option::<Vec2Format>::deserialize(deserializer)?.map(|v| match v {
            Vec2Format::Array(arr) => arr,
            Vec2Format::Object(obj) => [obj.u, obj.v],
        }),
    )
}

// Common default value functions
pub fn default_true() -> bool {
    true
}

pub fn default_false() -> bool {
    false
}

pub fn default_enabled() -> bool {
    true
}

pub fn default_one() -> f32 {
    1.0
}

pub fn default_zero() -> f32 {
    0.0
}

pub fn default_alpha() -> f32 {
    1.0
}
