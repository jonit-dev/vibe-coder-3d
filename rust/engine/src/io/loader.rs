use anyhow::Context;
use std::path::Path;
use vibe_ecs_bridge::decoders::{
    CameraComponent, Light as LightComponent, MeshRenderer, Transform,
};
use vibe_scene::Scene as SceneData;

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

    // Dump comprehensive diagnostic information for visual parity debugging
    dump_scene_diagnostics(&scene);

    Ok(scene)
}

/// Dump comprehensive diagnostic information for visual parity debugging
fn dump_scene_diagnostics(scene: &SceneData) {
    log::info!("========================================");
    log::info!("SCENE DIAGNOSTIC DUMP - Visual Parity");
    log::info!("========================================");
    log::info!(
        "Scene: {} (v{})",
        scene.metadata.name,
        scene.metadata.version
    );
    log::info!("Entities: {}", scene.entities.len());
    log::info!(
        "Materials: {}",
        scene
            .materials
            .as_ref()
            .and_then(|m| m.as_object())
            .map(|m| m.len())
            .unwrap_or(0)
    );
    log::info!("");

    // Dump each entity with detailed component information
    for (idx, entity) in scene.entities.iter().enumerate() {
        log::info!(
            "--- Entity {}/{}: {} ---",
            idx + 1,
            scene.entities.len(),
            entity.name.as_deref().unwrap_or("(unnamed)")
        );
        log::info!(
            "  PersistentID: {}",
            entity.persistentId.as_deref().unwrap_or("(none)")
        );

        if let Some(parent_id) = &entity.parentPersistentId {
            log::info!("  Parent: {}", parent_id);
        }

        // Dump Transform component with raw and converted values
        if let Some(transform_json) = entity.components.get("Transform") {
            log::info!(
                "  Transform (raw JSON): {}",
                serde_json::to_string(transform_json).unwrap_or_else(|_| "error".to_string())
            );

            if let Ok(transform) = serde_json::from_value::<Transform>(transform_json.clone()) {
                log::info!("    Position (raw): {:?}", transform.position);
                log::info!(
                    "    Rotation (raw): {:?} <- THREE.JS DEGREES",
                    transform.rotation
                );
                log::info!("    Scale (raw): {:?}", transform.scale);

                // Show converted values
                use vibe_ecs_bridge::{
                    position_to_vec3_opt, rotation_to_quat_opt, scale_to_vec3_opt,
                };
                let pos = position_to_vec3_opt(transform.position.as_ref());
                let rot = rotation_to_quat_opt(transform.rotation.as_ref());
                let scale = scale_to_vec3_opt(transform.scale.as_ref());

                log::info!("    Position (Vec3): {:?}", pos);
                log::info!("    Rotation (Quat): {:?} <- CONVERTED TO RADIANS", rot);

                // Show rotation as Euler in radians for comparison
                if let Some(rot_array) = &transform.rotation {
                    if rot_array.len() == 3 {
                        log::info!(
                            "    Rotation (Euler radians): [{:.4}, {:.4}, {:.4}]",
                            rot_array[0].to_radians(),
                            rot_array[1].to_radians(),
                            rot_array[2].to_radians()
                        );
                    }
                }

                log::info!("    Scale (Vec3): {:?}", scale);
            }
        }

        // Dump Camera component
        if let Some(camera_json) = entity.components.get("Camera") {
            log::info!(
                "  Camera (raw JSON): {}",
                serde_json::to_string(camera_json).unwrap_or_else(|_| "error".to_string())
            );

            if let Ok(camera) = serde_json::from_value::<CameraComponent>(camera_json.clone()) {
                log::info!("    FOV: {}° (field of view in degrees)", camera.fov);
                log::info!("    Near: {}, Far: {}", camera.near, camera.far);
                log::info!("    Is Main: {}", camera.is_main);
                log::info!("    Projection: {:?}", camera.projection_type);

                if let Some(bg_color) = &camera.background_color {
                    log::info!("    Background Color: {:?}", bg_color);
                }
                if let Some(skybox) = &camera.skybox_texture {
                    log::info!("    Skybox Texture: {}", skybox);
                }
            }
        }

        // Dump MeshRenderer component
        if let Some(mesh_renderer_json) = entity.components.get("MeshRenderer") {
            if let Ok(mesh_renderer) =
                serde_json::from_value::<MeshRenderer>(mesh_renderer_json.clone())
            {
                log::info!("  MeshRenderer:");
                log::info!("    Mesh ID: {:?}", mesh_renderer.mesh_id);
                log::info!("    Material ID: {:?}", mesh_renderer.material_id);
                log::info!("    Model Path: {:?}", mesh_renderer.model_path);
                log::info!(
                    "    Cast Shadows: {}, Receive Shadows: {}",
                    mesh_renderer.cast_shadows,
                    mesh_renderer.receive_shadows
                );
            }
        }

        // Dump Light component
        if let Some(light_json) = entity.components.get("Light") {
            if let Ok(light) = serde_json::from_value::<LightComponent>(light_json.clone()) {
                log::info!("  Light:");
                log::info!("    Type: {:?}", light.light_type);
                log::info!("    Color: {:?}", light.color);
                log::info!("    Intensity: {}", light.intensity);
                log::info!("    Cast Shadow: {}", light.cast_shadow);
                log::info!(
                    "    Direction: [{}, {}, {}]",
                    light.direction_x,
                    light.direction_y,
                    light.direction_z
                );
            }
        }

        log::info!("");
    }

    log::info!("========================================");
    log::info!("COORDINATE SYSTEM REFERENCE");
    log::info!("========================================");
    log::info!("Three.js Convention (matches Rust):");
    log::info!("  - Right-handed coordinate system");
    log::info!("  - Y-up (vertical axis)");
    log::info!("  - +Z forward (camera default)");
    log::info!("  - +X right");
    log::info!("  - Euler order: XYZ");
    log::info!("");
    log::info!("CRITICAL UNIT CONVERSIONS:");
    log::info!("  - Rotation: THREE.JS uses DEGREES → Rust converts to RADIANS");
    log::info!("  - Position: Direct mapping (no conversion)");
    log::info!("  - Scale: Direct mapping (no conversion)");
    log::info!("  - FOV: DEGREES (both sides)");
    log::info!("========================================");
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
