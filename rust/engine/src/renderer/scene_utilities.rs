/// Scene management utilities
///
/// Handles scene clearing and logging for scene load operations.

use three_d::*;
use vibe_scene::Scene as SceneData;

use super::{EnhancedDirectionalLight, EnhancedSpotLight, SkyboxRenderer};

/// Scene state for clearing operations
pub struct SceneState<'a> {
    pub meshes: &'a mut Vec<Gm<Mesh, PhysicalMaterial>>,
    pub mesh_entity_ids: &'a mut Vec<vibe_scene::EntityId>,
    pub mesh_scales: &'a mut Vec<glam::Vec3>,
    pub mesh_base_scales: &'a mut Vec<glam::Vec3>,
    pub mesh_cast_shadows: &'a mut Vec<bool>,
    pub mesh_receive_shadows: &'a mut Vec<bool>,
    pub directional_lights: &'a mut Vec<EnhancedDirectionalLight>,
    pub point_lights: &'a mut Vec<PointLight>,
    pub spot_lights: &'a mut Vec<EnhancedSpotLight>,
    pub ambient_light: &'a mut Option<AmbientLight>,
    pub skybox_renderer: &'a mut SkyboxRenderer,
    pub loaded_entity_ids: &'a mut std::collections::HashSet<vibe_scene::EntityId>,
}

/// Clear all scene data (meshes, lights, etc.)
pub fn clear_scene(state: SceneState) {
    state.meshes.clear();
    state.mesh_entity_ids.clear();
    state.mesh_scales.clear();
    state.mesh_base_scales.clear();
    state.mesh_cast_shadows.clear();
    state.mesh_receive_shadows.clear();
    state.directional_lights.clear();
    state.point_lights.clear();
    state.spot_lights.clear();
    *state.ambient_light = None;
    state.skybox_renderer.clear();
    state.loaded_entity_ids.clear();
}

/// Log scene load start with metadata
pub fn log_scene_load_start(scene: &SceneData) {
    log::info!("═══════════════════════════════════════════════════════════");
    log::info!("RUST SCENE LOAD: {}", scene.name);
    log::info!("═══════════════════════════════════════════════════════════");

    log::info!("Scene Metadata:");
    log::info!("  Name: {}", scene.name);
    log::info!("  Version: {}", scene.version);
    if let Some(metadata) = &scene.metadata {
        if let Some(desc) = metadata.get("description") {
            if let Some(desc_str) = desc.as_str() {
                log::info!("  Description: {}", desc_str);
            }
        }
    }
    log::info!("  Total Entities: {}", scene.entities.len());
}

/// Log scene load summary with counts
pub fn log_scene_load_summary(
    mesh_count: usize,
    directional_lights_count: usize,
    point_lights_count: usize,
    spot_lights_count: usize,
    has_ambient: bool,
) {
    log::info!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    log::info!("SCENE LOAD SUMMARY");
    log::info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    log::info!("Meshes:             {}", mesh_count);
    log::info!("Directional Lights: {}", directional_lights_count);
    log::info!("Point Lights:       {}", point_lights_count);
    log::info!("Spot Lights:        {}", spot_lights_count);
    log::info!(
        "Ambient Light:      {}",
        if has_ambient { "yes" } else { "no" }
    );
    log::info!("═══════════════════════════════════════════════════════════");
    log::info!("END RUST SCENE LOAD");
    log::info!("═══════════════════════════════════════════════════════════\n");
}

/// Log first frame render information (once per session)
pub fn log_first_frame(
    mesh_count: usize,
    directional_lights_count: usize,
    point_lights_count: usize,
    spot_lights_count: usize,
    has_ambient: bool,
    camera_position: &Vec3,
    camera_target: &Vec3,
) {
    static mut FIRST_FRAME: bool = true;
    unsafe {
        if FIRST_FRAME {
            log::info!("=== FIRST FRAME RENDER ===");
            log::info!("  Meshes: {}", mesh_count);
            log::info!("  Directional lights: {}", directional_lights_count);
            log::info!("  Point lights: {}", point_lights_count);
            log::info!("  Spot lights: {}", spot_lights_count);
            log::info!(
                "  Ambient light: {}",
                if has_ambient { "yes" } else { "no" }
            );
            log::info!("  Camera position: {:?}", camera_position);
            log::info!("  Camera target: {:?}", camera_target);
            log::info!("=========================");
            FIRST_FRAME = false;
        }
    }
}
