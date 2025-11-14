/// Noise generation with Three.js parity
///
/// Implements the exact noise algorithm from TerrainWorker.ts to ensure
/// visual parity between Rust and TypeScript terrain generation.

#[derive(Debug, Clone)]
pub struct NoiseParams {
    pub seed: u32,
    pub frequency: f64,
    pub octaves: u8,
    pub persistence: f64,
    pub lacunarity: f64,
}

/// Hash function matching Three.js implementation
/// Returns value in [0, 1] range
fn hash2(ix: i32, iy: i32, seed: u32) -> f64 {
    let x = ix as f64 + (seed as f64) * 374_761_393.0;
    let y = iy as f64 + (seed as f64) * 668_265_263.0;
    let n = (x * 127.1 + y * 311.7).sin() * 43_758.545_312_3;
    n - n.floor()
}

fn lerp(a: f64, b: f64, t: f64) -> f64 {
    a + (b - a) * t
}

fn smoothstep(t: f64) -> f64 {
    t * t * (3.0 - 2.0 * t)
}

/// Value noise in [0,1] range, sampled in normalized UV space
/// This matches the Three.js valueNoise2D function exactly
fn value_noise_01(
    x: f64,
    y: f64,
    frequency: f64,
    octaves: u8,
    persistence: f64,
    lacunarity: f64,
    seed: u32,
) -> f64 {
    let mut amp = 1.0;
    let mut freq = frequency;
    let mut sum = 0.0;
    let mut norm = 0.0;

    for _ in 0..octaves {
        let xi = (x * freq).floor() as i32;
        let yi = (y * freq).floor() as i32;

        let fx = x * freq - xi as f64;
        let fy = y * freq - yi as f64;

        let v00 = hash2(xi, yi, seed);
        let v10 = hash2(xi + 1, yi, seed);
        let v01 = hash2(xi, yi + 1, seed);
        let v11 = hash2(xi + 1, yi + 1, seed);

        let i1 = lerp(v00, v10, smoothstep(fx));
        let i2 = lerp(v01, v11, smoothstep(fx));
        let val = lerp(i1, i2, smoothstep(fy));

        sum += val.powf(1.2) * amp;
        norm += amp;
        amp *= persistence;
        freq *= lacunarity;
    }

    if norm > 0.0 {
        sum / norm
    } else {
        0.0
    }
}

/// Generate terrain height with Three.js parity
///
/// Implements the complete Three.js pipeline:
/// 1. Base multi-octave noise in [0,1]
/// 2. Large-scale undulation mix
/// 3. Rim/valley effect
/// 4. Scale by height_scale
///
/// # Arguments
/// * `u` - Normalized x coordinate [0,1]
/// * `v` - Normalized z coordinate [0,1]
/// * `height_scale` - Final height multiplier
/// * `params` - Noise parameters (seed, frequency, octaves, persistence, lacunarity)
pub fn terrain_height_parity(u: f32, v: f32, height_scale: f32, params: &NoiseParams) -> f32 {
    let u64 = u as f64;
    let v64 = v as f64;
    let height_scale64 = height_scale as f64;

    let mut n = value_noise_01(
        u64,
        v64,
        params.frequency,
        params.octaves,
        params.persistence,
        params.lacunarity,
        params.seed,
    );
    let base_noise = n;

    let large_scale_freq = (params.frequency * 0.25).max(1.0);
    let large_scale = value_noise_01(
        u64,
        v64,
        large_scale_freq,
        2,
        0.6,
        2.0,
        params.seed.wrapping_add(17),
    );
    n = n * 0.7 + large_scale * 0.3;

    let cx = 0.5;
    let cz = 0.5;
    let dx = (u64 - cx).abs() * 2.0;
    let dz = (v64 - cz).abs() * 2.0;
    let edge = dx.max(dz).powf(1.25).min(1.0);
    let rim = edge * edge;
    let valley = 1.0 - edge;
    n = n * (0.7 + 0.3 * valley) + rim * 0.45;

    let final_height = n * height_scale64;

    // Debug logging (sample only first few points to avoid spam)
    static mut LOG_COUNT: u32 = 0;
    unsafe {
        if LOG_COUNT < 5 {
            log::info!("terrain_height_parity({:.3}, {:.3}): base={:.4}, after_shaping={:.4}, height_scale={:.2}, final={:.4}",
                       u, v, base_noise, n, height_scale, final_height);
            LOG_COUNT += 1;
        }
    }

    final_height as f32
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hash2_range() {
        // Hash values should be in [0, 1] range
        for i in -10..10 {
            for j in -10..10 {
                let value = hash2(i, j, 1337);
                assert!(
                    value >= 0.0 && value <= 1.0,
                    "Hash value {} out of range [0,1]",
                    value
                );
            }
        }
    }

    #[test]
    fn test_hash2_deterministic() {
        let h1 = hash2(5, 7, 1337);
        let h2 = hash2(5, 7, 1337);
        assert_eq!(h1, h2, "Hash should be deterministic");
    }

    #[test]
    fn test_hash2_seed_variation() {
        let h1 = hash2(5, 7, 1337);
        let h2 = hash2(5, 7, 42);
        assert_ne!(h1, h2, "Different seeds should produce different hashes");
    }

    #[test]
    fn test_value_noise_01_range() {
        let params = NoiseParams {
            seed: 1337,
            frequency: 1.0,
            octaves: 4,
            persistence: 0.5,
            lacunarity: 2.0,
        };

        // Test multiple points
        for i in 0..10 {
            for j in 0..10 {
                let u = i as f32 / 10.0;
                let v = j as f32 / 10.0;
                let n = value_noise_01(
                    u as f64,
                    v as f64,
                    params.frequency,
                    params.octaves,
                    params.persistence,
                    params.lacunarity,
                    params.seed,
                );
                assert!(
                    n >= 0.0 && n <= 1.0,
                    "Noise value {} out of range [0,1] at ({}, {})",
                    n,
                    u,
                    v
                );
            }
        }
    }

    #[test]
    fn test_terrain_height_parity_deterministic() {
        let params = NoiseParams {
            seed: 1337,
            frequency: 0.2,
            octaves: 4,
            persistence: 0.5,
            lacunarity: 2.0,
        };

        let h1 = terrain_height_parity(0.5, 0.5, 10.0, &params);
        let h2 = terrain_height_parity(0.5, 0.5, 10.0, &params);
        assert_eq!(h1, h2, "Terrain height should be deterministic");
    }

    #[test]
    fn test_terrain_height_parity_scaling() {
        let params = NoiseParams {
            seed: 1337,
            frequency: 0.2,
            octaves: 4,
            persistence: 0.5,
            lacunarity: 2.0,
        };

        let h1 = terrain_height_parity(0.5, 0.5, 10.0, &params);
        let h2 = terrain_height_parity(0.5, 0.5, 20.0, &params);

        // h2 should be approximately 2x h1 (within floating point tolerance)
        let ratio = h2 / h1;
        assert!(
            (ratio - 2.0).abs() < 0.01,
            "Height scaling should be proportional: ratio={}",
            ratio
        );
    }
}
