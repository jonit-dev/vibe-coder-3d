use serde::Deserialize;

/// Attribute data type for typed arrays
#[derive(Debug, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum AttributeType {
    Float32,
    Float16,
    Uint32,
    Uint16,
    Uint8,
    Int32,
    Int16,
    Int8,
}

/// Accessor describes how to interpret attribute data
#[derive(Debug, Deserialize, Clone)]
pub struct Accessor {
    #[serde(rename = "itemSize")]
    pub item_size: u32,
    #[serde(default)]
    pub normalized: bool,
    /// Inline array data (JSON)
    #[serde(default)]
    pub array: Option<Vec<f32>>,
    /// External .bin or data URI
    pub uri: Option<String>,
    /// Type of the attribute data
    #[serde(rename = "type", default = "default_type")]
    pub attr_type: AttributeType,
}

fn default_type() -> AttributeType {
    AttributeType::Float32
}

/// Geometry group for multi-material support
#[derive(Debug, Deserialize, Clone)]
pub struct Group {
    pub start: u32,
    pub count: u32,
    #[serde(rename = "materialIndex")]
    pub material_index: Option<u32>,
}

/// Draw range specification
#[derive(Debug, Deserialize, Clone)]
pub struct DrawRange {
    pub start: u32,
    pub count: u32,
}

/// Bounding sphere
#[derive(Debug, Deserialize, Clone)]
pub struct BoundsSphere {
    pub center: [f32; 3],
    pub radius: f32,
}

/// Bounding volume information
#[derive(Debug, Deserialize, Clone)]
pub struct Bounds {
    /// Axis-aligned bounding box [min, max]
    pub aabb: Option<([f32; 3], [f32; 3])>,
    /// Bounding sphere
    pub sphere: Option<BoundsSphere>,
}

/// Geometry attributes (vertex data)
#[derive(Debug, Deserialize, Clone)]
pub struct Attributes {
    /// Position attribute (required, typically vec3)
    pub position: Accessor,
    /// Normal attribute (optional, typically vec3)
    pub normal: Option<Accessor>,
    /// UV texture coordinates (optional, typically vec2)
    pub uv: Option<Accessor>,
    /// Vertex color (optional, typically vec3 or vec4)
    pub color: Option<Accessor>,
    /// Tangent attribute (optional, typically vec4: xyz + w for handedness)
    pub tangent: Option<Accessor>,
}

/// Metadata header
#[derive(Debug, Deserialize, Clone)]
pub struct Meta {
    #[serde(default = "default_version")]
    pub version: String,
    #[serde(default = "default_generator")]
    pub generator: String,
    pub name: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
}

fn default_version() -> String {
    "1.0.0".to_string()
}

fn default_generator() -> String {
    "vibe-geometry-exporter".to_string()
}

/// Complete geometry metadata matching THREE.BufferGeometry semantics
#[derive(Debug, Deserialize, Clone)]
pub struct GeometryMeta {
    pub meta: Meta,
    pub attributes: Attributes,
    /// Optional index buffer
    pub index: Option<Accessor>,
    /// Optional groups for multi-material support
    #[serde(default)]
    pub groups: Vec<Group>,
    /// Optional draw range
    #[serde(rename = "drawRange")]
    pub draw_range: Option<DrawRange>,
    /// Optional bounding volume
    pub bounds: Option<Bounds>,
}

impl GeometryMeta {
    /// Load geometry metadata from JSON string
    pub fn from_json(json: &str) -> Result<Self, serde_json::Error> {
        serde_json::from_str(json)
    }

    /// Load geometry metadata from JSON file path
    pub fn from_file(path: &std::path::Path) -> anyhow::Result<Self> {
        let json = std::fs::read_to_string(path)
            .with_context(|| format!("Failed to read geometry metadata: {}", path.display()))?;
        Self::from_json(&json).context("Failed to parse geometry metadata JSON")
    }

    /// Get vertex count from position attribute
    pub fn vertex_count(&self) -> Option<usize> {
        self.attributes
            .position
            .array
            .as_ref()
            .map(|arr| arr.len() / self.attributes.position.item_size as usize)
    }

    /// Get index count if indexed
    pub fn index_count(&self) -> Option<usize> {
        self.index.as_ref().and_then(|idx| {
            idx.array
                .as_ref()
                .map(|arr| arr.len() / idx.item_size as usize)
        })
    }

    /// Check if geometry has normals
    pub fn has_normals(&self) -> bool {
        self.attributes.normal.is_some()
    }

    /// Check if geometry has UVs
    pub fn has_uvs(&self) -> bool {
        self.attributes.uv.is_some()
    }

    /// Check if geometry has vertex colors
    pub fn has_colors(&self) -> bool {
        self.attributes.color.is_some()
    }

    /// Check if geometry has tangents
    pub fn has_tangents(&self) -> bool {
        self.attributes.tangent.is_some()
    }
}

use anyhow::Context;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_minimal_geometry() {
        let json = r#"{
            "meta": {
                "version": "1.0.0",
                "generator": "test"
            },
            "attributes": {
                "position": {
                    "itemSize": 3,
                    "normalized": false,
                    "array": [0, 0, 0, 1, 0, 0, 0, 1, 0],
                    "type": "float32"
                }
            }
        }"#;

        let meta = GeometryMeta::from_json(json).expect("Failed to parse geometry");
        assert_eq!(meta.vertex_count(), Some(3));
        assert!(!meta.has_normals());
        assert!(!meta.has_uvs());
    }

    #[test]
    fn test_parse_full_geometry() {
        let json = r#"{
            "meta": {
                "version": "1.0.0",
                "generator": "test",
                "name": "TestCube"
            },
            "attributes": {
                "position": {
                    "itemSize": 3,
                    "normalized": false,
                    "array": [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0],
                    "type": "float32"
                },
                "normal": {
                    "itemSize": 3,
                    "normalized": false,
                    "array": [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
                    "type": "float32"
                },
                "uv": {
                    "itemSize": 2,
                    "normalized": false,
                    "array": [0, 0, 1, 0, 0, 1, 1, 1],
                    "type": "float32"
                }
            },
            "index": {
                "itemSize": 1,
                "normalized": false,
                "array": [0, 1, 2, 0, 2, 3],
                "type": "uint32"
            },
            "bounds": {
                "aabb": [[0, 0, 0], [1, 1, 0]],
                "sphere": {
                    "center": [0.5, 0.5, 0],
                    "radius": 0.707
                }
            }
        }"#;

        let meta = GeometryMeta::from_json(json).expect("Failed to parse geometry");
        assert_eq!(meta.meta.name, Some("TestCube".to_string()));
        assert_eq!(meta.vertex_count(), Some(4));
        assert_eq!(meta.index_count(), Some(6));
        assert!(meta.has_normals());
        assert!(meta.has_uvs());
        assert!(meta.bounds.is_some());
    }

    #[test]
    fn test_attribute_types() {
        let json = r#"{
            "meta": {"version": "1.0.0"},
            "attributes": {
                "position": {
                    "itemSize": 3,
                    "array": [0, 0, 0],
                    "type": "float32"
                }
            },
            "index": {
                "itemSize": 1,
                "array": [0, 1, 2],
                "type": "uint16"
            }
        }"#;

        let meta = GeometryMeta::from_json(json).expect("Failed to parse");
        assert_eq!(meta.attributes.position.attr_type, AttributeType::Float32);
        assert_eq!(
            meta.index.as_ref().unwrap().attr_type,
            AttributeType::Uint16
        );
    }
}
