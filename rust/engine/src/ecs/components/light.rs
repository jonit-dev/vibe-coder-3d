use serde::Deserialize;

#[derive(Debug, Deserialize, Clone)]
pub struct LightColor {
    #[serde(default = "default_one")]
    pub r: f32,
    #[serde(default = "default_one")]
    pub g: f32,
    #[serde(default = "default_one")]
    pub b: f32,
}

fn default_one() -> f32 {
    1.0
}

impl Default for LightColor {
    fn default() -> Self {
        Self {
            r: 1.0,
            g: 1.0,
            b: 1.0,
        }
    }
}

#[derive(Debug, Deserialize, Clone)]
pub struct Light {
    #[serde(default = "default_light_type", rename = "lightType")]
    pub light_type: String,

    #[serde(default)]
    pub color: Option<LightColor>,

    #[serde(default = "default_intensity")]
    pub intensity: f32,

    #[serde(default = "default_enabled")]
    pub enabled: bool,

    #[serde(default = "default_enabled", rename = "castShadow")]
    pub cast_shadow: bool,

    #[serde(default, rename = "directionX")]
    pub direction_x: f32,

    #[serde(default = "default_neg_one", rename = "directionY")]
    pub direction_y: f32,

    #[serde(default, rename = "directionZ")]
    pub direction_z: f32,

    #[serde(default = "default_range")]
    pub range: f32,

    #[serde(default = "default_one")]
    pub decay: f32,

    #[serde(default = "default_angle")]
    pub angle: f32,

    #[serde(default = "default_penumbra")]
    pub penumbra: f32,

    #[serde(default = "default_shadow_map_size", rename = "shadowMapSize")]
    pub shadow_map_size: u32,

    #[serde(default = "default_shadow_bias", rename = "shadowBias")]
    pub shadow_bias: f32,

    #[serde(default = "default_one", rename = "shadowRadius")]
    pub shadow_radius: f32,
}

fn default_light_type() -> String {
    "directional".to_string()
}

fn default_intensity() -> f32 {
    1.0
}

fn default_enabled() -> bool {
    true
}

fn default_neg_one() -> f32 {
    -1.0
}

fn default_range() -> f32 {
    10.0
}

fn default_angle() -> f32 {
    std::f32::consts::PI / 6.0 // 30 degrees in radians
}

fn default_penumbra() -> f32 {
    0.1
}

fn default_shadow_map_size() -> u32 {
    1024
}

fn default_shadow_bias() -> f32 {
    -0.0001
}

impl Default for Light {
    fn default() -> Self {
        Self {
            light_type: default_light_type(),
            color: Some(LightColor::default()),
            intensity: default_intensity(),
            enabled: true,
            cast_shadow: true,
            direction_x: 0.0,
            direction_y: default_neg_one(),
            direction_z: 0.0,
            range: default_range(),
            decay: 1.0,
            angle: default_angle(),
            penumbra: default_penumbra(),
            shadow_map_size: default_shadow_map_size(),
            shadow_bias: default_shadow_bias(),
            shadow_radius: 1.0,
        }
    }
}
