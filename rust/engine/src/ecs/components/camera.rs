use serde::Deserialize;

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

#[derive(Debug, Deserialize, Clone)]
pub struct CameraComponent {
    #[serde(default = "default_fov")]
    pub fov: f32,

    #[serde(default = "default_near")]
    pub near: f32,

    #[serde(default = "default_far")]
    pub far: f32,

    #[serde(default)]
    pub isMain: bool,

    #[serde(default = "default_projection_type")]
    pub projectionType: String,

    #[serde(default = "default_orthographic_size")]
    pub orthographicSize: f32,

    #[serde(default)]
    pub backgroundColor: Option<Color>,

    #[serde(default)]
    pub clearFlags: Option<String>,

    #[serde(default)]
    pub skyboxTexture: Option<String>,
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

impl Default for CameraComponent {
    fn default() -> Self {
        Self {
            fov: default_fov(),
            near: default_near(),
            far: default_far(),
            isMain: false,
            projectionType: default_projection_type(),
            orthographicSize: default_orthographic_size(),
            backgroundColor: None,
            clearFlags: None,
            skyboxTexture: None,
        }
    }
}
