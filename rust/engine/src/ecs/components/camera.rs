use serde::{Deserialize, Deserializer};

// Helper structs for deserializing object-based vectors
#[derive(Debug, Deserialize, Clone)]
struct Vec3Object {
    x: f32,
    y: f32,
    z: f32,
}

#[derive(Debug, Deserialize, Clone)]
struct Vec2Object {
    u: f32,
    v: f32,
}

// Custom deserializers that handle both array and object formats
fn deserialize_optional_vec3<'de, D>(deserializer: D) -> Result<Option<[f32; 3]>, D::Error>
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

fn deserialize_optional_vec2<'de, D>(deserializer: D) -> Result<Option<[f32; 2]>, D::Error>
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

#[derive(Debug, Deserialize, Clone)]
pub struct Color {
    #[serde(default)]
    pub r: f32,
    #[serde(default)]
    pub g: f32,
    #[serde(default)]
    pub b: f32,
    #[serde(default = "default_alpha")]
    pub a: f32,
}

fn default_alpha() -> f32 {
    1.0
}

impl Default for Color {
    fn default() -> Self {
        Self {
            r: 0.0,
            g: 0.0,
            b: 0.0,
            a: 1.0,
        }
    }
}

#[derive(Debug, Deserialize, Clone, PartialEq)]
pub struct ViewportRect {
    #[serde(default)]
    pub x: f32,
    #[serde(default)]
    pub y: f32,
    #[serde(default = "default_one")]
    pub width: f32,
    #[serde(default = "default_one")]
    pub height: f32,
}

fn default_one() -> f32 {
    1.0
}

impl Default for ViewportRect {
    fn default() -> Self {
        Self {
            x: 0.0,
            y: 0.0,
            width: 1.0,
            height: 1.0,
        }
    }
}

#[derive(Debug, Deserialize, Clone)]
pub struct CameraComponent {
    #[serde(default = "default_fov")]
    pub fov: f32,

    #[serde(default = "default_near")]
    pub near: f32,

    #[serde(default = "default_far")]
    pub far: f32,

    #[serde(default, rename = "isMain")]
    pub is_main: bool,

    #[serde(default = "default_projection_type", rename = "projectionType")]
    pub projection_type: String,

    #[serde(default = "default_orthographic_size", rename = "orthographicSize")]
    pub orthographic_size: f32,

    #[serde(default)]
    pub depth: i32,

    // Background and clear behavior
    #[serde(default, rename = "clearFlags")]
    pub clear_flags: Option<String>,

    #[serde(default, rename = "backgroundColor")]
    pub background_color: Option<Color>,

    #[serde(default, rename = "skyboxTexture")]
    pub skybox_texture: Option<String>,

    // Control & follow
    #[serde(default, rename = "controlMode")]
    pub control_mode: Option<String>, // "locked" | "free"

    #[serde(default, rename = "enableSmoothing")]
    pub enable_smoothing: bool,

    #[serde(default, rename = "followTarget")]
    pub follow_target: Option<u32>,

    #[serde(
        default,
        rename = "followOffset",
        deserialize_with = "deserialize_optional_vec3"
    )]
    pub follow_offset: Option<[f32; 3]>,

    #[serde(default = "default_smoothing_speed", rename = "smoothingSpeed")]
    pub smoothing_speed: f32,

    #[serde(default = "default_rotation_smoothing", rename = "rotationSmoothing")]
    pub rotation_smoothing: f32,

    // Viewport (normalized 0..1)
    #[serde(default, rename = "viewportRect")]
    pub viewport_rect: Option<ViewportRect>,

    // HDR / Tone Mapping
    #[serde(default)]
    pub hdr: bool,

    #[serde(default, rename = "toneMapping")]
    pub tone_mapping: Option<String>, // none | linear | reinhard | cineon | aces

    #[serde(
        default = "default_tone_mapping_exposure",
        rename = "toneMappingExposure"
    )]
    pub tone_mapping_exposure: f32,

    // Post-processing
    #[serde(default, rename = "enablePostProcessing")]
    pub enable_post_processing: bool,

    #[serde(default, rename = "postProcessingPreset")]
    pub post_processing_preset: Option<String>,

    // Skybox transforms
    #[serde(
        default,
        rename = "skyboxScale",
        deserialize_with = "deserialize_optional_vec3"
    )]
    pub skybox_scale: Option<[f32; 3]>,

    #[serde(
        default,
        rename = "skyboxRotation",
        deserialize_with = "deserialize_optional_vec3"
    )]
    pub skybox_rotation: Option<[f32; 3]>,

    #[serde(
        default,
        rename = "skyboxRepeat",
        deserialize_with = "deserialize_optional_vec2"
    )]
    pub skybox_repeat: Option<[f32; 2]>,

    #[serde(
        default,
        rename = "skyboxOffset",
        deserialize_with = "deserialize_optional_vec2"
    )]
    pub skybox_offset: Option<[f32; 2]>,

    #[serde(default = "default_skybox_intensity", rename = "skyboxIntensity")]
    pub skybox_intensity: f32,

    #[serde(default, rename = "skyboxBlur")]
    pub skybox_blur: f32,
}

fn default_fov() -> f32 {
    60.0
}

fn default_near() -> f32 {
    0.1
}

fn default_far() -> f32 {
    100.0
}

fn default_projection_type() -> String {
    "perspective".to_string()
}

fn default_orthographic_size() -> f32 {
    10.0
}

fn default_smoothing_speed() -> f32 {
    5.0
}

fn default_rotation_smoothing() -> f32 {
    5.0
}

fn default_tone_mapping_exposure() -> f32 {
    1.0
}

fn default_skybox_intensity() -> f32 {
    1.0
}

impl Default for CameraComponent {
    fn default() -> Self {
        Self {
            fov: default_fov(),
            near: default_near(),
            far: default_far(),
            is_main: false,
            projection_type: default_projection_type(),
            orthographic_size: default_orthographic_size(),
            depth: 0,
            clear_flags: None,
            background_color: None,
            skybox_texture: None,
            control_mode: None,
            enable_smoothing: false,
            follow_target: None,
            follow_offset: None,
            smoothing_speed: default_smoothing_speed(),
            rotation_smoothing: default_rotation_smoothing(),
            viewport_rect: None,
            hdr: false,
            tone_mapping: None,
            tone_mapping_exposure: default_tone_mapping_exposure(),
            enable_post_processing: false,
            post_processing_preset: None,
            skybox_scale: None,
            skybox_rotation: None,
            skybox_repeat: None,
            skybox_offset: None,
            skybox_intensity: default_skybox_intensity(),
            skybox_blur: 0.0,
        }
    }
}
