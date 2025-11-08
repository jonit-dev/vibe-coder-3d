//! Character Controller Physics Queries
//!
//! Ground detection, slope validation, and collision queries using Rapier3D

use rapier3d::prelude::*;

/// Result of a ground detection query
#[derive(Debug, Clone)]
pub struct GroundHit {
    /// Whether the character is grounded
    pub is_grounded: bool,

    /// Normal vector of the ground surface
    pub normal: Vector<f32>,

    /// Distance to the ground (negative if penetrating)
    pub distance: f32,

    /// Position of the hit point
    pub hit_point: Point<f32>,

    /// Entity/collider that was hit (if any)
    pub hit_entity: Option<ColliderHandle>,
}

impl Default for GroundHit {
    fn default() -> Self {
        Self {
            is_grounded: false,
            normal: Vector::y(), // Default upward normal
            distance: f32::MAX,
            hit_point: Point::origin(),
            hit_entity: None,
        }
    }
}

/// Perform ground detection using a raycast downward
///
/// # Arguments
/// * `query_pipeline` - Rapier query pipeline for raycasts
/// * `rigid_bodies` - Set of all rigid bodies
/// * `collider_set` - Set of all colliders in the physics world
/// * `character_pos` - Current position of the character
/// * `character_collider` - Handle to the character's own collider (to exclude from query)
/// * `skin_width` - Maximum snap distance for ground detection
/// * `slope_limit_rad` - Maximum slope angle in radians
///
/// # Returns
/// GroundHit with information about the ground surface (if any)
pub fn compute_ground(
    collider_set: &ColliderSet,
    character_pos: &Isometry<f32>,
    character_collider: ColliderHandle,
    skin_width: f32,
    slope_limit_rad: f32,
) -> GroundHit {
    // Determine bottom offset from the character's collider shape when possible
    let mut bottom_offset = 0.5;
    if let Some(self_collider) = collider_set.get(character_collider) {
        let shape = self_collider.shape();
        if let Some(capsule) = shape.as_capsule() {
            let seg = capsule.segment;
            let half_segment = (seg.b - seg.a).norm() * 0.5;
            bottom_offset = half_segment + capsule.radius;
        } else if let Some(ball) = shape.as_ball() {
            bottom_offset = ball.radius;
        }
    }

    // Start ray slightly above the bottom to avoid immediate self-hits
    let origin_local = Point::new(0.0, -bottom_offset + skin_width * 0.25, 0.0);
    let ray_origin = character_pos.transform_point(&origin_local);
    let ray_dir = Vector::new(0.0, -1.0, 0.0);
    let ray = Ray::new(ray_origin, ray_dir);
    let max_cast_distance = (skin_width * 2.0).max(0.05);

    // Find the closest valid ground hit
    let mut best: Option<(ColliderHandle, f32, Vector<f32>, Point<f32>)> = None;
    for (handle, collider) in collider_set.iter() {
        if handle == character_collider || collider.is_sensor() {
            continue;
        }
        let shape = collider.shape();
        let shape_pos = collider.position();
        if let Some(toi) = shape.cast_ray(shape_pos, &ray, max_cast_distance, true) {
            let hit_point = ray.point_at(toi);
            let proj = shape.project_point(shape_pos, &hit_point, false);
            let mut normal = proj.point - hit_point;
            if normal.magnitude() > 0.0001 {
                normal = normal.normalize();
            } else {
                normal = Vector::y();
            }
            // Skip too-steep surfaces
            let slope_angle = normal.angle(&Vector::y());
            if slope_angle > slope_limit_rad {
                continue;
            }
            match best {
                Some((_, best_toi, _, _)) if toi >= best_toi => {}
                _ => best = Some((handle, toi, normal, hit_point)),
            }
        }
    }

    if let Some((handle, toi, normal, hit_point)) = best {
        let is_grounded = toi <= skin_width;
        GroundHit {
            is_grounded,
            normal,
            distance: toi,
            hit_point,
            hit_entity: Some(handle),
        }
    } else {
        GroundHit::default()
    }
}

/// Calculate slide vector along a surface to prevent sticking to walls
///
/// # Arguments
/// * `velocity` - Current movement velocity
/// * `normal` - Normal of the surface being hit
///
/// # Returns
/// Adjusted velocity that slides along the surface
pub fn calculate_slide_vector(velocity: &Vector<f32>, normal: &Vector<f32>) -> Vector<f32> {
    // Project velocity onto the plane defined by the normal
    // Formula: v' = v - (v · n) * n
    let dot = velocity.dot(normal);
    if dot < 0.0 {
        // Moving into the surface, slide along it
        velocity - normal * dot
    } else {
        // Moving away from surface, keep original velocity
        *velocity
    }
}

/// Check if a slope is too steep to walk on
///
/// # Arguments
/// * `normal` - Normal vector of the slope
/// * `slope_limit_rad` - Maximum walkable slope angle in radians
///
/// # Returns
/// `true` if the slope is too steep, `false` if it's walkable
pub fn is_slope_too_steep(normal: &Vector<f32>, slope_limit_rad: f32) -> bool {
    let angle = normal.angle(&Vector::y());
    angle > slope_limit_rad
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_slide_vector() {
        // Moving forward into a wall (normal pointing back)
        let velocity = Vector::new(1.0, 0.0, 0.0);
        let normal = Vector::new(-1.0, 0.0, 0.0);
        let slide = calculate_slide_vector(&velocity, &normal);

        // Should cancel out horizontal movement
        assert!((slide.x).abs() < 0.001);
        assert!((slide.y).abs() < 0.001);
        assert!((slide.z).abs() < 0.001);
    }

    #[test]
    fn test_slide_vector_diagonal_wall() {
        // Moving forward into a diagonal wall
        let velocity = Vector::new(1.0, 0.0, 0.0);
        let normal = Vector::new(-0.707, 0.0, 0.707).normalize();
        let slide = calculate_slide_vector(&velocity, &normal);

        // Should slide along the wall
        assert!(slide.magnitude() > 0.1);
        assert!(slide.magnitude() <= velocity.magnitude());
    }

    #[test]
    fn test_slope_too_steep() {
        // Flat ground (0 degrees)
        let normal = Vector::new(0.0, 1.0, 0.0);
        assert!(!is_slope_too_steep(&normal, 45.0_f32.to_radians()));

        // 45 degree slope (at limit)
        let normal = Vector::new(0.707, 0.707, 0.0).normalize();
        assert!(!is_slope_too_steep(&normal, 45.0_f32.to_radians()));

        // 60 degree slope (too steep for 45 degree limit)
        let angle_60 = 60.0_f32.to_radians();
        let normal = Vector::new(angle_60.sin(), angle_60.cos(), 0.0).normalize();
        assert!(is_slope_too_steep(&normal, 45.0_f32.to_radians()));

        // Vertical wall (90 degrees)
        let normal = Vector::new(1.0, 0.0, 0.0);
        assert!(is_slope_too_steep(&normal, 45.0_f32.to_radians()));
    }
}
