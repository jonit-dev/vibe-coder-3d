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

    // Spot light
    spot_position: vec3<f32>,
    spot_intensity: f32,
    spot_direction: vec3<f32>,
    spot_angle: f32,  // Inner cone angle in radians
    spot_color: vec3<f32>,
    spot_penumbra: f32,  // Outer cone softness (0-1)
    spot_range: f32,
    spot_decay: f32,
    // Parity extras
    point_decay_0: f32,
    point_decay_1: f32,
    physically_correct_lights: f32,
    exposure: f32,
    tone_mapping: f32,
};

struct ShadowUniform {
    dir_light_vp: mat4x4<f32>,
    spot_light_vp: mat4x4<f32>,
    shadow_bias: f32,
    shadow_radius: f32,
    dir_shadow_enabled: f32,
    spot_shadow_enabled: f32,
};

// Shadow bindings (group 3)
@group(3) @binding(0)
var<uniform> shadows: ShadowUniform;

@group(3) @binding(1)
var shadow_map: texture_depth_2d;

@group(3) @binding(2)
var shadow_sampler: sampler_comparison;

struct MaterialUniform {
    emissive_color_intensity: vec4<f32>,
    uv_transform: vec4<f32>,
    normal_occlusion: vec4<f32>,
    flags_padding: vec4<u32>,
};

const TEXTURE_ALBEDO: u32 = 1u << 0u;
const TEXTURE_NORMAL: u32 = 1u << 1u;
const TEXTURE_METALLIC: u32 = 1u << 2u;
const TEXTURE_ROUGHNESS: u32 = 1u << 3u;
const TEXTURE_EMISSIVE: u32 = 1u << 4u;
const TEXTURE_OCCLUSION: u32 = 1u << 5u;
const ALPHA_MODE_OPAQUE: u32 = 0u;
const ALPHA_MODE_BLEND: u32 = 1u;
const ALPHA_MODE_MASK: u32 = 2u;

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

// Texture sampling (group 1) - 6 texture slots + 1 shared sampler
@group(1) @binding(0)
var albedo_texture: texture_2d<f32>;

@group(1) @binding(1)
var normal_texture: texture_2d<f32>;

@group(1) @binding(2)
var metallic_texture: texture_2d<f32>;

@group(1) @binding(3)
var roughness_texture: texture_2d<f32>;

@group(1) @binding(4)
var emissive_texture: texture_2d<f32>;

@group(1) @binding(5)
var occlusion_texture: texture_2d<f32>;

@group(1) @binding(6)
var texture_sampler: sampler;

@group(2) @binding(0)
var<uniform> material: MaterialUniform;

struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) uv: vec2<f32>,
    @location(3) tangent: vec4<f32>,
};

struct VertexOutput {
    @builtin(position) clip_position: vec4<f32>,
    @location(0) world_position: vec3<f32>,
    @location(1) world_normal: vec3<f32>,
    @location(2) uv: vec2<f32>,
    @location(3) color: vec3<f32>,
    @location(4) metallic_roughness: vec2<f32>,
    @location(5) world_tangent: vec3<f32>,
    @location(6) world_bitangent: vec3<f32>,
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
    let world_normal = normalize((model_matrix * vec4<f32>(model.normal, 0.0)).xyz);
    let world_tangent = normalize((model_matrix * vec4<f32>(model.tangent.xyz, 0.0)).xyz);
    let world_bitangent = normalize(cross(world_normal, world_tangent)) * model.tangent.w;
    out.world_normal = world_normal;
    out.world_tangent = world_tangent;
    out.world_bitangent = world_bitangent;
    let uv_offset = material.uv_transform.xy;
    let uv_repeat = material.uv_transform.zw;
    out.uv = model.uv * uv_repeat + uv_offset;
    out.color = instance.color;
    out.metallic_roughness = instance.metallic_roughness;
    return out;
}

// Fragment shader
// ACES Filmic tone mapping (approx)
fn aces_film(x: vec3<f32>) -> vec3<f32> {
    let a = 2.51;
    let b = 0.03;
    let c = 2.43;
    let d = 0.59;
    let e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), vec3<f32>(0.0), vec3<f32>(1.0));
}

// Three.js parity: punctualLightIntensityToIrradianceFactor
fn punctual_to_irradiance(distance: f32, cutoff: f32, decay: f32, physically_correct: bool) -> f32 {
    if (physically_correct) {
        let denom = max(pow(distance, decay), 0.01);
        var falloff = 1.0 / denom;
        if (cutoff > 0.0) {
            let x = distance / cutoff;
            // pow2( saturate( 1.0 - pow4( x ) ) )
            let v = clamp(1.0 - pow(x, 4.0), 0.0, 1.0);
            falloff = falloff * (v * v);
        }
        return falloff;
    } else {
        if (cutoff > 0.0 && decay > 0.0) {
            return pow(clamp(-distance / cutoff + 1.0, 0.0, 1.0), decay);
        }
        return 1.0;
    }
}


fn has_flag(flags: u32, mask: u32) -> bool {
    return (flags & mask) != 0u;
}

// 3x3 PCF shadow sampling (screen-space kernel in texel units)
fn sample_shadow_pcf(uv: vec2<f32>, depth_ref: f32, radius: f32) -> f32 {
    let dims = vec2<f32>(textureDimensions(shadow_map));
    let texel_size = 1.0 / dims;
    var sum: f32 = 0.0;

    // Unrolled 3x3 kernel - WGSL doesn't allow dynamic array indexing in loops
    sum += textureSampleCompare(shadow_map, shadow_sampler, uv + vec2<f32>(-1.0, -1.0) * texel_size * radius, depth_ref);
    sum += textureSampleCompare(shadow_map, shadow_sampler, uv + vec2<f32>( 0.0, -1.0) * texel_size * radius, depth_ref);
    sum += textureSampleCompare(shadow_map, shadow_sampler, uv + vec2<f32>( 1.0, -1.0) * texel_size * radius, depth_ref);
    sum += textureSampleCompare(shadow_map, shadow_sampler, uv + vec2<f32>(-1.0,  0.0) * texel_size * radius, depth_ref);
    sum += textureSampleCompare(shadow_map, shadow_sampler, uv + vec2<f32>( 0.0,  0.0) * texel_size * radius, depth_ref);
    sum += textureSampleCompare(shadow_map, shadow_sampler, uv + vec2<f32>( 1.0,  0.0) * texel_size * radius, depth_ref);
    sum += textureSampleCompare(shadow_map, shadow_sampler, uv + vec2<f32>(-1.0,  1.0) * texel_size * radius, depth_ref);
    sum += textureSampleCompare(shadow_map, shadow_sampler, uv + vec2<f32>( 0.0,  1.0) * texel_size * radius, depth_ref);
    sum += textureSampleCompare(shadow_map, shadow_sampler, uv + vec2<f32>( 1.0,  1.0) * texel_size * radius, depth_ref);

    return sum / 9.0;
}

// Vertex shader for shadow depth rendering
struct ShadowVertexOutput {
    @builtin(position) clip_position: vec4<f32>,
};

@vertex
fn vs_shadow(model: VertexInput, instance: InstanceInput) -> ShadowVertexOutput {
    let model_matrix = mat4x4<f32>(
        instance.model_matrix_0,
        instance.model_matrix_1,
        instance.model_matrix_2,
        instance.model_matrix_3,
    );
    let world_position = model_matrix * vec4<f32>(model.position, 1.0);
    var out: ShadowVertexOutput;
    // Directional shadow only for now
    out.clip_position = shadows.dir_light_vp * world_position;
    return out;
}

// Calculate point light contribution
fn calculate_point_light(
    position: vec3<f32>,
    color: vec3<f32>,
    intensity: f32,
    range: f32,
    world_pos: vec3<f32>,
    normal: vec3<f32>,
    view_dir: vec3<f32>,
    metallic: f32,
    roughness: f32,
    decay: f32,
    physically_correct: bool
) -> vec3<f32> {
    if (intensity <= 0.0) {
        return vec3<f32>(0.0);
    }

    let light_vec = position - world_pos;
    let distance = length(light_vec);

    // Parity attenuation
    let falloff = punctual_to_irradiance(distance, range, decay, physically_correct);
    if (falloff <= 0.0) {
        return vec3<f32>(0.0);
    }

    let light_dir = normalize(light_vec);

    // Diffuse
    let diffuse = max(dot(normal, light_dir), 0.0);

    // Specular
    let reflect_dir = reflect(-light_dir, normal);
    let spec_strength = mix(0.04, 1.0, metallic) * (1.0 - roughness);
    let spec = pow(max(dot(view_dir, reflect_dir), 0.0), 32.0) * spec_strength;

    return color * intensity * falloff * (diffuse * 0.7 + spec);
}

// Calculate spot light contribution
fn calculate_spot_light(
    position: vec3<f32>,
    direction: vec3<f32>,
    color: vec3<f32>,
    intensity: f32,
    angle: f32,
    penumbra: f32,
    range: f32,
    world_pos: vec3<f32>,
    normal: vec3<f32>,
    view_dir: vec3<f32>,
    metallic: f32,
    roughness: f32,
    physically_correct: bool
) -> vec3<f32> {
    if (intensity <= 0.0) {
        return vec3<f32>(0.0);
    }

    let light_vec = position - world_pos;
    let distance = length(light_vec);

    // Range attenuation (same as point with decay)
    let falloff = punctual_to_irradiance(distance, range, 1.0, physically_correct);
    if (falloff <= 0.0) {
        return vec3<f32>(0.0);
    }

    let light_dir = normalize(light_vec);
    let spot_dir = normalize(direction);

    // Cone attenuation (Three.js-style spot light)
    let angle_cos = dot(-light_dir, spot_dir);
    let outer_angle = angle + (penumbra * angle);  // Penumbra extends the cone
    let outer_cos = cos(outer_angle);
    let inner_cos = cos(angle);

    // Smooth falloff from inner to outer cone
    let spot_effect = smoothstep(outer_cos, inner_cos, angle_cos);

    if (spot_effect <= 0.0) {
        return vec3<f32>(0.0);
    }

    // Diffuse
    let diffuse = max(dot(normal, light_dir), 0.0);

    // Specular
    let reflect_dir = reflect(-light_dir, normal);
    let spec_strength = mix(0.04, 1.0, metallic) * (1.0 - roughness);
    let spec = pow(max(dot(view_dir, reflect_dir), 0.0), 32.0) * spec_strength;

    return color * intensity * falloff * spot_effect * (diffuse * 0.7 + spec);
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    var normal = normalize(in.world_normal);
    let flags = material.flags_padding.x;
    let shader_type = material.flags_padding.y;
    let alpha_mode = material.flags_padding.z;

    var base_color = in.color;
    var alpha = 1.0;
    if (has_flag(flags, TEXTURE_ALBEDO)) {
        let albedo_sample = textureSample(albedo_texture, texture_sampler, in.uv);
        base_color = base_color * albedo_sample.rgb;
        alpha = albedo_sample.a;
    }

    if (alpha_mode == ALPHA_MODE_MASK) {
        let cutoff = material.normal_occlusion.z;
        if (alpha < cutoff) {
            discard;
        }
        alpha = 1.0;
    } else if (alpha_mode == ALPHA_MODE_BLEND) {
        alpha = clamp(alpha, 0.0, 1.0);
    } else {
        alpha = 1.0;
    }

    var metallic = in.metallic_roughness.x;
    if (has_flag(flags, TEXTURE_METALLIC)) {
        metallic = textureSample(metallic_texture, texture_sampler, in.uv).r;
    }

    var roughness = in.metallic_roughness.y;
    if (has_flag(flags, TEXTURE_ROUGHNESS)) {
        roughness = textureSample(roughness_texture, texture_sampler, in.uv).r;
    }

    var occlusion = 1.0;
    if (has_flag(flags, TEXTURE_OCCLUSION)) {
        let occlusion_sample = textureSample(occlusion_texture, texture_sampler, in.uv).r;
        let strength = material.normal_occlusion.y;
        occlusion = mix(1.0, occlusion_sample, clamp(strength, 0.0, 1.0));
    }

    if (has_flag(flags, TEXTURE_NORMAL)) {
        let tangent = normalize(in.world_tangent);
        let bitangent = normalize(in.world_bitangent);
        let tbn = mat3x3<f32>(tangent, bitangent, normal);
        let normal_sample = textureSample(normal_texture, texture_sampler, in.uv).xyz;
        let mapped_xy = (normal_sample.xy * 2.0 - vec2<f32>(1.0, 1.0)) * material.normal_occlusion.x;
        let mapped_z = normal_sample.z * 2.0 - 1.0;
        let tangent_normal = vec3<f32>(mapped_xy.x, mapped_xy.y, mapped_z);
        normal = normalize(tbn * tangent_normal);
    }

    // View direction (simplified - from world position to camera)
    let view_dir = normalize(camera.camera_position.xyz - in.world_position);

    // Ambient light with occlusion
    var lighting = lights.ambient_color * lights.ambient_intensity * occlusion;

    // Directional light (with shadow)
    if (lights.directional_enabled > 0.5) {
        let light_dir = normalize(-lights.directional_direction);
        let diffuse = max(dot(normal, light_dir), 0.0);

        // Specular
        let reflect_dir = reflect(-light_dir, normal);
        let spec_strength = mix(0.04, 1.0, metallic) * (1.0 - roughness);
        let spec = pow(max(dot(view_dir, reflect_dir), 0.0), 32.0) * spec_strength;

        var visibility = 1.0;
        if (shadows.dir_shadow_enabled > 0.5) {
            // Transform world to light clip space
            let light_clip = shadows.dir_light_vp * vec4<f32>(in.world_position, 1.0);
            let ndc = light_clip.xyz / light_clip.w;
            let uv = ndc.xy * 0.5 + vec2<f32>(0.5, 0.5);
            let depth_ref = ndc.z - shadows.shadow_bias;
            if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) {
                visibility = sample_shadow_pcf(uv, depth_ref, shadows.shadow_radius);
            }
        }

        lighting += lights.directional_color * lights.directional_intensity * (diffuse * 0.7 + spec) * visibility;
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
        metallic,
        roughness,
        lights.point_decay_0,
        (lights.physically_correct_lights > 0.5)
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
        metallic,
        roughness,
        lights.point_decay_1,
        (lights.physically_correct_lights > 0.5)
    );

    // Spot light
    lighting += calculate_spot_light(
        lights.spot_position,
        lights.spot_direction,
        lights.spot_color,
        lights.spot_intensity,
        lights.spot_angle,
        lights.spot_penumbra,
        lights.spot_range,
        in.world_position,
        normal,
        view_dir,
        metallic,
        roughness,
        (lights.physically_correct_lights > 0.5)
    );

    // Apply lighting to base color
    let lit_color = base_color * lighting;

    var emissive = material.emissive_color_intensity.xyz * material.emissive_color_intensity.w;
    if (has_flag(flags, TEXTURE_EMISSIVE)) {
        let emissive_sample = textureSample(emissive_texture, texture_sampler, in.uv).rgb;
        emissive = emissive * emissive_sample;
    }

    if (shader_type == 1u) {
        let final_color = base_color + emissive;
        return vec4<f32>(final_color, alpha);
    }

    var final_color = lit_color + emissive;

    // Tone mapping + exposure to match Three.js defaults
    if (lights.tone_mapping > 0.5) {
        final_color = aces_film(final_color * lights.exposure);
    } else {
        final_color = final_color * lights.exposure;
    }

    // Gamma to sRGB output (approx Three.js renderer.outputColorSpace = sRGB)
    final_color = pow(final_color, vec3<f32>(1.0 / 2.2));

    return vec4<f32>(final_color, alpha);
}
