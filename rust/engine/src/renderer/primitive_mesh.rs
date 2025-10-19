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
        _ => default_scale,
    }
}

/// Create a primitive mesh based on the mesh ID hint
pub fn create_primitive_mesh(mesh_id: Option<&str>) -> CpuMesh {
    if let Some(id) = mesh_id {
        match id {
            mesh if mesh.contains("cube") || mesh.contains("box") => {
                log::info!("    Creating:    Cube primitive");
                CpuMesh::cube()
            }
            mesh if mesh.contains("sphere") => {
                log::info!("    Creating:    Sphere primitive (16 segments)");
                CpuMesh::sphere(16)
            }
            mesh if mesh.contains("plane") => {
                log::info!("    Creating:    Plane primitive");
                CpuMesh::square()
            }
            _ => {
                log::warn!("    Unknown mesh type: {}, using cube", id);
                CpuMesh::cube()
            }
        }
    } else {
        log::info!("    Creating:    Default cube");
        CpuMesh::cube()
    }
}
