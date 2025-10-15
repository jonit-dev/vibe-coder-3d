use crate::ecs::SceneData;
use anyhow::Context;
use std::path::Path;

/// Load a scene from a JSON file
pub fn load_scene<P: AsRef<Path>>(path: P) -> anyhow::Result<SceneData> {
    let path = path.as_ref();

    log::info!("Loading scene from: {}", path.display());

    let data = std::fs::read_to_string(path)
        .with_context(|| format!("Failed to read scene file: {}", path.display()))?;

    let scene: SceneData = serde_json::from_str(&data)
        .with_context(|| format!("Failed to parse scene JSON: {}", path.display()))?;

    log::info!(
        "Scene loaded: {} (version {}), {} entities",
        scene.metadata.name,
        scene.metadata.version,
        scene.entities.len()
    );

    // Validate scene and warn about unimplemented components
    super::validation::validate_scene(&scene);

    Ok(scene)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_load_nonexistent_scene() {
        let result = load_scene("/nonexistent/path.json");
        assert!(result.is_err());
    }
}
