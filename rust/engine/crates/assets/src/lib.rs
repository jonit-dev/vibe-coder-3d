mod geometry_math;
mod gltf_loader;
mod material;
#[cfg(test)]
mod material_test;
mod mesh_cache;
mod primitives;
mod primitives_cylinders;
mod primitives_platonic;
mod primitives_torus;
mod texture_cache;
mod vertex;
mod vertex_builder;

pub use gltf_loader::{load_gltf, load_gltf_full, GltfData, GltfImage, GltfImageFormat};
pub use material::{Material, MaterialCache};
pub use mesh_cache::{GpuMesh, MeshCache};
pub use primitives::{create_cube, create_plane, create_sphere};
pub use primitives_cylinders::{create_capsule, create_cone, create_cylinder};
pub use primitives_platonic::{
    create_dodecahedron, create_icosahedron, create_octahedron, create_tetrahedron,
};
pub use primitives_torus::{create_torus, create_torus_knot};
pub use texture_cache::{GpuTexture, TextureCache};
pub use vertex::{Mesh, Vertex};
