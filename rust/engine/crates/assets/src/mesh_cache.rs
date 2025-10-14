use super::{primitives, vertex::Mesh};
use std::collections::HashMap;
use wgpu::util::DeviceExt;

pub struct GpuMesh {
    pub vertex_buffer: wgpu::Buffer,
    pub index_buffer: wgpu::Buffer,
    pub index_count: u32,
}

pub struct MeshCache {
    meshes: HashMap<String, GpuMesh>,
}

impl MeshCache {
    pub fn new() -> Self {
        Self {
            meshes: HashMap::new(),
        }
    }

    pub fn initialize_primitives(&mut self, device: &wgpu::Device) {
        log::info!("Initializing primitive meshes...");

        // Create cube
        let cube = primitives::create_cube();
        self.upload_mesh(device, "cube", cube);

        // Create sphere
        let sphere = primitives::create_sphere(32, 16);
        self.upload_mesh(device, "sphere", sphere);

        // Create plane
        let plane = primitives::create_plane(10.0);
        self.upload_mesh(device, "plane", plane);

        log::info!("Loaded {} primitive meshes", self.meshes.len());
    }

    pub fn upload_mesh(&mut self, device: &wgpu::Device, id: &str, mesh: Mesh) {
        let vertex_buffer = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
            label: Some(&format!("{} Vertex Buffer", id)),
            contents: bytemuck::cast_slice(&mesh.vertices),
            usage: wgpu::BufferUsages::VERTEX,
        });

        let index_buffer = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
            label: Some(&format!("{} Index Buffer", id)),
            contents: bytemuck::cast_slice(&mesh.indices),
            usage: wgpu::BufferUsages::INDEX,
        });

        let gpu_mesh = GpuMesh {
            vertex_buffer,
            index_buffer,
            index_count: mesh.indices.len() as u32,
        };

        self.meshes.insert(id.to_string(), gpu_mesh);
        log::debug!(
            "Uploaded mesh '{}': {} vertices, {} indices",
            id,
            mesh.vertices.len(),
            mesh.indices.len()
        );
    }

    pub fn get(&self, id: &str) -> Option<&GpuMesh> {
        self.meshes.get(id)
    }

    /// Load meshes from a GLTF file and upload to GPU
    #[cfg(feature = "gltf-support")]
    pub fn load_gltf(&mut self, device: &wgpu::Device, path: &str) -> anyhow::Result<Vec<String>> {
        use crate::gltf_loader::load_gltf;

        let meshes = load_gltf(path)?;
        let mut mesh_ids = Vec::new();

        for (idx, mesh) in meshes.into_iter().enumerate() {
            let mesh_id = format!("{}_{}", path, idx);
            self.upload_mesh(device, &mesh_id, mesh);
            mesh_ids.push(mesh_id);
        }

        Ok(mesh_ids)
    }

    /// Load meshes from a GLTF file (stub when feature disabled)
    #[cfg(not(feature = "gltf-support"))]
    pub fn load_gltf(&mut self, _device: &wgpu::Device, _path: &str) -> anyhow::Result<Vec<String>> {
        anyhow::bail!("GLTF support not enabled")
    }
}

impl Default for MeshCache {
    fn default() -> Self {
        Self::new()
    }
}
