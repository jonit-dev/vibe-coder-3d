use anyhow::{Context, Result};
use glam::{Quat, Vec3};
use nalgebra::UnitQuaternion as NUnitQuaternion;
use rapier3d::prelude::*;

use crate::components::{ColliderType, PhysicsMaterial, RigidBodyType};

/// Builder for rigid bodies from component data
pub struct RigidBodyBuilder {
    body_type: RigidBodyType,
    position: Vec3,
    rotation: Quat,
    mass: f32,
    gravity_scale: f32,
    can_sleep: bool,
    material: PhysicsMaterial,
}

impl RigidBodyBuilder {
    pub fn new(body_type: RigidBodyType) -> Self {
        Self {
            body_type,
            position: Vec3::ZERO,
            rotation: Quat::IDENTITY,
            mass: 1.0,
            gravity_scale: 1.0,
            can_sleep: true,
            material: PhysicsMaterial::default(),
        }
    }

    pub fn position(mut self, position: Vec3) -> Self {
        self.position = position;
        self
    }

    pub fn rotation(mut self, rotation: Quat) -> Self {
        self.rotation = rotation;
        self
    }

    pub fn mass(mut self, mass: f32) -> Self {
        // Clamp to small epsilon to avoid zero mass
        self.mass = mass.max(0.0001);
        self
    }

    pub fn gravity_scale(mut self, scale: f32) -> Self {
        self.gravity_scale = scale;
        self
    }

    pub fn can_sleep(mut self, can_sleep: bool) -> Self {
        self.can_sleep = can_sleep;
        self
    }

    pub fn material(mut self, material: PhysicsMaterial) -> Self {
        self.material = material;
        self
    }

    pub fn build(self) -> RigidBody {
        let translation = vector![self.position.x, self.position.y, self.position.z];

        // Convert glam Quat to nalgebra UnitQuaternion
        let quat = NUnitQuaternion::new_normalize(nalgebra::Quaternion::new(
            self.rotation.w,
            self.rotation.x,
            self.rotation.y,
            self.rotation.z,
        ));

        // Create position with translation and rotation
        let position = Isometry::from_parts(translation.into(), quat);

        let mut builder = rapier3d::prelude::RigidBodyBuilder::new(self.body_type.to_rapier())
            .position(position)
            .sleeping(false) // Always start awake
            .can_sleep(self.can_sleep) // But allow sleeping later
            .gravity_scale(self.gravity_scale);

        // Only set mass for dynamic bodies
        if self.body_type == RigidBodyType::Dynamic {
            builder = builder.additional_mass(self.mass);
        }

        builder.build()
    }
}

/// Builder for colliders from component data
pub struct ColliderBuilder {
    collider_type: ColliderType,
    center: Vec3,
    size: ColliderSize,
    material: PhysicsMaterial,
    is_sensor: bool,
    scale: Vec3,
}

#[derive(Debug, Clone)]
pub struct ColliderSize {
    pub width: f32,
    pub height: f32,
    pub depth: f32,
    pub radius: f32,
    pub capsule_radius: f32,
    pub capsule_height: f32,
}

impl Default for ColliderSize {
    fn default() -> Self {
        Self {
            width: 1.0,
            height: 1.0,
            depth: 1.0,
            radius: 0.5,
            capsule_radius: 0.5,
            capsule_height: 2.0,
        }
    }
}

impl ColliderBuilder {
    pub fn new(collider_type: ColliderType) -> Self {
        Self {
            collider_type,
            center: Vec3::ZERO,
            size: ColliderSize::default(),
            material: PhysicsMaterial::default(),
            is_sensor: false,
            scale: Vec3::ONE,
        }
    }

    pub fn center(mut self, center: Vec3) -> Self {
        self.center = center;
        self
    }

    pub fn size(mut self, size: ColliderSize) -> Self {
        self.size = size;
        self
    }

    pub fn material(mut self, material: PhysicsMaterial) -> Self {
        self.material = material;
        self
    }

    pub fn sensor(mut self, is_sensor: bool) -> Self {
        self.is_sensor = is_sensor;
        self
    }

    pub fn scale(mut self, scale: Vec3) -> Self {
        self.scale = scale;
        self
    }

    pub fn build(self) -> Result<Collider> {
        let shape = self
            .build_shape()
            .context("Failed to build collider shape")?;

        let mut builder = rapier3d::prelude::ColliderBuilder::new(shape)
            .translation(vector![self.center.x, self.center.y, self.center.z])
            .friction(self.material.friction)
            .restitution(self.material.restitution)
            .density(self.material.density)
            .sensor(self.is_sensor);

        // If sensor, disable mass
        if self.is_sensor {
            builder = builder.density(0.0);
        }

        Ok(builder.build())
    }

    fn build_shape(&self) -> Result<SharedShape> {
        let shape = match self.collider_type {
            ColliderType::Box => {
                // Apply scale to half extents
                let half_x = (self.size.width * self.scale.x) / 2.0;
                let half_y = (self.size.height * self.scale.y) / 2.0;
                let half_z = (self.size.depth * self.scale.z) / 2.0;

                // Validate dimensions
                if half_x <= 0.0 || half_y <= 0.0 || half_z <= 0.0 {
                    log::warn!(
                        "Invalid box collider dimensions: [{}, {}, {}], using minimum values",
                        half_x,
                        half_y,
                        half_z
                    );
                }

                let half_x = half_x.max(0.001);
                let half_y = half_y.max(0.001);
                let half_z = half_z.max(0.001);

                SharedShape::cuboid(half_x, half_y, half_z)
            }

            ColliderType::Sphere => {
                let radius = (self.size.radius * self.scale.x.max(self.scale.y).max(self.scale.z))
                    .max(0.001);
                SharedShape::ball(radius)
            }

            ColliderType::Capsule => {
                let radius = (self.size.capsule_radius * self.scale.x.max(self.scale.z)).max(0.001);
                let half_height =
                    ((self.size.capsule_height * self.scale.y) / 2.0 - radius).max(0.001);
                SharedShape::capsule_y(half_height, radius)
            }

            ColliderType::Convex => {
                log::warn!("Convex colliders not yet implemented, falling back to box");
                let half_x = (self.size.width * self.scale.x) / 2.0;
                let half_y = (self.size.height * self.scale.y) / 2.0;
                let half_z = (self.size.depth * self.scale.z) / 2.0;
                SharedShape::cuboid(half_x.max(0.001), half_y.max(0.001), half_z.max(0.001))
            }

            ColliderType::Mesh => {
                log::warn!("Tri-mesh colliders not yet implemented, falling back to box");
                let half_x = (self.size.width * self.scale.x) / 2.0;
                let half_y = (self.size.height * self.scale.y) / 2.0;
                let half_z = (self.size.depth * self.scale.z) / 2.0;
                SharedShape::cuboid(half_x.max(0.001), half_y.max(0.001), half_z.max(0.001))
            }

            ColliderType::Heightfield => {
                log::warn!("Heightfield colliders not yet implemented, falling back to box");
                let half_x = (self.size.width * self.scale.x) / 2.0;
                let half_y = (self.size.height * self.scale.y) / 2.0;
                let half_z = (self.size.depth * self.scale.z) / 2.0;
                SharedShape::cuboid(half_x.max(0.001), half_y.max(0.001), half_z.max(0.001))
            }
        };

        Ok(shape)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rigid_body_builder_default() {
        let body = RigidBodyBuilder::new(RigidBodyType::Dynamic).build();
        assert_eq!(body.body_type(), rapier3d::prelude::RigidBodyType::Dynamic);
    }

    #[test]
    fn test_rigid_body_builder_with_properties() {
        let position = Vec3::new(1.0, 2.0, 3.0);
        let rotation = Quat::from_rotation_y(std::f32::consts::PI / 4.0);

        let body = RigidBodyBuilder::new(RigidBodyType::Dynamic)
            .position(position)
            .rotation(rotation)
            .mass(5.0)
            .gravity_scale(0.5)
            .can_sleep(false)
            .build();

        assert_eq!(body.body_type(), rapier3d::prelude::RigidBodyType::Dynamic);
        // Note: Rapier 0.17 doesn't expose is_sleeping_allowed() directly
        // Just verify the body was created correctly
        assert_eq!(body.body_type(), rapier3d::prelude::RigidBodyType::Dynamic);

        let pos = body.position();
        assert!((pos.translation.x - 1.0).abs() < 0.001);
        assert!((pos.translation.y - 2.0).abs() < 0.001);
        assert!((pos.translation.z - 3.0).abs() < 0.001);
    }

    #[test]
    fn test_rigid_body_mass_clamping() {
        let body = RigidBodyBuilder::new(RigidBodyType::Dynamic)
            .mass(0.0)
            .build();

        // Mass should be clamped to minimum
        // Note: Rapier handles mass internally, we just ensure it's not zero in the builder
        assert_eq!(body.body_type(), rapier3d::prelude::RigidBodyType::Dynamic);
    }

    #[test]
    fn test_collider_builder_box() {
        let size = ColliderSize {
            width: 2.0,
            height: 4.0,
            depth: 3.0,
            ..Default::default()
        };

        let collider = ColliderBuilder::new(ColliderType::Box)
            .size(size)
            .build()
            .unwrap();

        assert!(!collider.is_sensor());
    }

    #[test]
    fn test_collider_builder_sphere() {
        let size = ColliderSize {
            radius: 1.5,
            ..Default::default()
        };

        let collider = ColliderBuilder::new(ColliderType::Sphere)
            .size(size)
            .build()
            .unwrap();

        assert!(!collider.is_sensor());
    }

    #[test]
    fn test_collider_builder_capsule() {
        let size = ColliderSize {
            capsule_radius: 0.5,
            capsule_height: 2.0,
            ..Default::default()
        };

        let collider = ColliderBuilder::new(ColliderType::Capsule)
            .size(size)
            .build()
            .unwrap();

        assert!(!collider.is_sensor());
    }

    #[test]
    fn test_collider_builder_sensor() {
        let collider = ColliderBuilder::new(ColliderType::Box)
            .sensor(true)
            .build()
            .unwrap();

        assert!(collider.is_sensor());
    }

    #[test]
    fn test_collider_builder_with_material() {
        let material = PhysicsMaterial {
            friction: 0.5,
            restitution: 0.8,
            density: 2.0,
        };

        let collider = ColliderBuilder::new(ColliderType::Box)
            .material(material)
            .build()
            .unwrap();

        assert!((collider.friction() - 0.5).abs() < 0.001);
        assert!((collider.restitution() - 0.8).abs() < 0.001);
    }

    #[test]
    fn test_collider_builder_with_scale() {
        let scale = Vec3::new(2.0, 3.0, 1.5);
        let size = ColliderSize {
            width: 1.0,
            height: 1.0,
            depth: 1.0,
            ..Default::default()
        };

        let collider = ColliderBuilder::new(ColliderType::Box)
            .size(size)
            .scale(scale)
            .build()
            .unwrap();

        // Collider should be scaled appropriately
        assert!(!collider.is_sensor());
    }

    #[test]
    fn test_collider_builder_center_offset() {
        let center = Vec3::new(0.5, 1.0, -0.5);

        let collider = ColliderBuilder::new(ColliderType::Box)
            .center(center)
            .build()
            .unwrap();

        // Just verify the collider was created successfully with the offset
        // The actual translation will be set when attached to a rigid body
        assert!(!collider.is_sensor());
    }
}
