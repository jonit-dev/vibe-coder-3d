/// Procedural Shape Registry
///
/// Maps shape IDs (e.g., "helix", "star") to their parameter structures and generator functions.
/// This enables runtime shape generation from JSON component data.
///
/// # Architecture
///
/// - `ShapeParams` enum: Typed parameters for each shape
/// - `from_json()`: Deserialize dynamic JSON → typed params
/// - `generate_mesh()`: Call appropriate create_* function
/// - `ProceduralShapeRegistry`: Central registry for shape lookup
///
/// # Usage
///
/// ```rust
/// use serde_json::json;
/// use vibe_assets::procedural_shape_registry::ProceduralShapeRegistry;
///
/// let registry = ProceduralShapeRegistry::default();
/// let params_json = json!({
///     "radius": 0.5,
///     "height": 2.0,
///     "tubeRadius": 0.1,
///     "coils": 3.0,
///     "segments": 32,
///     "tubeSegments": 8
/// });
///
/// let mesh = registry.generate("helix", &params_json)?;
/// ```
use anyhow::{anyhow, Context, Result};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use super::vertex::Mesh;
use super::{
    create_bush, create_cross, create_diamond, create_grass, create_heart, create_helix,
    create_mobius_strip, create_ramp, create_rock, create_spiral_stairs, create_stairs,
    create_star, create_torus_knot, create_tree, create_tube,
};

/// Typed parameters for all procedural shapes
#[derive(Debug, Clone)]
pub enum ShapeParams {
    // Math shapes
    Helix {
        radius: f32,
        height: f32,
        tube_radius: f32,
        coils: f32,
        segments: u32,
        tube_segments: u32,
    },
    MobiusStrip {
        radius: f32,
        width: f32,
        segments: u32,
    },
    TorusKnot {
        radius: f32,
        tube: f32,
        tubular_segments: u32,
        radial_segments: u32,
        p: u32,
        q: u32,
    },

    // Decorative shapes
    Star {
        outer_radius: f32,
        inner_radius: f32,
        points: u32,
        thickness: f32,
    },
    Heart {
        size: f32,
        depth: f32,
        segments: u32,
    },
    Diamond {
        radius: f32,
        height: f32,
        table_ratio: f32,
        facets: u32,
    },
    Cross {
        arm_length: f32,
        arm_width: f32,
    },
    Tube {
        radius: f32,
        tube_radius: f32,
        radial_segments: u32,
        tubular_segments: u32,
    },

    // Structural shapes
    Ramp {
        width: f32,
        height: f32,
        depth: f32,
    },
    Stairs {
        width: f32,
        height: f32,
        depth: f32,
        num_steps: u32,
    },
    SpiralStairs {
        radius: f32,
        height: f32,
        num_steps: u32,
        turns: f32,
    },

    // Environment shapes (TODO: Add seeded randomness support)
    // Note: Current implementations don't use seed parameters
    Tree {
        trunk_radius: f32,
        trunk_height: f32,
        foliage_radius: f32,
        foliage_height: f32,
        segments: u32,
    },
    Rock {
        radius: f32,
        irregularity: f32,
        segments: u32,
    },
    Bush {
        radius: f32,
        segments: u32,
    },
    Grass {
        blade_width: f32,
        blade_height: f32,
        num_blades: u32,
    },
}

impl ShapeParams {
    /// Deserialize shape parameters from JSON based on shape ID
    ///
    /// # Arguments
    /// * `shape_id` - Shape identifier (e.g., "helix", "star")
    /// * `params` - JSON object with shape-specific parameters
    ///
    /// # Returns
    /// Typed `ShapeParams` enum variant with validated parameters
    pub fn from_json(shape_id: &str, params: &Value) -> Result<Self> {
        match shape_id {
            // Math shapes
            "helix" => {
                #[derive(Deserialize)]
                #[serde(rename_all = "camelCase")]
                struct HelixParams {
                    #[serde(default = "default_helix_radius")]
                    radius: f32,
                    #[serde(default = "default_helix_height")]
                    height: f32,
                    #[serde(default = "default_helix_tube_radius")]
                    tube_radius: f32,
                    #[serde(default = "default_helix_coils")]
                    coils: f32,
                    #[serde(default = "default_helix_segments")]
                    segments: u32,
                    #[serde(default = "default_helix_tube_segments")]
                    tube_segments: u32,
                }
                let p: HelixParams = serde_json::from_value(params.clone())
                    .context("Failed to parse helix parameters")?;
                Ok(Self::Helix {
                    radius: p.radius,
                    height: p.height,
                    tube_radius: p.tube_radius,
                    coils: p.coils,
                    segments: p.segments,
                    tube_segments: p.tube_segments,
                })
            }

            "mobiusstrip" => {
                #[derive(Deserialize)]
                #[serde(rename_all = "camelCase")]
                struct MobiusStripParams {
                    #[serde(default = "default_mobius_radius")]
                    radius: f32,
                    #[serde(default = "default_mobius_width")]
                    width: f32,
                    #[serde(default = "default_mobius_segments")]
                    segments: u32,
                }
                let p: MobiusStripParams = serde_json::from_value(params.clone())
                    .context("Failed to parse mobius strip parameters")?;
                Ok(Self::MobiusStrip {
                    radius: p.radius,
                    width: p.width,
                    segments: p.segments,
                })
            }

            "torusknot" => {
                #[derive(Deserialize)]
                #[serde(rename_all = "camelCase")]
                struct TorusKnotParams {
                    #[serde(default = "default_torus_knot_radius")]
                    radius: f32,
                    #[serde(default = "default_torus_knot_tube")]
                    tube: f32,
                    #[serde(default = "default_torus_knot_tubular_segments")]
                    tubular_segments: u32,
                    #[serde(default = "default_torus_knot_radial_segments")]
                    radial_segments: u32,
                    #[serde(default = "default_torus_knot_p")]
                    p: u32,
                    #[serde(default = "default_torus_knot_q")]
                    q: u32,
                }
                let p: TorusKnotParams = serde_json::from_value(params.clone())
                    .context("Failed to parse torus knot parameters")?;
                Ok(Self::TorusKnot {
                    radius: p.radius,
                    tube: p.tube,
                    tubular_segments: p.tubular_segments,
                    radial_segments: p.radial_segments,
                    p: p.p,
                    q: p.q,
                })
            }

            // Decorative shapes
            "star" => {
                #[derive(Deserialize)]
                #[serde(rename_all = "camelCase")]
                struct StarParams {
                    #[serde(default = "default_star_outer_radius")]
                    outer_radius: f32,
                    #[serde(default = "default_star_inner_radius")]
                    inner_radius: f32,
                    #[serde(default = "default_star_points")]
                    points: u32,
                    #[serde(default = "default_star_thickness")]
                    thickness: f32,
                }
                let p: StarParams = serde_json::from_value(params.clone())
                    .context("Failed to parse star parameters")?;
                Ok(Self::Star {
                    outer_radius: p.outer_radius,
                    inner_radius: p.inner_radius,
                    points: p.points,
                    thickness: p.thickness,
                })
            }

            "heart" => {
                #[derive(Deserialize)]
                #[serde(rename_all = "camelCase")]
                struct HeartParams {
                    #[serde(default = "default_heart_size")]
                    size: f32,
                    #[serde(default = "default_heart_depth")]
                    depth: f32,
                    #[serde(default = "default_heart_segments")]
                    segments: u32,
                }
                let p: HeartParams = serde_json::from_value(params.clone())
                    .context("Failed to parse heart parameters")?;
                Ok(Self::Heart {
                    size: p.size,
                    depth: p.depth,
                    segments: p.segments,
                })
            }

            "diamond" => {
                #[derive(Deserialize)]
                #[serde(rename_all = "camelCase")]
                struct DiamondParams {
                    #[serde(default = "default_diamond_radius")]
                    radius: f32,
                    #[serde(default = "default_diamond_height")]
                    height: f32,
                    #[serde(default = "default_diamond_table_ratio")]
                    table_ratio: f32,
                    #[serde(default = "default_diamond_facets")]
                    facets: u32,
                }
                let p: DiamondParams = serde_json::from_value(params.clone())
                    .context("Failed to parse diamond parameters")?;
                Ok(Self::Diamond {
                    radius: p.radius,
                    height: p.height,
                    table_ratio: p.table_ratio,
                    facets: p.facets,
                })
            }

            "cross" => {
                #[derive(Deserialize)]
                #[serde(rename_all = "camelCase")]
                struct CrossParams {
                    #[serde(default = "default_cross_arm_length")]
                    arm_length: f32,
                    #[serde(default = "default_cross_arm_width")]
                    arm_width: f32,
                }
                let p: CrossParams = serde_json::from_value(params.clone())
                    .context("Failed to parse cross parameters")?;
                Ok(Self::Cross {
                    arm_length: p.arm_length,
                    arm_width: p.arm_width,
                })
            }

            "tube" => {
                #[derive(Deserialize)]
                #[serde(rename_all = "camelCase")]
                struct TubeParams {
                    #[serde(default = "default_tube_radius")]
                    radius: f32,
                    #[serde(default = "default_tube_tube_radius")]
                    tube_radius: f32,
                    #[serde(default = "default_tube_radial_segments")]
                    radial_segments: u32,
                    #[serde(default = "default_tube_tubular_segments")]
                    tubular_segments: u32,
                }
                let p: TubeParams = serde_json::from_value(params.clone())
                    .context("Failed to parse tube parameters")?;
                Ok(Self::Tube {
                    radius: p.radius,
                    tube_radius: p.tube_radius,
                    radial_segments: p.radial_segments,
                    tubular_segments: p.tubular_segments,
                })
            }

            // Structural shapes
            "ramp" => {
                #[derive(Deserialize)]
                #[serde(rename_all = "camelCase")]
                struct RampParams {
                    #[serde(default = "default_ramp_width")]
                    width: f32,
                    #[serde(default = "default_ramp_height")]
                    height: f32,
                    #[serde(default = "default_ramp_depth")]
                    depth: f32,
                }
                let p: RampParams = serde_json::from_value(params.clone())
                    .context("Failed to parse ramp parameters")?;
                Ok(Self::Ramp {
                    width: p.width,
                    height: p.height,
                    depth: p.depth,
                })
            }

            "stairs" => {
                #[derive(Deserialize)]
                #[serde(rename_all = "camelCase")]
                struct StairsParams {
                    #[serde(default = "default_stairs_width")]
                    width: f32,
                    #[serde(default = "default_stairs_height")]
                    height: f32,
                    #[serde(default = "default_stairs_depth")]
                    depth: f32,
                    #[serde(default = "default_stairs_num_steps")]
                    num_steps: u32,
                }
                let p: StairsParams = serde_json::from_value(params.clone())
                    .context("Failed to parse stairs parameters")?;
                Ok(Self::Stairs {
                    width: p.width,
                    height: p.height,
                    depth: p.depth,
                    num_steps: p.num_steps,
                })
            }

            "spiralstairs" => {
                #[derive(Deserialize)]
                #[serde(rename_all = "camelCase")]
                struct SpiralStairsParams {
                    #[serde(default = "default_spiral_stairs_radius")]
                    radius: f32,
                    #[serde(default = "default_spiral_stairs_height")]
                    height: f32,
                    #[serde(default = "default_spiral_stairs_num_steps")]
                    num_steps: u32,
                    #[serde(default = "default_spiral_stairs_turns")]
                    turns: f32,
                }
                let p: SpiralStairsParams = serde_json::from_value(params.clone())
                    .context("Failed to parse spiral stairs parameters")?;
                Ok(Self::SpiralStairs {
                    radius: p.radius,
                    height: p.height,
                    num_steps: p.num_steps,
                    turns: p.turns,
                })
            }

            // Environment shapes
            "tree" => {
                #[derive(Deserialize)]
                #[serde(rename_all = "camelCase")]
                struct TreeParams {
                    #[serde(default = "default_tree_trunk_radius")]
                    trunk_radius: f32,
                    #[serde(default = "default_tree_trunk_height")]
                    trunk_height: f32,
                    #[serde(default = "default_tree_foliage_radius")]
                    foliage_radius: f32,
                    #[serde(default = "default_tree_foliage_height")]
                    foliage_height: f32,
                    #[serde(default = "default_tree_segments")]
                    segments: u32,
                }
                let p: TreeParams = serde_json::from_value(params.clone())
                    .context("Failed to parse tree parameters")?;
                Ok(Self::Tree {
                    trunk_radius: p.trunk_radius,
                    trunk_height: p.trunk_height,
                    foliage_radius: p.foliage_radius,
                    foliage_height: p.foliage_height,
                    segments: p.segments,
                })
            }

            "rock" => {
                #[derive(Deserialize)]
                #[serde(rename_all = "camelCase")]
                struct RockParams {
                    #[serde(default = "default_rock_radius")]
                    radius: f32,
                    #[serde(default = "default_rock_irregularity")]
                    irregularity: f32,
                    #[serde(default = "default_rock_segments")]
                    segments: u32,
                }
                let p: RockParams = serde_json::from_value(params.clone())
                    .context("Failed to parse rock parameters")?;
                Ok(Self::Rock {
                    radius: p.radius,
                    irregularity: p.irregularity,
                    segments: p.segments,
                })
            }

            "bush" => {
                #[derive(Deserialize)]
                #[serde(rename_all = "camelCase")]
                struct BushParams {
                    #[serde(default = "default_bush_radius")]
                    radius: f32,
                    #[serde(default = "default_bush_segments")]
                    segments: u32,
                }
                let p: BushParams = serde_json::from_value(params.clone())
                    .context("Failed to parse bush parameters")?;
                Ok(Self::Bush {
                    radius: p.radius,
                    segments: p.segments,
                })
            }

            "grass" => {
                #[derive(Deserialize)]
                #[serde(rename_all = "camelCase")]
                struct GrassParams {
                    #[serde(default = "default_grass_blade_width")]
                    blade_width: f32,
                    #[serde(default = "default_grass_blade_height")]
                    blade_height: f32,
                    #[serde(default = "default_grass_num_blades")]
                    num_blades: u32,
                }
                let p: GrassParams = serde_json::from_value(params.clone())
                    .context("Failed to parse grass parameters")?;
                Ok(Self::Grass {
                    blade_width: p.blade_width,
                    blade_height: p.blade_height,
                    num_blades: p.num_blades,
                })
            }

            _ => Err(anyhow!("Unknown shape ID: {}", shape_id)),
        }
    }

    /// Generate mesh by calling the appropriate create_* function
    pub fn generate_mesh(&self) -> Mesh {
        match self {
            // Math shapes
            Self::Helix {
                radius,
                height,
                tube_radius,
                coils,
                segments,
                tube_segments,
            } => create_helix(*radius, *height, *tube_radius, *coils, *segments, *tube_segments),

            Self::MobiusStrip {
                radius,
                width,
                segments,
            } => create_mobius_strip(*radius, *width, *segments),

            Self::TorusKnot {
                radius,
                tube,
                tubular_segments,
                radial_segments,
                p,
                q,
            } => create_torus_knot(*radius, *tube, *tubular_segments, *radial_segments, *p, *q),

            // Decorative shapes
            Self::Star {
                outer_radius,
                inner_radius,
                points,
                thickness,
            } => create_star(*outer_radius, *inner_radius, *points, *thickness),

            Self::Heart { size, depth, segments } => create_heart(*size, *depth, *segments),

            Self::Diamond {
                radius,
                height,
                table_ratio,
                facets,
            } => create_diamond(*radius, *height, *table_ratio, *facets),

            Self::Cross {
                arm_length,
                arm_width,
            } => create_cross(*arm_length, *arm_width),

            Self::Tube {
                radius,
                tube_radius,
                radial_segments,
                tubular_segments,
            } => create_tube(*radius, *tube_radius, *radial_segments, *tubular_segments),

            // Structural shapes
            Self::Ramp {
                width,
                height,
                depth,
            } => create_ramp(*width, *height, *depth),

            Self::Stairs {
                width,
                height,
                depth,
                num_steps,
            } => create_stairs(*width, *height, *depth, *num_steps),

            Self::SpiralStairs {
                radius,
                height,
                num_steps,
                turns,
            } => create_spiral_stairs(*radius, *height, *num_steps, *turns),

            // Environment shapes
            Self::Tree {
                trunk_radius,
                trunk_height,
                foliage_radius,
                foliage_height,
                segments,
            } => create_tree(*trunk_radius, *trunk_height, *foliage_radius, *foliage_height, *segments),

            Self::Rock {
                radius,
                irregularity,
                segments,
            } => create_rock(*radius, *irregularity, *segments),

            Self::Bush {
                radius,
                segments,
            } => create_bush(*radius, *segments),

            Self::Grass {
                blade_width,
                blade_height,
                num_blades,
            } => create_grass(*blade_width, *blade_height, *num_blades),
        }
    }
}

/// Central registry for procedural shape generation
#[derive(Debug, Default)]
pub struct ProceduralShapeRegistry;

impl ProceduralShapeRegistry {
    /// Create a new registry (currently stateless, but allows future extensions)
    pub fn new() -> Self {
        Self
    }

    /// Generate a mesh from shape ID and JSON parameters
    ///
    /// # Arguments
    /// * `shape_id` - Shape identifier (e.g., "helix", "star")
    /// * `params` - JSON object with shape-specific parameters
    ///
    /// # Returns
    /// Generated `Mesh` with vertices, indices, and normals
    pub fn generate(&self, shape_id: &str, params: &Value) -> Result<Mesh> {
        let shape_params = ShapeParams::from_json(shape_id, params)
            .with_context(|| format!("Failed to parse parameters for shape '{}'", shape_id))?;
        Ok(shape_params.generate_mesh())
    }

    /// Get list of all supported shape IDs
    pub fn supported_shapes() -> Vec<&'static str> {
        vec![
            // Math shapes
            "helix",
            "mobiusstrip",
            "torusknot",
            // Decorative shapes
            "star",
            "heart",
            "diamond",
            "cross",
            "tube",
            // Structural shapes
            "ramp",
            "stairs",
            "spiralstairs",
            // Environment shapes
            "tree",
            "rock",
            "bush",
            "grass",
        ]
    }
}

// ============================================================================
// Default parameter functions (required by serde)
// ============================================================================

// Helix defaults
fn default_helix_radius() -> f32 {
    0.5
}
fn default_helix_height() -> f32 {
    2.0
}
fn default_helix_tube_radius() -> f32 {
    0.1
}
fn default_helix_coils() -> f32 {
    3.0
}
fn default_helix_segments() -> u32 {
    32
}
fn default_helix_tube_segments() -> u32 {
    8
}

// Mobius strip defaults
fn default_mobius_radius() -> f32 {
    0.5
}
fn default_mobius_width() -> f32 {
    0.3
}
fn default_mobius_segments() -> u32 {
    64
}

// Torus knot defaults
fn default_torus_knot_radius() -> f32 {
    0.5
}
fn default_torus_knot_tube() -> f32 {
    0.15
}
fn default_torus_knot_tubular_segments() -> u32 {
    64
}
fn default_torus_knot_radial_segments() -> u32 {
    8
}
fn default_torus_knot_p() -> u32 {
    2
}
fn default_torus_knot_q() -> u32 {
    3
}

// Star defaults
fn default_star_outer_radius() -> f32 {
    0.5
}
fn default_star_inner_radius() -> f32 {
    0.25
}
fn default_star_points() -> u32 {
    5
}
fn default_star_thickness() -> f32 {
    0.2
}

// Heart defaults
fn default_heart_size() -> f32 {
    0.5
}
fn default_heart_depth() -> f32 {
    0.2
}
fn default_heart_segments() -> u32 {
    32
}

// Diamond defaults
fn default_diamond_radius() -> f32 {
    0.4
}
fn default_diamond_height() -> f32 {
    0.8
}
fn default_diamond_table_ratio() -> f32 {
    0.6
}
fn default_diamond_facets() -> u32 {
    8
}

// Cross defaults
fn default_cross_arm_length() -> f32 {
    0.8
}
fn default_cross_arm_width() -> f32 {
    0.2
}

// Tube defaults
fn default_tube_radius() -> f32 {
    1.0
}
fn default_tube_tube_radius() -> f32 {
    0.2
}
fn default_tube_radial_segments() -> u32 {
    32
}
fn default_tube_tubular_segments() -> u32 {
    64
}

// Ramp defaults
fn default_ramp_width() -> f32 {
    1.0
}
fn default_ramp_height() -> f32 {
    1.0
}
fn default_ramp_depth() -> f32 {
    1.0
}

// Stairs defaults
fn default_stairs_width() -> f32 {
    1.0
}
fn default_stairs_height() -> f32 {
    1.0
}
fn default_stairs_depth() -> f32 {
    1.0
}
fn default_stairs_num_steps() -> u32 {
    5
}

// Spiral stairs defaults
fn default_spiral_stairs_radius() -> f32 {
    0.8
}
fn default_spiral_stairs_height() -> f32 {
    2.0
}
fn default_spiral_stairs_num_steps() -> u32 {
    10
}
fn default_spiral_stairs_turns() -> f32 {
    1.0
}

// Tree defaults
fn default_tree_trunk_radius() -> f32 {
    0.1
}
fn default_tree_trunk_height() -> f32 {
    1.0
}
fn default_tree_foliage_radius() -> f32 {
    0.5
}
fn default_tree_foliage_height() -> f32 {
    1.0
}
fn default_tree_segments() -> u32 {
    8
}

// Rock defaults
fn default_rock_radius() -> f32 {
    0.5
}
fn default_rock_irregularity() -> f32 {
    0.3
}
fn default_rock_segments() -> u32 {
    16
}

// Bush defaults
fn default_bush_radius() -> f32 {
    0.5
}
fn default_bush_segments() -> u32 {
    8
}

// Grass defaults
fn default_grass_blade_width() -> f32 {
    0.02
}
fn default_grass_blade_height() -> f32 {
    0.3
}
fn default_grass_num_blades() -> u32 {
    10
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_helix_from_json() {
        let params = json!({
            "radius": 0.6,
            "height": 3.0,
            "tubeRadius": 0.15,
            "coils": 4.0,
            "segments": 64,
            "tubeSegments": 16
        });

        let shape = ShapeParams::from_json("helix", &params).unwrap();
        match shape {
            ShapeParams::Helix {
                radius,
                height,
                tube_radius,
                coils,
                segments,
                tube_segments,
            } => {
                assert_eq!(radius, 0.6);
                assert_eq!(height, 3.0);
                assert_eq!(tube_radius, 0.15);
                assert_eq!(coils, 4.0);
                assert_eq!(segments, 64);
                assert_eq!(tube_segments, 16);
            }
            _ => panic!("Expected Helix variant"),
        }
    }

    #[test]
    fn test_helix_defaults() {
        let params = json!({});
        let shape = ShapeParams::from_json("helix", &params).unwrap();
        match shape {
            ShapeParams::Helix {
                radius,
                height,
                tube_radius,
                coils,
                segments,
                tube_segments,
            } => {
                assert_eq!(radius, 0.5);
                assert_eq!(height, 2.0);
                assert_eq!(tube_radius, 0.1);
                assert_eq!(coils, 3.0);
                assert_eq!(segments, 32);
                assert_eq!(tube_segments, 8);
            }
            _ => panic!("Expected Helix variant"),
        }
    }

    #[test]
    fn test_star_from_json() {
        let params = json!({
            "outerRadius": 0.8,
            "innerRadius": 0.4,
            "points": 7,
            "thickness": 0.3
        });

        let shape = ShapeParams::from_json("star", &params).unwrap();
        match shape {
            ShapeParams::Star {
                outer_radius,
                inner_radius,
                points,
                thickness,
            } => {
                assert_eq!(outer_radius, 0.8);
                assert_eq!(inner_radius, 0.4);
                assert_eq!(points, 7);
                assert_eq!(thickness, 0.3);
            }
            _ => panic!("Expected Star variant"),
        }
    }

    #[test]
    fn test_tree_with_segments() {
        let params = json!({
            "trunkRadius": 0.15,
            "trunkHeight": 2.0,
            "foliageRadius": 1.0,
            "foliageHeight": 1.5,
            "segments": 16
        });

        let shape = ShapeParams::from_json("tree", &params).unwrap();
        match shape {
            ShapeParams::Tree {
                trunk_radius,
                trunk_height,
                foliage_radius,
                foliage_height,
                segments,
            } => {
                assert_eq!(trunk_radius, 0.15);
                assert_eq!(trunk_height, 2.0);
                assert_eq!(foliage_radius, 1.0);
                assert_eq!(foliage_height, 1.5);
                assert_eq!(segments, 16);
            }
            _ => panic!("Expected Tree variant"),
        }
    }

    #[test]
    fn test_unknown_shape_id() {
        let params = json!({});
        let result = ShapeParams::from_json("unknown_shape", &params);
        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .to_string()
            .contains("Unknown shape ID: unknown_shape"));
    }

    #[test]
    fn test_registry_generate() {
        let registry = ProceduralShapeRegistry::new();
        let params = json!({ "width": 2.0, "height": 1.0, "depth": 1.5 });
        let mesh = registry.generate("ramp", &params).unwrap();
        assert!(mesh.vertices.len() > 0);
        assert!(mesh.indices.len() > 0);
    }

    #[test]
    fn test_supported_shapes() {
        let shapes = ProceduralShapeRegistry::supported_shapes();
        assert!(shapes.contains(&"helix"));
        assert!(shapes.contains(&"star"));
        assert!(shapes.contains(&"tree"));
        assert!(shapes.contains(&"ramp"));
        assert_eq!(shapes.len(), 15);
    }

    #[test]
    fn test_generate_mesh() {
        let shape = ShapeParams::Ramp {
            width: 1.0,
            height: 1.0,
            depth: 1.0,
        };
        let mesh = shape.generate_mesh();
        assert!(mesh.vertices.len() > 0);
        assert!(mesh.indices.len() > 0);
    }
}
