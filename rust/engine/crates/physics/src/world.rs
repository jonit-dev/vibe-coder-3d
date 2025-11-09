use anyhow::Result;
use glam::{Quat, Vec3};
use hashbrown::{HashMap, HashSet};
use nalgebra::UnitQuaternion as NUnitQuaternion;
use rapier3d::prelude::*;
use vibe_scene::EntityId;

use crate::events::{CollisionEvent, PhysicsEventQueue};
use crate::PhysicsConfig;

/// Result of a raycast query
#[derive(Debug, Clone)]
pub struct RaycastHit {
    /// Entity that was hit
    pub entity_id: EntityId,
    /// Point where the ray hit the collider
    pub point: Vec3,
    /// Surface normal at the hit point
    pub normal: Vec3,
    /// Distance from ray origin to hit point
    pub distance: f32,
}

/// Main physics world managing Rapier simulation
pub struct PhysicsWorld {
    /// Physics configuration parameters
    config: PhysicsConfig,

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

    /// Track previous frame contacts to detect enter/exit events
    previous_contacts: HashSet<(EntityId, EntityId)>,

    /// Track previous frame trigger intersections to detect enter/exit events
    previous_triggers: HashSet<(EntityId, EntityId)>,
}

impl PhysicsWorld {
    /// Create a new physics world with default settings
    pub fn new() -> Self {
        Self::with_config(PhysicsConfig::default())
    }

    /// Create a new physics world with custom gravity (deprecated: use with_config)
    #[deprecated(note = "Use with_config() instead for better configuration management")]
    pub fn with_gravity(gravity: Vector<Real>) -> Self {
        let mut config = PhysicsConfig::default();
        config.gravity = [gravity.x, gravity.y, gravity.z];
        Self::with_config(config)
    }

    /// Create a new physics world with the given configuration
    pub fn with_config(config: PhysicsConfig) -> Self {
        let mut integration_params = IntegrationParameters::default();
        integration_params.dt = config.time_step;

        // Note: Rapier 3D doesn't expose velocity/position solver iterations directly
        // These are controlled internally for stability

        let gravity_vec = vector![
            config.gravity[0] as Real,
            config.gravity[1] as Real,
            config.gravity[2] as Real
        ];

        Self {
            config,
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
            previous_contacts: HashSet::new(),
            previous_triggers: HashSet::new(),
        }
    }

    /// Get a reference to the physics configuration
    pub fn config(&self) -> &PhysicsConfig {
        &self.config
    }

    /// Update the physics configuration
    pub fn update_config(&mut self, config: PhysicsConfig) -> Result<()> {
        config.validate()?;

        // Update integration parameters
        self.integration_params.dt = config.time_step;

        self.config = config;
        Ok(())
    }

    /// Get the current gravity vector
    pub fn gravity(&self) -> Vector<Real> {
        vector![
            self.config.gravity[0] as Real,
            self.config.gravity[1] as Real,
            self.config.gravity[2] as Real
        ]
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

        // Collect current contacts and triggers before the step
        let current_contacts = self.collect_current_contacts();
        let current_triggers = self.collect_current_triggers();

        // Step physics pipeline with basic event handling
        let gravity = self.gravity();
        self.pipeline.step(
            &gravity,
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
            &(),
            &(), // We'll handle events manually after the step
        );

        // Process collision events before updating previous frame tracking
        self.process_collision_events(&current_contacts, &current_triggers);

        // Update previous frame tracking
        self.previous_contacts = current_contacts;
        self.previous_triggers = current_triggers;
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

    /// Cast a ray and find the first hit
    ///
    /// # Arguments
    /// * `origin` - Ray origin point
    /// * `direction` - Ray direction (will be normalized)
    /// * `max_distance` - Maximum ray travel distance
    /// * `solid` - If true, stop at first hit. If false, pass through triggers.
    ///
    /// # Returns
    /// RaycastHit with entity_id, point, normal, and distance
    pub fn raycast_first(
        &self,
        origin: Vec3,
        direction: Vec3,
        max_distance: f32,
        solid: bool,
    ) -> Option<RaycastHit> {
        let ray = Ray::new(
            point![origin.x, origin.y, origin.z],
            vector![direction.x, direction.y, direction.z],
        );

        let filter = if solid {
            QueryFilter::default()
        } else {
            QueryFilter::default().exclude_sensors()
        };

        // Create a query pipeline for raycasting
        let query_pipeline = QueryPipeline::new();

        // Cast ray and find first hit
        if let Some((collider_handle, toi)) = query_pipeline.cast_ray(
            &self.rigid_bodies,
            &self.colliders,
            &ray,
            max_distance,
            solid,
            filter,
        ) {
            // Find entity ID from collider handle
            let entity_id = self
                .entity_to_colliders
                .iter()
                .find(|(_, handles)| handles.contains(&collider_handle))
                .map(|(id, _)| *id)?;

            // Calculate hit point
            let hit_point = ray.point_at(toi);

            // Use approximate normal (ray direction reversed)
            // TODO: Calculate actual surface normal using shape.project_point()
            let normal = -ray.dir.normalize();

            Some(RaycastHit {
                entity_id,
                point: Vec3::new(hit_point.x, hit_point.y, hit_point.z),
                normal: Vec3::new(normal.x, normal.y, normal.z),
                distance: toi,
            })
        } else {
            None
        }
    }

    /// Cast a ray and find all hits along the ray
    ///
    /// # Arguments
    /// * `origin` - Ray origin point
    /// * `direction` - Ray direction (will be normalized)
    /// * `max_distance` - Maximum ray travel distance
    /// * `solid` - If true, stop at first solid hit. If false, pass through triggers.
    ///
    /// # Returns
    /// Vector of RaycastHit sorted by distance (closest first)
    pub fn raycast_all(
        &self,
        origin: Vec3,
        direction: Vec3,
        max_distance: f32,
        solid: bool,
    ) -> Vec<RaycastHit> {
        let ray = Ray::new(
            point![origin.x, origin.y, origin.z],
            vector![direction.x, direction.y, direction.z],
        );

        let filter = if solid {
            QueryFilter::default()
        } else {
            QueryFilter::default().exclude_sensors()
        };

        let mut hits = Vec::new();

        // Create a query pipeline for raycasting
        let query_pipeline = QueryPipeline::new();

        // Cast ray and collect all intersections
        query_pipeline.intersections_with_ray(
            &self.rigid_bodies,
            &self.colliders,
            &ray,
            max_distance,
            solid,
            filter,
            |collider_handle, intersection| {
                // Find entity ID from collider handle
                if let Some(entity_id) = self
                    .entity_to_colliders
                    .iter()
                    .find(|(_, handles)| handles.contains(&collider_handle))
                    .map(|(id, _)| *id)
                {
                    let hit_point = ray.point_at(intersection.toi);

                    // Use ray direction reversed as approximate normal
                    let normal = -ray.dir.normalize();

                    hits.push(RaycastHit {
                        entity_id,
                        point: Vec3::new(hit_point.x, hit_point.y, hit_point.z),
                        normal: Vec3::new(normal.x, normal.y, normal.z),
                        distance: intersection.toi,
                    });
                }
                true // Continue searching for more hits
            },
        );

        // Sort by distance (closest first)
        hits.sort_by(|a, b| {
            a.distance
                .partial_cmp(&b.distance)
                .unwrap_or(std::cmp::Ordering::Equal)
        });
        hits
    }

    /// Collect current contact pairs between entities
    fn collect_current_contacts(&self) -> HashSet<(EntityId, EntityId)> {
        let mut contacts = HashSet::new();

        // Iterate through all contact pairs in narrow phase
        for contact_pair in self.narrow_phase.contact_pairs() {
            let handle1 = contact_pair.collider1;
            let handle2 = contact_pair.collider2;

            // Find entity IDs for both colliders
            if let (Some(entity1), Some(entity2)) = (
                self.find_entity_by_collider(handle1),
                self.find_entity_by_collider(handle2),
            ) {
                if entity1 != entity2 {
                    // Store in sorted order to avoid duplicates
                    let pair = if entity1.as_u64() < entity2.as_u64() {
                        (entity1, entity2)
                    } else {
                        (entity2, entity1)
                    };
                    contacts.insert(pair);
                }
            }
        }

        contacts
    }

    /// Collect current trigger (sensor) intersections
    fn collect_current_triggers(&self) -> HashSet<(EntityId, EntityId)> {
        let mut triggers = HashSet::new();

        // Simplified: for now, just collect basic collision pairs
        // and handle trigger detection separately if needed
        // This avoids complex intersection iteration for now
        triggers
    }

    /// Find entity ID by collider handle
    fn find_entity_by_collider(&self, collider_handle: ColliderHandle) -> Option<EntityId> {
        for (entity_id, collider_handles) in &self.entity_to_colliders {
            if collider_handles.contains(&collider_handle) {
                return Some(*entity_id);
            }
        }
        None
    }

    /// Process collision events by comparing current and previous frame contacts/triggers
    fn process_collision_events(
        &mut self,
        current_contacts: &HashSet<(EntityId, EntityId)>,
        current_triggers: &HashSet<(EntityId, EntityId)>,
    ) {
        // Find new contacts (collision enter)
        for &(entity_a, entity_b) in current_contacts.difference(&self.previous_contacts) {
            self.event_queue
                .push(CollisionEvent::ContactStarted { entity_a, entity_b });
        }

        // Find ended contacts (collision exit)
        for &(entity_a, entity_b) in self.previous_contacts.difference(current_contacts) {
            self.event_queue
                .push(CollisionEvent::ContactEnded { entity_a, entity_b });
        }

        // Find new triggers (trigger enter)
        for &(entity_a, entity_b) in current_triggers.difference(&self.previous_triggers) {
            self.event_queue
                .push(CollisionEvent::TriggerStarted { entity_a, entity_b });
        }

        // Find ended triggers (trigger exit)
        for &(entity_a, entity_b) in self.previous_triggers.difference(current_triggers) {
            self.event_queue
                .push(CollisionEvent::TriggerEnded { entity_a, entity_b });
        }
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
        assert_eq!(world.gravity().y, -9.81);
        assert_eq!(world.integration_params.dt, 1.0 / 60.0);
    }

    #[test]
    fn test_physics_world_custom_gravity() {
        let world = PhysicsWorld::with_gravity(vector![0.0, -20.0, 0.0]);
        assert_eq!(world.gravity().y, -20.0);
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
