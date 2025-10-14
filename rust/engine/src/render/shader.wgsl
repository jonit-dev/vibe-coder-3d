// Vertex shader

struct CameraUniform {
    view_proj: mat4x4<f32>,
    camera_position: vec4<f32>,
};

// Lighting uniform - supports up to 4 lights
struct LightUniform {
    // Directional light (main)
    directional_direction: vec3<f32>,
    directional_intensity: f32,
    directional_color: vec3<f32>,
    directional_enabled: f32,

    // Ambient light
    ambient_color: vec3<f32>,
    ambient_intensity: f32,

    // Point lights (up to 2)
    point_position_0: vec3<f32>,
    point_intensity_0: f32,
    point_color_0: vec3<f32>,
    point_range_0: f32,

    point_position_1: vec3<f32>,
    point_intensity_1: f32,
    point_color_1: vec3<f32>,
    point_range_1: f32,
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

@group(0) @binding(1)
var<uniform> lights: LightUniform;

struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) uv: vec2<f32>,
};

struct VertexOutput {
    @builtin(position) clip_position: vec4<f32>,
    @location(0) world_position: vec3<f32>,
    @location(1) world_normal: vec3<f32>,
    @location(2) uv: vec2<f32>,
    @location(3) color: vec3<f32>,
    @location(4) metallic_roughness: vec2<f32>,
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
    out.world_position = world_position.xyz;
    out.world_normal = (model_matrix * vec4<f32>(model.normal, 0.0)).xyz;
    out.uv = model.uv;
    out.color = instance.color;
    out.metallic_roughness = instance.metallic_roughness;
    return out;
}

// Fragment shader

// Calculate point light contribution
fn calculate_point_light(
    position: vec3<f32>,
    color: vec3<f32>,
    intensity: f32,
    range: f32,
    world_pos: vec3<f32>,
    normal: vec3<f32>,
    view_dir: vec3<f32>,
    roughness: f32
) -> vec3<f32> {
    if (intensity <= 0.0) {
        return vec3<f32>(0.0);
    }

    let light_vec = position - world_pos;
    let distance = length(light_vec);

    // Attenuation based on distance and range
    let attenuation = max(0.0, 1.0 - (distance / range));
    let attenuation_sq = attenuation * attenuation;

    if (attenuation_sq <= 0.0) {
        return vec3<f32>(0.0);
    }

    let light_dir = normalize(light_vec);

    // Diffuse
    let diffuse = max(dot(normal, light_dir), 0.0);

    // Specular
    let reflect_dir = reflect(-light_dir, normal);
    let spec_strength = (1.0 - roughness) * 0.5;
    let spec = pow(max(dot(view_dir, reflect_dir), 0.0), 32.0) * spec_strength;

    return color * intensity * attenuation_sq * (diffuse * 0.7 + spec);
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    let normal = normalize(in.world_normal);
    let base_color = in.color;
    let metallic = in.metallic_roughness.x;
    let roughness = in.metallic_roughness.y;

    // View direction (simplified - from world position to camera)
    let view_dir = normalize(camera.camera_position.xyz - in.world_position);

    // Ambient light
    var lighting = lights.ambient_color * lights.ambient_intensity;

    // Directional light
    if (lights.directional_enabled > 0.5) {
        let light_dir = normalize(-lights.directional_direction);
        let diffuse = max(dot(normal, light_dir), 0.0);

        // Specular
        let reflect_dir = reflect(-light_dir, normal);
        let spec_strength = (1.0 - roughness) * 0.5;
        let spec = pow(max(dot(view_dir, reflect_dir), 0.0), 32.0) * spec_strength;

        lighting += lights.directional_color * lights.directional_intensity * (diffuse * 0.7 + spec);
    }

    // Point light 0
    lighting += calculate_point_light(
        lights.point_position_0,
        lights.point_color_0,
        lights.point_intensity_0,
        lights.point_range_0,
        in.world_position,
        normal,
        view_dir,
        roughness
    );

    // Point light 1
    lighting += calculate_point_light(
        lights.point_position_1,
        lights.point_color_1,
        lights.point_intensity_1,
        lights.point_range_1,
        in.world_position,
        normal,
        view_dir,
        roughness
    );

    let final_color = base_color * lighting;

    return vec4<f32>(final_color, 1.0);
}
