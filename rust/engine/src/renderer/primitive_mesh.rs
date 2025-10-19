/// Primitive mesh creation utilities
///
/// Handles creation of basic geometric primitives and their scaling
use glam::Vec3 as GlamVec3;
use three_d::CpuMesh;

/// three-d primitives are built at [-1, 1] extents
/// This function returns the scale factor to normalize them to Unity/Three.js unit sizing
pub fn primitive_base_scale(mesh_id: Option<&str>) -> GlamVec3 {
    let default_scale = GlamVec3::ONE;
    let Some(id) = mesh_id else {
        return default_scale;
    };

    match id {
        primitive if primitive.contains("cube") || primitive.contains("box") => {
            GlamVec3::splat(0.5)
        }
        primitive if primitive.contains("sphere") => GlamVec3::splat(0.5),
        primitive if primitive.contains("plane") => GlamVec3::splat(0.5),
        primitive if primitive.contains("cylinder") => GlamVec3::splat(0.5),
        primitive if primitive.contains("capsule") => GlamVec3::splat(0.5),
        primitive if primitive.contains("cone") => GlamVec3::splat(0.5),
        primitive if primitive.contains("torus") => GlamVec3::splat(0.5),
        // Platonic solids already at correct size (0.5 radius default)
        primitive if primitive.contains("tetrahedron") => GlamVec3::ONE,
        primitive if primitive.contains("octahedron") => GlamVec3::ONE,
        primitive if primitive.contains("dodecahedron") => GlamVec3::ONE,
        primitive if primitive.contains("icosahedron") => GlamVec3::ONE,
        _ => default_scale,
    }
}

/// Create a primitive mesh based on the mesh ID hint
pub fn create_primitive_mesh(mesh_id: Option<&str>) -> CpuMesh {
    if let Some(id) = mesh_id {
        match id {
            mesh if mesh.contains("cube") || mesh.contains("box") => {
                log::info!("    Creating:    Cube primitive (with UVs)");
                use vibe_assets::create_cube;
                let vibe_mesh = create_cube();
                convert_vibe_mesh_to_cpu_mesh(&vibe_mesh)
            }
            mesh if mesh.contains("sphere") => {
                log::info!("    Creating:    Sphere primitive (with UVs, 16x16 segments)");
                use vibe_assets::create_sphere;
                let vibe_mesh = create_sphere(16, 16);
                convert_vibe_mesh_to_cpu_mesh(&vibe_mesh)
            }
            mesh if mesh.contains("plane") => {
                log::info!("    Creating:    Plane primitive (with UVs, size 1.0)");
                use vibe_assets::create_plane;
                let vibe_mesh = create_plane(1.0);
                convert_vibe_mesh_to_cpu_mesh(&vibe_mesh)
            }
            // Platonic solids - use vibe_assets implementations for Three.js parity
            mesh if mesh.contains("tetrahedron") || mesh == "Tetrahedron" => {
                log::info!("    Creating:    Tetrahedron primitive (4 vertices, 4 faces)");
                let vibe_mesh = vibe_assets::create_tetrahedron(0.5, 0);
                convert_vibe_mesh_to_cpu_mesh(&vibe_mesh)
            }
            mesh if mesh.contains("octahedron") || mesh == "Octahedron" => {
                log::info!("    Creating:    Octahedron primitive (6 vertices, 8 faces)");
                let vibe_mesh = vibe_assets::create_octahedron(0.5, 0);
                convert_vibe_mesh_to_cpu_mesh(&vibe_mesh)
            }
            mesh if mesh.contains("dodecahedron") || mesh == "Dodecahedron" => {
                log::info!("    Creating:    Dodecahedron primitive (20 vertices, 12 faces)");
                let vibe_mesh = vibe_assets::create_dodecahedron(0.5, 0);
                convert_vibe_mesh_to_cpu_mesh(&vibe_mesh)
            }
            mesh if mesh.contains("icosahedron") || mesh == "Icosahedron" => {
                log::info!("    Creating:    Icosahedron primitive (12 vertices, 20 faces)");
                let vibe_mesh = vibe_assets::create_icosahedron(0.5, 0);
                convert_vibe_mesh_to_cpu_mesh(&vibe_mesh)
            }
            _ => {
                log::warn!("    Unknown mesh type: {}, using cube (with UVs)", id);
                use vibe_assets::create_cube;
                let vibe_mesh = create_cube();
                convert_vibe_mesh_to_cpu_mesh(&vibe_mesh)
            }
        }
    } else {
        log::info!("    Creating:    Default cube (with UVs)");
        use vibe_assets::create_cube;
        let vibe_mesh = create_cube();
        convert_vibe_mesh_to_cpu_mesh(&vibe_mesh)
    }
}

/// Convert vibe_assets::Mesh to three_d::CpuMesh
fn convert_vibe_mesh_to_cpu_mesh(vibe_mesh: &vibe_assets::Mesh) -> CpuMesh {
    use three_d::{Indices, Positions, Vector2, Vector3};

    let positions: Vec<Vector3<f32>> = vibe_mesh
        .vertices
        .iter()
        .map(|v| Vector3::new(v.position[0], v.position[1], v.position[2]))
        .collect();

    let normals: Vec<Vector3<f32>> = vibe_mesh
        .vertices
        .iter()
        .map(|v| Vector3::new(v.normal[0], v.normal[1], v.normal[2]))
        .collect();

    let uvs: Vec<Vector2<f32>> = vibe_mesh
        .vertices
        .iter()
        .map(|v| Vector2::new(v.uv[0], v.uv[1]))
        .collect();

    CpuMesh {
        positions: Positions::F32(positions),
        normals: Some(normals),
        uvs: Some(uvs),
        indices: Indices::U32(vibe_mesh.indices.clone()),
        ..Default::default()
    }
}
