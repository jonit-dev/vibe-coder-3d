#[cfg(test)]
mod tests {
    use super::super::camera::Camera;
    use crate::ecs::components::camera::CameraComponent;
    use glam::{Mat4, Vec3};

    #[test]
    fn test_camera_new() {
        let camera = Camera::new(1920, 1080);

        assert_eq!(camera.position, Vec3::new(0.0, 2.0, 5.0));
        assert_eq!(camera.target, Vec3::ZERO);
        assert_eq!(camera.up, Vec3::Y);
        assert_eq!(camera.fov, 60.0_f32.to_radians());
        assert!((camera.aspect - 1920.0 / 1080.0).abs() < 0.001);
        assert_eq!(camera.near, 0.1);
        assert_eq!(camera.far, 1000.0);
    }

    #[test]
    fn test_camera_aspect_ratio() {
        let camera_16_9 = Camera::new(1920, 1080);
        let camera_4_3 = Camera::new(1024, 768);
        let camera_square = Camera::new(1000, 1000);

        assert!((camera_16_9.aspect - (16.0 / 9.0)).abs() < 0.01);
        assert!((camera_4_3.aspect - (4.0 / 3.0)).abs() < 0.01);
        assert!((camera_square.aspect - 1.0).abs() < 0.001);
    }

    #[test]
    fn test_camera_view_matrix() {
        let camera = Camera::new(1920, 1080);
        let view_matrix = camera.view_matrix();

        // View matrix should be a valid 4x4 matrix
        // Check that it's not identity (since camera is not at origin looking at target)
        let identity = Mat4::IDENTITY;
        let mut is_different = false;

        for i in 0..4 {
            for j in 0..4 {
                if (view_matrix.col(i)[j] - identity.col(i)[j]).abs() > 0.001 {
                    is_different = true;
                }
            }
        }

        assert!(is_different);
    }

    #[test]
    fn test_camera_projection_matrix() {
        let camera = Camera::new(1920, 1080);
        let proj_matrix = camera.projection_matrix();

        // Projection matrix should be a valid 4x4 matrix
        // For perspective projection, m[3][2] should be negative
        assert!(proj_matrix.col(2)[3] < 0.0);
    }

    #[test]
    fn test_camera_view_projection_matrix() {
        let camera = Camera::new(1920, 1080);
        let vp_matrix = camera.view_projection_matrix();
        let expected = camera.projection_matrix() * camera.view_matrix();

        // Check that view_projection_matrix returns the correct multiplication
        for i in 0..4 {
            for j in 0..4 {
                assert!((vp_matrix.col(i)[j] - expected.col(i)[j]).abs() < 0.001);
            }
        }
    }

    #[test]
    fn test_camera_update_aspect() {
        let mut camera = Camera::new(1920, 1080);

        assert!((camera.aspect - (16.0 / 9.0)).abs() < 0.01);

        camera.update_aspect(1024, 768);

        assert!((camera.aspect - (4.0 / 3.0)).abs() < 0.01);
    }

    #[test]
    fn test_camera_update_aspect_square() {
        let mut camera = Camera::new(1920, 1080);

        camera.update_aspect(1000, 1000);

        assert!((camera.aspect - 1.0).abs() < 0.001);
    }

    #[test]
    fn test_camera_apply_component_fov() {
        let mut camera = Camera::new(1920, 1080);
        let component = CameraComponent {
            fov: 90.0,
            near: 0.1,
            far: 100.0,
            isMain: true,
            projectionType: "perspective".to_string(),
            orthographicSize: 10.0,
        };

        camera.apply_component(&component);

        assert_eq!(camera.fov, 90.0_f32.to_radians());
    }

    #[test]
    fn test_camera_apply_component_near_far() {
        let mut camera = Camera::new(1920, 1080);
        let component = CameraComponent {
            fov: 60.0,
            near: 0.5,
            far: 500.0,
            isMain: true,
            projectionType: "perspective".to_string(),
            orthographicSize: 10.0,
        };

        camera.apply_component(&component);

        assert_eq!(camera.near, 0.5);
        assert_eq!(camera.far, 500.0);
    }

    #[test]
    fn test_camera_apply_component_full() {
        let mut camera = Camera::new(1920, 1080);
        let component = CameraComponent {
            fov: 45.0,
            near: 1.0,
            far: 2000.0,
            isMain: false,
            projectionType: "perspective".to_string(),
            orthographicSize: 10.0,
        };

        camera.apply_component(&component);

        assert_eq!(camera.fov, 45.0_f32.to_radians());
        assert_eq!(camera.near, 1.0);
        assert_eq!(camera.far, 2000.0);
    }

    #[test]
    fn test_camera_position_target_view() {
        let mut camera = Camera::new(1920, 1080);

        // Move camera position
        camera.position = Vec3::new(10.0, 5.0, 10.0);
        camera.target = Vec3::new(0.0, 0.0, 0.0);

        let view_matrix = camera.view_matrix();

        // Transform a point and verify view matrix is working
        let point = Vec3::new(0.0, 0.0, 0.0);
        let transformed = view_matrix.transform_point3(point);

        // Point should be transformed in view space
        assert!(transformed.length() > 0.0);
    }

    #[test]
    fn test_camera_fov_affects_projection() {
        let mut camera1 = Camera::new(1920, 1080);
        let mut camera2 = Camera::new(1920, 1080);

        camera1.fov = 45.0_f32.to_radians();
        camera2.fov = 90.0_f32.to_radians();

        let proj1 = camera1.projection_matrix();
        let proj2 = camera2.projection_matrix();

        // Different FOVs should produce different projection matrices
        let mut is_different = false;
        for i in 0..4 {
            for j in 0..4 {
                if (proj1.col(i)[j] - proj2.col(i)[j]).abs() > 0.001 {
                    is_different = true;
                }
            }
        }

        assert!(is_different);
    }

    #[test]
    fn test_camera_near_far_affects_projection() {
        let mut camera1 = Camera::new(1920, 1080);
        let mut camera2 = Camera::new(1920, 1080);

        camera1.near = 0.1;
        camera1.far = 100.0;

        camera2.near = 1.0;
        camera2.far = 1000.0;

        let proj1 = camera1.projection_matrix();
        let proj2 = camera2.projection_matrix();

        // Different near/far should produce different projection matrices
        let mut is_different = false;
        for i in 0..4 {
            for j in 0..4 {
                if (proj1.col(i)[j] - proj2.col(i)[j]).abs() > 0.001 {
                    is_different = true;
                }
            }
        }

        assert!(is_different);
    }

    #[test]
    fn test_camera_look_at_different_targets() {
        let mut camera1 = Camera::new(1920, 1080);
        let mut camera2 = Camera::new(1920, 1080);

        camera1.position = Vec3::new(5.0, 5.0, 5.0);
        camera1.target = Vec3::new(0.0, 0.0, 0.0);

        camera2.position = Vec3::new(5.0, 5.0, 5.0);
        camera2.target = Vec3::new(10.0, 0.0, 0.0);

        let view1 = camera1.view_matrix();
        let view2 = camera2.view_matrix();

        // Different targets should produce different view matrices
        let mut is_different = false;
        for i in 0..4 {
            for j in 0..4 {
                if (view1.col(i)[j] - view2.col(i)[j]).abs() > 0.001 {
                    is_different = true;
                }
            }
        }

        assert!(is_different);
    }
}
