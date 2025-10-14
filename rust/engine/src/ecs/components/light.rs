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
    #[serde(default = "default_light_type")]
    pub lightType: String,

    #[serde(default)]
    pub color: Option<LightColor>,

    #[serde(default = "default_intensity")]
    pub intensity: f32,

    #[serde(default = "default_enabled")]
    pub enabled: bool,

    #[serde(default = "default_enabled")]
    pub castShadow: bool,

    #[serde(default)]
    pub directionX: f32,

    #[serde(default = "default_neg_one")]
    pub directionY: f32,

    #[serde(default)]
    pub directionZ: f32,

    #[serde(default = "default_range")]
    pub range: f32,

    #[serde(default = "default_one")]
    pub decay: f32,

    #[serde(default = "default_angle")]
    pub angle: f32,

    #[serde(default = "default_penumbra")]
    pub penumbra: f32,

    #[serde(default = "default_shadow_map_size")]
    pub shadowMapSize: u32,

    #[serde(default = "default_shadow_bias")]
    pub shadowBias: f32,

    #[serde(default = "default_one")]
    pub shadowRadius: f32,
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
            lightType: default_light_type(),
            color: Some(LightColor::default()),
            intensity: default_intensity(),
            enabled: true,
            castShadow: true,
            directionX: 0.0,
            directionY: default_neg_one(),
            directionZ: 0.0,
            range: default_range(),
            decay: 1.0,
            angle: default_angle(),
            penumbra: default_penumbra(),
            shadowMapSize: default_shadow_map_size(),
            shadowBias: default_shadow_bias(),
            shadowRadius: 1.0,
        }
    }
}
