/// Debug gizmos for visualizing scene elements
///
/// Provides functions to add debug visualization for cameras, lights, and other scene elements
use crate::debug::LineBatch;
use crate::renderer::{CameraConfig, EnhancedDirectionalLight};
use glam::Vec3;

/// Add camera gizmo to line batch
///
/// Draws a camera frustum visualization
pub fn append_camera_gizmo(
    batch: &mut LineBatch,
    config: &CameraConfig,
    is_active: bool,
) {
    let color = if is_active {
        [0.0, 1.0, 1.0] // Cyan for active camera
    } else {
        [0.5, 0.5, 1.0] // Light blue for inactive camera
    };

    let position = Vec3::new(config.position.x, config.position.y, config.position.z);
    let target = Vec3::new(config.target.x, config.target.y, config.target.z);
    let forward = (target - position).normalize();
    let right = Vec3::new(0.0, 1.0, 0.0).cross(forward).normalize();
    let up = forward.cross(right);

    // Draw camera body (small box)
    let size = 0.3;
    let corners = [
        position + right * size * 0.5 + up * size * 0.5,
        position - right * size * 0.5 + up * size * 0.5,
        position - right * size * 0.5 - up * size * 0.5,
        position + right * size * 0.5 - up * size * 0.5,
    ];

    // Box edges
    for i in 0..4 {
        let next = (i + 1) % 4;
        batch.add_line(corners[i], corners[next], color);
    }

    // Draw view direction (line pointing forward)
    let view_length = 1.0;
    batch.add_line(position, position + forward * view_length, color);

    // Draw frustum if perspective
    if config.projection_type == "perspective" {
        let fov_rad = config.fov.to_radians();
        let aspect = 16.0 / 9.0; // Default aspect, could be parameterized
        let near_height = config.near * (fov_rad / 2.0).tan();
        let near_width = near_height * aspect;
        let far_height = config.far.min(20.0) * (fov_rad / 2.0).tan(); // Clamp far plane for visualization
        let far_width = far_height * aspect;

        // Near plane corners
        let near_center = position + forward * config.near;
        let near_tl = near_center + up * near_height + right * near_width;
        let near_tr = near_center + up * near_height - right * near_width;
        let near_bl = near_center - up * near_height + right * near_width;
        let near_br = near_center - up * near_height - right * near_width;

        // Far plane corners
        let far_dist = config.far.min(20.0);
        let far_center = position + forward * far_dist;
        let far_tl = far_center + up * far_height + right * far_width;
        let far_tr = far_center + up * far_height - right * far_width;
        let far_bl = far_center - up * far_height + right * far_width;
        let far_br = far_center - up * far_height - right * far_width;

        // Near plane
        batch.add_line(near_tl, near_tr, color);
        batch.add_line(near_tr, near_br, color);
        batch.add_line(near_br, near_bl, color);
        batch.add_line(near_bl, near_tl, color);

        // Far plane
        batch.add_line(far_tl, far_tr, color);
        batch.add_line(far_tr, far_br, color);
        batch.add_line(far_br, far_bl, color);
        batch.add_line(far_bl, far_tl, color);

        // Connect near to far
        batch.add_line(near_tl, far_tl, color);
        batch.add_line(near_tr, far_tr, color);
        batch.add_line(near_bl, far_bl, color);
        batch.add_line(near_br, far_br, color);
    }
}

/// Add directional light gizmo to line batch
///
/// Draws a sun icon with arrows pointing in the light direction
pub fn append_directional_light_gizmo(
    batch: &mut LineBatch,
    light: &EnhancedDirectionalLight,
) {
    let color = [1.0, 1.0, 0.3]; // Yellow for directional lights

    // Position the gizmo at a visible location
    // Since directional lights don't have a position, we place it at the origin
    // or offset in the opposite direction of the light
    let direction = light.direction();
    let light_dir = Vec3::new(direction.x, direction.y, direction.z);
    let position = -light_dir * 10.0;
    let size = 1.5;

    // Draw a circle to represent the sun
    let segments = 16;
    let right = if light_dir.y.abs() < 0.9 {
        Vec3::new(0.0, 1.0, 0.0).cross(light_dir).normalize()
    } else {
        Vec3::new(1.0, 0.0, 0.0).cross(light_dir).normalize()
    };
    let up = light_dir.cross(right);

    for i in 0..segments {
        let angle1 = (i as f32 / segments as f32) * 2.0 * std::f32::consts::PI;
        let angle2 = ((i + 1) as f32 / segments as f32) * 2.0 * std::f32::consts::PI;

        let p1 = position + (right * angle1.cos() + up * angle1.sin()) * size;
        let p2 = position + (right * angle2.cos() + up * angle2.sin()) * size;

        batch.add_line(p1, p2, color);
    }

    // Draw rays pointing outward
    let ray_count = 8;
    for i in 0..ray_count {
        let angle = (i as f32 / ray_count as f32) * 2.0 * std::f32::consts::PI;
        let dir = right * angle.cos() + up * angle.sin();
        let inner = position + dir * size;
        let outer = position + dir * (size * 1.3);
        batch.add_line(inner, outer, color);
    }

    // Draw direction arrow
    let arrow_start = position;
    let arrow_end = position + light_dir * 5.0;
    batch.add_line(arrow_start, arrow_end, color);

    // Arrow head
    let arrow_size = 0.5;
    let arrow_head1 = arrow_end + (right - light_dir) * arrow_size;
    let arrow_head2 = arrow_end + (-right - light_dir) * arrow_size;
    batch.add_line(arrow_end, arrow_head1, color);
    batch.add_line(arrow_end, arrow_head2, color);
}

/// Add ambient light gizmo to line batch
///
/// Draws a sphere at the origin to represent ambient light
pub fn append_ambient_light_gizmo(
    batch: &mut LineBatch,
    _intensity: f32, // Could scale the gizmo size
) {
    let color = [0.8, 0.8, 0.8]; // Light gray for ambient
    let position = Vec3::new(0.0, 0.0, 0.0);
    let radius = 0.5;
    let segments = 16;

    // Draw three circles (XY, YZ, XZ planes)
    // XY circle
    for i in 0..segments {
        let angle1 = (i as f32 / segments as f32) * 2.0 * std::f32::consts::PI;
        let angle2 = ((i + 1) as f32 / segments as f32) * 2.0 * std::f32::consts::PI;

        let p1 = position + Vec3::new(angle1.cos() * radius, angle1.sin() * radius, 0.0);
        let p2 = position + Vec3::new(angle2.cos() * radius, angle2.sin() * radius, 0.0);
        batch.add_line(p1, p2, color);
    }

    // YZ circle
    for i in 0..segments {
        let angle1 = (i as f32 / segments as f32) * 2.0 * std::f32::consts::PI;
        let angle2 = ((i + 1) as f32 / segments as f32) * 2.0 * std::f32::consts::PI;

        let p1 = position + Vec3::new(0.0, angle1.cos() * radius, angle1.sin() * radius);
        let p2 = position + Vec3::new(0.0, angle2.cos() * radius, angle2.sin() * radius);
        batch.add_line(p1, p2, color);
    }

    // XZ circle
    for i in 0..segments {
        let angle1 = (i as f32 / segments as f32) * 2.0 * std::f32::consts::PI;
        let angle2 = ((i + 1) as f32 / segments as f32) * 2.0 * std::f32::consts::PI;

        let p1 = position + Vec3::new(angle1.cos() * radius, 0.0, angle1.sin() * radius);
        let p2 = position + Vec3::new(angle2.cos() * radius, 0.0, angle2.sin() * radius);
        batch.add_line(p1, p2, color);
    }
}
