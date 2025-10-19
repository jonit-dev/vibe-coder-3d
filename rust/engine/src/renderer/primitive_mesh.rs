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
        // Geometric variations
        primitive if primitive.contains("trapezoid") => GlamVec3::splat(0.5),
        primitive if primitive.contains("prism") => GlamVec3::splat(0.5),
        primitive if primitive.contains("pyramid") => GlamVec3::splat(0.5),
        // Structural shapes
        primitive if primitive.contains("wall") => GlamVec3::new(1.0, 0.5, 0.05), // 2x1x0.1
        primitive if primitive.contains("ramp") => GlamVec3::splat(0.5),
        primitive if primitive.contains("stairs") => GlamVec3::splat(0.5),
        primitive if primitive.contains("spiralstairs") || primitive.contains("spiral") => {
            GlamVec3::splat(0.5)
        }
        // Platonic solids already at correct size (0.5 radius default)
        primitive if primitive.contains("tetrahedron") => GlamVec3::ONE,
        primitive if primitive.contains("octahedron") => GlamVec3::ONE,
        primitive if primitive.contains("dodecahedron") => GlamVec3::ONE,
        primitive if primitive.contains("icosahedron") => GlamVec3::ONE,
        // Decorative shapes
        primitive if primitive.contains("star") => GlamVec3::ONE,
        primitive if primitive.contains("heart") => GlamVec3::ONE,
        primitive if primitive.contains("diamond") => GlamVec3::ONE,
        primitive if primitive.contains("cross") => GlamVec3::ONE,
        primitive if primitive.contains("tube") => GlamVec3::ONE,
        // Mathematical shapes
        primitive if primitive.contains("helix") => GlamVec3::ONE,
        primitive if primitive.contains("mobius") => GlamVec3::ONE,
        // Environment shapes
        primitive if primitive.contains("tree") => GlamVec3::ONE,
        primitive if primitive.contains("rock") => GlamVec3::ONE,
        primitive if primitive.contains("bush") => GlamVec3::ONE,
        primitive if primitive.contains("grass") => GlamVec3::ONE,
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
            // Cylindrical variations - parameter-based
            mesh if mesh.contains("cylinder") || mesh == "Cylinder" => {
                log::info!("    Creating:    Cylinder primitive (with UVs)");
                let vibe_mesh = vibe_assets::create_cylinder(0.5, 1.0, 32);
                convert_vibe_mesh_to_cpu_mesh(&vibe_mesh)
            }
            mesh if mesh.contains("cone") || mesh == "Cone" => {
                log::info!("    Creating:    Cone primitive (with UVs)");
                let vibe_mesh = vibe_assets::create_cone(0.5, 1.0, 32);
                convert_vibe_mesh_to_cpu_mesh(&vibe_mesh)
            }
            mesh if mesh.contains("capsule") || mesh == "Capsule" => {
                log::info!("    Creating:    Capsule primitive (with UVs)");
                let vibe_mesh = vibe_assets::create_capsule(0.3, 0.4, 4, 16);
                convert_vibe_mesh_to_cpu_mesh(&vibe_mesh)
            }
            mesh if mesh.contains("torus") && !mesh.contains("knot") => {
                log::info!("    Creating:    Torus primitive (with UVs)");
                let vibe_mesh = vibe_assets::create_torus(0.5, 0.2, 16, 100);
                convert_vibe_mesh_to_cpu_mesh(&vibe_mesh)
            }
            mesh if mesh.contains("torusknot") || mesh == "TorusKnot" => {
                log::info!("    Creating:    TorusKnot primitive (with UVs)");
                let vibe_mesh = vibe_assets::create_torus_knot(0.4, 0.1, 64, 8, 2, 3);
                convert_vibe_mesh_to_cpu_mesh(&vibe_mesh)
            }
            // Geometric shape variations (using existing primitives with different params)
            mesh if mesh.contains("trapezoid") || mesh == "Trapezoid" => {
                log::info!("    Creating:    Trapezoid (truncated cylinder, 4 segments)");
                // Trapezoid uses cylinder with 4 segments and different radii
                let vibe_mesh = vibe_assets::CylindricalBuilder::truncated_cone(0.3, 0.7, 1.0, 4).build();
                convert_vibe_mesh_to_cpu_mesh(&vibe_mesh)
            }
            mesh if mesh.contains("prism") || mesh == "Prism" => {
                log::info!("    Creating:    Prism (cylinder with 6 segments)");
                let vibe_mesh = vibe_assets::create_cylinder(0.5, 1.0, 6);
                convert_vibe_mesh_to_cpu_mesh(&vibe_mesh)
            }
            mesh if mesh.contains("pyramid") || mesh == "Pyramid" => {
                log::info!("    Creating:    Pyramid (cone with 4 segments)");
                let vibe_mesh = vibe_assets::create_cone(0.5, 1.0, 4);
                convert_vibe_mesh_to_cpu_mesh(&vibe_mesh)
            }
            // Structural shapes
            mesh if mesh.contains("wall") || mesh == "Wall" => {
                log::info!("    Creating:    Wall (thin box 2x1x0.1)");
                // Wall is just a scaled cube - will be handled by scale
                use vibe_assets::create_cube;
                let vibe_mesh = create_cube();
                convert_vibe_mesh_to_cpu_mesh(&vibe_mesh)
            }
            mesh if mesh.contains("ramp") || mesh == "Ramp" => {
                log::info!("    Creating:    Ramp (inclined plane)");
                let vibe_mesh = vibe_assets::create_ramp(1.0, 1.0, 1.0);
                convert_vibe_mesh_to_cpu_mesh(&vibe_mesh)
            }
            mesh if mesh.contains("stairs") && !mesh.contains("spiral") => {
                log::info!("    Creating:    Stairs (5 steps)");
                let vibe_mesh = vibe_assets::create_stairs(1.0, 1.0, 1.0, 5);
                convert_vibe_mesh_to_cpu_mesh(&vibe_mesh)
            }
            mesh if mesh.contains("spiralstairs") || mesh.contains("spiral") && mesh.contains("stair") => {
                log::info!("    Creating:    Spiral Stairs (12 steps, 1 turn)");
                let vibe_mesh = vibe_assets::create_spiral_stairs(1.0, 2.0, 12, 1.0);
                convert_vibe_mesh_to_cpu_mesh(&vibe_mesh)
            }
            // Decorative shapes
            mesh if mesh.contains("star") || mesh == "Star" => {
                log::info!("    Creating:    Star (5 points)");
                let vibe_mesh = vibe_assets::create_star(0.5, 0.25, 5, 0.2);
                convert_vibe_mesh_to_cpu_mesh(&vibe_mesh)
            }
            mesh if mesh.contains("heart") || mesh == "Heart" => {
                log::info!("    Creating:    Heart (parametric curve)");
                let vibe_mesh = vibe_assets::create_heart(0.5, 0.2, 32);
                convert_vibe_mesh_to_cpu_mesh(&vibe_mesh)
            }
            mesh if mesh.contains("diamond") || mesh == "Diamond" => {
                log::info!("    Creating:    Diamond (faceted gem)");
                let vibe_mesh = vibe_assets::create_diamond(0.5, 0.8, 0.4, 8);
                convert_vibe_mesh_to_cpu_mesh(&vibe_mesh)
            }
            mesh if mesh.contains("cross") || mesh == "Cross" => {
                log::info!("    Creating:    Cross (3D plus sign)");
                let vibe_mesh = vibe_assets::create_cross(1.0, 0.3);
                convert_vibe_mesh_to_cpu_mesh(&vibe_mesh)
            }
            mesh if mesh.contains("tube") || mesh == "Tube" => {
                log::info!("    Creating:    Tube (curved cylinder)");
                let vibe_mesh = vibe_assets::create_tube(0.5, 0.1, 32, 16);
                convert_vibe_mesh_to_cpu_mesh(&vibe_mesh)
            }
            // Mathematical shapes
            mesh if mesh.contains("helix") || mesh == "Helix" => {
                log::info!("    Creating:    Helix (spiral, 3 coils)");
                let vibe_mesh = vibe_assets::create_helix(0.5, 2.0, 0.1, 3.0, 32, 8);
                convert_vibe_mesh_to_cpu_mesh(&vibe_mesh)
            }
            mesh if mesh.contains("mobius") || mesh == "MobiusStrip" => {
                log::info!("    Creating:    Mobius Strip (non-orientable surface)");
                let vibe_mesh = vibe_assets::create_mobius_strip(0.5, 0.3, 64);
                convert_vibe_mesh_to_cpu_mesh(&vibe_mesh)
            }
            // Environment shapes
            mesh if mesh.contains("tree") || mesh == "Tree" => {
                log::info!("    Creating:    Tree (trunk + foliage, improved proportions)");
                // Improved proportions: thicker trunk, better foliage ratio, more segments
                // trunk_radius: 0.15 (was 0.1 - thicker trunk)
                // trunk_height: 1.2 (was 1.0 - taller trunk)
                // foliage_radius: 0.7 (was 0.5 - larger foliage)
                // foliage_height: 1.8 (was 1.0 - taller cone)
                // segments: 16 (was 8 - smoother appearance)
                let vibe_mesh = vibe_assets::create_tree(0.15, 1.2, 0.7, 1.8, 16);
                convert_vibe_mesh_to_cpu_mesh(&vibe_mesh)
            }
            mesh if mesh.contains("rock") || mesh == "Rock" => {
                log::info!("    Creating:    Rock (irregular sphere)");
                let vibe_mesh = vibe_assets::create_rock(0.5, 0.3, 16);
                convert_vibe_mesh_to_cpu_mesh(&vibe_mesh)
            }
            mesh if mesh.contains("bush") || mesh == "Bush" => {
                log::info!("    Creating:    Bush (spherical foliage)");
                let vibe_mesh = vibe_assets::create_bush(0.5, 8);
                convert_vibe_mesh_to_cpu_mesh(&vibe_mesh)
            }
            mesh if mesh.contains("grass") || mesh == "Grass" => {
                log::info!("    Creating:    Grass (blade cluster, 5 blades)");
                let vibe_mesh = vibe_assets::create_grass(0.05, 0.3, 5);
                convert_vibe_mesh_to_cpu_mesh(&vibe_mesh)
            }
            _ => {
                log::warn!("    Unknown mesh type: {}, using placeholder cube", id);
                // TODO: Add proper placeholder system with shape name visualization
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
