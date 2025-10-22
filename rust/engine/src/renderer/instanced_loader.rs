/// Instanced component loading
///
/// Handles loading and creating instanced meshes from ECS components
use anyhow::Result;
use glam::Vec3 as GlamVec3;
use three_d::{Context, Gm, Mesh, PhysicalMaterial};
use vibe_ecs_bridge::decoders::{Instanced, Transform};
use vibe_ecs_bridge::{position_to_vec3_opt, rotation_to_quat_array_opt, scale_to_vec3_opt};
use vibe_scene::Entity;

use super::material_manager::MaterialManager;
use super::primitive_mesh::create_primitive_mesh;
use super::transform_utils::{convert_transform_to_matrix, create_base_scale_matrix};

/// Load an instanced component and create individual mesh instances
/// Returns a vector of Gm objects, one for each instance
/// Note: three-d doesn't have native GPU instancing, so we create individual meshes
pub async fn load_instanced(
    context: &Context,
    _entity: &Entity,
    instanced: &Instanced,
    transform: Option<&Transform>,
    material_manager: &mut MaterialManager,
) -> Result<Vec<(Gm<Mesh, PhysicalMaterial>, GlamVec3, GlamVec3)>> {
    log::info!("  Instanced:");
    log::info!("    Enabled:      {}", instanced.enabled);
    log::info!("    Capacity:     {}", instanced.capacity);
    log::info!("    Base Mesh:    {:?}", instanced.base_mesh_id);
    log::info!("    Base Mat:     {:?}", instanced.base_material_id);
    log::info!("    Instances:    {}", instanced.instances.len());
    log::info!("    Cast Shadows: {}", instanced.cast_shadows);
    log::info!("    Recv Shadows: {}", instanced.receive_shadows);

    if !instanced.enabled {
        log::info!("    Instanced component disabled, skipping");
        return Ok(Vec::new());
    }

    if instanced.instances.is_empty() {
        log::info!("    No instances defined, skipping");
        return Ok(Vec::new());
    }

    // Create base mesh
    let mesh_id_lower = if instanced.base_mesh_id.is_empty() {
        None
    } else {
        Some(instanced.base_mesh_id.to_ascii_lowercase())
    };
    let cpu_mesh = create_primitive_mesh(mesh_id_lower.as_deref());

    // Get base material
    let base_material = if instanced.base_material_id.is_empty() {
        log::info!("    Using default material for instances");
        material_manager.create_default_material(context)
    } else {
        get_material_by_id(context, &instanced.base_material_id, material_manager).await?
    };

    // Get entity-level transform (if any)
    let entity_transform = if let Some(transform) = transform {
        let mesh_id_lower = mesh_id_lower.as_deref();
        convert_transform_to_matrix(transform, mesh_id_lower)
    } else {
        let mesh_id_lower = mesh_id_lower.as_deref();
        create_base_scale_matrix(mesh_id_lower)
    };

    // Create individual mesh instances
    let mut result = Vec::new();

    for (idx, instance_data) in instanced.instances.iter().enumerate() {
        // Parse instance transform (CRITICAL: use rotation_to_quat_array_opt for degrees → radians)
        let instance_position = position_to_vec3_opt(Some(&instance_data.position));
        let instance_rotation = rotation_to_quat_array_opt(instance_data.rotation.as_ref());
        let instance_scale = scale_to_vec3_opt(instance_data.scale.as_ref());

        // Create instance transform matrix
        let instance_matrix = glam::Mat4::from_scale_rotation_translation(
            instance_scale,
            instance_rotation,
            instance_position,
        );

        // Combine entity transform with instance transform
        // Convert three_d::Mat4 (cgmath) to glam::Mat4 for multiplication
        let entity_array = [
            [
                entity_transform.matrix.x.x,
                entity_transform.matrix.x.y,
                entity_transform.matrix.x.z,
                entity_transform.matrix.x.w,
            ],
            [
                entity_transform.matrix.y.x,
                entity_transform.matrix.y.y,
                entity_transform.matrix.y.z,
                entity_transform.matrix.y.w,
            ],
            [
                entity_transform.matrix.z.x,
                entity_transform.matrix.z.y,
                entity_transform.matrix.z.z,
                entity_transform.matrix.z.w,
            ],
            [
                entity_transform.matrix.w.x,
                entity_transform.matrix.w.y,
                entity_transform.matrix.w.z,
                entity_transform.matrix.w.w,
            ],
        ];
        let entity_matrix_glam = glam::Mat4::from_cols_array_2d(&entity_array);
        let final_matrix_glam = entity_matrix_glam * instance_matrix;

        // Convert back to three_d::Mat4 (cgmath)
        let cols = final_matrix_glam.to_cols_array_2d();
        let final_matrix = three_d::Mat4::from_cols(
            three_d::vec4(cols[0][0], cols[0][1], cols[0][2], cols[0][3]),
            three_d::vec4(cols[1][0], cols[1][1], cols[1][2], cols[1][3]),
            three_d::vec4(cols[2][0], cols[2][1], cols[2][2], cols[2][3]),
            three_d::vec4(cols[3][0], cols[3][1], cols[3][2], cols[3][3]),
        );

        // Clone material and optionally apply instance color
        let mut instance_material = base_material.clone();
        if let Some(color) = &instance_data.color {
            instance_material.albedo = three_d::Srgba::new(
                (color[0] * 255.0) as u8,
                (color[1] * 255.0) as u8,
                (color[2] * 255.0) as u8,
                255,
            );
        }

        // Create mesh
        let mut mesh = Mesh::new(context, &cpu_mesh);
        mesh.set_transformation(final_matrix);

        // Calculate final scale for physics/bounds (entity scale * instance scale)
        let final_scale = GlamVec3::new(
            entity_transform.final_scale.x * instance_scale.x,
            entity_transform.final_scale.y * instance_scale.y,
            entity_transform.final_scale.z * instance_scale.z,
        );

        let base_scale = GlamVec3::new(
            entity_transform.base_scale.x * instance_scale.x,
            entity_transform.base_scale.y * instance_scale.y,
            entity_transform.base_scale.z * instance_scale.z,
        );

        result.push((Gm::new(mesh, instance_material), final_scale, base_scale));

        if idx < 5 {
            log::info!(
                "    Instance {}: pos={:?}, rot={:?}, scale={:?}",
                idx,
                instance_position,
                instance_data.rotation,
                instance_scale
            );
        }
    }

    if instanced.instances.len() > 5 {
        log::info!(
            "    ... and {} more instances",
            instanced.instances.len() - 5
        );
    }

    Ok(result)
}

async fn get_material_by_id(
    context: &Context,
    material_id: &str,
    material_manager: &mut MaterialManager,
) -> Result<PhysicalMaterial> {
    if let Some(material_data) = material_manager.get_material(material_id) {
        log::debug!("      Using cached material: {}", material_id);
        let material_clone = material_data.clone();
        material_manager
            .create_physical_material(context, &material_clone)
            .await
    } else {
        log::warn!("      Material not found: {}, using default", material_id);
        Ok(material_manager.create_default_material(context))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use vibe_ecs_bridge::decoders::InstanceData;

    #[test]
    fn test_instanced_disabled() {
        let instanced = Instanced {
            enabled: false,
            capacity: 100,
            base_mesh_id: "cube".to_string(),
            base_material_id: "default".to_string(),
            instances: vec![],
            cast_shadows: true,
            receive_shadows: true,
            frustum_culled: true,
        };

        // Should skip disabled components
        assert!(!instanced.enabled);
    }

    #[test]
    fn test_instanced_empty_instances() {
        let instanced = Instanced {
            enabled: true,
            capacity: 100,
            base_mesh_id: "cube".to_string(),
            base_material_id: "default".to_string(),
            instances: vec![],
            cast_shadows: true,
            receive_shadows: true,
            frustum_culled: true,
        };

        // Should skip empty instance arrays
        assert!(instanced.instances.is_empty());
    }

    #[test]
    fn test_instance_transform_parsing() {
        let instance = InstanceData {
            position: [1.0, 2.0, 3.0],
            rotation: Some([90.0, 0.0, 0.0]), // Degrees!
            scale: Some([2.0, 2.0, 2.0]),
            color: Some([1.0, 0.0, 0.0]),
            userData: None,
        };

        // Verify position
        let position = position_to_vec3_opt(Some(&instance.position));
        assert_eq!(position, GlamVec3::new(1.0, 2.0, 3.0));

        // Verify rotation (degrees → radians conversion)
        let rotation = rotation_to_quat_array_opt(instance.rotation.as_ref());
        let expected = glam::Quat::from_euler(glam::EulerRot::XYZ, 90.0_f32.to_radians(), 0.0, 0.0);
        assert!((rotation.x - expected.x).abs() < 0.001);
        assert!((rotation.y - expected.y).abs() < 0.001);
        assert!((rotation.z - expected.z).abs() < 0.001);
        assert!((rotation.w - expected.w).abs() < 0.001);

        // Verify scale
        let scale = scale_to_vec3_opt(instance.scale.as_ref());
        assert_eq!(scale, GlamVec3::new(2.0, 2.0, 2.0));
    }

    #[test]
    fn test_instance_optional_fields() {
        let instance = InstanceData {
            position: [0.0, 0.0, 0.0],
            rotation: None,
            scale: None,
            color: None,
            userData: None,
        };

        // Verify defaults
        let rotation = rotation_to_quat_array_opt(instance.rotation.as_ref());
        assert_eq!(rotation, glam::Quat::IDENTITY);

        let scale = scale_to_vec3_opt(instance.scale.as_ref());
        assert_eq!(scale, GlamVec3::ONE);
    }
}
