use serde::Deserialize;

#[derive(Debug, Deserialize, Clone)]
pub struct MeshRenderer {
    #[serde(default)]
    pub meshId: Option<String>,
    #[serde(default)]
    pub materialId: Option<String>,
    #[serde(default)]
    pub modelPath: Option<String>,
    #[serde(default = "default_enabled")]
    pub enabled: bool,
}

fn default_enabled() -> bool {
    true
}

impl Default for MeshRenderer {
    fn default() -> Self {
        Self {
            meshId: None,
            materialId: None,
            modelPath: None,
            enabled: true,
        }
    }
}
