/// Mesh renderer component loading
///
/// Handles loading and creating mesh renderers from ECS components

use anyhow::Result;
use glam::Vec3 as GlamVec3;
use three_d::{Context, Gm, Mesh, PhysicalMaterial};
use vibe_ecs_bridge::decoders::{MeshRenderer, Transform};
use vibe_scene::Entity;

use super::material_manager::MaterialManager;
use super::primitive_mesh::create_primitive_mesh;
use super::transform_utils::{convert_transform_to_matrix, create_base_scale_matrix};

/// Load a mesh renderer component and create the corresponding Gm object
pub fn load_mesh_renderer(
    context: &Context,
    entity: &Entity,
    mesh_renderer: &MeshRenderer,
    transform: Option<&Transform>,
    material_manager: &MaterialManager,
) -> Result<(Gm<Mesh, PhysicalMaterial>, GlamVec3)> {
    log::info!("  MeshRenderer:");
    log::info!("    Mesh ID:     {:?}", mesh_renderer.meshId);
    log::info!("    Material ID: {:?}", mesh_renderer.materialId);

    // Normalize mesh identifier for comparisons
    let mesh_id_lower = mesh_renderer
        .meshId
        .as_ref()
        .map(|id| id.to_ascii_lowercase());

    // Create primitive mesh based on meshId hints
    let cpu_mesh = create_primitive_mesh(mesh_id_lower.as_deref());

    // Get or create material
    let material = get_or_create_material(context, mesh_renderer, material_manager);

    // Create mesh and apply transform
    let mut mesh = Mesh::new(context, &cpu_mesh);

    let final_scale = if let Some(transform) = transform {
        let converted = convert_transform_to_matrix(transform, mesh_id_lower.as_deref());
        mesh.set_transformation(converted.matrix);
        converted.final_scale
    } else {
        // Even without an explicit Transform component, apply primitive base scale
        let converted = create_base_scale_matrix(mesh_id_lower.as_deref());
        mesh.set_transformation(converted.matrix);
        converted.final_scale
    };

    Ok((Gm::new(mesh, material), final_scale))
}

fn get_or_create_material(
    context: &Context,
    mesh_renderer: &MeshRenderer,
    material_manager: &MaterialManager,
) -> PhysicalMaterial {
    if let Some(material_id) = &mesh_renderer.materialId {
        if let Some(material_data) = material_manager.get_material(material_id) {
            log::info!("    Using cached material: {}", material_id);
            material_manager.create_physical_material(context, material_data)
        } else {
            log::warn!("    Material not found: {}, using default", material_id);
            material_manager.create_default_material(context)
        }
    } else {
        log::info!("    Using default material");
        material_manager.create_default_material(context)
    }
}
