use anyhow::Result;
use serde::{Deserialize, Deserializer, Serialize};
use serde_json::Value;
use std::any::Any;
use vibe_scene::ComponentKindId;

use crate::{ComponentCapabilities, IComponentDecoder};

// ============================================================================
// Component Types (duplicated from main engine for now, will refactor later)
// ============================================================================

// Helper structs for deserializing object-based vectors
#[derive(Debug, Deserialize, Clone)]
struct Vec3Object {
    x: f32,
    y: f32,
    z: f32,
}

#[derive(Debug, Deserialize, Clone)]
struct Vec2Object {
    u: f32,
    v: f32,
}

// Custom deserializers that handle both array and object formats
fn deserialize_optional_vec3<'de, D>(deserializer: D) -> Result<Option<[f32; 3]>, D::Error>
where
    D: Deserializer<'de>,
{
    #[derive(Deserialize)]
    #[serde(untagged)]
    enum Vec3Format {
        Array([f32; 3]),
        Object(Vec3Object),
    }

    Ok(
        Option::<Vec3Format>::deserialize(deserializer)?.map(|v| match v {
            Vec3Format::Array(arr) => arr,
            Vec3Format::Object(obj) => [obj.x, obj.y, obj.z],
        }),
    )
}

fn deserialize_optional_vec2<'de, D>(deserializer: D) -> Result<Option<[f32; 2]>, D::Error>
where
    D: Deserializer<'de>,
{
    #[derive(Deserialize)]
    #[serde(untagged)]
    enum Vec2Format {
        Array([f32; 2]),
        Object(Vec2Object),
    }

    Ok(
        Option::<Vec2Format>::deserialize(deserializer)?.map(|v| match v {
            Vec2Format::Array(arr) => arr,
            Vec2Format::Object(obj) => [obj.u, obj.v],
        }),
    )
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Transform {
    #[serde(default)]
    pub position: Option<[f32; 3]>,
    #[serde(default)]
    pub rotation: Option<Vec<f32>>,
    #[serde(default)]
    pub scale: Option<[f32; 3]>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct CameraColor {
    #[serde(default)]
    pub r: f32,
    #[serde(default)]
    pub g: f32,
    #[serde(default)]
    pub b: f32,
    #[serde(default = "default_alpha")]
    pub a: f32,
}

fn default_alpha() -> f32 {
    1.0
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct CameraComponent {
    #[serde(default = "default_fov")]
    pub fov: f32,
    #[serde(default = "default_near")]
    pub near: f32,
    #[serde(default = "default_far")]
    pub far: f32,
    #[serde(default, rename = "isMain")]
    pub is_main: bool,
    #[serde(default = "default_projection_type", rename = "projectionType")]
    pub projection_type: String,
    #[serde(default = "default_orthographic_size", rename = "orthographicSize")]
    pub orthographic_size: f32,
    #[serde(default)]
    pub depth: i32,

    // Background and clear behavior
    #[serde(default, rename = "clearFlags")]
    pub clear_flags: Option<String>,
    #[serde(default, rename = "backgroundColor")]
    pub background_color: Option<CameraColor>,
    #[serde(default, rename = "skyboxTexture")]
    pub skybox_texture: Option<String>,

    // Control & follow
    #[serde(default, rename = "controlMode")]
    pub control_mode: Option<String>, // "locked" | "free"
    #[serde(default, rename = "enableSmoothing")]
    pub enable_smoothing: bool,
    #[serde(default, rename = "followTarget")]
    pub follow_target: Option<u32>,
    #[serde(
        default,
        rename = "followOffset",
        deserialize_with = "deserialize_optional_vec3"
    )]
    pub follow_offset: Option<[f32; 3]>,
    #[serde(default = "default_smoothing_speed", rename = "smoothingSpeed")]
    pub smoothing_speed: f32,
    #[serde(default = "default_rotation_smoothing", rename = "rotationSmoothing")]
    pub rotation_smoothing: f32,

    // Viewport (normalized 0..1)
    #[serde(default, rename = "viewportRect")]
    pub viewport_rect: Option<ViewportRect>,

    // HDR / Tone Mapping
    #[serde(default)]
    pub hdr: bool,
    #[serde(default, rename = "toneMapping")]
    pub tone_mapping: Option<String>, // none | linear | reinhard | cineon | aces
    #[serde(
        default = "default_tone_mapping_exposure",
        rename = "toneMappingExposure"
    )]
    pub tone_mapping_exposure: f32,

    // Post-processing
    #[serde(default, rename = "enablePostProcessing")]
    pub enable_post_processing: bool,
    #[serde(default, rename = "postProcessingPreset")]
    pub post_processing_preset: Option<String>,

    // Skybox transforms
    #[serde(
        default,
        rename = "skyboxScale",
        deserialize_with = "deserialize_optional_vec3"
    )]
    pub skybox_scale: Option<[f32; 3]>,
    #[serde(
        default,
        rename = "skyboxRotation",
        deserialize_with = "deserialize_optional_vec3"
    )]
    pub skybox_rotation: Option<[f32; 3]>,
    #[serde(
        default,
        rename = "skyboxRepeat",
        deserialize_with = "deserialize_optional_vec2"
    )]
    pub skybox_repeat: Option<[f32; 2]>,
    #[serde(
        default,
        rename = "skyboxOffset",
        deserialize_with = "deserialize_optional_vec2"
    )]
    pub skybox_offset: Option<[f32; 2]>,
    #[serde(default = "default_skybox_intensity", rename = "skyboxIntensity")]
    pub skybox_intensity: f32,
    #[serde(default, rename = "skyboxBlur")]
    pub skybox_blur: f32,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ViewportRect {
    #[serde(default)]
    pub x: f32,
    #[serde(default)]
    pub y: f32,
    #[serde(default = "default_one")]
    pub width: f32,
    #[serde(default = "default_one")]
    pub height: f32,
}

fn default_fov() -> f32 {
    60.0
}
fn default_near() -> f32 {
    0.1
}
fn default_far() -> f32 {
    100.0
}
fn default_projection_type() -> String {
    "perspective".to_string()
}
fn default_orthographic_size() -> f32 {
    10.0
}
fn default_smoothing_speed() -> f32 {
    5.0
}
fn default_rotation_smoothing() -> f32 {
    5.0
}
fn default_tone_mapping_exposure() -> f32 {
    1.0
}
fn default_skybox_intensity() -> f32 {
    1.0
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct LightColor {
    #[serde(default = "default_one")]
    pub r: f32,
    #[serde(default = "default_one")]
    pub g: f32,
    #[serde(default = "default_one")]
    pub b: f32,
}

fn default_one() -> f32 {
    1.0
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Light {
    #[serde(default = "default_light_type")]
    pub lightType: String,
    #[serde(default)]
    pub color: Option<LightColor>,
    #[serde(default = "default_intensity")]
    pub intensity: f32,
    #[serde(default = "default_enabled")]
    pub enabled: bool,
    #[serde(default = "default_enabled")]
    pub castShadow: bool,
    #[serde(default)]
    pub directionX: f32,
    #[serde(default = "default_neg_one")]
    pub directionY: f32,
    #[serde(default)]
    pub directionZ: f32,
    #[serde(default = "default_range")]
    pub range: f32,
    #[serde(default = "default_one")]
    pub decay: f32,
    #[serde(default = "default_angle")]
    pub angle: f32,
    #[serde(default = "default_penumbra")]
    pub penumbra: f32,
    #[serde(default = "default_shadow_map_size")]
    pub shadowMapSize: u32,
    #[serde(default = "default_shadow_bias")]
    pub shadowBias: f32,
    #[serde(default = "default_shadow_radius")]
    pub shadowRadius: f32,
}

fn default_light_type() -> String {
    "directional".to_string()
}
fn default_intensity() -> f32 {
    1.0
}
fn default_enabled() -> bool {
    true
}
fn default_neg_one() -> f32 {
    -1.0
}
fn default_range() -> f32 {
    10.0
}
fn default_angle() -> f32 {
    std::f32::consts::PI / 6.0
}
fn default_penumbra() -> f32 {
    0.1
}
fn default_shadow_map_size() -> u32 {
    2048 // Higher resolution for smoother shadows (was 1024)
}
fn default_shadow_bias() -> f32 {
    -0.0001 // Prevents shadow acne
}
fn default_shadow_radius() -> f32 {
    2.0 // PCF filtering radius for soft shadow edges (was 1.0)
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct MeshRenderer {
    #[serde(default)]
    pub meshId: Option<String>,
    #[serde(default)]
    pub materialId: Option<String>,
    #[serde(default)]
    pub materials: Option<Vec<String>>,
    #[serde(default)]
    pub material: Option<MeshRendererMaterialOverride>,
    #[serde(default)]
    pub modelPath: Option<String>,
    #[serde(default = "default_enabled")]
    pub enabled: bool,
    #[serde(default = "default_enabled")]
    pub castShadows: bool,
    #[serde(default = "default_enabled")]
    pub receiveShadows: bool,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Material {
    #[serde(default)]
    pub id: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone, Default)]
pub struct MeshRendererMaterialOverride {
    #[serde(default)]
    pub shader: Option<String>,
    #[serde(default, rename = "materialType")]
    pub material_type: Option<String>,
    #[serde(default)]
    pub color: Option<String>,
    #[serde(default, rename = "albedoTexture")]
    pub albedo_texture: Option<String>,
    #[serde(default, rename = "normalTexture")]
    pub normal_texture: Option<String>,
    #[serde(default, rename = "normalScale")]
    pub normal_scale: Option<f32>,
    #[serde(default)]
    pub metalness: Option<f32>,
    #[serde(default, rename = "metallicTexture")]
    pub metallic_texture: Option<String>,
    #[serde(default)]
    pub roughness: Option<f32>,
    #[serde(default, rename = "roughnessTexture")]
    pub roughness_texture: Option<String>,
    #[serde(default)]
    pub emissive: Option<String>,
    #[serde(default, rename = "emissiveIntensity")]
    pub emissive_intensity: Option<f32>,
    #[serde(default, rename = "emissiveTexture")]
    pub emissive_texture: Option<String>,
    #[serde(default, rename = "occlusionTexture")]
    pub occlusion_texture: Option<String>,
    #[serde(default, rename = "occlusionStrength")]
    pub occlusion_strength: Option<f32>,
    #[serde(default, rename = "textureOffsetX")]
    pub texture_offset_x: Option<f32>,
    #[serde(default, rename = "textureOffsetY")]
    pub texture_offset_y: Option<f32>,
    #[serde(default, rename = "textureRepeatX")]
    pub texture_repeat_x: Option<f32>,
    #[serde(default, rename = "textureRepeatY")]
    pub texture_repeat_y: Option<f32>,
    #[serde(default)]
    pub transparent: Option<bool>,
    #[serde(default, rename = "alphaMode")]
    pub alpha_mode: Option<String>,
    #[serde(default, rename = "alphaCutoff")]
    pub alpha_cutoff: Option<f32>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct RigidBodyMaterial {
    #[serde(default = "default_friction")]
    pub friction: f32,
    #[serde(default = "default_restitution")]
    pub restitution: f32,
    #[serde(default = "default_density")]
    pub density: f32,
}

fn default_friction() -> f32 {
    0.7
}

fn default_restitution() -> f32 {
    0.3
}

fn default_density() -> f32 {
    1.0
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct RigidBody {
    #[serde(default = "default_enabled")]
    pub enabled: bool,
    #[serde(default = "default_body_type")]
    pub bodyType: String,
    #[serde(default, rename = "type")]
    pub type_: Option<String>, // Legacy field for backward compat
    #[serde(default = "default_mass")]
    pub mass: f32,
    #[serde(default = "default_gravity_scale")]
    pub gravityScale: f32,
    #[serde(default = "default_can_sleep")]
    pub canSleep: bool,
    #[serde(default)]
    pub material: Option<RigidBodyMaterial>,
}

fn default_body_type() -> String {
    "dynamic".to_string()
}

fn default_mass() -> f32 {
    1.0
}

fn default_gravity_scale() -> f32 {
    1.0
}

fn default_can_sleep() -> bool {
    true
}

impl RigidBody {
    /// Get the body type, preferring bodyType over legacy type field
    /// If only legacy "type" field is provided, use that instead of default
    pub fn get_body_type(&self) -> &str {
        // If type_ is explicitly set and bodyType is the default, prefer type_
        if let Some(ref type_) = self.type_ {
            if self.bodyType == "dynamic" {
                // bodyType is default, so legacy type takes precedence
                return type_;
            }
        }
        // Otherwise use bodyType (either explicitly set or default)
        &self.bodyType
    }
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct MeshColliderSize {
    #[serde(default = "default_one")]
    pub width: f32,
    #[serde(default = "default_one")]
    pub height: f32,
    #[serde(default = "default_one")]
    pub depth: f32,
    #[serde(default = "default_radius")]
    pub radius: f32,
    #[serde(default = "default_radius")]
    pub capsuleRadius: f32,
    #[serde(default = "default_capsule_height")]
    pub capsuleHeight: f32,
}

fn default_radius() -> f32 {
    0.5
}

fn default_capsule_height() -> f32 {
    2.0
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct PhysicsMaterialData {
    #[serde(default = "default_friction")]
    pub friction: f32,
    #[serde(default = "default_restitution")]
    pub restitution: f32,
    #[serde(default = "default_density")]
    pub density: f32,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct MeshCollider {
    #[serde(default = "default_enabled")]
    pub enabled: bool,
    #[serde(default = "default_collider_type")]
    pub colliderType: String,
    #[serde(default)]
    pub isTrigger: bool,
    #[serde(default = "default_center")]
    pub center: [f32; 3],
    #[serde(default)]
    pub size: MeshColliderSize,
    #[serde(default)]
    pub physicsMaterial: PhysicsMaterialData,
}

fn default_collider_type() -> String {
    "box".to_string()
}

fn default_center() -> [f32; 3] {
    [0.0, 0.0, 0.0]
}

impl Default for MeshColliderSize {
    fn default() -> Self {
        Self {
            width: default_one(),
            height: default_one(),
            depth: default_one(),
            radius: default_radius(),
            capsuleRadius: default_radius(),
            capsuleHeight: default_capsule_height(),
        }
    }
}

impl Default for PhysicsMaterialData {
    fn default() -> Self {
        Self {
            friction: default_friction(),
            restitution: default_restitution(),
            density: default_density(),
        }
    }
}

// ============================================================================
// Decoders
// ============================================================================

pub struct TransformDecoder;

impl IComponentDecoder for TransformDecoder {
    fn can_decode(&self, kind: &str) -> bool {
        kind == "Transform"
    }

    fn decode(&self, value: &Value) -> Result<Box<dyn Any>> {
        let component: Transform = serde_json::from_value(value.clone())?;
        Ok(Box::new(component))
    }

    fn capabilities(&self) -> ComponentCapabilities {
        ComponentCapabilities {
            affects_rendering: true,
            requires_pass: Some("geometry"),
            stable: true,
        }
    }

    fn component_kinds(&self) -> Vec<ComponentKindId> {
        vec![ComponentKindId::new("Transform")]
    }
}

pub struct CameraDecoder;

impl IComponentDecoder for CameraDecoder {
    fn can_decode(&self, kind: &str) -> bool {
        kind == "Camera"
    }

    fn decode(&self, value: &Value) -> Result<Box<dyn Any>> {
        let component: CameraComponent = serde_json::from_value(value.clone())?;
        Ok(Box::new(component))
    }

    fn capabilities(&self) -> ComponentCapabilities {
        ComponentCapabilities {
            affects_rendering: true,
            requires_pass: Some("geometry"),
            stable: true,
        }
    }

    fn component_kinds(&self) -> Vec<ComponentKindId> {
        vec![ComponentKindId::new("Camera")]
    }
}

pub struct LightDecoder;

impl IComponentDecoder for LightDecoder {
    fn can_decode(&self, kind: &str) -> bool {
        kind == "Light"
    }

    fn decode(&self, value: &Value) -> Result<Box<dyn Any>> {
        let component: Light = serde_json::from_value(value.clone())?;
        Ok(Box::new(component))
    }

    fn capabilities(&self) -> ComponentCapabilities {
        ComponentCapabilities {
            affects_rendering: true,
            requires_pass: Some("shadow"),
            stable: true,
        }
    }

    fn component_kinds(&self) -> Vec<ComponentKindId> {
        vec![ComponentKindId::new("Light")]
    }
}

pub struct MeshRendererDecoder;

impl IComponentDecoder for MeshRendererDecoder {
    fn can_decode(&self, kind: &str) -> bool {
        kind == "MeshRenderer"
    }

    fn decode(&self, value: &Value) -> Result<Box<dyn Any>> {
        let component: MeshRenderer = serde_json::from_value(value.clone())?;
        Ok(Box::new(component))
    }

    fn capabilities(&self) -> ComponentCapabilities {
        ComponentCapabilities {
            affects_rendering: true,
            requires_pass: Some("geometry"),
            stable: true,
        }
    }

    fn component_kinds(&self) -> Vec<ComponentKindId> {
        vec![ComponentKindId::new("MeshRenderer")]
    }
}

pub struct MaterialDecoder;

impl IComponentDecoder for MaterialDecoder {
    fn can_decode(&self, kind: &str) -> bool {
        kind == "Material"
    }

    fn decode(&self, value: &Value) -> Result<Box<dyn Any>> {
        let component: Material = serde_json::from_value(value.clone())?;
        Ok(Box::new(component))
    }

    fn capabilities(&self) -> ComponentCapabilities {
        ComponentCapabilities {
            affects_rendering: true,
            requires_pass: Some("geometry"),
            stable: true,
        }
    }

    fn component_kinds(&self) -> Vec<ComponentKindId> {
        vec![ComponentKindId::new("Material")]
    }
}

pub struct RigidBodyDecoder;

impl IComponentDecoder for RigidBodyDecoder {
    fn can_decode(&self, kind: &str) -> bool {
        kind == "RigidBody"
    }

    fn decode(&self, value: &Value) -> Result<Box<dyn Any>> {
        let component: RigidBody = serde_json::from_value(value.clone())?;
        Ok(Box::new(component))
    }

    fn capabilities(&self) -> ComponentCapabilities {
        ComponentCapabilities {
            affects_rendering: false,
            requires_pass: None,
            stable: true,
        }
    }

    fn component_kinds(&self) -> Vec<ComponentKindId> {
        vec![ComponentKindId::new("RigidBody")]
    }
}

pub struct MeshColliderDecoder;

impl IComponentDecoder for MeshColliderDecoder {
    fn can_decode(&self, kind: &str) -> bool {
        kind == "MeshCollider"
    }

    fn decode(&self, value: &Value) -> Result<Box<dyn Any>> {
        let component: MeshCollider = serde_json::from_value(value.clone())?;
        Ok(Box::new(component))
    }

    fn capabilities(&self) -> ComponentCapabilities {
        ComponentCapabilities {
            affects_rendering: false,
            requires_pass: None,
            stable: true,
        }
    }

    fn component_kinds(&self) -> Vec<ComponentKindId> {
        vec![ComponentKindId::new("MeshCollider")]
    }
}

// ============================================================================
// PrefabInstance Component
// ============================================================================

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct PrefabInstance {
    #[serde(default)]
    pub prefabId: String,
    #[serde(default = "default_version")]
    pub version: u32,
    #[serde(default)]
    pub instanceUuid: String,
    #[serde(default)]
    pub overridePatch: Option<Value>,
}

fn default_version() -> u32 {
    1
}

pub struct PrefabInstanceDecoder;

impl IComponentDecoder for PrefabInstanceDecoder {
    fn can_decode(&self, kind: &str) -> bool {
        kind == "PrefabInstance"
    }

    fn decode(&self, value: &Value) -> Result<Box<dyn Any>> {
        let component: PrefabInstance = serde_json::from_value(value.clone())?;
        Ok(Box::new(component))
    }

    fn capabilities(&self) -> ComponentCapabilities {
        ComponentCapabilities {
            affects_rendering: false,
            requires_pass: None,
            stable: true,
        }
    }

    fn component_kinds(&self) -> Vec<ComponentKindId> {
        vec![ComponentKindId::new("PrefabInstance")]
    }
}

// ============================================================================
// Instanced Component
// ============================================================================

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct InstanceData {
    pub position: [f32; 3],
    #[serde(default)]
    pub rotation: Option<[f32; 3]>,
    #[serde(default)]
    pub scale: Option<[f32; 3]>,
    #[serde(default)]
    pub color: Option<[f32; 3]>,
    #[serde(default)]
    pub userData: Option<Value>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Instanced {
    #[serde(default = "default_true")]
    pub enabled: bool,
    #[serde(default = "default_capacity")]
    pub capacity: u32,
    #[serde(default)]
    pub baseMeshId: String,
    #[serde(default)]
    pub baseMaterialId: String,
    #[serde(default)]
    pub instances: Vec<InstanceData>,
    #[serde(default = "default_true")]
    pub castShadows: bool,
    #[serde(default = "default_true")]
    pub receiveShadows: bool,
    #[serde(default = "default_true")]
    pub frustumCulled: bool,
}

fn default_true() -> bool {
    true
}

fn default_false() -> bool {
    false
}

fn default_capacity() -> u32 {
    100
}

pub struct InstancedDecoder;

impl IComponentDecoder for InstancedDecoder {
    fn can_decode(&self, kind: &str) -> bool {
        kind == "Instanced"
    }

    fn decode(&self, value: &Value) -> Result<Box<dyn Any>> {
        let component: Instanced = serde_json::from_value(value.clone())?;
        Ok(Box::new(component))
    }

    fn capabilities(&self) -> ComponentCapabilities {
        ComponentCapabilities {
            affects_rendering: true,
            requires_pass: Some("geometry"),
            stable: true,
        }
    }

    fn component_kinds(&self) -> Vec<ComponentKindId> {
        vec![ComponentKindId::new("Instanced")]
    }
}

// ============================================================================
// Terrain Component
// ============================================================================

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Terrain {
    #[serde(default = "default_size")]
    pub size: [f32; 2],
    #[serde(default = "default_segments")]
    pub segments: [u32; 2],
    #[serde(default = "default_height_scale")]
    pub heightScale: f32,
    #[serde(default = "default_true")]
    pub noiseEnabled: bool,
    #[serde(default = "default_noise_seed")]
    pub noiseSeed: u32,
    #[serde(default = "default_noise_frequency")]
    pub noiseFrequency: f32,
    #[serde(default = "default_noise_octaves")]
    pub noiseOctaves: u8,
    #[serde(default = "default_noise_persistence")]
    pub noisePersistence: f32,
    #[serde(default = "default_noise_lacunarity")]
    pub noiseLacunarity: f32,
}

fn default_size() -> [f32; 2] {
    [20.0, 20.0]
}

fn default_segments() -> [u32; 2] {
    [129, 129]
}

fn default_height_scale() -> f32 {
    2.0
}

fn default_noise_seed() -> u32 {
    1337
}

fn default_noise_frequency() -> f32 {
    4.0
}

fn default_noise_octaves() -> u8 {
    4
}

fn default_noise_persistence() -> f32 {
    0.5
}

fn default_noise_lacunarity() -> f32 {
    2.0
}

pub struct TerrainDecoder;

impl IComponentDecoder for TerrainDecoder {
    fn can_decode(&self, kind: &str) -> bool {
        kind == "Terrain"
    }

    fn decode(&self, value: &Value) -> Result<Box<dyn Any>> {
        let component: Terrain = serde_json::from_value(value.clone())?;
        Ok(Box::new(component))
    }

    fn capabilities(&self) -> ComponentCapabilities {
        ComponentCapabilities {
            affects_rendering: true,
            requires_pass: Some("geometry"),
            stable: true,
        }
    }

    fn component_kinds(&self) -> Vec<ComponentKindId> {
        vec![ComponentKindId::new("Terrain")]
    }
}

// ============================================================================
// Sound Component
// ============================================================================

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Sound {
    #[serde(default)]
    pub audioPath: String,
    #[serde(default = "default_true")]
    pub enabled: bool,
    #[serde(default = "default_false")]
    pub autoplay: bool,
    #[serde(default = "default_false")]
    pub loop_: bool, // 'loop' is a Rust keyword, use loop_
    #[serde(rename = "loop", default = "default_false")]
    _loop_serde: bool, // For correct serde deserialization
    #[serde(default = "default_volume")]
    pub volume: f32,
    #[serde(default = "default_pitch")]
    pub pitch: f32,
    #[serde(default = "default_playback_rate")]
    pub playbackRate: f32,
    #[serde(default = "default_false")]
    pub muted: bool,

    // 3D Spatial Audio Properties
    #[serde(default = "default_true")]
    pub is3D: bool,
    #[serde(default = "default_min_distance")]
    pub minDistance: f32,
    #[serde(default = "default_max_distance")]
    pub maxDistance: f32,
    #[serde(default = "default_rolloff_factor")]
    pub rolloffFactor: f32,
    #[serde(default = "default_cone_inner_angle")]
    pub coneInnerAngle: f32,
    #[serde(default = "default_cone_outer_angle")]
    pub coneOuterAngle: f32,
    #[serde(default = "default_cone_outer_gain")]
    pub coneOuterGain: f32,

    // Playback State (read-only, managed by system)
    #[serde(default = "default_false")]
    pub isPlaying: bool,
    #[serde(default)]
    pub currentTime: f32,
    #[serde(default)]
    pub duration: f32,

    // Audio Format
    #[serde(default)]
    pub format: Option<String>,
}

// Default value functions for Sound
fn default_volume() -> f32 {
    1.0
}

fn default_pitch() -> f32 {
    1.0
}

fn default_playback_rate() -> f32 {
    1.0
}

fn default_min_distance() -> f32 {
    1.0
}

fn default_max_distance() -> f32 {
    10000.0
}

fn default_rolloff_factor() -> f32 {
    1.0
}

fn default_cone_inner_angle() -> f32 {
    360.0
}

fn default_cone_outer_angle() -> f32 {
    360.0
}

fn default_cone_outer_gain() -> f32 {
    0.0
}

impl Sound {
    pub fn is_looping(&self) -> bool {
        self.loop_
    }
}

impl Default for Sound {
    fn default() -> Self {
        Self {
            audioPath: String::new(),
            enabled: true,
            autoplay: false,
            loop_: false,
            _loop_serde: false,
            volume: 1.0,
            pitch: 1.0,
            playbackRate: 1.0,
            muted: false,
            is3D: true,
            minDistance: 1.0,
            maxDistance: 10000.0,
            rolloffFactor: 1.0,
            coneInnerAngle: 360.0,
            coneOuterAngle: 360.0,
            coneOuterGain: 0.0,
            isPlaying: false,
            currentTime: 0.0,
            duration: 0.0,
            format: None,
        }
    }
}

pub struct SoundDecoder;

impl IComponentDecoder for SoundDecoder {
    fn can_decode(&self, kind: &str) -> bool {
        kind == "Sound"
    }

    fn decode(&self, value: &Value) -> Result<Box<dyn Any>> {
        let mut component: Sound = serde_json::from_value(value.clone())?;
        // Copy the serde-deserialized loop field to the public field
        component.loop_ = component._loop_serde;
        Ok(Box::new(component))
    }

    fn capabilities(&self) -> ComponentCapabilities {
        ComponentCapabilities {
            affects_rendering: false,
            requires_pass: Some("audio"),
            stable: true,
        }
    }

    fn component_kinds(&self) -> Vec<ComponentKindId> {
        vec![ComponentKindId::new("Sound")]
    }
}

// ============================================================================
// Helper to create a fully populated registry
// ============================================================================

use crate::ComponentRegistry;

pub fn create_default_registry() -> ComponentRegistry {
    let mut registry = ComponentRegistry::new();
    registry.register(TransformDecoder);
    registry.register(CameraDecoder);
    registry.register(LightDecoder);
    registry.register(MeshRendererDecoder);
    registry.register(MaterialDecoder);
    registry.register(RigidBodyDecoder);
    registry.register(MeshColliderDecoder);
    registry.register(PrefabInstanceDecoder);
    registry.register(InstancedDecoder);
    registry.register(TerrainDecoder);
    registry.register(SoundDecoder);
    registry
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_transform_decoder() {
        let decoder = TransformDecoder;
        assert!(decoder.can_decode("Transform"));
        assert!(!decoder.can_decode("Camera"));

        let json = serde_json::json!({
            "position": [1.0, 2.0, 3.0],
            "rotation": [0.0, 0.0, 0.0],
            "scale": [1.0, 1.0, 1.0]
        });

        let decoded = decoder.decode(&json).unwrap();
        let transform = decoded.downcast_ref::<Transform>().unwrap();
        assert_eq!(transform.position, Some([1.0, 2.0, 3.0]));
    }

    #[test]
    fn test_camera_decoder() {
        let decoder = CameraDecoder;
        assert!(decoder.can_decode("Camera"));

        let json = serde_json::json!({
            "fov": 75.0,
            "near": 0.1,
            "far": 1000.0,
            "isMain": true
        });

        let decoded = decoder.decode(&json).unwrap();
        let camera = decoded.downcast_ref::<CameraComponent>().unwrap();
        assert_eq!(camera.fov, 75.0);
        assert!(camera.is_main);
    }

    #[test]
    fn test_light_decoder() {
        let decoder = LightDecoder;
        assert!(decoder.can_decode("Light"));

        let json = serde_json::json!({
            "lightType": "directional",
            "intensity": 1.5,
            "enabled": true
        });

        let decoded = decoder.decode(&json).unwrap();
        let light = decoded.downcast_ref::<Light>().unwrap();
        assert_eq!(light.intensity, 1.5);
    }

    #[test]
    fn test_mesh_renderer_decoder() {
        let decoder = MeshRendererDecoder;
        assert!(decoder.can_decode("MeshRenderer"));

        let json = serde_json::json!({
            "meshId": "cube",
            "materialId": "default",
            "enabled": true
        });

        let decoded = decoder.decode(&json).unwrap();
        let renderer = decoded.downcast_ref::<MeshRenderer>().unwrap();
        assert_eq!(renderer.meshId.as_deref(), Some("cube"));
    }

    #[test]
    fn test_material_decoder() {
        let decoder = MaterialDecoder;
        assert!(decoder.can_decode("Material"));

        let json = serde_json::json!({
            "id": "mat-1"
        });

        let decoded = decoder.decode(&json).unwrap();
        let material = decoded.downcast_ref::<Material>().unwrap();
        assert_eq!(material.id.as_deref(), Some("mat-1"));
    }

    #[test]
    fn test_rigid_body_decoder() {
        let decoder = RigidBodyDecoder;
        assert!(decoder.can_decode("RigidBody"));
        assert!(!decoder.can_decode("MeshCollider"));

        let json = serde_json::json!({
            "enabled": true,
            "bodyType": "dynamic",
            "mass": 5.0,
            "gravityScale": 0.5,
            "canSleep": false,
            "material": {
                "friction": 0.8,
                "restitution": 0.5,
                "density": 2.0
            }
        });

        let decoded = decoder.decode(&json).unwrap();
        let rigid_body = decoded.downcast_ref::<RigidBody>().unwrap();
        assert_eq!(rigid_body.enabled, true);
        assert_eq!(rigid_body.bodyType, "dynamic");
        assert_eq!(rigid_body.mass, 5.0);
        assert_eq!(rigid_body.gravityScale, 0.5);
        assert_eq!(rigid_body.canSleep, false);
        assert!(rigid_body.material.is_some());
        let material = rigid_body.material.as_ref().unwrap();
        assert_eq!(material.friction, 0.8);
        assert_eq!(material.restitution, 0.5);
        assert_eq!(material.density, 2.0);
    }

    #[test]
    fn test_rigid_body_decoder_defaults() {
        let decoder = RigidBodyDecoder;
        let json = serde_json::json!({});

        let decoded = decoder.decode(&json).unwrap();
        let rigid_body = decoded.downcast_ref::<RigidBody>().unwrap();
        assert_eq!(rigid_body.enabled, true);
        assert_eq!(rigid_body.bodyType, "dynamic");
        assert_eq!(rigid_body.mass, 1.0);
        assert_eq!(rigid_body.gravityScale, 1.0);
        assert_eq!(rigid_body.canSleep, true);
    }

    #[test]
    fn test_rigid_body_legacy_type_field() {
        let json = serde_json::json!({
            "type": "static"
        });

        let rigid_body: RigidBody = serde_json::from_value(json).unwrap();
        assert_eq!(rigid_body.get_body_type(), "static");
    }

    #[test]
    fn test_mesh_collider_decoder() {
        let decoder = MeshColliderDecoder;
        assert!(decoder.can_decode("MeshCollider"));
        assert!(!decoder.can_decode("RigidBody"));

        let json = serde_json::json!({
            "enabled": true,
            "colliderType": "sphere",
            "isTrigger": true,
            "center": [1.0, 2.0, 3.0],
            "size": {
                "width": 2.0,
                "height": 3.0,
                "depth": 1.5,
                "radius": 1.0,
                "capsuleRadius": 0.8,
                "capsuleHeight": 3.0
            },
            "physicsMaterial": {
                "friction": 0.9,
                "restitution": 0.2,
                "density": 1.5
            }
        });

        let decoded = decoder.decode(&json).unwrap();
        let collider = decoded.downcast_ref::<MeshCollider>().unwrap();
        assert_eq!(collider.enabled, true);
        assert_eq!(collider.colliderType, "sphere");
        assert_eq!(collider.isTrigger, true);
        assert_eq!(collider.center, [1.0, 2.0, 3.0]);
        assert_eq!(collider.size.radius, 1.0);
        assert_eq!(collider.physicsMaterial.friction, 0.9);
    }

    #[test]
    fn test_mesh_collider_decoder_defaults() {
        let decoder = MeshColliderDecoder;
        let json = serde_json::json!({});

        let decoded = decoder.decode(&json).unwrap();
        let collider = decoded.downcast_ref::<MeshCollider>().unwrap();
        assert_eq!(collider.enabled, true);
        assert_eq!(collider.colliderType, "box");
        assert_eq!(collider.isTrigger, false);
        assert_eq!(collider.center, [0.0, 0.0, 0.0]);
        assert_eq!(collider.size.width, 1.0);
        assert_eq!(collider.size.height, 1.0);
        assert_eq!(collider.size.depth, 1.0);
        assert_eq!(collider.size.radius, 0.5);
        assert_eq!(collider.size.capsuleRadius, 0.5);
        assert_eq!(collider.size.capsuleHeight, 2.0);
        assert_eq!(collider.physicsMaterial.friction, 0.7);
        assert_eq!(collider.physicsMaterial.restitution, 0.3);
        assert_eq!(collider.physicsMaterial.density, 1.0);
    }

    #[test]
    fn test_default_registry() {
        let registry = create_default_registry();

        assert!(registry.has_decoder("Transform"));
        assert!(registry.has_decoder("Camera"));
        assert!(registry.has_decoder("Light"));
        assert!(registry.has_decoder("MeshRenderer"));
        assert!(registry.has_decoder("Material"));
        assert!(registry.has_decoder("RigidBody"));
        assert!(registry.has_decoder("MeshCollider"));
        assert!(!registry.has_decoder("Unknown"));
    }

    #[test]
    fn test_registry_decode_all_components() {
        let registry = create_default_registry();

        // Test Transform
        let json = serde_json::json!({"position": [1.0, 2.0, 3.0]});
        let decoded = registry.decode("Transform", &json).unwrap();
        assert!(decoded.downcast_ref::<Transform>().is_some());

        // Test Camera
        let json = serde_json::json!({"fov": 60.0});
        let decoded = registry.decode("Camera", &json).unwrap();
        assert!(decoded.downcast_ref::<CameraComponent>().is_some());

        // Test Light
        let json = serde_json::json!({"intensity": 1.0});
        let decoded = registry.decode("Light", &json).unwrap();
        assert!(decoded.downcast_ref::<Light>().is_some());

        // Test MeshRenderer
        let json = serde_json::json!({"meshId": "cube"});
        let decoded = registry.decode("MeshRenderer", &json).unwrap();
        assert!(decoded.downcast_ref::<MeshRenderer>().is_some());

        // Test Material
        let json = serde_json::json!({"id": "mat-1"});
        let decoded = registry.decode("Material", &json).unwrap();
        assert!(decoded.downcast_ref::<Material>().is_some());

        // Test RigidBody
        let json = serde_json::json!({"mass": 2.0});
        let decoded = registry.decode("RigidBody", &json).unwrap();
        assert!(decoded.downcast_ref::<RigidBody>().is_some());

        // Test MeshCollider
        let json = serde_json::json!({"colliderType": "sphere"});
        let decoded = registry.decode("MeshCollider", &json).unwrap();
        assert!(decoded.downcast_ref::<MeshCollider>().is_some());

        // Test PrefabInstance
        let json = serde_json::json!({"prefabId": "prefab-1"});
        let decoded = registry.decode("PrefabInstance", &json).unwrap();
        assert!(decoded.downcast_ref::<PrefabInstance>().is_some());

        // Test Instanced
        let json = serde_json::json!({"baseMeshId": "cube", "baseMaterialId": "mat-1"});
        let decoded = registry.decode("Instanced", &json).unwrap();
        assert!(decoded.downcast_ref::<Instanced>().is_some());

        // Test Terrain
        let json = serde_json::json!({"size": [20.0, 20.0]});
        let decoded = registry.decode("Terrain", &json).unwrap();
        assert!(decoded.downcast_ref::<Terrain>().is_some());
    }

    // ============================================================================
    // PrefabInstance Component Tests
    // ============================================================================

    #[test]
    fn test_prefab_instance_decoder() {
        let decoder = PrefabInstanceDecoder;
        assert!(decoder.can_decode("PrefabInstance"));
        assert!(!decoder.can_decode("Transform"));

        let json = serde_json::json!({
            "prefabId": "tree-prefab",
            "version": 2,
            "instanceUuid": "abc-123",
            "overridePatch": {"color": "red"}
        });

        let decoded = decoder.decode(&json).unwrap();
        let component = decoded.downcast_ref::<PrefabInstance>().unwrap();
        assert_eq!(component.prefabId, "tree-prefab");
        assert_eq!(component.version, 2);
        assert_eq!(component.instanceUuid, "abc-123");
        assert!(component.overridePatch.is_some());
    }

    #[test]
    fn test_prefab_instance_decoder_defaults() {
        let decoder = PrefabInstanceDecoder;
        let json = serde_json::json!({});

        let decoded = decoder.decode(&json).unwrap();
        let component = decoded.downcast_ref::<PrefabInstance>().unwrap();
        assert_eq!(component.prefabId, "");
        assert_eq!(component.version, 1);
        assert_eq!(component.instanceUuid, "");
        assert!(component.overridePatch.is_none());
    }

    #[test]
    fn test_prefab_instance_capabilities() {
        let decoder = PrefabInstanceDecoder;
        let caps = decoder.capabilities();
        assert!(!caps.affects_rendering);
        assert!(caps.requires_pass.is_none());
        assert!(caps.stable);
    }

    // ============================================================================
    // Instanced Component Tests
    // ============================================================================

    #[test]
    fn test_instanced_decoder() {
        let decoder = InstancedDecoder;
        assert!(decoder.can_decode("Instanced"));
        assert!(!decoder.can_decode("Transform"));

        let json = serde_json::json!({
            "enabled": true,
            "capacity": 500,
            "baseMeshId": "cube",
            "baseMaterialId": "mat-1",
            "instances": [
                {
                    "position": [1.0, 2.0, 3.0],
                    "rotation": [0.0, 90.0, 0.0],
                    "scale": [1.0, 1.0, 1.0],
                    "color": [1.0, 0.0, 0.0]
                },
                {
                    "position": [4.0, 5.0, 6.0]
                }
            ],
            "castShadows": true,
            "receiveShadows": false,
            "frustumCulled": true
        });

        let decoded = decoder.decode(&json).unwrap();
        let component = decoded.downcast_ref::<Instanced>().unwrap();
        assert_eq!(component.enabled, true);
        assert_eq!(component.capacity, 500);
        assert_eq!(component.baseMeshId, "cube");
        assert_eq!(component.baseMaterialId, "mat-1");
        assert_eq!(component.instances.len(), 2);
        assert_eq!(component.instances[0].position, [1.0, 2.0, 3.0]);
        assert_eq!(component.instances[0].rotation, Some([0.0, 90.0, 0.0]));
        assert_eq!(component.instances[0].scale, Some([1.0, 1.0, 1.0]));
        assert_eq!(component.instances[0].color, Some([1.0, 0.0, 0.0]));
        assert_eq!(component.instances[1].position, [4.0, 5.0, 6.0]);
        assert_eq!(component.instances[1].rotation, None);
        assert_eq!(component.castShadows, true);
        assert_eq!(component.receiveShadows, false);
        assert_eq!(component.frustumCulled, true);
    }

    #[test]
    fn test_instanced_decoder_defaults() {
        let decoder = InstancedDecoder;
        let json = serde_json::json!({});

        let decoded = decoder.decode(&json).unwrap();
        let component = decoded.downcast_ref::<Instanced>().unwrap();
        assert_eq!(component.enabled, true);
        assert_eq!(component.capacity, 100);
        assert_eq!(component.baseMeshId, "");
        assert_eq!(component.baseMaterialId, "");
        assert_eq!(component.instances.len(), 0);
        assert_eq!(component.castShadows, true);
        assert_eq!(component.receiveShadows, true);
        assert_eq!(component.frustumCulled, true);
    }

    #[test]
    fn test_instanced_capabilities() {
        let decoder = InstancedDecoder;
        let caps = decoder.capabilities();
        assert!(caps.affects_rendering);
        assert_eq!(caps.requires_pass, Some("geometry"));
        assert!(caps.stable);
    }

    // ============================================================================
    // Terrain Component Tests
    // ============================================================================

    #[test]
    fn test_terrain_decoder() {
        let decoder = TerrainDecoder;
        assert!(decoder.can_decode("Terrain"));
        assert!(!decoder.can_decode("Transform"));

        let json = serde_json::json!({
            "size": [40.0, 40.0],
            "segments": [257, 257],
            "heightScale": 5.0,
            "noiseEnabled": true,
            "noiseSeed": 42,
            "noiseFrequency": 8.0,
            "noiseOctaves": 6,
            "noisePersistence": 0.6,
            "noiseLacunarity": 2.5
        });

        let decoded = decoder.decode(&json).unwrap();
        let component = decoded.downcast_ref::<Terrain>().unwrap();
        assert_eq!(component.size, [40.0, 40.0]);
        assert_eq!(component.segments, [257, 257]);
        assert_eq!(component.heightScale, 5.0);
        assert_eq!(component.noiseEnabled, true);
        assert_eq!(component.noiseSeed, 42);
        assert_eq!(component.noiseFrequency, 8.0);
        assert_eq!(component.noiseOctaves, 6);
        assert_eq!(component.noisePersistence, 0.6);
        assert_eq!(component.noiseLacunarity, 2.5);
    }

    #[test]
    fn test_terrain_decoder_defaults() {
        let decoder = TerrainDecoder;
        let json = serde_json::json!({});

        let decoded = decoder.decode(&json).unwrap();
        let component = decoded.downcast_ref::<Terrain>().unwrap();
        assert_eq!(component.size, [20.0, 20.0]);
        assert_eq!(component.segments, [129, 129]);
        assert_eq!(component.heightScale, 2.0);
        assert_eq!(component.noiseEnabled, true);
        assert_eq!(component.noiseSeed, 1337);
        assert_eq!(component.noiseFrequency, 4.0);
        assert_eq!(component.noiseOctaves, 4);
        assert_eq!(component.noisePersistence, 0.5);
        assert_eq!(component.noiseLacunarity, 2.0);
    }

    #[test]
    fn test_terrain_capabilities() {
        let decoder = TerrainDecoder;
        let caps = decoder.capabilities();
        assert!(caps.affects_rendering);
        assert_eq!(caps.requires_pass, Some("geometry"));
        assert!(caps.stable);
    }

    #[test]
    fn test_default_registry_has_new_components() {
        let registry = create_default_registry();

        assert!(registry.has_decoder("PrefabInstance"));
        assert!(registry.has_decoder("Instanced"));
        assert!(registry.has_decoder("Terrain"));
        assert!(registry.has_decoder("Sound"));
    }

    // ============================================================================
    // Sound Component Tests
    // ============================================================================

    #[test]
    fn test_sound_decoder() {
        let decoder = SoundDecoder;
        assert!(decoder.can_decode("Sound"));
        assert!(!decoder.can_decode("Light"));

        let json = serde_json::json!({
            "audioPath": "/sounds/music.mp3",
            "enabled": true,
            "autoplay": false,
            "loop": true,
            "volume": 0.8,
            "pitch": 1.2,
            "playbackRate": 1.5,
            "muted": false,
            "is3D": true,
            "minDistance": 5.0,
            "maxDistance": 100.0,
            "rolloffFactor": 0.5,
            "coneInnerAngle": 90.0,
            "coneOuterAngle": 180.0,
            "coneOuterGain": 0.3,
            "isPlaying": false,
            "currentTime": 0.0,
            "duration": 120.5,
            "format": "mp3"
        });

        let decoded = decoder.decode(&json).unwrap();
        let sound = decoded.downcast_ref::<Sound>().unwrap();

        // Core properties
        assert_eq!(sound.audioPath, "/sounds/music.mp3");
        assert_eq!(sound.enabled, true);
        assert_eq!(sound.autoplay, false);
        assert_eq!(sound.is_looping(), true);
        assert_eq!(sound.volume, 0.8);
        assert_eq!(sound.pitch, 1.2);
        assert_eq!(sound.playbackRate, 1.5);
        assert_eq!(sound.muted, false);

        // 3D Audio properties
        assert_eq!(sound.is3D, true);
        assert_eq!(sound.minDistance, 5.0);
        assert_eq!(sound.maxDistance, 100.0);
        assert_eq!(sound.rolloffFactor, 0.5);
        assert_eq!(sound.coneInnerAngle, 90.0);
        assert_eq!(sound.coneOuterAngle, 180.0);
        assert_eq!(sound.coneOuterGain, 0.3);

        // Playback state
        assert_eq!(sound.isPlaying, false);
        assert_eq!(sound.currentTime, 0.0);
        assert_eq!(sound.duration, 120.5);

        // Format
        assert_eq!(sound.format.as_deref(), Some("mp3"));
    }

    #[test]
    fn test_sound_decoder_defaults() {
        let decoder = SoundDecoder;
        let json = serde_json::json!({
            "audioPath": "/sounds/test.wav"
        });

        let decoded = decoder.decode(&json).unwrap();
        let sound = decoded.downcast_ref::<Sound>().unwrap();

        // Verify defaults
        assert_eq!(sound.audioPath, "/sounds/test.wav");
        assert_eq!(sound.enabled, true);
        assert_eq!(sound.autoplay, false);
        assert_eq!(sound.is_looping(), false);
        assert_eq!(sound.volume, 1.0);
        assert_eq!(sound.pitch, 1.0);
        assert_eq!(sound.playbackRate, 1.0);
        assert_eq!(sound.muted, false);
        assert_eq!(sound.is3D, true);
        assert_eq!(sound.minDistance, 1.0);
        assert_eq!(sound.maxDistance, 10000.0);
        assert_eq!(sound.rolloffFactor, 1.0);
        assert_eq!(sound.coneInnerAngle, 360.0);
        assert_eq!(sound.coneOuterAngle, 360.0);
        assert_eq!(sound.coneOuterGain, 0.0);
        assert_eq!(sound.isPlaying, false);
        assert_eq!(sound.currentTime, 0.0);
        assert_eq!(sound.duration, 0.0);
        assert_eq!(sound.format, None);
    }

    #[test]
    fn test_sound_decoder_minimal() {
        let decoder = SoundDecoder;
        let json = serde_json::json!({});

        let decoded = decoder.decode(&json).unwrap();
        let sound = decoded.downcast_ref::<Sound>().unwrap();

        // Minimal sound with empty audioPath
        assert_eq!(sound.audioPath, "");
        assert_eq!(sound.enabled, true);
    }

    #[test]
    fn test_sound_loop_keyword_handling() {
        // Test that 'loop' keyword is properly handled via _loop_serde
        let json = serde_json::json!({
            "audioPath": "/sounds/loop_test.wav",
            "loop": true
        });

        let sound: Sound = serde_json::from_value(json).unwrap();
        assert_eq!(sound.is_looping(), false); // Not manually copied in direct deserialize

        // Test via decoder (which copies the field)
        let decoder = SoundDecoder;
        let json = serde_json::json!({
            "audioPath": "/sounds/loop_test.wav",
            "loop": true
        });
        let decoded = decoder.decode(&json).unwrap();
        let sound = decoded.downcast_ref::<Sound>().unwrap();
        assert_eq!(sound.is_looping(), true);
    }

    #[test]
    fn test_sound_2d_audio() {
        let decoder = SoundDecoder;
        let json = serde_json::json!({
            "audioPath": "/sounds/ui_click.wav",
            "is3D": false,
            "volume": 0.5
        });

        let decoded = decoder.decode(&json).unwrap();
        let sound = decoded.downcast_ref::<Sound>().unwrap();

        assert_eq!(sound.is3D, false);
        assert_eq!(sound.volume, 0.5);
    }

    #[test]
    fn test_sound_playback_state() {
        let decoder = SoundDecoder;
        let json = serde_json::json!({
            "audioPath": "/sounds/music.mp3",
            "isPlaying": true,
            "currentTime": 45.5,
            "duration": 180.0
        });

        let decoded = decoder.decode(&json).unwrap();
        let sound = decoded.downcast_ref::<Sound>().unwrap();

        assert_eq!(sound.isPlaying, true);
        assert_eq!(sound.currentTime, 45.5);
        assert_eq!(sound.duration, 180.0);
    }

    #[test]
    fn test_sound_capabilities() {
        let decoder = SoundDecoder;
        let caps = decoder.capabilities();

        assert_eq!(caps.affects_rendering, false); // Audio doesn't affect visual rendering
        assert_eq!(caps.requires_pass, Some("audio"));
        assert!(caps.stable);
    }

    #[test]
    fn test_sound_component_kinds() {
        let decoder = SoundDecoder;
        let kinds = decoder.component_kinds();

        assert_eq!(kinds.len(), 1);
        assert_eq!(kinds[0].as_str(), "Sound");
    }

    #[test]
    fn test_sound_spatial_audio_cone() {
        let decoder = SoundDecoder;
        let json = serde_json::json!({
            "audioPath": "/sounds/alarm.wav",
            "is3D": true,
            "coneInnerAngle": 45.0,
            "coneOuterAngle": 90.0,
            "coneOuterGain": 0.1
        });

        let decoded = decoder.decode(&json).unwrap();
        let sound = decoded.downcast_ref::<Sound>().unwrap();

        // Verify directional audio cone settings
        assert_eq!(sound.coneInnerAngle, 45.0);
        assert_eq!(sound.coneOuterAngle, 90.0);
        assert_eq!(sound.coneOuterGain, 0.1);
    }

    #[test]
    fn test_sound_distance_attenuation() {
        let decoder = SoundDecoder;
        let json = serde_json::json!({
            "audioPath": "/sounds/environment.wav",
            "minDistance": 10.0,
            "maxDistance": 500.0,
            "rolloffFactor": 0.75
        });

        let decoded = decoder.decode(&json).unwrap();
        let sound = decoded.downcast_ref::<Sound>().unwrap();

        // Verify distance-based attenuation settings
        assert_eq!(sound.minDistance, 10.0);
        assert_eq!(sound.maxDistance, 500.0);
        assert_eq!(sound.rolloffFactor, 0.75);
    }
}
