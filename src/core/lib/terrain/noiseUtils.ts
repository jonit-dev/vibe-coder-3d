/**
 * Utility functions for terrain noise generation
 */

/**
 * Deterministic hash in [0,1] based on integer grid + seed
 */
export function hash2(ix: number, iy: number, seed: number): number {
  const x = ix + seed * 374761393;
  const y = iy + seed * 668265263;
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

/**
 * Generate value noise at specific coordinates with multiple octaves
 */
export function valueNoise2D(
  x: number,
  y: number,
  frequency: number,
  octaves: number,
  persistence: number,
  lacunarity: number,
  seed: number,
): number {
  let amp = 1;
  let freq = frequency;
  let sum = 0;
  let norm = 0;

  for (let o = 0; o < octaves; o++) {
    const xi = Math.floor(x * freq);
    const yi = Math.floor(y * freq);

    // Deterministic corner values
    const h = (ix: number, iy: number) => hash2(ix, iy, seed);

    const fx = x * freq - xi;
    const fy = y * freq - yi;

    const v00 = h(xi, yi);
    const v10 = h(xi + 1, yi);
    const v01 = h(xi, yi + 1);
    const v11 = h(xi + 1, yi + 1);

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const smooth = (t: number) => t * t * (3 - 2 * t);

    const i1 = lerp(v00, v10, smooth(fx));
    const i2 = lerp(v01, v11, smooth(fx));
    const val = lerp(i1, i2, smooth(fy));

    // Slight shaping to reduce harsh plateaus
    const shaped = Math.pow(val, 1.2);
    sum += shaped * amp;
    norm += amp;
    amp *= persistence;
    freq *= lacunarity;
  }

  return norm > 0 ? sum / norm : 0;
}
