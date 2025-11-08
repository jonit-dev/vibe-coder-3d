//! Character Controller System
//!
//! Processes character movement, jumping, ground detection, and physics integration

use super::component::{CharacterControllerComponent, CharacterControllerConfig};
use super::queries::{calculate_slide_vector, compute_ground};
use crate::world::PhysicsWorld;
use rapier3d::prelude::*;
use std::collections::HashMap;
use vibe_scene::EntityId;

/// Coyote time in milliseconds - grace period for jumping after leaving ground
const COYOTE_TIME_MS: u64 = 150;

/// Character Controller System
/// Handles frame-by-frame updates for all character controllers
pub struct CharacterControllerSystem {
    /// Map of entity IDs to their character controller components
    controllers: HashMap<EntityId, CharacterControllerComponent>,

    /// Current time in milliseconds (for coyote time)
    current_time_ms: u64,

    /// Delta time accumulator for sub-stepping
    delta_accumulator: f32,
}

impl CharacterControllerSystem {
    /// Create a new character controller system
    pub fn new() -> Self {
        Self {
            controllers: HashMap::new(),
            current_time_ms: 0,
            delta_accumulator: 0.0,
        }
    }

    /// Add a character controller component
    pub fn add_controller(&mut self, controller: CharacterControllerComponent) {
        self.controllers.insert(controller.entity_id, controller);
    }

    /// Remove a character controller component
    pub fn remove_controller(&mut self, entity_id: EntityId) {
        self.controllers.remove(&entity_id);
    }

    /// Get a controller component (immutable)
    pub fn get_controller(&self, entity_id: EntityId) -> Option<&CharacterControllerComponent> {
        self.controllers.get(&entity_id)
    }

    /// Get a controller component (mutable)
    pub fn get_controller_mut(
        &mut self,
        entity_id: EntityId,
    ) -> Option<&mut CharacterControllerComponent> {
        self.controllers.get_mut(&entity_id)
    }

    /// Update all character controllers
    ///
    /// # Arguments
    /// * `physics_world` - Physics world containing rigid bodies and colliders
    /// * `delta_seconds` - Time step in seconds
    pub fn update(&mut self, physics_world: &mut PhysicsWorld, delta_seconds: f32) {
        // Update time tracking
        self.current_time_ms += (delta_seconds * 1000.0) as u64;
        self.delta_accumulator += delta_seconds;

        // Fixed timestep for controller updates (optional, can be configurable)
        let fixed_dt = 1.0 / 60.0; // 60 Hz

        while self.delta_accumulator >= fixed_dt {
            self.update_controllers_fixed(physics_world, fixed_dt);
            self.delta_accumulator -= fixed_dt;
        }
    }

    /// Fixed timestep update for all controllers
    fn update_controllers_fixed(&mut self, physics_world: &mut PhysicsWorld, delta_seconds: f32) {
        // Clone entity IDs to avoid borrow checker issues
        let entity_ids: Vec<EntityId> = self.controllers.keys().copied().collect();

        for entity_id in entity_ids {
            self.update_single_controller(entity_id, physics_world, delta_seconds);
        }
    }

    /// Update a single character controller
    fn update_single_controller(
        &mut self,
        entity_id: EntityId,
        physics_world: &mut PhysicsWorld,
        delta_seconds: f32,
    ) {
        // Ensure physics handles are resolved from the world if missing
        {
            if let Some(controller) = self.controllers.get_mut(&entity_id) {
                if controller.state.body_handle.is_none() {
                    if let Some(body) = physics_world.entity_to_body.get(&entity_id).copied() {
                        controller.state.body_handle = Some(body);
                    }
                }
                if controller.state.collider_handle.is_none() {
                    if let Some(list) = physics_world.entity_to_colliders.get(&entity_id) {
                        if let Some(&collider) = list.first() {
                            controller.state.collider_handle = Some(collider);
                        }
                    }
                }
            }
        }

        // Get controller config and state (avoid holding mutable borrow)
        let (config, state_data) = {
            let controller = match self.controllers.get(&entity_id) {
                Some(c) if c.config.enabled => c,
                _ => return,
            };

            (
                controller.config.clone(),
                (
                    controller.state.body_handle,
                    controller.state.collider_handle,
                    controller.state.desired_input_xz,
                    controller.state.pending_jump,
                    controller.state.velocity,
                ),
            )
        };

        let (body_handle, collider_handle, input, pending_jump, current_velocity) = state_data;

        // Get physics handles
        let (body_handle, collider_handle) = match (body_handle, collider_handle) {
            (Some(b), Some(c)) => (b, c),
            _ => {
                log::warn!(
                    "Character controller for entity {:?} missing physics handles",
                    entity_id
                );
                return;
            }
        };

        // Get rigid body and collider
        let position = match physics_world.rigid_bodies.get(body_handle) {
            Some(b) => *b.position(),
            None => return,
        };

        let collider = match physics_world.colliders.get(collider_handle) {
            Some(c) => c,
            None => return,
        };

        // Verify collider type (capsule or sphere required)
        let _capsule_radius = match collider.shape().as_capsule() {
            Some(capsule) => capsule.radius,
            None => {
                // Try sphere as fallback
                match collider.shape().as_ball() {
                    Some(ball) => ball.radius,
                    None => {
                        log::warn!(
                            "Character controller requires a capsule or sphere collider, got {:?}",
                            collider.shape().shape_type()
                        );
                        return;
                    }
                }
            }
        };

        // 1. Ground detection
        let ground_hit = compute_ground(
            &physics_world.colliders,
            &position,
            collider_handle,
            config.skin_width,
            config.slope_limit_deg.to_radians(),
        );

        // Calculate vertical extents of the character from collider to help clamping
        let mut bottom_offset = 0.5f32;
        let mut top_offset = 0.5f32;
        if let Some(self_collider) = physics_world.colliders.get(collider_handle) {
            let shape = self_collider.shape();
            if let Some(capsule) = shape.as_capsule() {
                let seg = capsule.segment;
                let half_segment = (seg.b - seg.a).norm() * 0.5;
                bottom_offset = half_segment + capsule.radius;
                top_offset = bottom_offset;
            } else if let Some(ball) = shape.as_ball() {
                bottom_offset = ball.radius;
                top_offset = ball.radius;
            }
        }

        // Update controller state
        let controller = self.controllers.get_mut(&entity_id).unwrap();
        let was_grounded = controller.state.is_grounded;
        controller.state.is_grounded = ground_hit.is_grounded;
        controller.state.ground_normal = ground_hit.normal.into();

        if controller.state.is_grounded {
            controller.state.last_grounded_time_ms = self.current_time_ms;
        }

        // 2. Process jump input
        let mut new_velocity = current_velocity;
        if pending_jump && controller.can_jump(self.current_time_ms, COYOTE_TIME_MS) {
            // Apply jump velocity
            new_velocity.y = config.jump_strength;
            controller.state.is_grounded = false;
            controller.state.pending_jump = false;

            log::debug!("Character {:?} jumped", entity_id);
        } else {
            controller.state.pending_jump = false;
        }

        // 3. Process horizontal movement
        let input_vector = Vector::new(input[0], 0.0, input[1]);

        let mut horizontal_velocity = if controller.state.is_grounded {
            // On ground: project input onto ground plane and apply max speed
            let ground_normal = Vector::from(controller.state.ground_normal);
            let projected_input = calculate_slide_vector(&input_vector, &ground_normal);
            let mag = projected_input.magnitude();
            if mag > 0.001 {
                projected_input.normalize() * config.max_speed
            } else {
                Vector::zeros()
            }
        } else {
            // In air: maintain some air control
            let air_control_factor = 0.3;
            let mag = input_vector.magnitude();
            let desired = if mag > 0.001 {
                input_vector.normalize() * config.max_speed
            } else {
                Vector::zeros()
            };
            let current_horizontal = Vector::new(new_velocity.x, 0.0, new_velocity.z);
            current_horizontal + (desired - current_horizontal) * air_control_factor * delta_seconds
        };

        // Cap to max speed
        let horizontal_speed = horizontal_velocity.magnitude();
        if horizontal_speed > config.max_speed {
            horizontal_velocity = horizontal_velocity.normalize() * config.max_speed;
        }

        // 4. Apply gravity if not grounded
        let mut vertical_velocity = new_velocity.y;
        if !controller.state.is_grounded {
            let gravity = physics_world.gravity().y * config.gravity_scale;
            vertical_velocity += gravity * delta_seconds;
        } else if !was_grounded {
            // Just became grounded, snap to ground
            let correction = ground_hit.distance.max(0.0);
            // Clamp snap speed to avoid aggressive "drowning" into floors
            let max_snap_speed = (config.skin_width / delta_seconds.max(0.001)).min(10.0);
            vertical_velocity = -(correction / delta_seconds.max(0.001)).clamp(0.0, max_snap_speed);
        } else {
            // Already grounded, cancel vertical velocity
            vertical_velocity = 0.0;
        }

        // 5. Combine horizontal and vertical velocity
        new_velocity = Vector::new(
            horizontal_velocity.x,
            vertical_velocity,
            horizontal_velocity.z,
        );

        // Update controller state
        controller.state.velocity = new_velocity;

        // 6. Calculate desired displacement
        let displacement = new_velocity * delta_seconds;
        let mut dx = displacement.x;
        let mut dy = displacement.y;
        let mut dz = displacement.z;

        // 6.a Ceiling clamp: prevent moving into ceilings when going up
        if dy > 0.0 {
            let ray_len = dy.abs() + config.skin_width;
            if ray_len > 0.0 {
                let dir = Vector::new(0.0, 1.0, 0.0);
                let origins_y = [
                    0.0,                            // center
                    top_offset * 0.45_f32,          // near top
                ];
                let mut min_toi = ray_len;
                for oy in origins_y {
                    let ray_origin = Point::new(
                        position.translation.x,
                        position.translation.y + oy,
                        position.translation.z,
                    );
                    let ray = Ray::new(ray_origin, dir);
                    for (handle, other) in physics_world.colliders.iter() {
                        if handle == collider_handle || other.is_sensor() {
                            continue;
                        }
                        if let Some(toi) = other.shape().cast_ray(other.position(), &ray, ray_len, true) {
                            if toi < min_toi {
                                min_toi = toi;
                            }
                        }
                    }
                }
                if min_toi < ray_len {
                    // Clamp upward movement to avoid penetration
                    dy = (min_toi - config.skin_width).max(0.0);
                }
            }
        }

        // 6.b Horizontal clamp on X using two horizontal rays (center and near bottom)
        if dx.abs() > 0.0 {
            let ray_len = dx.abs() + config.skin_width;
            let dir = Vector::new(dx.signum(), 0.0, 0.0);
            let origins_y = [
                0.0,                             // center
                -bottom_offset * 0.45_f32,       // near bottom
            ];
            let mut min_toi = ray_len;
            for oy in origins_y {
                let ray_origin = Point::new(
                    position.translation.x,
                    position.translation.y + oy,
                    position.translation.z,
                );
                let ray = Ray::new(ray_origin, dir);
                for (handle, other) in physics_world.colliders.iter() {
                    if handle == collider_handle || other.is_sensor() {
                        continue;
                    }
                    if let Some(toi) = other.shape().cast_ray(other.position(), &ray, ray_len, true) {
                        if toi < min_toi {
                            min_toi = toi;
                        }
                    }
                }
            }
            if min_toi < ray_len {
                let allowed = (min_toi - config.skin_width).max(0.0);
                dx = allowed * dx.signum();
            }
        }

        // 6.c Horizontal clamp on Z
        if dz.abs() > 0.0 {
            let ray_len = dz.abs() + config.skin_width;
            let dir = Vector::new(0.0, 0.0, dz.signum());
            let origins_y = [
                0.0,                             // center
                -bottom_offset * 0.45_f32,       // near bottom
            ];
            let mut min_toi = ray_len;
            for oy in origins_y {
                let ray_origin = Point::new(
                    position.translation.x,
                    position.translation.y + oy,
                    position.translation.z,
                );
                let ray = Ray::new(ray_origin, dir);
                for (handle, other) in physics_world.colliders.iter() {
                    if handle == collider_handle || other.is_sensor() {
                        continue;
                    }
                    if let Some(toi) = other.shape().cast_ray(other.position(), &ray, ray_len, true) {
                        if toi < min_toi {
                            min_toi = toi;
                        }
                    }
                }
            }
            if min_toi < ray_len {
                let allowed = (min_toi - config.skin_width).max(0.0);
                dz = allowed * dz.signum();
            }
        }

        // 6.d Compose final position from clamped displacements
        let mut final_position = position;
        final_position.translation.vector.x += dx;
        final_position.translation.vector.y += dy;
        final_position.translation.vector.z += dz;

        // 6.e Ground snap: ensure we don't sink into the floor when grounded
        if controller.state.is_grounded {
            let desired_min_y = ground_hit.hit_point.y + bottom_offset + (config.skin_width * 0.25);
            if final_position.translation.y < desired_min_y {
                final_position.translation.y = desired_min_y;
                // Cancel residual downward velocity when snapped
                controller.state.velocity.y = 0.0;
            }
        }

        // 7. Update rigid body position
        if let Some(body) = physics_world.rigid_bodies.get_mut(body_handle) {
            body.set_position(final_position, true);
            body.set_linvel(new_velocity, true);
        }
    }

    /// Get all controller entity IDs
    pub fn get_all_entity_ids(&self) -> Vec<EntityId> {
        self.controllers.keys().copied().collect()
    }

    /// Clear all controllers
    pub fn clear(&mut self) {
        self.controllers.clear();
    }
}

impl Default for CharacterControllerSystem {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_system_creation() {
        let system = CharacterControllerSystem::new();
        assert_eq!(system.controllers.len(), 0);
        assert_eq!(system.current_time_ms, 0);
    }

    #[test]
    fn test_add_remove_controller() {
        let mut system = CharacterControllerSystem::new();
        let entity_id = EntityId::new(1);
        let config = CharacterControllerConfig::default();
        let controller = CharacterControllerComponent::new(entity_id, config);

        system.add_controller(controller);
        assert_eq!(system.controllers.len(), 1);
        assert!(system.get_controller(entity_id).is_some());

        system.remove_controller(entity_id);
        assert_eq!(system.controllers.len(), 0);
        assert!(system.get_controller(entity_id).is_none());
    }
}
