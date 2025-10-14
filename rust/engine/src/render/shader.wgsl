// Vertex shader

struct CameraUniform {
    view_proj: mat4x4<f32>,
};

struct InstanceInput {
    @location(5) model_matrix_0: vec4<f32>,
    @location(6) model_matrix_1: vec4<f32>,
    @location(7) model_matrix_2: vec4<f32>,
    @location(8) model_matrix_3: vec4<f32>,
    @location(9) color: vec3<f32>,
    @location(10) metallic_roughness: vec2<f32>,
};

@group(0) @binding(0)
var<uniform> camera: CameraUniform;

struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) uv: vec2<f32>,
};

struct VertexOutput {
    @builtin(position) clip_position: vec4<f32>,
    @location(0) world_normal: vec3<f32>,
    @location(1) uv: vec2<f32>,
    @location(2) color: vec3<f32>,
    @location(3) metallic_roughness: vec2<f32>,
};

@vertex
fn vs_main(
    model: VertexInput,
    instance: InstanceInput,
) -> VertexOutput {
    let model_matrix = mat4x4<f32>(
        instance.model_matrix_0,
        instance.model_matrix_1,
        instance.model_matrix_2,
        instance.model_matrix_3,
    );

    var out: VertexOutput;
    let world_position = model_matrix * vec4<f32>(model.position, 1.0);
    out.clip_position = camera.view_proj * world_position;
    out.world_normal = (model_matrix * vec4<f32>(model.normal, 0.0)).xyz;
    out.uv = model.uv;
    out.color = instance.color;
    out.metallic_roughness = instance.metallic_roughness;
    return out;
}

// Fragment shader

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    // Simple lighting: diffuse based on normal
    let light_dir = normalize(vec3<f32>(0.5, 1.0, 0.5));
    let normal = normalize(in.world_normal);
    let diffuse = max(dot(normal, light_dir), 0.0);

    // Use material color from instance
    let base_color = in.color;
    let metallic = in.metallic_roughness.x;
    let roughness = in.metallic_roughness.y;

    // Simple PBR-ish lighting
    let ambient = 0.3;
    let specular_strength = (1.0 - roughness) * 0.5;

    // Basic lighting calculation
    let lit_color = base_color * (ambient + diffuse * 0.7);

    // Add simple specular highlight for non-rough materials
    let view_dir = vec3<f32>(0.0, 0.0, 1.0); // Simplified
    let reflect_dir = reflect(-light_dir, normal);
    let spec = pow(max(dot(view_dir, reflect_dir), 0.0), 32.0) * specular_strength;

    let final_color = lit_color + vec3<f32>(spec);

    return vec4<f32>(final_color, 1.0);
}
