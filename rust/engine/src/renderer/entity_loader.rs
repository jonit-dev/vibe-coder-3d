/// Entity component loading and processing
///
/// Handles loading individual component types from entities:
/// - MeshRenderer (GLTF models, primitives, LOD)
/// - GeometryAsset (custom geometry files)
/// - Instanced (GPU instancing pseudo-implementation)
/// - Terrain (heightmap-based terrain generation)
/// - Light (directional, point, spot, ambient)
/// - Camera (perspective, orthographic, skybox)
use anyhow::{Context as _, Result};
use glam::Vec3 as GlamVec3;
use std::path::PathBuf;
use std::sync::Arc;
use three_d::*;
use vibe_ecs_bridge::decoders::{
    CameraComponent, GeometryAsset, Instanced, Light as LightComponent, MeshRenderer, Terrain,
    Transform,
};
use vibe_scene::{Entity, EntityId};

use super::{
    camera_loader::{create_camera, load_camera, CameraConfig},
    coordinate_conversion::threejs_to_threed_position,
    generate_terrain,
    instanced_loader::load_instanced,
    light_loader::{load_light, LoadedLight},
    lod_manager::LODManager,
    material_manager::MaterialManager,
    mesh_loader::load_mesh_renderer,
    skybox::SkyboxRenderer,
};

/// Helper for computing effective transform from scene graph
pub fn get_effective_transform(
    entity_id: EntityId,
    transform: Option<&Transform>,
    scene_graph: &mut Option<vibe_scene_graph::SceneGraph>,
) -> Option<Transform> {
    // Try to get world transform from scene graph (for parent-child hierarchies)
    if let Some(scene_graph) = scene_graph {
        if let Some(world_matrix) = scene_graph.get_world_transform(entity_id) {
            // Decompose world matrix into TRS components
            let (scale, rotation, translation) = world_matrix.to_scale_rotation_translation();

            // Create a Transform with world values
            return Some(Transform {
                position: Some([translation.x, translation.y, translation.z]),
                rotation: Some(vec![rotation.x, rotation.y, rotation.z, rotation.w]), // Quaternion XYZW
                scale: Some([scale.x, scale.y, scale.z]),
            });
        }
    }

    // Entity not in scene graph or no scene graph, use local transform
    transform.cloned()
}

/// Helper for loading MeshRenderer component
pub async fn handle_mesh_renderer(
    context: &three_d::Context,
    entity: &Entity,
    mesh_renderer: &MeshRenderer,
    effective_transform: Option<&Transform>,
    local_transform: Option<&Transform>,
    lod_component: Option<&vibe_ecs_bridge::LODComponent>,
    material_manager: &mut MaterialManager,
    lod_manager: &Arc<LODManager>,
    camera_pos: GlamVec3,
) -> Result<Vec<(Gm<Mesh, PhysicalMaterial>, GlamVec3, GlamVec3)>> {
    let submeshes = load_mesh_renderer(
        context,
        entity,
        mesh_renderer,
        effective_transform,
        material_manager,
        lod_component,
        lod_manager,
        camera_pos,
    )
    .await?;

    // Log transforms (caller will register meshes and store shadow flags)
    for (idx, (_, final_scale, _)) in submeshes.iter().enumerate() {
        if let Some(transform) = local_transform {
            let ts_position = vibe_ecs_bridge::position_to_vec3_opt(transform.position.as_ref());
            let converted = threejs_to_threed_position(ts_position);
            log::info!(
                "    Submesh {} transform: three.js pos [{:.2}, {:.2}, {:.2}] → three-d pos [{:.2}, {:.2}, {:.2}]",
                idx,
                ts_position.x,
                ts_position.y,
                ts_position.z,
                converted.x,
                converted.y,
                converted.z
            );
        } else {
            log::info!(
                "    Submesh {} transform: no Transform component, using primitive base scale only",
                idx
            );
        }

        log::info!(
            "      Shadows → cast: {}, receive: {}, final scale [{:.2}, {:.2}, {:.2}]",
            mesh_renderer.cast_shadows,
            mesh_renderer.receive_shadows,
            final_scale.x,
            final_scale.y,
            final_scale.z
        );
    }

    Ok(submeshes)
}

/// Helper for loading GeometryAsset component
pub async fn handle_geometry_asset(
    context: &three_d::Context,
    entity: &Entity,
    geometry_asset: &GeometryAsset,
    transform: Option<&Transform>,
    material_manager: &mut MaterialManager,
) -> Result<(Gm<Mesh, PhysicalMaterial>, GlamVec3, GlamVec3)> {
    use crate::renderer::mesh_loader::convert_geometry_meta_to_cpu_mesh;

    log::info!("  GeometryAsset:");
    log::info!("    Path:        {:?}", geometry_asset.path);
    log::info!("    Geometry ID: {:?}", geometry_asset.geometry_id);
    log::info!("    Material ID: {:?}", geometry_asset.material_id);
    log::info!("    Enabled:     {}", geometry_asset.enabled);

    if !geometry_asset.enabled {
        log::info!("    Skipping disabled geometry asset");
        anyhow::bail!("Geometry asset is disabled");
    }

    // 1. Load the geometry metadata from path
    // Resolve path: TypeScript stores paths like "/src/game/geometry/file.shape.json"
    // Geometry files are synced from src/game/geometry/ to rust/game/geometry/ via yarn rust:sync-assets
    // Since we run from rust/engine/, we load from ../game/geometry/
    let resolved_path = if geometry_asset.path.starts_with("/src/game/geometry/") {
        // Extract just the filename from the TypeScript path
        let filename = geometry_asset
            .path
            .strip_prefix("/src/game/geometry/")
            .unwrap_or(&geometry_asset.path);
        PathBuf::from("../game/geometry").join(filename)
    } else if geometry_asset.path.starts_with('/') {
        // Legacy fallback: strip leading slash and use relative path
        let relative_path = geometry_asset
            .path
            .strip_prefix('/')
            .unwrap_or(&geometry_asset.path);
        PathBuf::from("../..").join(relative_path)
    } else {
        PathBuf::from(&geometry_asset.path)
    };

    log::info!("    Resolved path: {}", resolved_path.display());

    let geometry_meta = vibe_assets::GeometryMeta::from_file(&resolved_path)
        .with_context(|| format!("Failed to load geometry metadata: {}", geometry_asset.path))?;

    log::info!(
        "    Loaded metadata: {} vertices, {} indices",
        geometry_meta.vertex_count().unwrap_or(0),
        geometry_meta.index_count().unwrap_or(0)
    );

    // 2. Convert to CpuMesh
    let cpu_mesh = convert_geometry_meta_to_cpu_mesh(&geometry_meta)?;

    // 3. Create GPU mesh
    let mut mesh = Mesh::new(context, &cpu_mesh);

    // 4. Get or create material
    let material = if let Some(material_id) = &geometry_asset.material_id {
        if let Some(material_data) = material_manager.get_material(material_id) {
            log::info!("    Using material: {}", material_id);
            let material_clone = material_data.clone();
            material_manager
                .create_physical_material(context, &material_clone)
                .await?
        } else {
            log::warn!("    Material '{}' not found, using default", material_id);
            material_manager.create_default_material(context)
        }
    } else {
        log::info!("    Using default material");
        material_manager.create_default_material(context)
    };

    // 5. Apply transform
    let (final_scale, base_scale) = if let Some(transform) = transform {
        let converted =
            crate::renderer::transform_utils::convert_transform_to_matrix(transform, None);
        mesh.set_transformation(converted.matrix);

        let ts_position = vibe_ecs_bridge::position_to_vec3_opt(transform.position.as_ref());
        let converted_pos = threejs_to_threed_position(ts_position);
        log::info!(
            "    Transform: three.js pos [{:.2}, {:.2}, {:.2}] → three-d pos [{:.2}, {:.2}, {:.2}]",
            ts_position.x,
            ts_position.y,
            ts_position.z,
            converted_pos.x,
            converted_pos.y,
            converted_pos.z
        );

        (converted.final_scale, converted.base_scale)
    } else {
        log::info!("    No Transform component, using identity transform");
        (GlamVec3::ONE, GlamVec3::ONE)
    };

    log::info!(
        "    GeometryAsset loaded → cast shadows: {}, receive shadows: {}, final scale [{:.2}, {:.2}, {:.2}]",
        geometry_asset.cast_shadows,
        geometry_asset.receive_shadows,
        final_scale.x,
        final_scale.y,
        final_scale.z
    );

    Ok((Gm::new(mesh, material), final_scale, base_scale))
}

/// Helper for loading Instanced component
pub async fn handle_instanced(
    context: &three_d::Context,
    entity: &Entity,
    instanced: &Instanced,
    transform: Option<&Transform>,
    material_manager: &mut MaterialManager,
) -> Result<Vec<(Gm<Mesh, PhysicalMaterial>, GlamVec3, GlamVec3)>> {
    let instances = load_instanced(context, entity, instanced, transform, material_manager).await?;

    let instance_count = instances.len();

    // Log first 3 instances
    for (idx, (_, final_scale, _)) in instances.iter().enumerate().take(3) {
        log::info!(
            "    Instance {}: shadows (cast: {}, recv: {}), scale [{:.2}, {:.2}, {:.2}]",
            idx,
            instanced.cast_shadows,
            instanced.receive_shadows,
            final_scale.x,
            final_scale.y,
            final_scale.z
        );
    }

    if instance_count > 3 {
        log::info!("    ... and {} more instances added", instance_count - 3);
    }

    Ok(instances)
}

/// Helper for loading Terrain component
pub async fn handle_terrain(
    context: &three_d::Context,
    entity: &Entity,
    terrain: &Terrain,
    transform: Option<&Transform>,
    material_manager: &mut MaterialManager,
) -> Result<Vec<(Gm<Mesh, PhysicalMaterial>, GlamVec3, GlamVec3)>> {
    let meshes = generate_terrain(context, entity, terrain, transform, material_manager).await?;

    for (_, final_scale, _) in &meshes {
        log::info!(
            "    Terrain mesh added: scale [{:.2}, {:.2}, {:.2}]",
            final_scale.x,
            final_scale.y,
            final_scale.z
        );
    }

    Ok(meshes)
}

/// Helper for loading Light component
pub fn handle_light(
    context: &three_d::Context,
    light: &LightComponent,
    transform: Option<&Transform>,
) -> Result<Option<LoadedLight>> {
    load_light(context, light, transform)
}

/// Helper for loading Camera component
pub async fn handle_camera(
    context: &three_d::Context,
    camera_component: &CameraComponent,
    transform: Option<&Transform>,
    window_size: (u32, u32),
) -> Result<Option<CameraLoadResult>> {
    if let Some(config) = load_camera(camera_component, transform)? {
        let mut camera = create_camera(&config, window_size);
        camera.tone_mapping = parse_tone_mapping(config.tone_mapping.as_deref());
        camera.color_mapping = ColorMapping::ComputeToSrgb;

        let mut skybox_renderer = SkyboxRenderer::new();
        if config.skybox_texture.is_some() {
            if let Err(err) = skybox_renderer.load_from_config(context, &config).await {
                log::warn!("Failed to load skybox texture: {}", err);
                skybox_renderer.clear();
            }
        }

        if config.is_main {
            log::info!(
                "    Main camera loaded → position [{:.2}, {:.2}, {:.2}], target [{:.2}, {:.2}, {:.2}], clearFlags={:?}, background={:?}",
                config.position.x,
                config.position.y,
                config.position.z,
                config.target.x,
                config.target.y,
                config.target.z,
                config.clear_flags,
                config.background_color
            );
        } else {
            log::info!(
                "    Additional camera (depth {}) loaded → position [{:.2}, {:.2}, {:.2}], target [{:.2}, {:.2}, {:.2}]",
                config.depth,
                config.position.x,
                config.position.y,
                config.position.z,
                config.target.x,
                config.target.y,
                config.target.z
            );
        }

        Ok(Some(CameraLoadResult {
            camera,
            config,
            skybox_renderer,
        }))
    } else {
        Ok(None)
    }
}

/// Result of loading a camera component
pub struct CameraLoadResult {
    pub camera: Camera,
    pub config: CameraConfig,
    pub skybox_renderer: SkyboxRenderer,
}

fn parse_tone_mapping(mode: Option<&str>) -> ToneMapping {
    match mode.unwrap_or("aces").to_ascii_lowercase().as_str() {
        "none" | "linear" => ToneMapping::None,
        "reinhard" => ToneMapping::Reinhard,
        "cineon" | "filmic" => ToneMapping::Filmic,
        "aces" => ToneMapping::Aces,
        other => {
            log::warn!("Unknown tone mapping mode '{}', defaulting to ACES", other);
            ToneMapping::Aces
        }
    }
}
