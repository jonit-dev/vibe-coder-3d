use serde::Deserialize;

#[derive(Debug, Deserialize, Clone)]
pub struct MeshRenderer {
    #[serde(default, rename = "meshId")]
    pub mesh_id: Option<String>,
    #[serde(default, rename = "materialId")]
    pub material_id: Option<String>,
    #[serde(default, rename = "modelPath")]
    pub model_path: Option<String>,
    #[serde(default = "default_enabled")]
    pub enabled: bool,
    #[serde(default = "default_enabled", rename = "castShadows")]
    pub cast_shadows: bool,
    #[serde(default = "default_enabled", rename = "receiveShadows")]
    pub receive_shadows: bool,
}

fn default_enabled() -> bool {
    true
}

impl Default for MeshRenderer {
    fn default() -> Self {
        Self {
            mesh_id: None,
            material_id: None,
            model_path: None,
            enabled: true,
            cast_shadows: true,
            receive_shadows: true,
        }
    }
}
