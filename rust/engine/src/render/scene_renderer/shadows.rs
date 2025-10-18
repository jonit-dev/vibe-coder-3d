//! Shadow uniform computation - calculates scene bounds and shadow matrices.
//!
//! This module encapsulates shadow-related calculations for directional and spot lights.

use super::super::pipeline::ShadowUniform;
use super::super::scene_renderer::RenderableEntity;
use super::super::shadows::calculate_directional_light_matrix;
use glam::{Mat4, Vec3};

/// Shadow uniform builder
pub struct ShadowBinder;

impl ShadowBinder {
    /// Compute scene bounding sphere from entities (pure function)
    pub fn compute_scene_bounds(entities: &[RenderableEntity]) -> (Vec3, f32) {
        if entities.is_empty() {
            return (Vec3::ZERO, 10.0);
        }

        let mut min_v = Vec3::splat(f32::INFINITY);
        let mut max_v = Vec3::splat(f32::NEG_INFINITY);
        for e in entities {
            let p = e.transform.w_axis.truncate();
            min_v = min_v.min(p);
            max_v = max_v.max(p);
        }
        let center = (min_v + max_v) * 0.5;
        let radius = (max_v - center).length().max(5.0);
        (center, radius)
    }

    /// Update shadow uniform for directional light (pure function)
    pub fn update_directional(
        light_direction: Vec3,
        scene_center: Vec3,
        scene_radius: f32,
        enabled: bool,
        bias: f32,
        radius: f32,
    ) -> ShadowUniform {
        let vp = calculate_directional_light_matrix(light_direction, scene_center, scene_radius);
        let mut shadow_uniform = ShadowUniform::new();
        shadow_uniform.update_directional(vp, enabled, bias, radius);
        shadow_uniform
    }

    /// Update shadow uniform for spot light (pure function)
    pub fn update_spot(vp_matrix: Mat4, enabled: bool) -> ShadowUniform {
        let mut shadow_uniform = ShadowUniform::new();
        shadow_uniform.update_spot(vp_matrix, enabled);
        shadow_uniform
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use glam::Mat4;

    #[test]
    fn test_compute_scene_bounds_empty() {
        let entities = vec![];
        let (center, radius) = ShadowBinder::compute_scene_bounds(&entities);

        assert_eq!(center, Vec3::ZERO);
        assert_eq!(radius, 10.0, "Empty scene should return default radius");
    }

    #[test]
    fn test_compute_scene_bounds_single_entity() {
        let entities = vec![RenderableEntity {
            entity_id: None,
            transform: Mat4::from_translation(Vec3::new(1.0, 2.0, 3.0)),
            mesh_id: "cube".to_string(),
            material_id: None,
            texture_override: None,
            cast_shadows: true,
            receive_shadows: true,
        }];

        let (center, radius) = ShadowBinder::compute_scene_bounds(&entities);

        assert_eq!(center, Vec3::new(1.0, 2.0, 3.0));
        assert_eq!(radius, 5.0, "Single point should return minimum radius");
    }

    #[test]
    fn test_compute_scene_bounds_multiple_entities() {
        let entities = vec![
            RenderableEntity {
                entity_id: None,
                transform: Mat4::from_translation(Vec3::new(0.0, 0.0, 0.0)),
                mesh_id: "cube".to_string(),
                material_id: None,
                texture_override: None,
                cast_shadows: true,
                receive_shadows: true,
            },
            RenderableEntity {
                entity_id: None,
                transform: Mat4::from_translation(Vec3::new(10.0, 0.0, 0.0)),
                mesh_id: "sphere".to_string(),
                material_id: None,
                texture_override: None,
                cast_shadows: true,
                receive_shadows: true,
            },
        ];

        let (center, radius) = ShadowBinder::compute_scene_bounds(&entities);

        assert_eq!(center, Vec3::new(5.0, 0.0, 0.0));
        assert!(radius >= 5.0, "Radius should cover all entities");
    }

    #[test]
    fn test_update_directional_disabled() {
        let shadow_uniform = ShadowBinder::update_directional(
            Vec3::new(0.0, -1.0, 0.0),
            Vec3::ZERO,
            10.0,
            false, // disabled
            0.001,
            2.0,
        );

        assert_eq!(
            shadow_uniform.dir_shadow_enabled, 0.0,
            "Shadow should be disabled"
        );
    }

    #[test]
    fn test_update_directional_enabled() {
        let shadow_uniform = ShadowBinder::update_directional(
            Vec3::new(0.0, -1.0, 0.0),
            Vec3::ZERO,
            10.0,
            true, // enabled
            0.001,
            2.0,
        );

        assert_eq!(shadow_uniform.dir_shadow_enabled, 1.0, "Shadow should be enabled");
        assert_eq!(shadow_uniform.shadow_bias, 0.001);
        assert_eq!(shadow_uniform.shadow_radius, 2.0);
    }

    #[test]
    fn test_update_spot() {
        let vp = Mat4::IDENTITY;
        let shadow_uniform = ShadowBinder::update_spot(vp, true);

        assert_eq!(shadow_uniform.spot_shadow_enabled, 1.0);
    }
}
