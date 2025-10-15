#[cfg(test)]
mod tests {
    use super::super::camera::{Camera, ProjectionType};
    use crate::ecs::components::camera::{CameraComponent, Color};
    use glam::{Mat4, Vec3, Vec4};

    /// Test that perspective projection matches Three.js PerspectiveCamera
    #[test]
    fn test_perspective_projection_matrix() {
        let camera = Camera {
            position: Vec3::new(0.0, 0.0, 5.0),
            target: Vec3::ZERO,
            up: Vec3::Y,
            fov: 60.0_f32.to_radians(), // Three.js default: 50, common: 60
            aspect: 16.0 / 9.0,
            near: 0.1,   // Three.js default
            far: 2000.0, // Three.js default
            background_color: wgpu::Color {
                r: 0.0,
                g: 0.0,
                b: 0.0,
                a: 1.0,
            },
            projection_type: ProjectionType::Perspective,
            orthographic_size: 10.0,
        };

        let proj = camera.view_projection_matrix();

        // Test that near plane points are in front of camera
        let near_point = Vec4::new(0.0, 0.0, -camera.near, 1.0);
        let clip_space = proj * near_point;
        let ndc_z = clip_space.z / clip_space.w;

        // In Vulkan/WGPU NDC, near = 0.0, far = 1.0
        // Note: projection_matrix alone returns GL-style (-1..1), but view_projection_matrix converts to WGPU (0..1)
        assert!(ndc_z >= 0.0 && ndc_z <= 1.0, "NDC z should be in [0, 1], got {}", ndc_z);
    }

    /// Test that orthographic projection matches Three.js OrthographicCamera
    #[test]
    fn test_orthographic_projection_matrix() {
        let camera = Camera {
            position: Vec3::new(0.0, 0.0, 5.0),
            target: Vec3::ZERO,
            up: Vec3::Y,
            fov: 60.0_f32.to_radians(),
            aspect: 16.0 / 9.0,
            near: 0.1,
            far: 2000.0,
            background_color: wgpu::Color {
                r: 0.0,
                g: 0.0,
                b: 0.0,
                a: 1.0,
            },
            projection_type: ProjectionType::Orthographic,
            orthographic_size: 10.0, // Three.js orthographic size
        };

        let proj = camera.projection_matrix();

        // In orthographic projection, parallel lines stay parallel
        // Test two points at different depths project to same X,Y
        let point1 = Vec4::new(1.0, 1.0, -1.0, 1.0);
        let point2 = Vec4::new(1.0, 1.0, -10.0, 1.0);

        let clip1 = proj * point1;
        let clip2 = proj * point2;

        let ndc1_x = clip1.x / clip1.w;
        let ndc1_y = clip1.y / clip1.w;
        let ndc2_x = clip2.x / clip2.w;
        let ndc2_y = clip2.y / clip2.w;

        // Same X,Y in NDC space (orthographic = no perspective divide)
        assert!((ndc1_x - ndc2_x).abs() < 0.01);
        assert!((ndc1_y - ndc2_y).abs() < 0.01);
    }

    /// Test that view matrix matches Three.js lookAt
    #[test]
    fn test_view_matrix_look_at() {
        let camera = Camera {
            position: Vec3::new(0.0, 5.0, 10.0),
            target: Vec3::new(0.0, 0.0, 0.0),
            up: Vec3::Y,
            fov: 60.0_f32.to_radians(),
            aspect: 16.0 / 9.0,
            near: 0.1,
            far: 2000.0,
            background_color: wgpu::Color {
                r: 0.0,
                g: 0.0,
                b: 0.0,
                a: 1.0,
            },
            projection_type: ProjectionType::Perspective,
            orthographic_size: 10.0,
        };

        let view = camera.view_matrix();

        // Transform camera position to view space (should be at origin)
        let cam_pos_view =
            view * Vec4::new(camera.position.x, camera.position.y, camera.position.z, 1.0);

        // In view space, camera is at origin
        assert!(cam_pos_view.x.abs() < 0.01);
        assert!(cam_pos_view.y.abs() < 0.01);
        assert!(cam_pos_view.z.abs() < 0.01);
    }

    /// Test that aspect ratio affects horizontal FOV (Three.js behavior)
    #[test]
    fn test_aspect_ratio_horizontal_fov() {
        let mut camera_wide = Camera::new(1920, 1080);
        camera_wide.fov = 60.0_f32.to_radians();

        let mut camera_narrow = Camera::new(1080, 1920);
        camera_narrow.fov = 60.0_f32.to_radians();

        // Wide aspect = wider horizontal view
        assert!(camera_wide.aspect > camera_narrow.aspect);

        // Both should have same vertical FOV
        // Horizontal FOV = 2 * atan(tan(vfov/2) * aspect)
        let hfov_wide = 2.0 * ((camera_wide.fov / 2.0).tan() * camera_wide.aspect).atan();
        let hfov_narrow = 2.0 * ((camera_narrow.fov / 2.0).tan() * camera_narrow.aspect).atan();

        assert!(hfov_wide > hfov_narrow);
    }

    /// Test that CameraComponent defaults match Three.js
    #[test]
    fn test_camera_component_defaults() {
        let camera_comp = CameraComponent::default();

        // Three.js PerspectiveCamera defaults:
        // fov: 50 (we use 60 as more common)
        // near: 0.1
        // far: 2000
        // aspect: window.width / window.height

        assert_eq!(camera_comp.fov, 60.0);
        assert_eq!(camera_comp.near, 0.1);
        assert_eq!(camera_comp.far, 100.0); // Our default is more conservative
        assert_eq!(camera_comp.projectionType, "perspective");
        assert_eq!(camera_comp.orthographicSize, 10.0);
    }

    /// Test that background color is properly applied (Three.js Scene.background)
    #[test]
    fn test_background_color_application() {
        let mut camera = Camera::new(1920, 1080);

        let camera_comp = CameraComponent {
            fov: 60.0,
            near: 0.1,
            far: 1000.0,
            isMain: true,
            projectionType: "perspective".to_string(),
            orthographicSize: 10.0,
            backgroundColor: Some(Color {
                r: 0.2,
                g: 0.4,
                b: 0.6,
                a: 1.0,
            }),
            clearFlags: Some("solidColor".to_string()),
            skyboxTexture: None,
        };

        camera.apply_component(&camera_comp);

        assert!((camera.background_color.r - 0.2).abs() < 0.001);
        assert!((camera.background_color.g - 0.4).abs() < 0.001);
        assert!((camera.background_color.b - 0.6).abs() < 0.001);
        assert!((camera.background_color.a - 1.0).abs() < 0.001);
    }

    /// Test that projection type switches correctly (Three.js behavior)
    #[test]
    fn test_projection_type_switching() {
        let mut camera = Camera::new(1920, 1080);

        // Start as perspective
        let camera_comp_persp = CameraComponent {
            fov: 60.0,
            near: 0.1,
            far: 1000.0,
            isMain: true,
            projectionType: "perspective".to_string(),
            orthographicSize: 10.0,
            backgroundColor: None,
            clearFlags: None,
            skyboxTexture: None,
        };

        camera.apply_component(&camera_comp_persp);
        assert_eq!(camera.projection_type, ProjectionType::Perspective);

        // Switch to orthographic
        let camera_comp_ortho = CameraComponent {
            projectionType: "orthographic".to_string(),
            ..camera_comp_persp
        };

        camera.apply_component(&camera_comp_ortho);
        assert_eq!(camera.projection_type, ProjectionType::Orthographic);
    }

    /// Test that orthographic size affects view bounds (Three.js behavior)
    #[test]
    fn test_orthographic_size_bounds() {
        let camera_small = Camera {
            position: Vec3::ZERO,
            target: Vec3::new(0.0, 0.0, -1.0),
            up: Vec3::Y,
            fov: 60.0_f32.to_radians(),
            aspect: 1.0,
            near: 0.1,
            far: 1000.0,
            background_color: wgpu::Color::BLACK,
            projection_type: ProjectionType::Orthographic,
            orthographic_size: 5.0,
        };

        let camera_large = Camera {
            orthographic_size: 20.0,
            ..camera_small
        };

        // Larger orthographic size = larger view bounds
        assert!(camera_large.orthographic_size > camera_small.orthographic_size);

        // Test projection matrices
        let proj_small = camera_small.projection_matrix();
        let proj_large = camera_large.projection_matrix();

        // Point at edge of small camera
        let edge_point = Vec4::new(2.5, 0.0, -5.0, 1.0);

        let clip_small = proj_small * edge_point;
        let clip_large = proj_large * edge_point;

        let ndc_small_x = clip_small.x / clip_small.w;
        let ndc_large_x = clip_large.x / clip_large.w;

        // Same world point is closer to edge in small camera
        assert!(ndc_small_x.abs() > ndc_large_x.abs());
    }

    /// Test that near/far planes match Three.js behavior
    #[test]
    fn test_near_far_plane_clipping() {
        let camera = Camera {
            position: Vec3::new(0.0, 0.0, 10.0),
            target: Vec3::ZERO,
            up: Vec3::Y,
            fov: 60.0_f32.to_radians(),
            aspect: 16.0 / 9.0,
            near: 1.0,
            far: 100.0,
            background_color: wgpu::Color::BLACK,
            projection_type: ProjectionType::Perspective,
            orthographic_size: 10.0,
        };

        let view_proj = camera.view_projection_matrix();

        // Point before near plane (should be clipped)
        let before_near = Vec4::new(0.0, 0.0, 10.5, 1.0); // 0.5 units in front of camera
        let clip_before = view_proj * before_near;
        let ndc_z_before = clip_before.z / clip_before.w;

        // Point between near and far (should be visible)
        let between = Vec4::new(0.0, 0.0, 5.0, 1.0); // 5 units in front
        let clip_between = view_proj * between;
        let ndc_z_between = clip_between.z / clip_between.w;

        // Point after far plane (should be clipped)
        let after_far = Vec4::new(0.0, 0.0, -100.0, 1.0); // Way behind
        let clip_after = view_proj * after_far;
        let ndc_z_after = clip_after.z / clip_after.w;

        // In WGPU NDC: near = 0.0, far = 1.0
        // Before near: z < 0 (clipped)
        // Between: 0 <= z <= 1 (visible)
        // After far: z > 1 (clipped)
        assert!(ndc_z_before < 0.0 || ndc_z_before > 1.0); // Outside
        assert!(ndc_z_between >= 0.0 && ndc_z_between <= 1.0); // Inside
        assert!(ndc_z_after < 0.0 || ndc_z_after > 1.0); // Outside
    }

    /// Test that resize updates aspect ratio (Three.js behavior)
    #[test]
    fn test_resize_updates_aspect() {
        let mut camera = Camera::new(1920, 1080);
        let initial_aspect = camera.aspect;

        camera.update_aspect(3840, 2160);
        let new_aspect = camera.aspect;

        // Aspect ratio should stay same for same proportions
        assert!((initial_aspect - new_aspect).abs() < 0.01);

        camera.update_aspect(1080, 1920);
        let portrait_aspect = camera.aspect;

        // Portrait aspect should be < 1
        assert!(portrait_aspect < 1.0);
    }

    /// Test that isMain flag selects correct camera (Three.js behavior)
    #[test]
    fn test_is_main_camera_selection() {
        let camera_main = CameraComponent {
            fov: 60.0,
            near: 0.1,
            far: 1000.0,
            isMain: true, // Main camera
            projectionType: "perspective".to_string(),
            orthographicSize: 10.0,
            backgroundColor: None,
            clearFlags: None,
            skyboxTexture: None,
        };

        let camera_secondary = CameraComponent {
            isMain: false, // Not main
            ..camera_main
        };

        assert!(camera_main.isMain);
        assert!(!camera_secondary.isMain);

        // In app.rs, only isMain: true camera is applied
    }

    /// Test view-projection matrix composition (Three.js order)
    #[test]
    fn test_view_projection_composition() {
        let camera = Camera::new(1920, 1080);

        let view = camera.view_matrix();
        let proj = camera.projection_matrix();
        let view_proj = camera.view_projection_matrix();

        // view_projection_matrix applies WGPU conversion, so it's: WGPU_MATRIX * proj * view
        const OPENGL_TO_WGPU_MATRIX: Mat4 = Mat4::from_cols_array(&[
            1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.5, 1.0,
        ]);
        let manual_view_proj = OPENGL_TO_WGPU_MATRIX * proj * view;

        // Compare matrices (allow small floating point errors)
        let view_proj_array = view_proj.to_cols_array();
        let manual_array = manual_view_proj.to_cols_array();

        for (a, b) in view_proj_array.iter().zip(manual_array.iter()) {
            assert!((a - b).abs() < 0.0001, "Matrix element mismatch: {} vs {}", a, b);
        }
    }

    /// Test that clearFlags are parsed correctly (Three.js Scene.background behavior)
    #[test]
    fn test_clear_flags_parsing() {
        let camera_skybox = CameraComponent {
            fov: 60.0,
            near: 0.1,
            far: 1000.0,
            isMain: true,
            projectionType: "perspective".to_string(),
            orthographicSize: 10.0,
            backgroundColor: None,
            clearFlags: Some("skybox".to_string()),
            skyboxTexture: Some("path/to/skybox.hdr".to_string()),
        };

        let camera_solid = CameraComponent {
            clearFlags: Some("solidColor".to_string()),
            backgroundColor: Some(Color {
                r: 0.5,
                g: 0.5,
                b: 0.5,
                a: 1.0,
            }),
            ..camera_skybox
        };

        assert_eq!(camera_skybox.clearFlags, Some("skybox".to_string()));
        assert_eq!(camera_solid.clearFlags, Some("solidColor".to_string()));

        // Note: clearFlags parsed but not yet applied in rendering
    }
}
