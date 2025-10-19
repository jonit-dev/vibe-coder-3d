/// Mesh renderer component loading
///
/// Handles loading and creating mesh renderers from ECS components
use anyhow::{Context as AnyhowContext, Result};
use glam::Vec3 as GlamVec3;
use three_d::{Context, CpuMesh, Gm, Indices, Mesh, PhysicalMaterial, Positions};
use vibe_ecs_bridge::decoders::{MeshRenderer, Transform};
use vibe_scene::Entity;

use super::material_manager::MaterialManager;
use super::primitive_mesh::create_primitive_mesh;
use super::transform_utils::{convert_transform_to_matrix, create_base_scale_matrix};

/// Load a mesh renderer component and create the corresponding Gm object
/// Now async to support texture loading!
pub async fn load_mesh_renderer(
    context: &Context,
    _entity: &Entity,
    mesh_renderer: &MeshRenderer,
    transform: Option<&Transform>,
    material_manager: &mut MaterialManager,
) -> Result<(Gm<Mesh, PhysicalMaterial>, GlamVec3)> {
    log::info!("  MeshRenderer:");
    log::info!("    Mesh ID:     {:?}", mesh_renderer.meshId);
    log::info!("    Model Path:  {:?}", mesh_renderer.modelPath);
    log::info!("    Material ID: {:?}", mesh_renderer.materialId);

    // Check if we should load a GLTF model (filter out empty strings)
    let cpu_mesh = if let Some(model_path) = &mesh_renderer.modelPath {
        if !model_path.is_empty() {
            load_gltf_mesh(model_path)?
        } else {
            // Empty string - treat as no model path, use primitive
            let mesh_id_lower = mesh_renderer
                .meshId
                .as_ref()
                .map(|id| id.to_ascii_lowercase());
            create_primitive_mesh(mesh_id_lower.as_deref())
        }
    } else {
        // Normalize mesh identifier for comparisons
        let mesh_id_lower = mesh_renderer
            .meshId
            .as_ref()
            .map(|id| id.to_ascii_lowercase());

        // Create primitive mesh based on meshId hints
        create_primitive_mesh(mesh_id_lower.as_deref())
    };

    // Get or create material (now async)
    let material = get_or_create_material(context, mesh_renderer, material_manager).await?;

    // Create mesh and apply transform
    let mut mesh = Mesh::new(context, &cpu_mesh);

    let final_scale = if let Some(transform) = transform {
        // Use meshId for primitive scaling logic (GLTF models don't need base scale adjustments)
        let mesh_id_lower = mesh_renderer
            .meshId
            .as_ref()
            .map(|id| id.to_ascii_lowercase());
        let converted = convert_transform_to_matrix(transform, mesh_id_lower.as_deref());
        mesh.set_transformation(converted.matrix);
        converted.final_scale
    } else {
        // Even without an explicit Transform component, apply primitive base scale
        let mesh_id_lower = mesh_renderer
            .meshId
            .as_ref()
            .map(|id| id.to_ascii_lowercase());
        let converted = create_base_scale_matrix(mesh_id_lower.as_deref());
        mesh.set_transformation(converted.matrix);
        converted.final_scale
    };

    Ok((Gm::new(mesh, material), final_scale))
}

async fn get_or_create_material(
    context: &Context,
    mesh_renderer: &MeshRenderer,
    material_manager: &mut MaterialManager,
) -> Result<PhysicalMaterial> {
    if let Some(material_id) = &mesh_renderer.materialId {
        if let Some(material_data) = material_manager.get_material(material_id) {
            log::info!("    Using cached material: {}", material_id);
            // Clone material to avoid borrow issues
            let material_clone = material_data.clone();
            material_manager.create_physical_material(context, &material_clone).await
        } else {
            log::warn!("    Material not found: {}, using default", material_id);
            Ok(material_manager.create_default_material(context))
        }
    } else {
        log::info!("    Using default material");
        Ok(material_manager.create_default_material(context))
    }
}

/// Load a GLTF model and convert the first mesh to three-d's CpuMesh format
#[cfg(feature = "gltf-support")]
fn load_gltf_mesh(model_path: &str) -> Result<CpuMesh> {
    log::info!("    Loading GLTF model from: {}", model_path);

    // Load GLTF using vibe-assets loader
    let meshes = vibe_assets::load_gltf(model_path)
        .with_context(|| format!("Failed to load GLTF model: {}", model_path))?;

    if meshes.is_empty() {
        anyhow::bail!("GLTF model contains no meshes: {}", model_path);
    }

    // For now, take the first mesh (future: support multi-mesh GLTF)
    let asset_mesh = &meshes[0];
    log::info!("    Loaded GLTF mesh with {} vertices, {} indices",
        asset_mesh.vertices.len(),
        asset_mesh.indices.len()
    );

    // Convert vibe_assets::Mesh to three-d::CpuMesh
    convert_asset_mesh_to_cpu_mesh(asset_mesh)
}

/// Fallback for when GLTF support is not enabled
#[cfg(not(feature = "gltf-support"))]
fn load_gltf_mesh(model_path: &str) -> Result<CpuMesh> {
    anyhow::bail!(
        "GLTF support not enabled. Cannot load: {}. Compile with --features gltf-support",
        model_path
    )
}

/// Convert vibe_assets::Mesh to three_d::CpuMesh
#[cfg(feature = "gltf-support")]
fn convert_asset_mesh_to_cpu_mesh(asset_mesh: &vibe_assets::Mesh) -> Result<CpuMesh> {
    use three_d::{Vector2, Vector3};

    // Extract positions as Vec<Vector3<f32>>
    let positions: Vec<Vector3<f32>> = asset_mesh
        .vertices
        .iter()
        .map(|v| Vector3::new(v.position[0], v.position[1], v.position[2]))
        .collect();

    // Extract normals as Vec<Vector3<f32>>
    let normals: Vec<Vector3<f32>> = asset_mesh
        .vertices
        .iter()
        .map(|v| Vector3::new(v.normal[0], v.normal[1], v.normal[2]))
        .collect();

    // Extract UVs as Vec<Vector2<f32>>
    let uvs: Vec<Vector2<f32>> = asset_mesh
        .vertices
        .iter()
        .map(|v| Vector2::new(v.uv[0], v.uv[1]))
        .collect();

    // Create CpuMesh
    let cpu_mesh = CpuMesh {
        positions: Positions::F32(positions),
        normals: Some(normals),
        uvs: Some(uvs),
        indices: Indices::U32(asset_mesh.indices.clone()),
        ..Default::default()
    };

    Ok(cpu_mesh)
}
