//! Light component and decoder

use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::any::Any;
use vibe_scene::ComponentKindId;

use crate::{ComponentCapabilities, IComponentDecoder};
use super::common::default_one;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct LightColor {
    #[serde(default = "default_one")]
    pub r: f32,
    #[serde(default = "default_one")]
    pub g: f32,
    #[serde(default = "default_one")]
    pub b: f32,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Light {
    #[serde(default = "default_light_type", rename = "lightType")]
    pub light_type: String,
    #[serde(default)]
    pub color: Option<LightColor>,
    #[serde(default = "default_intensity")]
    pub intensity: f32,
    #[serde(default = "default_enabled")]
    pub enabled: bool,
    #[serde(default = "default_enabled", rename = "castShadow")]
    pub cast_shadow: bool,
    #[serde(default, rename = "directionX")]
    pub direction_x: f32,
    #[serde(default = "default_neg_one", rename = "directionY")]
    pub direction_y: f32,
    #[serde(default, rename = "directionZ")]
    pub direction_z: f32,
    #[serde(default = "default_range")]
    pub range: f32,
    #[serde(default = "default_one")]
    pub decay: f32,
    #[serde(default = "default_angle")]
    pub angle: f32,
    #[serde(default = "default_penumbra")]
    pub penumbra: f32,
    #[serde(default = "default_shadow_map_size", rename = "shadowMapSize")]
    pub shadow_map_size: u32,
    #[serde(default = "default_shadow_bias", rename = "shadowBias")]
    pub shadow_bias: f32,
    #[serde(default = "default_shadow_radius", rename = "shadowRadius")]
    pub shadow_radius: f32,
}

// Default value functions
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

/// Decoder for Light components
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

#[cfg(test)]
mod tests {
    use super::*;

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
    fn test_light_decoder_defaults() {
        let decoder = LightDecoder;
        let json = serde_json::json!({});

        let decoded = decoder.decode(&json).unwrap();
        let light = decoded.downcast_ref::<Light>().unwrap();
        assert_eq!(light.light_type, "directional");
        assert_eq!(light.intensity, 1.0);
        assert!(light.enabled);
        assert!(light.cast_shadow);
        assert_eq!(light.shadow_map_size, 2048);
    }

    #[test]
    fn test_light_capabilities() {
        let decoder = LightDecoder;
        let caps = decoder.capabilities();
        assert!(caps.affects_rendering);
        assert_eq!(caps.requires_pass, Some("shadow"));
        assert!(caps.stable);
    }

    #[test]
    fn test_light_component_kinds() {
        let decoder = LightDecoder;
        let kinds = decoder.component_kinds();
        assert_eq!(kinds.len(), 1);
        assert_eq!(kinds[0].as_str(), "Light");
    }

    #[test]
    fn test_light_spotlight() {
        let decoder = LightDecoder;
        let json = serde_json::json!({
            "lightType": "spot",
            "angle": 0.5,
            "penumbra": 0.2,
            "range": 50.0
        });

        let decoded = decoder.decode(&json).unwrap();
        let light = decoded.downcast_ref::<Light>().unwrap();
        assert_eq!(light.light_type, "spot");
        assert_eq!(light.angle, 0.5);
        assert_eq!(light.penumbra, 0.2);
        assert_eq!(light.range, 50.0);
    }
}