use glam::{Mat4, Quat, Vec3};
use vibe_physics::PhysicsWorld;
use rapier3d::prelude::*;

use super::lines::LineBatch;

const COLLIDER_COLOR: [f32; 3] = [1.0, 1.0, 0.0]; // Yellow
const SPHERE_SEGMENTS: u32 = 16;

/// Generate debug lines for all colliders in the physics world
pub fn append_collider_lines(world: &PhysicsWorld, batch: &mut LineBatch) {
    for (_entity_id, collider_handles) in &world.entity_to_colliders {
        for collider_handle in collider_handles {
            if let Some(collider) = world.colliders.get(*collider_handle) {
                append_collider_shape(collider, batch);
            }
        }
    }
}

fn append_collider_shape(collider: &Collider, batch: &mut LineBatch) {

    // Get collider position and rotation
    let iso = collider.position();
    let translation = Vec3::new(
        iso.translation.x,
        iso.translation.y,
        iso.translation.z,
    );
    let rotation = Quat::from_xyzw(
        iso.rotation.i,
        iso.rotation.j,
        iso.rotation.k,
        iso.rotation.w,
    );

    // Create transform matrix
    let transform = Mat4::from_rotation_translation(rotation, translation);

    match collider.shape().shape_type() {
        ShapeType::Cuboid => {
            if let Some(cuboid) = collider.shape().as_cuboid() {
                append_cuboid(cuboid, transform, batch);
            }
        }
        ShapeType::Ball => {
            if let Some(ball) = collider.shape().as_ball() {
                append_ball(ball, translation, batch);
            }
        }
        ShapeType::Capsule => {
            if let Some(capsule) = collider.shape().as_capsule() {
                append_capsule(capsule, transform, batch);
            }
        }
        ShapeType::Cylinder => {
            if let Some(cylinder) = collider.shape().as_cylinder() {
                append_cylinder(cylinder, transform, batch);
            }
        }
        ShapeType::ConvexPolyhedron => {
            // For convex shapes, fall back to AABB for now
            let aabb = collider.compute_aabb();
            append_aabb(&aabb, batch);
        }
        ShapeType::TriMesh => {
            // For triangle meshes, fall back to AABB
            let aabb = collider.compute_aabb();
            append_aabb(&aabb, batch);
        }
        _ => {
            // For any other shape types, draw AABB
            let aabb = collider.compute_aabb();
            append_aabb(&aabb, batch);
        }
    }
}

fn append_cuboid(cuboid: &Cuboid, transform: Mat4, batch: &mut LineBatch) {
    let half_extents = cuboid.half_extents;
    let he = Vec3::new(half_extents.x, half_extents.y, half_extents.z);

    // Define 8 corners of the cuboid in local space
    let corners = [
        Vec3::new(-he.x, -he.y, -he.z),
        Vec3::new(he.x, -he.y, -he.z),
        Vec3::new(he.x, -he.y, he.z),
        Vec3::new(-he.x, -he.y, he.z),
        Vec3::new(-he.x, he.y, -he.z),
        Vec3::new(he.x, he.y, -he.z),
        Vec3::new(he.x, he.y, he.z),
        Vec3::new(-he.x, he.y, he.z),
    ];

    // Transform corners to world space
    let transformed: Vec<Vec3> = corners
        .iter()
        .map(|&corner| transform.transform_point3(corner))
        .collect();

    // Bottom face
    batch.add_line(transformed[0], transformed[1], COLLIDER_COLOR);
    batch.add_line(transformed[1], transformed[2], COLLIDER_COLOR);
    batch.add_line(transformed[2], transformed[3], COLLIDER_COLOR);
    batch.add_line(transformed[3], transformed[0], COLLIDER_COLOR);

    // Top face
    batch.add_line(transformed[4], transformed[5], COLLIDER_COLOR);
    batch.add_line(transformed[5], transformed[6], COLLIDER_COLOR);
    batch.add_line(transformed[6], transformed[7], COLLIDER_COLOR);
    batch.add_line(transformed[7], transformed[4], COLLIDER_COLOR);

    // Vertical edges
    batch.add_line(transformed[0], transformed[4], COLLIDER_COLOR);
    batch.add_line(transformed[1], transformed[5], COLLIDER_COLOR);
    batch.add_line(transformed[2], transformed[6], COLLIDER_COLOR);
    batch.add_line(transformed[3], transformed[7], COLLIDER_COLOR);
}

fn append_ball(ball: &Ball, center: Vec3, batch: &mut LineBatch) {
    batch.add_sphere(center, ball.radius, COLLIDER_COLOR, SPHERE_SEGMENTS);
}

fn append_capsule(capsule: &Capsule, transform: Mat4, batch: &mut LineBatch) {
    let half_height = capsule.half_height();
    let radius = capsule.radius;

    // Capsule is aligned along Y axis in local space
    let top_center = Vec3::new(0.0, half_height, 0.0);
    let bottom_center = Vec3::new(0.0, -half_height, 0.0);

    // Transform to world space
    let top_world = transform.transform_point3(top_center);
    let bottom_world = transform.transform_point3(bottom_center);

    // Draw top and bottom spheres
    batch.add_sphere(top_world, radius, COLLIDER_COLOR, SPHERE_SEGMENTS);
    batch.add_sphere(bottom_world, radius, COLLIDER_COLOR, SPHERE_SEGMENTS);

    // Draw connecting lines (4 vertical edges around the capsule)
    for i in 0..4 {
        let angle = (i as f32 / 4.0) * std::f32::consts::TAU;
        let offset = Vec3::new(radius * angle.cos(), 0.0, radius * angle.sin());

        let top = transform.transform_point3(top_center + offset);
        let bottom = transform.transform_point3(bottom_center + offset);

        batch.add_line(bottom, top, COLLIDER_COLOR);
    }
}

fn append_cylinder(cylinder: &Cylinder, transform: Mat4, batch: &mut LineBatch) {
    let half_height = cylinder.half_height;
    let radius = cylinder.radius;

    // Draw top and bottom circles
    let segments = SPHERE_SEGMENTS;

    // Bottom circle
    for i in 0..segments {
        let angle1 = (i as f32 / segments as f32) * std::f32::consts::TAU;
        let angle2 = ((i + 1) as f32 / segments as f32) * std::f32::consts::TAU;

        let p1_local = Vec3::new(radius * angle1.cos(), -half_height, radius * angle1.sin());
        let p2_local = Vec3::new(radius * angle2.cos(), -half_height, radius * angle2.sin());

        let p1 = transform.transform_point3(p1_local);
        let p2 = transform.transform_point3(p2_local);

        batch.add_line(p1, p2, COLLIDER_COLOR);
    }

    // Top circle
    for i in 0..segments {
        let angle1 = (i as f32 / segments as f32) * std::f32::consts::TAU;
        let angle2 = ((i + 1) as f32 / segments as f32) * std::f32::consts::TAU;

        let p1_local = Vec3::new(radius * angle1.cos(), half_height, radius * angle1.sin());
        let p2_local = Vec3::new(radius * angle2.cos(), half_height, radius * angle2.sin());

        let p1 = transform.transform_point3(p1_local);
        let p2 = transform.transform_point3(p2_local);

        batch.add_line(p1, p2, COLLIDER_COLOR);
    }

    // Vertical edges (4 lines)
    for i in 0..4 {
        let angle = (i as f32 / 4.0) * std::f32::consts::TAU;
        let offset_xz = Vec3::new(radius * angle.cos(), 0.0, radius * angle.sin());

        let bottom = transform.transform_point3(Vec3::new(offset_xz.x, -half_height, offset_xz.z));
        let top = transform.transform_point3(Vec3::new(offset_xz.x, half_height, offset_xz.z));

        batch.add_line(bottom, top, COLLIDER_COLOR);
    }
}

fn append_aabb(aabb: &parry3d::bounding_volume::Aabb, batch: &mut LineBatch) {
    let min = Vec3::new(aabb.mins.x, aabb.mins.y, aabb.mins.z);
    let max = Vec3::new(aabb.maxs.x, aabb.maxs.y, aabb.maxs.z);
    batch.add_box(min, max, COLLIDER_COLOR);
}

// Tests are integration-level and require a full physics world
// See tests in vibe-physics crate or integration tests
