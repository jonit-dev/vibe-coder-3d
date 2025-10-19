use glam::{Mat4, Quat, Vec3};
use rapier3d::prelude::*;
use vibe_physics::PhysicsWorld;

use super::lines::LineBatch;

const COLLIDER_COLOR: [f32; 3] = [1.0, 1.0, 0.0]; // Yellow
const SPHERE_SEGMENTS: u32 = 16;

/// Generate debug lines for all colliders in the physics world
pub fn append_collider_lines(world: &PhysicsWorld, batch: &mut LineBatch) {
    // Iterate through all colliders
    for (_handle, collider) in world.colliders.iter() {
        // Get the collider's position in world space
        let position = collider.position();
        let translation = Vec3::new(
            position.translation.x,
            position.translation.y,
            position.translation.z,
        );
        let rotation = Quat::from_xyzw(
            position.rotation.i,
            position.rotation.j,
            position.rotation.k,
            position.rotation.w,
        );

        // Get the shape and draw appropriate debug lines
        match collider.shape().shape_type() {
            ShapeType::Cuboid => {
                if let Some(cuboid) = collider.shape().as_cuboid() {
                    draw_cuboid(batch, translation, rotation, cuboid);
                }
            }
            ShapeType::Ball => {
                if let Some(ball) = collider.shape().as_ball() {
                    draw_ball(batch, translation, ball);
                }
            }
            ShapeType::Capsule => {
                if let Some(capsule) = collider.shape().as_capsule() {
                    draw_capsule(batch, translation, rotation, capsule);
                }
            }
            ShapeType::Cylinder => {
                if let Some(cylinder) = collider.shape().as_cylinder() {
                    draw_cylinder(batch, translation, rotation, cylinder);
                }
            }
            ShapeType::ConvexPolyhedron => {
                if let Some(convex) = collider.shape().as_convex_polyhedron() {
                    draw_convex_polyhedron(batch, translation, rotation, convex);
                }
            }
            ShapeType::TriMesh => {
                if let Some(trimesh) = collider.shape().as_trimesh() {
                    draw_trimesh(batch, translation, rotation, trimesh);
                }
            }
            _ => {
                // For unsupported shapes, draw a small cross at the position
                draw_cross(batch, translation, 0.1);
            }
        }
    }
}

/// Draw a cuboid (box) collider
fn draw_cuboid(batch: &mut LineBatch, position: Vec3, rotation: Quat, cuboid: &Cuboid) {
    let half_extents = Vec3::new(
        cuboid.half_extents.x,
        cuboid.half_extents.y,
        cuboid.half_extents.z,
    );

    // Define the 8 corners of the box in local space
    let corners = [
        Vec3::new(-half_extents.x, -half_extents.y, -half_extents.z),
        Vec3::new(half_extents.x, -half_extents.y, -half_extents.z),
        Vec3::new(half_extents.x, -half_extents.y, half_extents.z),
        Vec3::new(-half_extents.x, -half_extents.y, half_extents.z),
        Vec3::new(-half_extents.x, half_extents.y, -half_extents.z),
        Vec3::new(half_extents.x, half_extents.y, -half_extents.z),
        Vec3::new(half_extents.x, half_extents.y, half_extents.z),
        Vec3::new(-half_extents.x, half_extents.y, half_extents.z),
    ];

    // Transform corners to world space
    let world_corners: Vec<Vec3> = corners
        .iter()
        .map(|&corner| position + rotation * corner)
        .collect();

    // Draw bottom face
    batch.add_line(world_corners[0], world_corners[1], COLLIDER_COLOR);
    batch.add_line(world_corners[1], world_corners[2], COLLIDER_COLOR);
    batch.add_line(world_corners[2], world_corners[3], COLLIDER_COLOR);
    batch.add_line(world_corners[3], world_corners[0], COLLIDER_COLOR);

    // Draw top face
    batch.add_line(world_corners[4], world_corners[5], COLLIDER_COLOR);
    batch.add_line(world_corners[5], world_corners[6], COLLIDER_COLOR);
    batch.add_line(world_corners[6], world_corners[7], COLLIDER_COLOR);
    batch.add_line(world_corners[7], world_corners[4], COLLIDER_COLOR);

    // Draw vertical edges
    batch.add_line(world_corners[0], world_corners[4], COLLIDER_COLOR);
    batch.add_line(world_corners[1], world_corners[5], COLLIDER_COLOR);
    batch.add_line(world_corners[2], world_corners[6], COLLIDER_COLOR);
    batch.add_line(world_corners[3], world_corners[7], COLLIDER_COLOR);
}

/// Draw a ball (sphere) collider
fn draw_ball(batch: &mut LineBatch, position: Vec3, ball: &Ball) {
    batch.add_sphere(position, ball.radius, COLLIDER_COLOR, SPHERE_SEGMENTS);
}

/// Draw a capsule collider
fn draw_capsule(batch: &mut LineBatch, position: Vec3, rotation: Quat, capsule: &Capsule) {
    let half_height = capsule.half_height();
    let radius = capsule.radius;

    // Capsule axis is along Y in local space
    let axis = rotation * Vec3::Y;
    let top = position + axis * half_height;
    let bottom = position - axis * half_height;

    // Draw the cylinder part (vertical lines)
    let perpendicular = if axis.dot(Vec3::X).abs() < 0.9 {
        axis.cross(Vec3::X).normalize()
    } else {
        axis.cross(Vec3::Y).normalize()
    };

    for i in 0..8 {
        let angle = (i as f32 / 8.0) * std::f32::consts::TAU;
        let offset =
            (perpendicular * angle.cos() + axis.cross(perpendicular) * angle.sin()) * radius;
        batch.add_line(top + offset, bottom + offset, COLLIDER_COLOR);
    }

    // Draw top and bottom hemispheres as circles
    batch.add_sphere(top, radius, COLLIDER_COLOR, 8);
    batch.add_sphere(bottom, radius, COLLIDER_COLOR, 8);
}

/// Draw a cylinder collider
fn draw_cylinder(batch: &mut LineBatch, position: Vec3, rotation: Quat, cylinder: &Cylinder) {
    let half_height = cylinder.half_height;
    let radius = cylinder.radius;

    // Cylinder axis is along Y in local space
    let axis = rotation * Vec3::Y;
    let top_center = position + axis * half_height;
    let bottom_center = position - axis * half_height;

    // Get perpendicular vectors for drawing circles
    let perpendicular = if axis.dot(Vec3::X).abs() < 0.9 {
        axis.cross(Vec3::X).normalize()
    } else {
        axis.cross(Vec3::Y).normalize()
    };
    let perpendicular2 = axis.cross(perpendicular).normalize();

    // Draw top and bottom circles
    let segments = 16;
    for i in 0..segments {
        let angle1 = (i as f32 / segments as f32) * std::f32::consts::TAU;
        let angle2 = ((i + 1) as f32 / segments as f32) * std::f32::consts::TAU;

        let offset1 = (perpendicular * angle1.cos() + perpendicular2 * angle1.sin()) * radius;
        let offset2 = (perpendicular * angle2.cos() + perpendicular2 * angle2.sin()) * radius;

        // Top circle
        batch.add_line(top_center + offset1, top_center + offset2, COLLIDER_COLOR);
        // Bottom circle
        batch.add_line(
            bottom_center + offset1,
            bottom_center + offset2,
            COLLIDER_COLOR,
        );
    }

    // Draw vertical lines connecting top and bottom
    for i in 0..4 {
        let angle = (i as f32 / 4.0) * std::f32::consts::TAU;
        let offset = (perpendicular * angle.cos() + perpendicular2 * angle.sin()) * radius;
        batch.add_line(top_center + offset, bottom_center + offset, COLLIDER_COLOR);
    }
}

/// Draw a convex polyhedron collider
fn draw_convex_polyhedron(
    batch: &mut LineBatch,
    position: Vec3,
    rotation: Quat,
    convex: &ConvexPolyhedron,
) {
    let vertices = convex.points();

    // Transform vertices to world space
    let world_vertices: Vec<Vec3> = vertices
        .iter()
        .map(|v| position + rotation * Vec3::new(v.x, v.y, v.z))
        .collect();

    // Draw edges - Rapier doesn't expose edges directly, so we draw all possible edges
    // This is inefficient but works for visualization
    for i in 0..world_vertices.len() {
        for j in (i + 1)..world_vertices.len() {
            let dist = (world_vertices[i] - world_vertices[j]).length();
            // Only draw edges between nearby vertices (heuristic)
            if dist < 2.0 {
                batch.add_line(world_vertices[i], world_vertices[j], COLLIDER_COLOR);
            }
        }
    }
}

/// Draw a triangle mesh collider
fn draw_trimesh(batch: &mut LineBatch, position: Vec3, rotation: Quat, trimesh: &TriMesh) {
    let vertices = trimesh.vertices();
    let indices = trimesh.indices();

    // Transform vertices to world space
    let world_vertices: Vec<Vec3> = vertices
        .iter()
        .map(|v| position + rotation * Vec3::new(v.x, v.y, v.z))
        .collect();

    // Draw all triangle edges
    for triangle in indices {
        let v0 = world_vertices[triangle[0] as usize];
        let v1 = world_vertices[triangle[1] as usize];
        let v2 = world_vertices[triangle[2] as usize];

        batch.add_line(v0, v1, COLLIDER_COLOR);
        batch.add_line(v1, v2, COLLIDER_COLOR);
        batch.add_line(v2, v0, COLLIDER_COLOR);
    }
}

/// Draw a small cross marker at a position (for unsupported shapes)
fn draw_cross(batch: &mut LineBatch, position: Vec3, size: f32) {
    batch.add_line(
        position - Vec3::X * size,
        position + Vec3::X * size,
        COLLIDER_COLOR,
    );
    batch.add_line(
        position - Vec3::Y * size,
        position + Vec3::Y * size,
        COLLIDER_COLOR,
    );
    batch.add_line(
        position - Vec3::Z * size,
        position + Vec3::Z * size,
        COLLIDER_COLOR,
    );
}
