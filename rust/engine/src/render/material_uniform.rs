use bytemuck::{Pod, Zeroable};

/// GPU uniform buffer for material properties
/// Stores per-material data that can't fit in the instance buffer
#[repr(C)]
#[derive(Copy, Clone, Debug, Pod, Zeroable)]
pub struct MaterialUniform {
    /// Emissive RGB in xyz, intensity in w
    pub emissive_color_intensity: [f32; 4],
    /// UV offset (xy) and repeat (zw)
    pub uv_transform: [f32; 4],
    /// Normal scale, occlusion strength, alpha cutoff, padding
    pub normal_occlusion: [f32; 4],
    /// texture_flags in x, shader_type in y, alpha_mode in z, padding elsewhere
    pub flags_padding: [u32; 4],
}

/// Texture flag bits
pub const TEXTURE_ALBEDO: u32 = 1 << 0;
pub const TEXTURE_NORMAL: u32 = 1 << 1;
pub const TEXTURE_METALLIC: u32 = 1 << 2;
pub const TEXTURE_ROUGHNESS: u32 = 1 << 3;
pub const TEXTURE_EMISSIVE: u32 = 1 << 4;
pub const TEXTURE_OCCLUSION: u32 = 1 << 5;

/// Alpha modes
pub const ALPHA_MODE_OPAQUE: u32 = 0;
pub const ALPHA_MODE_BLEND: u32 = 1;
pub const ALPHA_MODE_MASK: u32 = 2;

impl MaterialUniform {
    /// Create a default material uniform (no textures, standard shader)
    pub fn new() -> Self {
        Self {
            emissive_color_intensity: [0.0, 0.0, 0.0, 0.0],
            uv_transform: [0.0, 0.0, 1.0, 1.0],
            normal_occlusion: [1.0, 1.0, 0.5, 0.0],
            flags_padding: [0, 0, ALPHA_MODE_OPAQUE, 0],
        }
    }

    /// Create material uniform from vibe_assets::Material
    pub fn from_material(material: &vibe_assets::Material) -> Self {
        let mut texture_flags = 0u32;

        if material.albedoTexture.is_some() {
            texture_flags |= TEXTURE_ALBEDO;
        }
        if material.normalTexture.is_some() {
            texture_flags |= TEXTURE_NORMAL;
        }
        if material.metallicTexture.is_some() {
            texture_flags |= TEXTURE_METALLIC;
        }
        if material.roughnessTexture.is_some() {
            texture_flags |= TEXTURE_ROUGHNESS;
        }
        if material.emissiveTexture.is_some() {
            texture_flags |= TEXTURE_EMISSIVE;
        }
        if material.occlusionTexture.is_some() {
            texture_flags |= TEXTURE_OCCLUSION;
        }

        let emissive_rgb = material.emissive_rgb();

        let shader_type = match material.shader.as_str() {
            "unlit" => 1,
            _ => 0, // default to standard
        };

        let mut alpha_mode = match material.alphaMode.as_str() {
            "blend" => ALPHA_MODE_BLEND,
            "mask" => ALPHA_MODE_MASK,
            _ => ALPHA_MODE_OPAQUE,
        };

        if material.transparent && alpha_mode == ALPHA_MODE_OPAQUE {
            alpha_mode = ALPHA_MODE_BLEND;
        }

        let uniform = Self {
            emissive_color_intensity: [
                emissive_rgb.x,
                emissive_rgb.y,
                emissive_rgb.z,
                material.emissiveIntensity,
            ],
            uv_transform: [
                material.textureOffsetX,
                material.textureOffsetY,
                material.textureRepeatX,
                material.textureRepeatY,
            ],
            normal_occlusion: [
                material.normalScale,
                material.occlusionStrength,
                material.alphaCutoff,
                0.0,
            ],
            flags_padding: [texture_flags, shader_type, alpha_mode, 0],
        };

        uniform
    }

    /// Get texture flags bitfield
    pub fn texture_flags(&self) -> u32 {
        self.flags_padding[0]
    }

    /// Set texture flags bitfield
    pub fn set_texture_flags(&mut self, flags: u32) {
        self.flags_padding[0] = flags;
    }

    /// Get shader type (0 = standard, 1 = unlit)
    pub fn shader_type(&self) -> u32 {
        self.flags_padding[1]
    }

    /// Set shader type
    pub fn set_shader_type(&mut self, shader_type: u32) {
        self.flags_padding[1] = shader_type;
    }

    /// Get alpha mode (0=opaque,1=blend,2=mask)
    pub fn alpha_mode(&self) -> u32 {
        self.flags_padding[2]
    }

    /// Set alpha mode
    pub fn set_alpha_mode(&mut self, alpha_mode: u32) {
        self.flags_padding[2] = alpha_mode;
    }

    /// Get emissive color (rgb portion)
    pub fn emissive_color(&self) -> [f32; 3] {
        [
            self.emissive_color_intensity[0],
            self.emissive_color_intensity[1],
            self.emissive_color_intensity[2],
        ]
    }

    /// Get emissive intensity (w component)
    pub fn emissive_intensity(&self) -> f32 {
        self.emissive_color_intensity[3]
    }

    /// Get UV offset (xy)
    pub fn uv_offset(&self) -> [f32; 2] {
        [self.uv_transform[0], self.uv_transform[1]]
    }

    /// Get UV repeat (zw)
    pub fn uv_repeat(&self) -> [f32; 2] {
        [self.uv_transform[2], self.uv_transform[3]]
    }

    /// Get normal scale
    pub fn normal_scale(&self) -> f32 {
        self.normal_occlusion[0]
    }

    /// Get occlusion strength
    pub fn occlusion_strength(&self) -> f32 {
        self.normal_occlusion[1]
    }

    /// Get alpha cutoff (used in mask mode)
    pub fn alpha_cutoff(&self) -> f32 {
        self.normal_occlusion[2]
    }
}

impl Default for MaterialUniform {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use vibe_assets::Material;

    #[test]
    fn test_material_uniform_default() {
        let uniform = MaterialUniform::new();
        assert_eq!(uniform.emissive_color(), [0.0, 0.0, 0.0]);
        assert_eq!(uniform.emissive_intensity(), 0.0);
        assert_eq!(uniform.uv_offset(), [0.0, 0.0]);
        assert_eq!(uniform.uv_repeat(), [1.0, 1.0]);
        assert_eq!(uniform.normal_scale(), 1.0);
        assert_eq!(uniform.occlusion_strength(), 1.0);
        assert_eq!(uniform.texture_flags(), 0);
        assert_eq!(uniform.shader_type(), 0);
    }

    #[test]
    fn test_material_uniform_from_material() {
        let material = Material {
            id: "test".to_string(),
            name: Some("Test Material".to_string()),
            color: "#ffffff".to_string(),
            roughness: 0.7,
            emissive: Some("#ff6600".to_string()),
            shader: "standard".to_string(),
            materialType: "solid".to_string(),
            metalness: 0.5,
            emissiveIntensity: 2.0,
            albedoTexture: Some("albedo.png".to_string()),
            normalTexture: Some("normal.png".to_string()),
            metallicTexture: None,
            roughnessTexture: None,
            emissiveTexture: Some("emissive.png".to_string()),
            occlusionTexture: None,
            normalScale: 1.5,
            occlusionStrength: 0.8,
            textureOffsetX: 0.1,
            textureOffsetY: 0.2,
            textureRepeatX: 2.0,
            textureRepeatY: 3.0,
            transparent: false,
            alphaMode: "opaque".to_string(),
            alphaCutoff: 0.5,
        };

        let uniform = MaterialUniform::from_material(&material);

        assert_eq!(uniform.emissive_intensity(), 2.0);
        assert_eq!(uniform.uv_offset(), [0.1, 0.2]);
        assert_eq!(uniform.uv_repeat(), [2.0, 3.0]);
        assert_eq!(uniform.normal_scale(), 1.5);
        assert_eq!(uniform.occlusion_strength(), 0.8);

        // Check texture flags
        let flags = uniform.texture_flags();
        assert_eq!(flags & TEXTURE_ALBEDO, TEXTURE_ALBEDO);
        assert_eq!(flags & TEXTURE_NORMAL, TEXTURE_NORMAL);
        assert_eq!(flags & TEXTURE_EMISSIVE, TEXTURE_EMISSIVE);
        assert_eq!(flags & TEXTURE_METALLIC, 0);
        assert_eq!(flags & TEXTURE_ROUGHNESS, 0);
        assert_eq!(flags & TEXTURE_OCCLUSION, 0);

        assert_eq!(uniform.shader_type(), 0); // standard
    }

    #[test]
    fn test_material_uniform_unlit_shader() {
        let material = Material {
            id: "unlit".to_string(),
            name: Some("Unlit Material".to_string()),
            color: "#ffffff".to_string(),
            roughness: 0.7,
            emissive: None,
            shader: "unlit".to_string(),
            materialType: "solid".to_string(),
            metalness: 0.0,
            emissiveIntensity: 0.0,
            albedoTexture: Some("sprite.png".to_string()),
            normalTexture: None,
            metallicTexture: None,
            roughnessTexture: None,
            emissiveTexture: None,
            occlusionTexture: None,
            normalScale: 1.0,
            occlusionStrength: 1.0,
            textureOffsetX: 0.0,
            textureOffsetY: 0.0,
            textureRepeatX: 1.0,
            textureRepeatY: 1.0,
            transparent: false,
            alphaMode: "opaque".to_string(),
            alphaCutoff: 0.5,
        };

        let uniform = MaterialUniform::from_material(&material);
        assert_eq!(uniform.shader_type(), 1); // unlit
    }
}
