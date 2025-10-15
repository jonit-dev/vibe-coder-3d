#[cfg(feature = "gltf-support")]
use crate::vertex::{Mesh, Vertex};
#[cfg(feature = "gltf-support")]
use anyhow::{Context, Result};
#[cfg(feature = "gltf-support")]
use glam::{Vec2, Vec3};
#[cfg(feature = "gltf-support")]
use std::path::Path;

#[cfg(feature = "gltf-support")]
pub struct GltfData {
    pub meshes: Vec<Mesh>,
    pub images: Vec<GltfImage>,
}

#[cfg(feature = "gltf-support")]
pub struct GltfImage {
    pub name: Option<String>,
    pub data: Vec<u8>, // Raw RGBA pixels
    pub width: u32,
    pub height: u32,
    pub format: GltfImageFormat,
}

#[cfg(feature = "gltf-support")]
#[derive(Debug, Clone, Copy)]
pub enum GltfImageFormat {
    Png,
    Jpeg,
    Unknown,
}

#[cfg(feature = "gltf-support")]
pub fn load_gltf(path: &str) -> Result<Vec<Mesh>> {
    let gltf_data = load_gltf_full(path)?;
    Ok(gltf_data.meshes)
}

#[cfg(feature = "gltf-support")]
pub fn load_gltf_full(path: &str) -> Result<GltfData> {
    log::info!("Loading GLTF model from: {}", path);

    // Check if file exists first for better error messages
    let path_obj = Path::new(path);
    if !path_obj.exists() {
        anyhow::bail!(
            "GLTF file does not exist: {} (cwd: {:?})",
            path,
            std::env::current_dir()
        );
    }

    let (document, buffers, images) = gltf::import(path)
        .map_err(|e| anyhow::anyhow!("gltf::import failed: {:?}", e))
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
                .map(|coords| {
                    coords
                        .into_f32()
                        .map(|uv| Vec2::from(uv))
                        .collect::<Vec<_>>()
                })
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
                    tangent: [0.0, 0.0, 0.0, 1.0],
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

            meshes.push(Mesh::new(vertices, indices));
        }
    }

    // Extract images/textures and convert to RGBA
    let gltf_images = images
        .into_iter()
        .enumerate()
        .map(|(idx, img_data)| {
            let format = match img_data.format {
                gltf::image::Format::R8G8B8 | gltf::image::Format::R8G8B8A8 => GltfImageFormat::Png,
                _ => GltfImageFormat::Unknown,
            };

            // Convert RGB to RGBA if needed
            let rgba_data = match img_data.format {
                gltf::image::Format::R8G8B8 => {
                    // Convert RGB to RGBA by adding alpha channel
                    let mut rgba =
                        Vec::with_capacity((img_data.width * img_data.height * 4) as usize);
                    for chunk in img_data.pixels.chunks(3) {
                        rgba.push(chunk[0]); // R
                        rgba.push(chunk[1]); // G
                        rgba.push(chunk[2]); // B
                        rgba.push(255); // A (fully opaque)
                    }
                    rgba
                }
                gltf::image::Format::R8G8B8A8 => {
                    // Already RGBA
                    img_data.pixels
                }
                _ => {
                    log::warn!("Unsupported image format: {:?}", img_data.format);
                    img_data.pixels
                }
            };

            GltfImage {
                name: Some(format!("texture_{}", idx)),
                data: rgba_data,
                width: img_data.width,
                height: img_data.height,
                format,
            }
        })
        .collect::<Vec<_>>();

    log::info!(
        "Loaded {} mesh(es) and {} texture(s) from GLTF file",
        meshes.len(),
        gltf_images.len()
    );

    Ok(GltfData {
        meshes,
        images: gltf_images,
    })
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
