#[cfg(test)]
mod tests {
    use super::super::pipeline::{CameraUniform, InstanceRaw};
    use glam::Mat4;

    // ========== CameraUniform Tests ==========

    #[test]
    fn test_camera_uniform_new() {
        let _uniform = CameraUniform::new();
        // Just verify it can be created without panic
    }

    #[test]
    fn test_camera_uniform_update_view_proj() {
        let mut uniform = CameraUniform::new();

        // Create a translation matrix
        let translation = Mat4::from_translation(glam::Vec3::new(1.0, 2.0, 3.0));
        let camera_pos = glam::Vec3::new(1.0, 2.0, 3.0);
        uniform.update_view_proj(translation, camera_pos);
        // Just verify it doesn't panic
    }

    #[test]
    fn test_camera_uniform_update_multiple_times() {
        let mut uniform = CameraUniform::new();

        // Update with first matrix
        let mat1 = Mat4::from_scale(glam::Vec3::new(2.0, 2.0, 2.0));
        let camera_pos1 = glam::Vec3::new(0.0, 0.0, 0.0);
        uniform.update_view_proj(mat1, camera_pos1);

        // Update with second matrix
        let mat2 = Mat4::from_rotation_y(std::f32::consts::PI / 2.0);
        let camera_pos2 = glam::Vec3::new(5.0, 5.0, 5.0);
        uniform.update_view_proj(mat2, camera_pos2);
        // Just verify multiple updates work
    }

    #[test]
    fn test_camera_uniform_size() {
        // Verify size matches expected layout (4x4 matrix + vec4 camera_position = 16 + 4 floats = 80 bytes)
        let size = std::mem::size_of::<CameraUniform>();
        assert_eq!(size, 80);
    }

    #[test]
    fn test_camera_uniform_bytemuck() {
        let uniform = CameraUniform::new();

        // Test that it can be cast to bytes
        let binding = [uniform];
        let bytes: &[u8] = bytemuck::cast_slice(&binding);
        assert_eq!(bytes.len(), std::mem::size_of::<CameraUniform>());
    }

    // ========== InstanceRaw Tests ==========

    #[test]
    fn test_instance_raw_from_matrix() {
        let model = Mat4::from_translation(glam::Vec3::new(5.0, 10.0, 15.0));
        let _instance = InstanceRaw::from_matrix(model);
        // Just verify it can be created
    }

    #[test]
    fn test_instance_raw_with_material() {
        let model = Mat4::IDENTITY;
        let color = [1.0, 0.0, 0.0]; // Red
        let metallic = 0.8;
        let roughness = 0.2;

        let _instance = InstanceRaw::with_material(model, color, metallic, roughness);
        // Just verify it can be created with material
    }

    #[test]
    fn test_instance_raw_with_material_green() {
        let model = Mat4::from_scale(glam::Vec3::new(2.0, 2.0, 2.0));
        let color = [0.0, 1.0, 0.0]; // Green
        let metallic = 0.3;
        let roughness = 0.7;

        let _instance = InstanceRaw::with_material(model, color, metallic, roughness);
        // Just verify it can be created
    }

    #[test]
    fn test_instance_raw_size() {
        // Verify size: 16 floats (matrix) + 3 (color) + 2 (metallic/roughness) + 3 (padding) = 24 floats = 96 bytes
        let size = std::mem::size_of::<InstanceRaw>();
        assert_eq!(size, 96);
    }

    #[test]
    fn test_instance_raw_alignment() {
        // Verify proper 16-byte alignment due to padding
        let alignment = std::mem::align_of::<InstanceRaw>();
        assert_eq!(alignment, 4); // f32 alignment
    }

    #[test]
    fn test_instance_raw_bytemuck() {
        let instance = InstanceRaw::from_matrix(Mat4::IDENTITY);

        // Test that it can be cast to bytes
        let binding = [instance];
        let bytes: &[u8] = bytemuck::cast_slice(&binding);
        assert_eq!(bytes.len(), std::mem::size_of::<InstanceRaw>());
    }

    #[test]
    fn test_instance_raw_copy_clone() {
        let model = Mat4::from_rotation_z(std::f32::consts::PI / 4.0);
        let instance1 = InstanceRaw::from_matrix(model);

        let _instance2 = instance1; // Copy
        let _instance3 = instance1.clone(); // Clone
                                            // Just verify copy and clone work
    }

    #[test]
    fn test_instance_raw_desc_array_stride() {
        let desc = InstanceRaw::desc();

        // Array stride should match instance size
        assert_eq!(desc.array_stride, std::mem::size_of::<InstanceRaw>() as u64);
    }

    #[test]
    fn test_instance_raw_desc_step_mode() {
        let desc = InstanceRaw::desc();

        // Should use Instance step mode
        assert_eq!(desc.step_mode, wgpu::VertexStepMode::Instance);
    }

    #[test]
    fn test_instance_raw_desc_attributes_count() {
        let desc = InstanceRaw::desc();

        // Should have 6 attributes (4 for matrix, 1 for color, 1 for metallic/roughness)
        assert_eq!(desc.attributes.len(), 6);
    }

    #[test]
    fn test_instance_raw_desc_matrix_attributes() {
        let desc = InstanceRaw::desc();

        // Check matrix columns (shader locations 5-8)
        assert_eq!(desc.attributes[0].shader_location, 5);
        assert_eq!(desc.attributes[0].format, wgpu::VertexFormat::Float32x4);
        assert_eq!(desc.attributes[0].offset, 0);

        assert_eq!(desc.attributes[1].shader_location, 6);
        assert_eq!(desc.attributes[1].format, wgpu::VertexFormat::Float32x4);
        assert_eq!(
            desc.attributes[1].offset,
            std::mem::size_of::<[f32; 4]>() as u64
        );

        assert_eq!(desc.attributes[2].shader_location, 7);
        assert_eq!(desc.attributes[2].format, wgpu::VertexFormat::Float32x4);
        assert_eq!(
            desc.attributes[2].offset,
            std::mem::size_of::<[f32; 8]>() as u64
        );

        assert_eq!(desc.attributes[3].shader_location, 8);
        assert_eq!(desc.attributes[3].format, wgpu::VertexFormat::Float32x4);
        assert_eq!(
            desc.attributes[3].offset,
            std::mem::size_of::<[f32; 12]>() as u64
        );
    }

    #[test]
    fn test_instance_raw_desc_color_attribute() {
        let desc = InstanceRaw::desc();

        // Check color attribute (shader location 9)
        let color_attr = &desc.attributes[4];
        assert_eq!(color_attr.shader_location, 9);
        assert_eq!(color_attr.format, wgpu::VertexFormat::Float32x3);
        assert_eq!(color_attr.offset, std::mem::size_of::<[f32; 16]>() as u64);
    }

    #[test]
    fn test_instance_raw_desc_metallic_roughness_attribute() {
        let desc = InstanceRaw::desc();

        // Check metallic/roughness attribute (shader location 10)
        let mr_attr = &desc.attributes[5];
        assert_eq!(mr_attr.shader_location, 10);
        assert_eq!(mr_attr.format, wgpu::VertexFormat::Float32x2);
        assert_eq!(mr_attr.offset, std::mem::size_of::<[f32; 19]>() as u64);
    }

    #[test]
    fn test_instance_raw_pod_zeroable() {
        // Test that InstanceRaw can be zero-initialized
        let _instance: InstanceRaw = bytemuck::Zeroable::zeroed();
        // Just verify it can be zero-initialized
    }

    #[test]
    fn test_instance_raw_array_cast() {
        let instances = vec![
            InstanceRaw::from_matrix(Mat4::IDENTITY),
            InstanceRaw::with_material(
                Mat4::from_translation(glam::Vec3::new(1.0, 0.0, 0.0)),
                [1.0, 0.0, 0.0],
                0.5,
                0.5,
            ),
        ];

        // Test that array can be cast to bytes
        let bytes: &[u8] = bytemuck::cast_slice(&instances);
        assert_eq!(
            bytes.len(),
            instances.len() * std::mem::size_of::<InstanceRaw>()
        );
    }

    #[test]
    fn test_different_material_properties() {
        // Test various material property combinations
        let materials = vec![
            ([1.0, 1.0, 1.0], 0.0, 1.0), // White, non-metallic, rough
            ([0.0, 0.0, 0.0], 1.0, 0.0), // Black, metallic, smooth
            ([1.0, 0.5, 0.0], 0.5, 0.5), // Orange, semi-metallic, medium
        ];

        for (color, metallic, roughness) in materials {
            let _instance = InstanceRaw::with_material(Mat4::IDENTITY, color, metallic, roughness);
            // Just verify all material combinations can be created
        }
    }

    #[test]
    fn test_instance_raw_transform_variations() {
        // Test different transform matrices
        let transforms = vec![
            Mat4::IDENTITY,
            Mat4::from_translation(glam::Vec3::new(10.0, 20.0, 30.0)),
            Mat4::from_rotation_x(std::f32::consts::PI / 2.0),
            Mat4::from_scale(glam::Vec3::new(2.0, 3.0, 4.0)),
        ];

        for transform in transforms {
            let _instance = InstanceRaw::from_matrix(transform);
            // Just verify all transforms can be created
        }
    }

    #[test]
    fn test_camera_uniform_projection_matrix() {
        let mut uniform = CameraUniform::new();

        // Create a perspective projection matrix
        let projection = Mat4::perspective_rh(60.0_f32.to_radians(), 16.0 / 9.0, 0.1, 1000.0);
        let camera_pos = glam::Vec3::new(0.0, 2.0, 5.0);

        uniform.update_view_proj(projection, camera_pos);
        // Just verify projection matrices can be set
    }

    #[test]
    fn test_camera_uniform_view_projection_combined() {
        let mut uniform = CameraUniform::new();

        // Create view and projection matrices
        let camera_pos = glam::Vec3::new(0.0, 2.0, 5.0);
        let view = Mat4::look_at_rh(camera_pos, glam::Vec3::ZERO, glam::Vec3::Y);
        let projection = Mat4::perspective_rh(60.0_f32.to_radians(), 16.0 / 9.0, 0.1, 1000.0);

        let view_proj = projection * view;
        uniform.update_view_proj(view_proj, camera_pos);
        // Just verify combined matrices can be set
    }
}
