/// Terrain generator
///
/// Handles procedural terrain generation with noise from ECS components
use anyhow::Result;
use glam::Vec3 as GlamVec3;
use three_d::{Context, CpuMesh, Gm, Indices, Mesh, PhysicalMaterial, Positions, Vector3};
use vibe_ecs_bridge::decoders::{Terrain, Transform};
use vibe_scene::Entity;

use super::material_manager::MaterialManager;
use super::transform_utils::{convert_transform_to_matrix, create_base_scale_matrix};

/// Generate terrain mesh from Terrain component
/// Returns a single Gm mesh with optional height variations from noise
pub async fn generate_terrain(
    context: &Context,
    _entity: &Entity,
    terrain: &Terrain,
    transform: Option<&Transform>,
    material_manager: &mut MaterialManager,
) -> Result<Vec<(Gm<Mesh, PhysicalMaterial>, GlamVec3)>> {
    log::info!("  Terrain:");
    log::info!("    Size:         {:?}", terrain.size);
    log::info!("    Segments:     {:?}", terrain.segments);
    log::info!("    Height Scale: {}", terrain.heightScale);
    log::info!("    Noise:        {}", terrain.noiseEnabled);
    if terrain.noiseEnabled {
        log::info!("      Seed:       {}", terrain.noiseSeed);
        log::info!("      Frequency:  {}", terrain.noiseFrequency);
        log::info!("      Octaves:    {}", terrain.noiseOctaves);
        log::info!("      Persist:    {}", terrain.noisePersistence);
        log::info!("      Lacunar:    {}", terrain.noiseLacunarity);
    }

    // Generate mesh geometry
    let cpu_mesh = create_terrain_mesh(terrain)?;

    // Get material
    let material = material_manager.create_default_material(context);

    // Create mesh and apply transform
    let mut mesh = Mesh::new(context, &cpu_mesh);

    let final_scale = if let Some(transform) = transform {
        let converted = convert_transform_to_matrix(transform, None);
        mesh.set_transformation(converted.matrix);
        converted.final_scale
    } else {
        let converted = create_base_scale_matrix(None);
        mesh.set_transformation(converted.matrix);
        converted.final_scale
    };

    Ok(vec![(Gm::new(mesh, material), final_scale)])
}

/// Create terrain mesh with optional noise
fn create_terrain_mesh(terrain: &Terrain) -> Result<CpuMesh> {
    let width = terrain.size[0];
    let depth = terrain.size[1];
    let segments_x = terrain.segments[0].max(2);
    let segments_z = terrain.segments[1].max(2);

    log::info!("    Generating {} x {} grid", segments_x, segments_z);

    // Calculate vertex count
    let vertex_count = (segments_x + 1) * (segments_z + 1);
    let mut positions = Vec::with_capacity(vertex_count as usize);
    let mut normals = Vec::with_capacity(vertex_count as usize);
    let mut uvs = Vec::with_capacity(vertex_count as usize);

    // Generate vertices with height from noise
    let half_width = width * 0.5;
    let half_depth = depth * 0.5;

    for z in 0..=segments_z {
        for x in 0..=segments_x {
            // Position in [0, 1] range
            let u = x as f32 / segments_x as f32;
            let v = z as f32 / segments_z as f32;

            // World position
            let world_x = u * width - half_width;
            let world_z = v * depth - half_depth;

            // Calculate height
            let height = if terrain.noiseEnabled {
                sample_noise(
                    world_x,
                    world_z,
                    terrain.noiseSeed,
                    terrain.noiseFrequency,
                    terrain.noiseOctaves,
                    terrain.noisePersistence,
                    terrain.noiseLacunarity,
                ) * terrain.heightScale
            } else {
                0.0
            };

            positions.push(Vector3::new(world_x, height, world_z));
            uvs.push(three_d::Vector2::new(u, v));
            // Normals will be calculated after we have all positions
            normals.push(Vector3::new(0.0, 1.0, 0.0)); // Placeholder
        }
    }

    // Generate indices
    let triangle_count = segments_x * segments_z * 2;
    let mut indices = Vec::with_capacity((triangle_count * 3) as usize);

    for z in 0..segments_z {
        for x in 0..segments_x {
            let i0 = z * (segments_x + 1) + x;
            let i1 = i0 + 1;
            let i2 = i0 + segments_x + 1;
            let i3 = i2 + 1;

            // First triangle (counter-clockwise)
            indices.push(i0);
            indices.push(i2);
            indices.push(i1);

            // Second triangle (counter-clockwise)
            indices.push(i1);
            indices.push(i2);
            indices.push(i3);
        }
    }

    log::info!(
        "    Generated {} vertices, {} triangles",
        positions.len(),
        triangle_count
    );

    // Calculate smooth normals
    let normals = calculate_normals(&positions, &indices, segments_x, segments_z);

    Ok(CpuMesh {
        positions: Positions::F32(positions),
        normals: Some(normals),
        uvs: Some(uvs),
        indices: Indices::U32(indices),
        ..Default::default()
    })
}

/// Calculate smooth normals for terrain mesh
fn calculate_normals(
    positions: &[Vector3<f32>],
    indices: &[u32],
    _segments_x: u32,
    _segments_z: u32,
) -> Vec<Vector3<f32>> {
    let mut normals = vec![Vector3::new(0.0, 0.0, 0.0); positions.len()];

    // Accumulate face normals
    for triangle in indices.chunks(3) {
        let i0 = triangle[0] as usize;
        let i1 = triangle[1] as usize;
        let i2 = triangle[2] as usize;

        let v0 = positions[i0];
        let v1 = positions[i1];
        let v2 = positions[i2];

        let edge1 = Vector3::new(v1.x - v0.x, v1.y - v0.y, v1.z - v0.z);
        let edge2 = Vector3::new(v2.x - v0.x, v2.y - v0.y, v2.z - v0.z);

        // Cross product for face normal
        let normal = Vector3::new(
            edge1.y * edge2.z - edge1.z * edge2.y,
            edge1.z * edge2.x - edge1.x * edge2.z,
            edge1.x * edge2.y - edge1.y * edge2.x,
        );

        // Accumulate to vertex normals
        normals[i0] = Vector3::new(
            normals[i0].x + normal.x,
            normals[i0].y + normal.y,
            normals[i0].z + normal.z,
        );
        normals[i1] = Vector3::new(
            normals[i1].x + normal.x,
            normals[i1].y + normal.y,
            normals[i1].z + normal.z,
        );
        normals[i2] = Vector3::new(
            normals[i2].x + normal.x,
            normals[i2].y + normal.y,
            normals[i2].z + normal.z,
        );
    }

    // Normalize
    for normal in &mut normals {
        let length = (normal.x * normal.x + normal.y * normal.y + normal.z * normal.z).sqrt();
        if length > 0.0001 {
            normal.x /= length;
            normal.y /= length;
            normal.z /= length;
        } else {
            // Flat surface, use up vector
            normal.y = 1.0;
        }
    }

    normals
}

/// Simple Perlin-style noise using value noise (hash-based interpolation)
/// This is a basic implementation without external dependencies
fn sample_noise(
    x: f32,
    z: f32,
    seed: u32,
    frequency: f32,
    octaves: u8,
    persistence: f32,
    lacunarity: f32,
) -> f32 {
    let mut total = 0.0;
    let mut amplitude = 1.0;
    let mut max_value = 0.0;
    let mut freq = frequency;

    for _ in 0..octaves {
        let sample_x = x * freq;
        let sample_z = z * freq;

        let noise_value = value_noise(sample_x, sample_z, seed);
        total += noise_value * amplitude;

        max_value += amplitude;
        amplitude *= persistence;
        freq *= lacunarity;
    }

    // Normalize to [-1, 1] range
    if max_value > 0.0 {
        total / max_value
    } else {
        0.0
    }
}

/// Value noise - interpolate between random values at grid points
fn value_noise(x: f32, z: f32, seed: u32) -> f32 {
    let xi = x.floor() as i32;
    let zi = z.floor() as i32;

    let fx = x - xi as f32;
    let fz = z - zi as f32;

    // Smoothstep interpolation for smoother noise
    let u = smoothstep(fx);
    let v = smoothstep(fz);

    // Get corner values
    let v00 = hash_value(xi, zi, seed);
    let v10 = hash_value(xi + 1, zi, seed);
    let v01 = hash_value(xi, zi + 1, seed);
    let v11 = hash_value(xi + 1, zi + 1, seed);

    // Bilinear interpolation
    let x0 = lerp(v00, v10, u);
    let x1 = lerp(v01, v11, u);
    lerp(x0, x1, v)
}

/// Hash function to generate pseudo-random value from coordinates
fn hash_value(x: i32, z: i32, seed: u32) -> f32 {
    // Simple hash combining x, z, and seed
    let mut hash = seed;
    hash = hash.wrapping_mul(374761393).wrapping_add(x as u32);
    hash = hash.wrapping_mul(668265263).wrapping_add(z as u32);
    hash ^= hash >> 13;
    hash = hash.wrapping_mul(1274126177);
    hash ^= hash >> 16;

    // Convert to [0, 1] range, then to [-1, 1]
    let value = (hash as f32) / (u32::MAX as f32);
    value * 2.0 - 1.0
}

/// Smoothstep function for smooth interpolation
fn smoothstep(t: f32) -> f32 {
    t * t * (3.0 - 2.0 * t)
}

/// Linear interpolation
fn lerp(a: f32, b: f32, t: f32) -> f32 {
    a + (b - a) * t
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_terrain_basic_grid() {
        let terrain = Terrain {
            size: [10.0, 10.0],
            segments: [10, 10],
            heightScale: 1.0,
            noiseEnabled: false,
            noiseSeed: 0,
            noiseFrequency: 1.0,
            noiseOctaves: 1,
            noisePersistence: 0.5,
            noiseLacunarity: 2.0,
        };

        let mesh = create_terrain_mesh(&terrain).expect("Failed to create terrain mesh");

        // Verify vertex count: (segments + 1)^2
        let expected_vertices = (10 + 1) * (10 + 1);
        match &mesh.positions {
            Positions::F32(positions) => assert_eq!(positions.len(), expected_vertices),
            _ => panic!("Unexpected position format"),
        }

        // Verify triangle count: segments^2 * 2
        let expected_triangles = 10 * 10 * 2;
        match &mesh.indices {
            Indices::U32(indices) => {
                assert_eq!(indices.len(), (expected_triangles * 3) as usize)
            }
            _ => panic!("Unexpected index format"),
        }
    }

    #[test]
    fn test_terrain_with_noise() {
        let terrain = Terrain {
            size: [20.0, 20.0],
            segments: [50, 50],
            heightScale: 2.0,
            noiseEnabled: true,
            noiseSeed: 1337,
            noiseFrequency: 4.0,
            noiseOctaves: 4,
            noisePersistence: 0.5,
            noiseLacunarity: 2.0,
        };

        let mesh = create_terrain_mesh(&terrain).expect("Failed to create terrain mesh");

        // Should have positions
        match &mesh.positions {
            Positions::F32(positions) => {
                assert!(!positions.is_empty());
                // Check that some heights are non-zero (noise applied)
                let has_variation = positions.iter().any(|p| p.y.abs() > 0.01);
                assert!(has_variation, "Terrain should have height variation");
            }
            _ => panic!("Unexpected position format"),
        }

        // Should have normals
        assert!(mesh.normals.is_some());
    }

    #[test]
    fn test_noise_deterministic() {
        let noise1 = sample_noise(5.0, 5.0, 1337, 1.0, 4, 0.5, 2.0);
        let noise2 = sample_noise(5.0, 5.0, 1337, 1.0, 4, 0.5, 2.0);

        // Same inputs should produce same output
        assert_eq!(noise1, noise2);
    }

    #[test]
    fn test_noise_seed_variation() {
        let noise1 = sample_noise(5.0, 5.0, 1337, 1.0, 4, 0.5, 2.0);
        let noise2 = sample_noise(5.0, 5.0, 42, 1.0, 4, 0.5, 2.0);

        // Different seeds should produce different output
        assert_ne!(noise1, noise2);
    }

    #[test]
    fn test_hash_value_distribution() {
        // Hash values should be in [-1, 1] range
        for i in -10..10 {
            for j in -10..10 {
                let value = hash_value(i, j, 1337);
                assert!(value >= -1.0 && value <= 1.0);
            }
        }
    }

    #[test]
    fn test_smoothstep() {
        assert_eq!(smoothstep(0.0), 0.0);
        assert_eq!(smoothstep(1.0), 1.0);
        assert!(smoothstep(0.5) > 0.4 && smoothstep(0.5) < 0.6);
    }

    #[test]
    fn test_lerp() {
        assert_eq!(lerp(0.0, 10.0, 0.0), 0.0);
        assert_eq!(lerp(0.0, 10.0, 1.0), 10.0);
        assert_eq!(lerp(0.0, 10.0, 0.5), 5.0);
    }

    #[test]
    fn test_terrain_minimum_segments() {
        let terrain = Terrain {
            size: [10.0, 10.0],
            segments: [1, 1], // Should be clamped to 2
            heightScale: 1.0,
            noiseEnabled: false,
            noiseSeed: 0,
            noiseFrequency: 1.0,
            noiseOctaves: 1,
            noisePersistence: 0.5,
            noiseLacunarity: 2.0,
        };

        let mesh = create_terrain_mesh(&terrain).expect("Failed to create terrain mesh");

        // Should create at least a 2x2 grid
        match &mesh.positions {
            Positions::F32(positions) => assert!(positions.len() >= 9), // 3x3 vertices
            _ => panic!("Unexpected position format"),
        }
    }
}
