use anyhow::Result;
use glam::{Quat, Vec3};
use hashbrown::HashMap;
use nalgebra::UnitQuaternion as NUnitQuaternion;
use rapier3d::prelude::*;
use vibe_scene::EntityId;

use crate::events::PhysicsEventQueue;

/// Main physics world managing Rapier simulation
pub struct PhysicsWorld {
    /// Gravity vector (default: [0, -9.81, 0])
    pub gravity: Vector<Real>,

    /// Rapier physics pipeline
    pub pipeline: PhysicsPipeline,

    /// Island manager for sleeping bodies
    pub island_manager: IslandManager,

    /// Broad phase collision detection
    pub broad_phase: BroadPhase,

    /// Narrow phase collision detection
    pub narrow_phase: NarrowPhase,

    /// Set of all rigid bodies
    pub rigid_bodies: RigidBodySet,

    /// Set of all colliders
    pub colliders: ColliderSet,

    /// Impulse-based joints
    pub impulse_joints: ImpulseJointSet,

    /// Multibody joints
    pub multibody_joints: MultibodyJointSet,

    /// Continuous collision detection solver
    pub ccd_solver: CCDSolver,

    /// Integration parameters (timestep, etc.)
    pub integration_params: IntegrationParameters,

    /// Map entity IDs to rigid body handles
    pub entity_to_body: HashMap<EntityId, RigidBodyHandle>,

    /// Map entity IDs to collider handles (multiple colliders per entity supported)
    pub entity_to_colliders: HashMap<EntityId, Vec<ColliderHandle>>,

    /// Event queue for downstream consumers
    pub event_queue: PhysicsEventQueue,
}

impl PhysicsWorld {
    /// Create a new physics world with default settings
    pub fn new() -> Self {
        Self::with_gravity(vector![0.0, -9.81, 0.0])
    }

    /// Create a new physics world with custom gravity
    pub fn with_gravity(gravity: Vector<Real>) -> Self {
        let mut integration_params = IntegrationParameters::default();
        // Target 60 Hz physics simulation
        integration_params.dt = 1.0 / 60.0;

        Self {
            gravity,
            pipeline: PhysicsPipeline::new(),
            island_manager: IslandManager::new(),
            broad_phase: BroadPhase::new(),
            narrow_phase: NarrowPhase::new(),
            rigid_bodies: RigidBodySet::new(),
            colliders: ColliderSet::new(),
            impulse_joints: ImpulseJointSet::new(),
            multibody_joints: MultibodyJointSet::new(),
            ccd_solver: CCDSolver::new(),
            integration_params,
            entity_to_body: HashMap::new(),
            entity_to_colliders: HashMap::new(),
            event_queue: PhysicsEventQueue::new(),
        }
    }

    /// Add a rigid body with optional colliders for an entity
    pub fn add_entity(
        &mut self,
        entity_id: EntityId,
        rigid_body: RigidBody,
        colliders: Vec<Collider>,
    ) -> Result<()> {
        // Insert the rigid body
        let body_handle = self.rigid_bodies.insert(rigid_body);
        self.entity_to_body.insert(entity_id, body_handle);

        // Insert colliders attached to this body
        let mut collider_handles = Vec::new();
        for collider in colliders {
            let collider_handle =
                self.colliders
                    .insert_with_parent(collider, body_handle, &mut self.rigid_bodies);
            collider_handles.push(collider_handle);
        }

        let collider_count = collider_handles.len();

        if !collider_handles.is_empty() {
            self.entity_to_colliders.insert(entity_id, collider_handles);
        }

        log::debug!(
            "Added physics entity {:?} with {} colliders",
            entity_id,
            collider_count
        );

        Ok(())
    }

    /// Remove an entity from the physics world
    pub fn remove_entity(&mut self, entity_id: EntityId) -> Result<()> {
        // Remove colliders first
        if let Some(collider_handles) = self.entity_to_colliders.remove(&entity_id) {
            for handle in collider_handles {
                self.colliders.remove(
                    handle,
                    &mut self.island_manager,
                    &mut self.rigid_bodies,
                    false,
                );
            }
        }

        // Remove rigid body
        if let Some(body_handle) = self.entity_to_body.remove(&entity_id) {
            self.rigid_bodies.remove(
                body_handle,
                &mut self.island_manager,
                &mut self.colliders,
                &mut self.impulse_joints,
                &mut self.multibody_joints,
                false,
            );
        }

        log::debug!("Removed physics entity {:?}", entity_id);
        Ok(())
    }

    /// Step the physics simulation by a fixed timestep
    pub fn step(&mut self, dt: f32) {
        // Update integration parameters with current dt
        self.integration_params.dt = dt;

        // Step the physics pipeline
        self.pipeline.step(
            &self.gravity,
            &self.integration_params,
            &mut self.island_manager,
            &mut self.broad_phase,
            &mut self.narrow_phase,
            &mut self.rigid_bodies,
            &mut self.colliders,
            &mut self.impulse_joints,
            &mut self.multibody_joints,
            &mut self.ccd_solver,
            None, // query pipeline (not needed for basic sim)
            &(),  // hooks
            &(),  // events (we'll implement custom event handling later)
        );
    }

    /// Get the position and rotation of an entity's rigid body
    pub fn get_entity_transform(&self, entity_id: EntityId) -> Option<(Vec3, Quat)> {
        let body_handle = self.entity_to_body.get(&entity_id)?;
        let body = self.rigid_bodies.get(*body_handle)?;
        let isometry = body.position();

        let position = Vec3::new(
            isometry.translation.x,
            isometry.translation.y,
            isometry.translation.z,
        );

        let rotation = Quat::from_xyzw(
            isometry.rotation.i,
            isometry.rotation.j,
            isometry.rotation.k,
            isometry.rotation.w,
        );

        Some((position, rotation))
    }

    /// Set the position and rotation of an entity's rigid body
    pub fn set_entity_transform(&mut self, entity_id: EntityId, position: Vec3, rotation: Quat) {
        if let Some(body_handle) = self.entity_to_body.get(&entity_id) {
            if let Some(body) = self.rigid_bodies.get_mut(*body_handle) {
                let quat = NUnitQuaternion::new_normalize(nalgebra::Quaternion::new(
                    rotation.w, rotation.x, rotation.y, rotation.z,
                ));
                let isometry =
                    Isometry::from_parts(vector![position.x, position.y, position.z].into(), quat);
                body.set_position(isometry, true);
            }
        }
    }

    /// Get physics statistics
    pub fn stats(&self) -> PhysicsStats {
        PhysicsStats {
            rigid_body_count: self.rigid_bodies.len(),
            collider_count: self.colliders.len(),
            active_body_count: self
                .rigid_bodies
                .iter()
                .filter(|(_, body)| !body.is_sleeping())
                .count(),
            island_count: 0, // Island count is private in this version of Rapier
        }
    }

    /// Poll events (consumes the queue)
    pub fn poll_events(&mut self) -> impl Iterator<Item = crate::events::CollisionEvent> + '_ {
        self.event_queue.drain()
    }
}

impl Default for PhysicsWorld {
    fn default() -> Self {
        Self::new()
    }
}

/// Physics statistics for debugging and monitoring
#[derive(Debug, Clone)]
pub struct PhysicsStats {
    pub rigid_body_count: usize,
    pub collider_count: usize,
    pub active_body_count: usize,
    pub island_count: usize,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_physics_world_creation() {
        let world = PhysicsWorld::new();
        assert_eq!(world.gravity.y, -9.81);
        assert_eq!(world.integration_params.dt, 1.0 / 60.0);
    }

    #[test]
    fn test_physics_world_custom_gravity() {
        let world = PhysicsWorld::with_gravity(vector![0.0, -20.0, 0.0]);
        assert_eq!(world.gravity.y, -20.0);
    }

    #[test]
    fn test_add_and_remove_entity() {
        let mut world = PhysicsWorld::new();
        let entity_id = EntityId::new(1);

        // Create a simple dynamic rigid body
        let rigid_body = RigidBodyBuilder::dynamic()
            .translation(vector![0.0, 10.0, 0.0])
            .build();

        // Create a box collider
        let collider = ColliderBuilder::cuboid(1.0, 1.0, 1.0).build();

        // Add entity
        world
            .add_entity(entity_id, rigid_body, vec![collider])
            .unwrap();

        let stats = world.stats();
        assert_eq!(stats.rigid_body_count, 1);
        assert_eq!(stats.collider_count, 1);

        // Remove entity
        world.remove_entity(entity_id).unwrap();

        let stats = world.stats();
        assert_eq!(stats.rigid_body_count, 0);
        assert_eq!(stats.collider_count, 0);
    }

    #[test]
    fn test_step_simulation() {
        let mut world = PhysicsWorld::new();
        let entity_id = EntityId::new(1);

        // Create a falling body
        let rigid_body = RigidBodyBuilder::dynamic()
            .translation(vector![0.0, 10.0, 0.0])
            .build();

        let collider = ColliderBuilder::cuboid(1.0, 1.0, 1.0).build();

        world
            .add_entity(entity_id, rigid_body, vec![collider])
            .unwrap();

        // Get initial position
        let (initial_pos, _) = world.get_entity_transform(entity_id).unwrap();
        assert_eq!(initial_pos.y, 10.0);

        // Step simulation multiple times (body should fall)
        for _ in 0..60 {
            world.step(1.0 / 60.0);
        }

        // Check that body has fallen
        let (final_pos, _) = world.get_entity_transform(entity_id).unwrap();
        assert!(
            final_pos.y < initial_pos.y,
            "Body should have fallen due to gravity"
        );
    }

    #[test]
    fn test_get_set_entity_transform() {
        let mut world = PhysicsWorld::new();
        let entity_id = EntityId::new(1);

        let rigid_body = RigidBodyBuilder::dynamic().build();
        let collider = ColliderBuilder::cuboid(1.0, 1.0, 1.0).build();

        world
            .add_entity(entity_id, rigid_body, vec![collider])
            .unwrap();

        // Set transform
        let new_pos = Vec3::new(5.0, 10.0, 3.0);
        let new_rot = Quat::from_rotation_y(std::f32::consts::PI / 4.0);
        world.set_entity_transform(entity_id, new_pos, new_rot);

        // Get transform
        let (pos, rot) = world.get_entity_transform(entity_id).unwrap();
        assert!((pos - new_pos).length() < 0.001);
        assert!((rot.dot(new_rot) - 1.0).abs() < 0.001); // Quaternions should be nearly equal
    }

    #[test]
    fn test_physics_stats() {
        let mut world = PhysicsWorld::new();

        // Add multiple entities
        for i in 0..5 {
            let entity_id = EntityId::new(i);
            let rigid_body = RigidBodyBuilder::dynamic().build();
            let collider = ColliderBuilder::cuboid(1.0, 1.0, 1.0).build();
            world
                .add_entity(entity_id, rigid_body, vec![collider])
                .unwrap();
        }

        let stats = world.stats();
        assert_eq!(stats.rigid_body_count, 5);
        assert_eq!(stats.collider_count, 5);
    }
}
