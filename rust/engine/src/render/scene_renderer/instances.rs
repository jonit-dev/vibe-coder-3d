//! Instance buffer management - building InstanceRaw data and GPU buffers.
//!
//! This module encapsulates all logic for creating instance data from renderable entities.

use super::super::pipeline::InstanceRaw;
use super::super::scene_renderer::RenderableEntity;
use glam::Mat4;
use vibe_assets::MaterialCache;
use wgpu::util::DeviceExt;

/// Builder for instance data and buffers
pub struct InstanceBuilder;

impl InstanceBuilder {
    /// Build instance data from renderable entities (pure function)
    pub fn build_instances(
        entities: &[RenderableEntity],
        material_cache: &MaterialCache,
    ) -> Vec<InstanceRaw> {
        entities
            .iter()
            .enumerate()
            .map(|(idx, e)| {
                // Get material
                let (material, mat_id) = if let Some(ref mat_id) = e.material_id {
                    (material_cache.get(mat_id), mat_id.as_str())
                } else {
                    (material_cache.default(), "default")
                };

                let color_rgb = material.color_rgb();

                log::debug!(
                    "Instance #{}: mesh='{}', material='{}', color=RGB({:.2}, {:.2}, {:.2}), metalness={}, roughness={}",
                    idx,
                    e.mesh_id,
                    mat_id,
                    color_rgb.x,
                    color_rgb.y,
                    color_rgb.z,
                    material.metalness,
                    material.roughness
                );

                InstanceRaw::with_material(
                    e.transform,
                    [color_rgb.x, color_rgb.y, color_rgb.z],
                    material.metalness,
                    material.roughness,
                )
            })
            .collect()
    }

    /// Create GPU buffer from instance data (I/O function)
    pub fn create_buffer(device: &wgpu::Device, instances: &[InstanceRaw]) -> wgpu::Buffer {
        log::debug!("Creating instance buffer for {} entities", instances.len());

        let buffer = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
            label: Some("Instance Buffer"),
            contents: bytemuck::cast_slice(instances),
            usage: wgpu::BufferUsages::VERTEX | wgpu::BufferUsages::COPY_DST,
        });

        log::debug!("Instance buffer created successfully");
        buffer
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use vibe_assets::Material;

    #[test]
    fn test_build_instances_empty() {
        let entities = vec![];
        let material_cache = MaterialCache::new();
        let instances = InstanceBuilder::build_instances(&entities, &material_cache);
        assert_eq!(instances.len(), 0);
    }

    #[test]
    fn test_build_instances_with_default_material() {
        let material_cache = MaterialCache::new();
        let entities = vec![RenderableEntity {
            entity_id: None,
            transform: Mat4::IDENTITY,
            mesh_id: "cube".to_string(),
            material_id: None,
            texture_override: None,
        }];

        let instances = InstanceBuilder::build_instances(&entities, &material_cache);
        assert_eq!(instances.len(), 1);
    }

    #[test]
    fn test_build_instances_with_custom_material() {
        let mut material_cache = MaterialCache::new();
        let mut material = Material::default();
        material.id = "custom".to_string();
        material.metalness = 0.8;
        material.roughness = 0.2;
        material_cache.insert(material);

        let entities = vec![RenderableEntity {
            entity_id: None,
            transform: Mat4::IDENTITY,
            mesh_id: "sphere".to_string(),
            material_id: Some("custom".to_string()),
            texture_override: None,
        }];

        let instances = InstanceBuilder::build_instances(&entities, &material_cache);
        assert_eq!(instances.len(), 1);
    }

    #[test]
    fn test_build_instances_multiple_entities() {
        let material_cache = MaterialCache::new();
        let entities = vec![
            RenderableEntity {
                entity_id: None,
                transform: Mat4::from_translation(glam::Vec3::new(0.0, 0.0, 0.0)),
                mesh_id: "cube".to_string(),
                material_id: None,
                texture_override: None,
            },
            RenderableEntity {
                entity_id: None,
                transform: Mat4::from_translation(glam::Vec3::new(1.0, 0.0, 0.0)),
                mesh_id: "sphere".to_string(),
                material_id: None,
                texture_override: None,
            },
        ];

        let instances = InstanceBuilder::build_instances(&entities, &material_cache);
        assert_eq!(instances.len(), 2);
    }
}
