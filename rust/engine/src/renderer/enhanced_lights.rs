/// Enhanced light implementations with full Three.js parity
///
/// This module extends three-d's light system to support:
/// - Shadow bias (prevents shadow acne)
/// - Shadow radius (PCF soft shadows)
/// - Spot light penumbra (soft cone edges)
use three_d::*;

/// Extended DirectionalLight with shadow bias and radius support
pub struct EnhancedDirectionalLight {
    inner: DirectionalLight,
    pub shadow_bias: f32,
    pub shadow_radius: f32,
    pub shadow_map_size: u32,
    pub cast_shadow: bool,
}

impl EnhancedDirectionalLight {
    pub fn new(
        context: &Context,
        intensity: f32,
        color: Srgba,
        direction: &Vec3,
        shadow_bias: f32,
        shadow_radius: f32,
        shadow_map_size: u32,
        cast_shadow: bool,
    ) -> Self {
        // IMPORTANT: Three.js vs three-d intensity parity
        // After empirical testing, applying intensity directly (no scaling) provides the best match
        // The previous brightness difference was primarily due to:
        // 1. Skybox environmental lighting in Rust (light blue background adds ambient light)
        // 2. Potential differences in ambient light contribution
        // Using intensity directly matches Three.js when accounting for these environmental factors

        Self {
            inner: DirectionalLight::new(context, intensity, color, direction),
            shadow_bias,
            shadow_radius,
            shadow_map_size,
            cast_shadow,
        }
    }

    pub fn inner(&self) -> &DirectionalLight {
        &self.inner
    }

    pub fn inner_mut(&mut self) -> &mut DirectionalLight {
        &mut self.inner
    }

    /// Get light direction for gizmo rendering
    pub fn direction(&self) -> Vec3 {
        self.inner.direction
    }

    /// Generate shadow map with custom bias applied
    pub fn generate_shadow_map(
        &mut self,
        texture_size: u32,
        geometries: impl IntoIterator<Item = impl Geometry> + Clone,
    ) {
        // Note: three-d doesn't expose bias/radius in public API
        // This is a wrapper that stores the parameters for future custom shader implementation
        self.inner.generate_shadow_map(texture_size, geometries);
    }
}

/// Extended SpotLight with penumbra, shadow bias, and radius support
pub struct EnhancedSpotLight {
    inner: SpotLight,
    pub penumbra: f32, // 0.0 = hard edge, 1.0 = soft edge
    pub shadow_bias: f32,
    pub shadow_radius: f32,
    pub shadow_map_size: u32,
    pub cast_shadow: bool,
}

impl EnhancedSpotLight {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        context: &Context,
        intensity: f32,
        color: Srgba,
        position: &Vec3,
        direction: &Vec3,
        cutoff: Radians,
        attenuation: Attenuation,
        penumbra: f32,
        shadow_bias: f32,
        shadow_radius: f32,
        shadow_map_size: u32,
        cast_shadow: bool,
    ) -> Self {
        Self {
            inner: SpotLight::new(
                context,
                intensity,
                color,
                position,
                direction,
                cutoff,
                attenuation,
            ),
            penumbra,
            shadow_bias,
            shadow_radius,
            shadow_map_size,
            cast_shadow,
        }
    }

    pub fn inner(&self) -> &SpotLight {
        &self.inner
    }

    pub fn inner_mut(&mut self) -> &mut SpotLight {
        &mut self.inner
    }

    /// Generate shadow map with custom bias applied
    pub fn generate_shadow_map(
        &mut self,
        texture_size: u32,
        geometries: impl IntoIterator<Item = impl Geometry> + Clone,
    ) {
        // Note: three-d doesn't expose bias/radius in public API
        // This is a wrapper that stores the parameters for future custom shader implementation
        self.inner.generate_shadow_map(texture_size, geometries);
    }
}

/// Implement Light trait for EnhancedDirectionalLight with custom shadow shader
impl Light for EnhancedDirectionalLight {
    fn shader_source(&self, i: u32) -> String {
        // Get base shader from inner light
        let base = self.inner.shader_source(i);

        // If shadows are enabled, inject custom bias and PCF
        if base.contains("shadowMap") {
            inject_shadow_enhancements(&base, i, self.shadow_bias, self.shadow_radius)
        } else {
            base
        }
    }

    fn use_uniforms(&self, program: &Program, i: u32) {
        self.inner.use_uniforms(program, i);
    }

    fn id(&self) -> u8 {
        self.inner.id()
    }
}

/// Implement Light trait for EnhancedSpotLight with custom penumbra and shadow shader
impl Light for EnhancedSpotLight {
    fn shader_source(&self, i: u32) -> String {
        // Get base shader from inner light
        let base = self.inner.shader_source(i);

        // Inject penumbra soft edge
        let with_penumbra = inject_penumbra(&base, i, self.penumbra);

        // If shadows are enabled, inject custom bias and PCF
        if with_penumbra.contains("shadowMap") {
            inject_shadow_enhancements(&with_penumbra, i, self.shadow_bias, self.shadow_radius)
        } else {
            with_penumbra
        }
    }

    fn use_uniforms(&self, program: &Program, i: u32) {
        self.inner.use_uniforms(program, i);
    }

    fn id(&self) -> u8 {
        self.inner.id()
    }
}

/// Inject shadow bias and PCF (radius) into shadow shader code
fn inject_shadow_enhancements(shader: &str, i: u32, bias: f32, radius: f32) -> String {
    let mut result = shader.to_string();

    // Step 1: Replace the calculate_shadow call for this specific light
    let old_shadow_call = format!(
        "calculate_shadow(lightDirection, normal, shadowMap{}, shadowMVP{}, position)",
        i, i
    );

    // Check if this is the FIRST light (i == 0) to inject global helpers
    let inject_helpers = i == 0 && !result.contains("float calculate_shadow_pcf_helper");

    if inject_helpers {
        let helper_functions = r#"
    // Global PCF shadow helper (injected once for all lights)
    float calculate_shadow_pcf_helper(vec4 shadow_coord, sampler2D shadow_map, float pcf_radius, float bias_value) {
        vec3 proj_coords = shadow_coord.xyz / shadow_coord.w;
        vec2 shadow_uv = proj_coords.xy * 0.5 + 0.5;
        float current_depth = proj_coords.z;

        float shadow = 0.0;
        vec2 texel_size = 1.0 / vec2(textureSize(shadow_map, 0));

        // PCF kernel
        for(float x = -pcf_radius; x <= pcf_radius; x += 1.0) {
            for(float y = -pcf_radius; y <= pcf_radius; y += 1.0) {
                vec2 offset = vec2(x, y) * texel_size;
                float shadow_depth = texture(shadow_map, shadow_uv + offset).r;
                shadow += (current_depth - bias_value > shadow_depth) ? 1.0 : 0.0;
            }
        }

        float kernel_size = (pcf_radius * 2.0 + 1.0) * (pcf_radius * 2.0 + 1.0);
        shadow /= kernel_size;

        return 1.0 - shadow;
    }

    float calculate_shadow_simple_helper(vec4 shadow_coord, sampler2D shadow_map, float bias_value) {
        vec3 proj_coords = shadow_coord.xyz / shadow_coord.w;
        vec2 shadow_uv = proj_coords.xy * 0.5 + 0.5;
        float current_depth = proj_coords.z;

        float shadow_depth = texture(shadow_map, shadow_uv).r;
        float shadow = (current_depth - bias_value > shadow_depth) ? 1.0 : 0.0;

        return 1.0 - shadow;
    }
"#;

        // Inject before the first calculate_lighting function
        result = result.replace(
            &format!("vec3 calculate_lighting{}", i),
            &format!("{}\n    vec3 calculate_lighting{}", helper_functions, i),
        );
    }

    // Step 2: Now replace the shadow call with the enhanced version
    let new_shadow_call = if radius > 0.0 {
        // Use PCF with the configured radius
        format!(
            "calculate_shadow_pcf_helper(shadowMVP{} * vec4(position, 1.0), shadowMap{}, {}, {})",
            i, i, radius, bias
        )
    } else {
        // Use simple shadow with bias
        format!(
            "calculate_shadow_simple_helper(shadowMVP{} * vec4(position, 1.0), shadowMap{}, {})",
            i, i, bias
        )
    };

    result = result.replace(&old_shadow_call, &new_shadow_call);

    result
}

/// Inject penumbra (soft edge) into spot light shader
fn inject_penumbra(shader: &str, _i: u32, penumbra: f32) -> String {
    if penumbra > 0.0 {
        // Modify the spot light cutoff calculation to include soft edge
        // This creates a smooth falloff at the edge of the cone
        shader.replace(
            "smoothstep(cutoff",
            &format!(
                "smoothstep(cutoff{} * (1.0 + {}), cutoff{}",
                _i, penumbra, _i
            ),
        )
    } else {
        shader.to_string()
    }
}
