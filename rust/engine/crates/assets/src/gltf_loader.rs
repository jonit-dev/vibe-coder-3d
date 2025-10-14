#[cfg(feature = "gltf-support")]
use crate::vertex::{Mesh, Vertex};
#[cfg(feature = "gltf-support")]
use anyhow::{Context, Result};
#[cfg(feature = "gltf-support")]
use glam::{Vec2, Vec3};
#[cfg(feature = "gltf-support")]
use std::path::Path;

#[cfg(feature = "gltf-support")]
pub fn load_gltf(path: &str) -> Result<Vec<Mesh>> {
    log::info!("Loading GLTF model from: {}", path);

    let (document, buffers, _images) = gltf::import(path)
        .with_context(|| format!("Failed to load GLTF file: {}", path))?;

    let mut meshes = Vec::new();

    for gltf_mesh in document.meshes() {
        let mesh_name = gltf_mesh.name().unwrap_or("Unnamed");
        log::debug!("Processing GLTF mesh: {}", mesh_name);

        for primitive in gltf_mesh.primitives() {
            let reader = primitive.reader(|buffer| Some(&buffers[buffer.index()]));

            // Read positions (required)
            let positions = reader
                .read_positions()
                .context("GLTF mesh missing positions")?
                .map(|p| Vec3::from(p))
                .collect::<Vec<_>>();

            // Read normals (required)
            let normals = reader
                .read_normals()
                .context("GLTF mesh missing normals")?
                .map(|n| Vec3::from(n))
                .collect::<Vec<_>>();

            // Read texture coordinates (optional, default to 0)
            let tex_coords = reader
                .read_tex_coords(0)
                .map(|coords| coords.into_f32().map(|uv| Vec2::from(uv)).collect::<Vec<_>>())
                .unwrap_or_else(|| vec![Vec2::ZERO; positions.len()]);

            // Build vertices
            let vertices = positions
                .iter()
                .zip(normals.iter())
                .zip(tex_coords.iter())
                .map(|((pos, norm), uv)| Vertex {
                    position: [pos.x, pos.y, pos.z],
                    normal: [norm.x, norm.y, norm.z],
                    uv: [uv.x, uv.y],
                })
                .collect::<Vec<_>>();

            // Read indices (required for indexed meshes)
            let indices = reader
                .read_indices()
                .context("GLTF mesh missing indices")?
                .into_u32()
                .collect::<Vec<_>>();

            log::debug!(
                "  Primitive: {} vertices, {} indices",
                vertices.len(),
                indices.len()
            );

            meshes.push(Mesh { vertices, indices });
        }
    }

    log::info!("Loaded {} mesh(es) from GLTF file", meshes.len());
    Ok(meshes)
}

#[cfg(not(feature = "gltf-support"))]
pub fn load_gltf(_path: &str) -> anyhow::Result<Vec<crate::vertex::Mesh>> {
    anyhow::bail!("GLTF support not enabled. Compile with --features gltf-support")
}

#[cfg(test)]
#[cfg(feature = "gltf-support")]
mod tests {
    use super::*;

    #[test]
    fn test_load_gltf_not_found() {
        let result = load_gltf("nonexistent.gltf");
        assert!(result.is_err());
    }
}
