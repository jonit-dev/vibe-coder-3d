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

/// Load a mesh renderer component and create the corresponding Gm object(s)
/// Returns a vector to support multi-submesh GLTF models
/// Now async to support texture loading!
pub async fn load_mesh_renderer(
    context: &Context,
    _entity: &Entity,
    mesh_renderer: &MeshRenderer,
    transform: Option<&Transform>,
    material_manager: &mut MaterialManager,
) -> Result<Vec<(Gm<Mesh, PhysicalMaterial>, GlamVec3, GlamVec3)>> {
    log::info!("  MeshRenderer:");
    log::info!("    Mesh ID:     {:?}", mesh_renderer.meshId);
    log::info!("    Model Path:  {:?}", mesh_renderer.modelPath);
    log::info!("    Material ID: {:?}", mesh_renderer.materialId);
    log::info!("    Materials:   {:?}", mesh_renderer.materials);

    // Check if we should load a GLTF model (filter out empty strings)
    #[cfg(feature = "gltf-support")]
    let (cpu_meshes, gltf_textures, _gltf_images) =
        if let Some(model_path) = &mesh_renderer.modelPath {
            if !model_path.is_empty() {
                let gltf_result = load_gltf_meshes_with_textures(model_path)?;

                // Load GLTF embedded images into texture cache
                for (idx, gltf_image) in gltf_result.images.iter().enumerate() {
                    if let Some(ref texture_id) = gltf_image.name {
                        log::info!("      Loading embedded texture '{}' into cache", texture_id);
                        material_manager.texture_cache_mut().load_gltf_image(
                            texture_id,
                            &gltf_image.data,
                            gltf_image.width,
                            gltf_image.height,
                        )?;
                    } else {
                        log::warn!("      Skipping unnamed GLTF image {}", idx);
                    }
                }

                (
                    gltf_result.cpu_meshes,
                    Some(gltf_result.texture_ids),
                    Some(gltf_result.images),
                )
            } else {
                // Empty string - treat as no model path, use primitive
                let mesh_id_lower = mesh_renderer
                    .meshId
                    .as_ref()
                    .map(|id| id.to_ascii_lowercase());
                (
                    vec![create_primitive_mesh(mesh_id_lower.as_deref())],
                    None,
                    None,
                )
            }
        } else {
            // Normalize mesh identifier for comparisons
            let mesh_id_lower = mesh_renderer
                .meshId
                .as_ref()
                .map(|id| id.to_ascii_lowercase());

            // Create primitive mesh based on meshId hints
            (
                vec![create_primitive_mesh(mesh_id_lower.as_deref())],
                None,
                None,
            )
        };

    #[cfg(not(feature = "gltf-support"))]
    let (cpu_meshes, gltf_textures, gltf_images): (
        Vec<CpuMesh>,
        Option<Vec<Option<String>>>,
        Option<Vec<vibe_assets::GltfImage>>,
    ) = {
        let mesh_id_lower = mesh_renderer
            .meshId
            .as_ref()
            .map(|id| id.to_ascii_lowercase());
        (
            vec![create_primitive_mesh(mesh_id_lower.as_deref())],
            None,
            None,
        )
    };

    // Build result vector for all submeshes
    let mut result = Vec::new();

    // Determine if we should use GLTF embedded materials or scene overrides
    let use_gltf_materials = gltf_textures.is_some()
        && mesh_renderer.materialId.as_ref().map(|id| id.as_str()) == Some("default")
        && mesh_renderer.materials.is_none();

    log::info!(
        "    Material strategy: use_gltf_materials={}, has_gltf_textures={}, materialId={:?}, has_materials_array={}",
        use_gltf_materials,
        gltf_textures.is_some(),
        mesh_renderer.materialId,
        mesh_renderer.materials.is_some()
    );

    for (submesh_idx, cpu_mesh) in cpu_meshes.iter().enumerate() {
        // Get material for this submesh
        let material = if use_gltf_materials {
            // Use GLTF embedded textures
            if let Some(ref texture_ids) = gltf_textures {
                if let Some(Some(ref texture_id)) = texture_ids.get(submesh_idx) {
                    log::info!(
                        "    Submesh {}: using GLTF embedded texture '{}'",
                        submesh_idx,
                        texture_id
                    );
                    create_material_from_gltf_texture(context, texture_id, material_manager).await?
                } else {
                    // Fallback: if GLTF has embedded images but no texture assignment, try using first image
                    #[cfg(feature = "gltf-support")]
                    if let Some(ref images) = _gltf_images {
                        if !images.is_empty() {
                            if let Some(ref first_texture_id) = images[0].name {
                                log::info!(
                                    "    Submesh {}: no texture assignment, using first GLTF image '{}'",
                                    submesh_idx,
                                    first_texture_id
                                );
                                create_material_from_gltf_texture(
                                    context,
                                    first_texture_id,
                                    material_manager,
                                )
                                .await?
                            } else {
                                log::info!(
                                    "    Submesh {}: no embedded texture, using default",
                                    submesh_idx
                                );
                                material_manager.create_default_material(context)
                            }
                        } else {
                            log::info!(
                                "    Submesh {}: no embedded images, using default",
                                submesh_idx
                            );
                            material_manager.create_default_material(context)
                        }
                    } else {
                        log::info!(
                            "    Submesh {}: no embedded texture, using default",
                            submesh_idx
                        );
                        material_manager.create_default_material(context)
                    }
                    #[cfg(not(feature = "gltf-support"))]
                    {
                        log::info!(
                            "    Submesh {}: no embedded texture, using default",
                            submesh_idx
                        );
                        material_manager.create_default_material(context)
                    }
                }
            } else {
                material_manager.create_default_material(context)
            }
        } else if let Some(materials) = &mesh_renderer.materials {
            // Use materials array if available
            if submesh_idx < materials.len() {
                let material_id = &materials[submesh_idx];
                log::info!(
                    "    Submesh {}: using material '{}'",
                    submesh_idx,
                    material_id
                );
                get_material_by_id(context, material_id, material_manager).await?
            } else {
                log::warn!(
                    "    Submesh {}: materials array too short, using default",
                    submesh_idx
                );
                material_manager.create_default_material(context)
            }
        } else {
            // Fall back to single materialId for all submeshes
            get_or_create_material(context, mesh_renderer, material_manager).await?
        };

        // Create mesh and apply transform
        let mut mesh = Mesh::new(context, cpu_mesh);

        let (final_scale, base_scale) = if let Some(transform) = transform {
            // Use meshId for primitive scaling logic (GLTF models don't need base scale adjustments)
            let mesh_id_lower = mesh_renderer
                .meshId
                .as_ref()
                .map(|id| id.to_ascii_lowercase());
            let converted = convert_transform_to_matrix(transform, mesh_id_lower.as_deref());
            mesh.set_transformation(converted.matrix);
            (converted.final_scale, converted.base_scale)
        } else {
            // Even without an explicit Transform component, apply primitive base scale
            let mesh_id_lower = mesh_renderer
                .meshId
                .as_ref()
                .map(|id| id.to_ascii_lowercase());
            let converted = create_base_scale_matrix(mesh_id_lower.as_deref());
            mesh.set_transformation(converted.matrix);
            (converted.final_scale, converted.base_scale)
        };

        result.push((Gm::new(mesh, material), final_scale, base_scale));
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

async fn get_or_create_material(
    context: &Context,
    mesh_renderer: &MeshRenderer,
    material_manager: &mut MaterialManager,
) -> Result<PhysicalMaterial> {
    if let Some(material_id) = &mesh_renderer.materialId {
        get_material_by_id(context, material_id, material_manager).await
    } else {
        log::info!("    Using default material");
        Ok(material_manager.create_default_material(context))
    }
}

/// Create a PhysicalMaterial from a GLTF embedded texture
async fn create_material_from_gltf_texture(
    context: &Context,
    texture_id: &str,
    material_manager: &mut MaterialManager,
) -> Result<PhysicalMaterial> {
    use three_d::{CpuMaterial, Srgba};

    // Create a material with the GLTF texture as albedo
    let mut cpu_material = CpuMaterial {
        albedo: Srgba::WHITE,
        roughness: 0.7,
        metallic: 0.0,
        ..Default::default()
    };

    // Load the texture from cache
    match material_manager
        .texture_cache_mut()
        .load_texture(texture_id)
        .await
    {
        Ok(texture) => {
            cpu_material.albedo_texture = Some(texture.as_ref().clone());
            log::debug!("Applied GLTF texture '{}' to material", texture_id);
        }
        Err(e) => {
            log::warn!("Failed to apply GLTF texture '{}': {}", texture_id, e);
        }
    }

    Ok(PhysicalMaterial::new(context, &cpu_material))
}

/// GLTF loading result with meshes and texture information
#[cfg(feature = "gltf-support")]
struct GltfLoadResult {
    cpu_meshes: Vec<CpuMesh>,
    texture_ids: Vec<Option<String>>,
    images: Vec<vibe_assets::GltfImage>,
}

/// Load a GLTF model with full texture support
#[cfg(feature = "gltf-support")]
fn load_gltf_meshes_with_textures(model_path: &str) -> Result<GltfLoadResult> {
    log::info!("    Loading GLTF model from: {}", model_path);

    // Load GLTF using vibe-assets loader (full version with textures)
    let gltf_data = vibe_assets::load_gltf_full(model_path)
        .with_context(|| format!("Failed to load GLTF model: {}", model_path))?;

    if gltf_data.meshes.is_empty() {
        anyhow::bail!("GLTF model contains no meshes: {}", model_path);
    }

    log::info!(
        "    GLTF model contains {} submesh(es) and {} texture(s)",
        gltf_data.meshes.len(),
        gltf_data.images.len()
    );

    // Convert all meshes to CpuMesh format
    let mut cpu_meshes = Vec::new();
    for (idx, asset_mesh) in gltf_data.meshes.iter().enumerate() {
        log::info!(
            "      Submesh {}: {} vertices, {} indices, texture: {:?}",
            idx,
            asset_mesh.vertices.len(),
            asset_mesh.indices.len(),
            gltf_data.mesh_textures.get(idx).and_then(|t| t.as_ref())
        );
        let cpu_mesh = convert_asset_mesh_to_cpu_mesh(asset_mesh)?;
        cpu_meshes.push(cpu_mesh);
    }

    Ok(GltfLoadResult {
        cpu_meshes,
        texture_ids: gltf_data.mesh_textures,
        images: gltf_data.images,
    })
}

/// Load a GLTF model and convert all meshes to three-d's CpuMesh format (legacy)
#[cfg(feature = "gltf-support")]
fn load_gltf_meshes(model_path: &str) -> Result<Vec<CpuMesh>> {
    let result = load_gltf_meshes_with_textures(model_path)?;
    Ok(result.cpu_meshes)
}

/// Fallback for when GLTF support is not enabled
#[cfg(not(feature = "gltf-support"))]
fn load_gltf_meshes(model_path: &str) -> Result<Vec<CpuMesh>> {
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

/// Convert GeometryMeta to three_d::CpuMesh
pub fn convert_geometry_meta_to_cpu_mesh(meta: &vibe_assets::GeometryMeta) -> Result<CpuMesh> {
    use three_d::{Srgba, Vector2, Vector3, Vector4};

    // Extract positions (required)
    let position_array = meta
        .attributes
        .position
        .array
        .as_ref()
        .context("Position attribute must have inline array data")?;

    let position_item_size = meta.attributes.position.item_size as usize;
    if position_item_size != 3 {
        anyhow::bail!(
            "Position attribute must have itemSize 3, got {}",
            position_item_size
        );
    }

    let positions: Vec<Vector3<f32>> = position_array
        .chunks(position_item_size)
        .map(|chunk| Vector3::new(chunk[0], chunk[1], chunk[2]))
        .collect();

    // Extract normals (optional)
    let normals = if let Some(normal_accessor) = &meta.attributes.normal {
        if let Some(normal_array) = &normal_accessor.array {
            let normal_item_size = normal_accessor.item_size as usize;
            if normal_item_size != 3 {
                log::warn!(
                    "Normal attribute should have itemSize 3, got {}",
                    normal_item_size
                );
                None
            } else {
                Some(
                    normal_array
                        .chunks(normal_item_size)
                        .map(|chunk| Vector3::new(chunk[0], chunk[1], chunk[2]))
                        .collect(),
                )
            }
        } else {
            log::warn!("Normal accessor has no array data");
            None
        }
    } else {
        None
    };

    // Extract UVs (optional)
    let uvs = if let Some(uv_accessor) = &meta.attributes.uv {
        if let Some(uv_array) = &uv_accessor.array {
            let uv_item_size = uv_accessor.item_size as usize;
            if uv_item_size != 2 {
                log::warn!("UV attribute should have itemSize 2, got {}", uv_item_size);
                None
            } else {
                Some(
                    uv_array
                        .chunks(uv_item_size)
                        .map(|chunk| Vector2::new(chunk[0], chunk[1]))
                        .collect(),
                )
            }
        } else {
            log::warn!("UV accessor has no array data");
            None
        }
    } else {
        None
    };

    // Extract colors (optional) - convert to Srgba
    let colors = if let Some(color_accessor) = &meta.attributes.color {
        if let Some(color_array) = &color_accessor.array {
            let color_item_size = color_accessor.item_size as usize;
            if color_item_size == 3 {
                Some(
                    color_array
                        .chunks(color_item_size)
                        .map(|chunk| {
                            Srgba::new(
                                (chunk[0] * 255.0) as u8,
                                (chunk[1] * 255.0) as u8,
                                (chunk[2] * 255.0) as u8,
                                255,
                            )
                        })
                        .collect::<Vec<Srgba>>(),
                )
            } else if color_item_size == 4 {
                // RGBA
                Some(
                    color_array
                        .chunks(color_item_size)
                        .map(|chunk| {
                            Srgba::new(
                                (chunk[0] * 255.0) as u8,
                                (chunk[1] * 255.0) as u8,
                                (chunk[2] * 255.0) as u8,
                                (chunk[3] * 255.0) as u8,
                            )
                        })
                        .collect::<Vec<Srgba>>(),
                )
            } else {
                log::warn!(
                    "Color attribute should have itemSize 3 or 4, got {}",
                    color_item_size
                );
                None
            }
        } else {
            log::warn!("Color accessor has no array data");
            None
        }
    } else {
        None
    };

    // Extract tangents (optional)
    let tangents = if let Some(tangent_accessor) = &meta.attributes.tangent {
        if let Some(tangent_array) = &tangent_accessor.array {
            let tangent_item_size = tangent_accessor.item_size as usize;
            if tangent_item_size != 4 {
                log::warn!(
                    "Tangent attribute should have itemSize 4, got {}",
                    tangent_item_size
                );
                None
            } else {
                Some(
                    tangent_array
                        .chunks(tangent_item_size)
                        .map(|chunk| Vector4::new(chunk[0], chunk[1], chunk[2], chunk[3]))
                        .collect::<Vec<Vector4<f32>>>(),
                )
            }
        } else {
            log::warn!("Tangent accessor has no array data");
            None
        }
    } else {
        None
    };

    // Extract indices (optional)
    let indices = if let Some(index_accessor) = &meta.index {
        if let Some(index_array) = &index_accessor.array {
            // Convert f32 to u32 for indices
            let vertex_count = positions.len() as u32;
            let indices_vec: Vec<u32> = index_array
                .iter()
                .map(|&f| {
                    let idx = f as u32;
                    // Clamp indices to valid range (Three.js compatibility)
                    if idx >= vertex_count {
                        log::warn!(
                            "Index {} out of range (vertex count: {}), clamping to {}",
                            idx,
                            vertex_count,
                            vertex_count - 1
                        );
                        vertex_count - 1
                    } else {
                        idx
                    }
                })
                .collect();
            Indices::U32(indices_vec)
        } else {
            log::warn!("Index accessor has no array data, using non-indexed mesh");
            Indices::U32(vec![])
        }
    } else {
        Indices::U32(vec![])
    };

    // Create CpuMesh
    let mut cpu_mesh = CpuMesh {
        positions: Positions::F32(positions),
        normals,
        uvs,
        indices,
        ..Default::default()
    };

    // Set colors if present
    if let Some(color_data) = colors {
        cpu_mesh.colors = Some(color_data);
    }

    // Set tangents if present
    if let Some(tangent_data) = tangents {
        cpu_mesh.tangents = Some(tangent_data);
    }

    log::info!(
        "Loaded geometry meta: {} vertices, has_normals={}, has_uvs={}, has_indices={}",
        cpu_mesh.positions.len(),
        cpu_mesh.normals.is_some(),
        cpu_mesh.uvs.is_some(),
        !matches!(cpu_mesh.indices, Indices::U32(ref v) if v.is_empty())
    );

    Ok(cpu_mesh)
}
