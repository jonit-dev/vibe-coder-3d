#[cfg(test)]
mod tests {
    use super::super::transform::Transform;
    use glam::{Mat4, Quat, Vec3};

    #[test]
    fn test_default_transform() {
        let transform = Transform::default();

        assert_eq!(transform.position, Some([0.0, 0.0, 0.0]));
        assert_eq!(transform.rotation, Some([0.0, 0.0, 0.0, 1.0]));
        assert_eq!(transform.scale, Some([1.0, 1.0, 1.0]));
    }

    #[test]
    fn test_position_vec3_with_value() {
        let transform = Transform {
            position: Some([1.0, 2.0, 3.0]),
            rotation: None,
            scale: None,
        };

        let pos = transform.position_vec3();
        assert_eq!(pos, Vec3::new(1.0, 2.0, 3.0));
    }

    #[test]
    fn test_position_vec3_none() {
        let transform = Transform {
            position: None,
            rotation: None,
            scale: None,
        };

        let pos = transform.position_vec3();
        assert_eq!(pos, Vec3::ZERO);
    }

    #[test]
    fn test_rotation_quat_with_value() {
        let transform = Transform {
            position: None,
            rotation: Some([0.0, 0.0, 0.707, 0.707]), // ~90 degrees around Z
            scale: None,
        };

        let rot = transform.rotation_quat();
        assert!((rot.x - 0.0).abs() < 0.001);
        assert!((rot.y - 0.0).abs() < 0.001);
        assert!((rot.z - 0.707).abs() < 0.001);
        assert!((rot.w - 0.707).abs() < 0.001);
    }

    #[test]
    fn test_rotation_quat_none() {
        let transform = Transform {
            position: None,
            rotation: None,
            scale: None,
        };

        let rot = transform.rotation_quat();
        assert_eq!(rot, Quat::IDENTITY);
    }

    #[test]
    fn test_scale_vec3_with_value() {
        let transform = Transform {
            position: None,
            rotation: None,
            scale: Some([2.0, 3.0, 4.0]),
        };

        let scale = transform.scale_vec3();
        assert_eq!(scale, Vec3::new(2.0, 3.0, 4.0));
    }

    #[test]
    fn test_scale_vec3_none() {
        let transform = Transform {
            position: None,
            rotation: None,
            scale: None,
        };

        let scale = transform.scale_vec3();
        assert_eq!(scale, Vec3::ONE);
    }

    #[test]
    fn test_matrix_identity() {
        let transform = Transform::default();
        let matrix = transform.matrix();

        // Default transform should be close to identity (at origin, no rotation, unit scale)
        let identity = Mat4::IDENTITY;

        for i in 0..4 {
            for j in 0..4 {
                assert!((matrix.col(i)[j] - identity.col(i)[j]).abs() < 0.001);
            }
        }
    }

    #[test]
    fn test_matrix_translation() {
        let transform = Transform {
            position: Some([5.0, 10.0, 15.0]),
            rotation: Some([0.0, 0.0, 0.0, 1.0]),
            scale: Some([1.0, 1.0, 1.0]),
        };

        let matrix = transform.matrix();

        // Check translation column (column 3)
        assert!((matrix.col(3)[0] - 5.0).abs() < 0.001);
        assert!((matrix.col(3)[1] - 10.0).abs() < 0.001);
        assert!((matrix.col(3)[2] - 15.0).abs() < 0.001);
    }

    #[test]
    fn test_matrix_scale() {
        let transform = Transform {
            position: Some([0.0, 0.0, 0.0]),
            rotation: Some([0.0, 0.0, 0.0, 1.0]),
            scale: Some([2.0, 3.0, 4.0]),
        };

        let matrix = transform.matrix();

        // Transform a point to check scale
        let point = Vec3::new(1.0, 1.0, 1.0);
        let transformed = matrix.transform_point3(point);

        assert!((transformed.x - 2.0).abs() < 0.001);
        assert!((transformed.y - 3.0).abs() < 0.001);
        assert!((transformed.z - 4.0).abs() < 0.001);
    }

    #[test]
    fn test_deserialization() {
        // Test that Transform can be deserialized from JSON
        let json = r#"{
            "position": [1.0, 2.0, 3.0],
            "rotation": [0.0, 0.0, 0.0, 1.0],
            "scale": [1.5, 1.5, 1.5]
        }"#;

        let transform: Transform = serde_json::from_str(json).unwrap();

        assert_eq!(transform.position, Some([1.0, 2.0, 3.0]));
        assert_eq!(transform.rotation, Some([0.0, 0.0, 0.0, 1.0]));
        assert_eq!(transform.scale, Some([1.5, 1.5, 1.5]));
    }

    #[test]
    fn test_deserialization_partial() {
        // Test that missing fields deserialize as None
        let json = r#"{
            "position": [1.0, 2.0, 3.0]
        }"#;

        let transform: Transform = serde_json::from_str(json).unwrap();

        assert_eq!(transform.position, Some([1.0, 2.0, 3.0]));
        assert_eq!(transform.rotation, None);
        assert_eq!(transform.scale, None);
    }
}
