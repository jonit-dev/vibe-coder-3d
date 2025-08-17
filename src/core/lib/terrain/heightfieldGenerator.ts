import * as THREE from 'three';
import type { TerrainData } from '@/core/lib/ecs/components/definitions/TerrainComponent';
import { valueNoise2D } from './noiseUtils';

export interface IHeightfieldResult {
  heights: number[];
  positions: Float32Array;
}

/**
 * Generate terrain heights and positions based on terrain configuration
 */
export function generateTerrainHeights(terrainData: TerrainData): IHeightfieldResult {
  const [w, d] = terrainData.size;
  const [sx, sz] = terrainData.segments;

  // Validate input data
  if (!w || !d || w <= 0 || d <= 0) {
    throw new Error(`Invalid terrain size: [${w}, ${d}]`);
  }
  if (!sx || !sz || sx < 2 || sz < 2) {
    throw new Error(`Invalid terrain segments: [${sx}, ${sz}] - must be >= 2`);
  }

  // Create the same geometry as TerrainGeometry to get exact vertex positions
  const plane = new THREE.PlaneGeometry(w, d, sx - 1, sz - 1);
  plane.rotateX(-Math.PI / 2);
  const positions = plane.attributes.position.array as Float32Array;
  const heights: number[] = [];

  if (!terrainData.noiseEnabled) {
    // Flat terrain - all heights are 0
    const flatHeights = new Array(positions.length / 3).fill(0);
    return { heights: flatHeights, positions };
  }

  let minY = Number.POSITIVE_INFINITY;
  const tempHeights: number[] = [];

  // Generate heights using same algorithm as TerrainGeometry - iterate through actual vertices
  for (let i = 0; i < positions.length / 3; i++) {
    const px = positions[i * 3 + 0];
    const pz = positions[i * 3 + 2];
    const nx = px / w + 0.5;
    const nz = pz / d + 0.5;

    // Base multi-octave noise
    let n = valueNoise2D(
      nx,
      nz,
      terrainData.noiseFrequency,
      terrainData.noiseOctaves,
      terrainData.noisePersistence,
      terrainData.noiseLacunarity,
      terrainData.noiseSeed,
    );

    // Add a gentle large-scale undulation to mimic rolling terrain
    const largeScale = valueNoise2D(
      nx,
      nz,
      Math.max(1.0, terrainData.noiseFrequency * 0.25),
      2,
      0.6,
      2.0,
      terrainData.noiseSeed + 17,
    );
    n = n * 0.7 + largeScale * 0.3;

    // Rim mountains: increase height towards edges using distance to center
    const cx = 0.5;
    const cz = 0.5;
    const dx = Math.abs(nx - cx) * 2; // 0 at center, ~1 at edge
    const dzv = Math.abs(nz - cz) * 2;
    const edge = Math.min(1, Math.pow(Math.max(dx, dzv), 1.25));
    const rim = edge * edge;
    // Slight valley bias towards center to create basins
    const valley = 1.0 - edge;
    n = n * (0.7 + 0.3 * valley) + rim * 0.45; // lift edges, keep center lower

    const y = n * terrainData.heightScale;
    tempHeights.push(y);
    if (y < minY) minY = y;
  }

  // Snap terrain so the lowest point sits on y = 0 (ground)
  if (isFinite(minY) && minY !== 0) {
    for (let i = 0; i < tempHeights.length; i++) {
      heights.push(tempHeights[i] - minY);
    }
  } else {
    heights.push(...tempHeights);
  }

  return { heights, positions };
}
