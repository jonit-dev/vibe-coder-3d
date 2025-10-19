use anyhow::Result;
use three_d::*;

/// Debug line renderer using instanced thin cylinders for line segments
pub struct DebugLineRenderer {
    context: Context,
    cylinder_mesh: CpuMesh,
}

impl DebugLineRenderer {
    pub fn new(context: &Context) -> Self {
        // Create a thin cylinder to use for each line segment
        let mut cylinder = CpuMesh::cylinder(6); // Low poly for performance
        cylinder
            .transform(&Mat4::from_nonuniform_scale(1.0, 0.005, 0.005))
            .unwrap();

        Self {
            context: context.clone(),
            cylinder_mesh: cylinder,
        }
    }

    /// Create renderable line meshes from a LineBatch
    pub fn create_line_mesh(
        &self,
        batch: &crate::debug::LineBatch,
    ) -> Result<Option<Gm<InstancedMesh, ColorMaterial>>> {
        if batch.vertices.is_empty() {
            return Ok(None);
        }

        let mut transformations = Vec::new();
        let mut colors = Vec::new();

        // Process pairs of vertices (each pair is a line segment)
        for i in (0..batch.vertices.len()).step_by(2) {
            if i + 1 >= batch.vertices.len() {
                break;
            }

            let v1 = batch.vertices[i];
            let v2 = batch.vertices[i + 1];

            let p1 = vec3(v1.position.x, v1.position.y, v1.position.z);
            let p2 = vec3(v2.position.x, v2.position.y, v2.position.z);

            // Create transformation matrix for this line segment
            transformations.push(edge_transform(p1, p2));

            // Use the color from the first vertex
            colors.push(Srgba::new(
                (v1.color[0] * 255.0) as u8,
                (v1.color[1] * 255.0) as u8,
                (v1.color[2] * 255.0) as u8,
                255,
            ));
        }

        if transformations.is_empty() {
            return Ok(None);
        }

        // Create instances with per-instance colors
        let instances = Instances {
            transformations,
            colors: Some(colors),
            ..Default::default()
        };

        // Create the instanced mesh
        let mesh = InstancedMesh::new(&self.context, &instances, &self.cylinder_mesh);

        // Create a simple color material (colors come from instances)
        let material = ColorMaterial {
            color: Srgba::WHITE, // Will be overridden by instance colors
            texture: None,
            render_states: RenderStates {
                write_mask: WriteMask::COLOR,
                depth_test: DepthTest::LessOrEqual,
                cull: Cull::Back,
                ..Default::default()
            },
            is_transparent: false,
        };

        Ok(Some(Gm::new(mesh, material)))
    }
}

/// Create transformation matrix for a line segment from p1 to p2
fn edge_transform(p1: Vec3, p2: Vec3) -> Mat4 {
    let direction = p2 - p1;
    let length = direction.magnitude();

    if length < 0.0001 {
        // Degenerate line, use zero scale
        return Mat4::from_scale(0.0);
    }

    Mat4::from_translation(p1)
        * Into::<Mat4>::into(Quat::from_arc(
            vec3(1.0, 0.0, 0.0),
            direction.normalize(),
            None,
        ))
        * Mat4::from_nonuniform_scale(length, 1.0, 1.0)
}
