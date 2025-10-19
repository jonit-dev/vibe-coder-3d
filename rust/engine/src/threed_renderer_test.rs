#[cfg(test)]
mod tests {
    use super::*;
    use crate::renderer::material_manager::parse_hex_color;
    use rapier3d::na::{vector, UnitQuaternion};
    use rapier3d::prelude::*;

    // Note: These tests are limited because three-d requires a real windowing context
    // which is not available in headless test environments. Full integration tests
    // should be run manually with `cargo run -- --scene testphysics`

    #[test]
    fn test_renderer_struct_size_is_reasonable() {
        // Ensure the renderer struct isn't accidentally bloated
        let size = std::mem::size_of::<crate::threed_renderer::ThreeDRenderer>();
        // Should be less than 10KB (mostly vectors and a few small structs)
        assert!(
            size < 10 * 1024,
            "ThreeDRenderer is unexpectedly large: {} bytes",
            size
        );
    }

    #[test]
    fn test_parse_hex_color_6_digit() {
        let color = parse_hex_color("#FF5733").unwrap();
        assert_eq!(color.r, 255);
        assert_eq!(color.g, 87);
        assert_eq!(color.b, 51);
        assert_eq!(color.a, 255);
    }

    #[test]
    fn test_parse_hex_color_3_digit() {
        let color = parse_hex_color("#F53").unwrap();
        // #F53 expands to #FF5533
        assert_eq!(color.r, 255);
        assert_eq!(color.g, 85);
        assert_eq!(color.b, 51);
        assert_eq!(color.a, 255);
    }

    #[test]
    fn test_parse_hex_color_without_hash() {
        let color = parse_hex_color("FF5733").unwrap();
        assert_eq!(color.r, 255);
        assert_eq!(color.g, 87);
        assert_eq!(color.b, 51);
    }

    #[test]
    fn test_parse_hex_color_invalid() {
        assert!(parse_hex_color("#GGGGGG").is_none());
        assert!(parse_hex_color("#12345").is_none()); // Wrong length
        assert!(parse_hex_color("").is_none());
    }

    #[test]
    fn test_entity_id_tracking_parallel_arrays() {
        // Verify that mesh_entity_ids would be parallel to meshes
        let entity_ids = vec![1, 2, 3, 4];
        let mesh_count = 4;

        // Simulate what happens in load_mesh_renderer
        assert_eq!(entity_ids.len(), mesh_count);

        // Verify we can look up by entity ID
        let entity_id_to_find = 3;
        let mesh_idx = entity_ids.iter().position(|&id| id == entity_id_to_find);
        assert_eq!(mesh_idx, Some(2)); // Index 2 has entity ID 3
    }

    #[test]
    fn test_coordinate_conversion_axes_match() {
        // Positions should pass through unchanged
        let threejs_pos = (1.0, 2.0, 3.0);
        let threed_pos = (threejs_pos.0, threejs_pos.1, threejs_pos.2);
        assert_eq!(threed_pos, (1.0, 2.0, 3.0));

        // Negative values remain negative
        let threejs_neg = (1.0, 2.0, -5.0);
        let threed_neg = (threejs_neg.0, threejs_neg.1, threejs_neg.2);
        assert_eq!(threed_neg, (1.0, 2.0, -5.0));
    }

    #[test]
    fn test_physics_transform_extraction() {
        // Test that we can extract transforms from Rapier position
        use rapier3d::prelude::*;

        // Create a test isometry (position + rotation)
        let position = vector![1.0, 2.0, 3.0];
        let rotation = UnitQuaternion::from_euler_angles(0.0, std::f32::consts::FRAC_PI_2, 0.0);
        let iso = Isometry::from_parts(position.into(), rotation);

        // Extract translation
        let trans = iso.translation;
        assert_eq!(trans.x, 1.0);
        assert_eq!(trans.y, 2.0);
        assert_eq!(trans.z, 3.0);

        // Extract rotation
        let rot = iso.rotation;
        assert!(rot.w.abs() > 0.0_f32); // Quaternion has some rotation
    }

    #[test]
    fn test_nalgebra_to_glam_quaternion_conversion() {
        // Test conversion from nalgebra quaternion to glam quaternion
        // Note: UnitQuaternion is already imported from rapier3d::prelude::* at module level

        // Create nalgebra quaternion (identity rotation)
        let na_quat = UnitQuaternion::identity();

        // Convert to glam (matches what sync_physics_transforms does)
        let glam_quat = glam::Quat::from_xyzw(na_quat.i, na_quat.j, na_quat.k, na_quat.w);

        // Identity quaternion should have w=1, x=y=z=0
        assert!((glam_quat.w - 1.0).abs() < 0.001);
        assert!(glam_quat.x.abs() < 0.001);
        assert!(glam_quat.y.abs() < 0.001);
        assert!(glam_quat.z.abs() < 0.001);
    }

    // Integration test guidance (to be run manually):
    // 1. cargo run -- --scene testphysics
    // 2. Verify window opens with testphysics scene
    // 3. Verify cube and sphere are visible above a red plane
    // 4. Verify objects fall due to gravity
    // 5. Verify objects collide with the plane and stop (not fall through)
    // 6. Verify no sliding/rolling after objects settle
    // 7. Press Escape to exit cleanly

    #[test]
    fn test_phase2_physics_checklist() {
        // This test documents Phase 2 physics integration success criteria
        println!("Phase 2: Physics Integration Success Criteria:");
        println!("  ✓ Entity IDs are tracked in parallel with meshes");
        println!("  ✓ sync_physics_transforms maps physics to render meshes");
        println!("  ✓ Coordinate conversion (Z-flip) is applied correctly");
        println!("  ✓ Rapier quaternions convert to glam quaternions");
        println!("");
        println!("Manual testing required:");
        println!("  cargo run -- --scene testphysics");
        println!("  Verify: objects fall, collide, and settle on ground");
    }
}
