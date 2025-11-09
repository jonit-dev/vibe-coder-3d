//! Terrain component and decoder

use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::any::Any;
use vibe_scene::ComponentKindId;

use super::common::default_true;
use crate::{ComponentCapabilities, IComponentDecoder};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Terrain {
    #[serde(default = "default_size")]
    pub size: [f32; 2],
    #[serde(default = "default_segments")]
    pub segments: [u32; 2],
    #[serde(default = "default_height_scale")]
    #[serde(rename = "heightScale")]
    pub height_scale: f32,
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

// Default value functions
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

/// Decoder for Terrain components
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

#[cfg(test)]
mod tests {
    use super::*;

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
        assert_eq!(component.height_scale, 5.0);
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
        assert_eq!(component.height_scale, 2.0);
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
    fn test_terrain_component_kinds() {
        let decoder = TerrainDecoder;
        let kinds = decoder.component_kinds();
        assert_eq!(kinds.len(), 1);
        assert_eq!(kinds[0].as_str(), "Terrain");
    }
}
