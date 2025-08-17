import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { terrainWorker, type ITerrainGeometryData } from '@/core/lib/terrain/TerrainWorker';
import { terrainProfiler } from '@/core/lib/terrain/TerrainProfiler';
import { terrainCache } from '@/core/lib/terrain/TerrainCache';
import { Logger } from '@/core/lib/logger';

export interface ITerrainGeometryProps {
  size: [number, number];
  segments: [number, number];
  heightScale: number;
  noiseEnabled: boolean;
  noiseSeed: number;
  noiseFrequency: number;
  noiseOctaves: number;
  noisePersistence: number;
  noiseLacunarity: number;
}

// Deterministic hash in [0,1] based on integer grid + seed
function hash2(ix: number, iy: number, seed: number): number {
  const x = ix + seed * 374761393;
  const y = iy + seed * 668265263;
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

function valueNoise2D(
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

// Enhanced TerrainGeometry with Web Worker and Memory Management
export const TerrainGeometry: React.FC<ITerrainGeometryProps> = React.memo((props) => {
  const logger = Logger.create('TerrainGeometry');
  const {
    size,
    segments,
    heightScale,
    noiseEnabled,
    noiseSeed,
    noiseFrequency,
    noiseOctaves,
    noisePersistence,
    noiseLacunarity,
  } = props;

  const geometryRef = useRef<THREE.BufferGeometry | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [geometryData, setGeometryData] = useState<ITerrainGeometryData | null>(null);

  // Memory management: dispose geometry on unmount or when regenerating
  useEffect(() => {
    return () => {
      if (geometryRef.current) {
        geometryRef.current.dispose();
      }
    };
  }, []);

  // Generate terrain using web worker with cache
  const generateTerrain = useCallback(async () => {
    terrainProfiler.startProfile('terrain_generation');
    setIsGenerating(true);

    try {
      // Dispose previous geometry
      if (geometryRef.current) {
        geometryRef.current.dispose();
        geometryRef.current = undefined;
      }

      // Check cache first
      const cachedData = terrainCache.get(props);
      let data: ITerrainGeometryData;

      if (cachedData) {
        data = cachedData;
        terrainProfiler.endProfile('terrain_generation');
      } else {
        data = await terrainWorker.generateTerrain(props);
        terrainCache.set(props, data);
        terrainProfiler.endProfile('terrain_generation');
      }

      // Record performance metrics
      const [sx, sz] = segments;
      terrainProfiler.setMetric('vertex_count', sx * sz);
      terrainProfiler.setMetric('triangle_count', (sx - 1) * (sz - 1) * 2);

      setGeometryData(data);
    } catch (error) {
      logger.error('Terrain generation failed:', error);
      terrainProfiler.endProfile('terrain_generation');
    } finally {
      setIsGenerating(false);
    }
  }, [
    size,
    segments,
    heightScale,
    noiseEnabled,
    noiseSeed,
    noiseFrequency,
    noiseOctaves,
    noisePersistence,
    noiseLacunarity,
  ]);

  // Trigger generation when props change
  useEffect(() => {
    generateTerrain();
  }, [generateTerrain]);

  // Create THREE.js geometry from worker data
  const geometry = useMemo(() => {
    if (!geometryData) return null;

    const geom = new THREE.BufferGeometry();

    geom.setIndex(new THREE.BufferAttribute(geometryData.indices, 1));
    geom.setAttribute('position', new THREE.BufferAttribute(geometryData.positions, 3));
    geom.setAttribute('normal', new THREE.BufferAttribute(geometryData.normals, 3));
    geom.setAttribute('uv', new THREE.BufferAttribute(geometryData.uvs, 2));

    geom.computeBoundingBox();
    geom.computeBoundingSphere();

    geometryRef.current = geom;
    return geom;
  }, [geometryData]);

  // Fallback geometry while generating (low-res version)
  const fallbackGeometry = useMemo(() => {
    const [w, d] = size;
    const [sx, sz] = segments;
    const plane = new THREE.PlaneGeometry(
      w,
      d,
      Math.min(sx - 1, 16), // Cap at 16 segments for fallback
      Math.min(sz - 1, 16),
    );
    plane.rotateX(-Math.PI / 2);
    return plane;
  }, [size, segments]);

  if (!geometry || isGenerating) {
    return <primitive object={fallbackGeometry} />;
  }

  return <primitive object={geometry} />;
});

// Legacy synchronous terrain generation (kept for fallback)
export const LegacyTerrainGeometry: React.FC<ITerrainGeometryProps> = ({
  size,
  segments,
  heightScale,
  noiseEnabled,
  noiseSeed,
  noiseFrequency,
  noiseOctaves,
  noisePersistence,
  noiseLacunarity,
}) => {
  const geometry = useMemo(() => {
    const [w, d] = size;
    const [sx, sz] = segments;
    const plane = new THREE.PlaneGeometry(w, d, sx - 1, sz - 1);
    // Rotate XY plane into XZ so Y is up
    plane.rotateX(-Math.PI / 2);

    const positions = plane.attributes.position.array as Float32Array;

    if (noiseEnabled) {
      // Normalize x,z to [0,1] across grid to feed noise
      let minY = Number.POSITIVE_INFINITY;
      for (let i = 0; i < positions.length / 3; i++) {
        const px = positions[i * 3 + 0];
        const pz = positions[i * 3 + 2];
        const nx = px / w + 0.5;
        const nz = pz / d + 0.5;

        // Base multi-octave noise
        let n = valueNoise2D(
          nx,
          nz,
          noiseFrequency,
          noiseOctaves,
          noisePersistence,
          noiseLacunarity,
          noiseSeed,
        );

        // Add a gentle large-scale undulation to mimic rolling terrain
        const largeScale = valueNoise2D(
          nx,
          nz,
          Math.max(1.0, noiseFrequency * 0.25),
          2,
          0.6,
          2.0,
          noiseSeed + 17,
        );
        n = n * 0.7 + largeScale * 0.3;

        // Rim mountains: increase height towards edges using distance to center
        const cx = 0.5;
        const cz = 0.5;
        const dx = Math.abs(nx - cx) * 2; // 0 at center, ~1 at edge
        const dz = Math.abs(nz - cz) * 2;
        const edge = Math.min(1, Math.pow(Math.max(dx, dz), 1.25));
        const rim = edge * edge;
        // Slight valley bias towards center to create basins
        const valley = 1.0 - edge;
        n = n * (0.7 + 0.3 * valley) + rim * 0.45; // lift edges, keep center lower

        const y = n * heightScale;
        positions[i * 3 + 1] = y;
        if (y < minY) minY = y;
      }

      // Snap terrain so the lowest point sits on y = 0 (ground)
      if (isFinite(minY) && minY !== 0) {
        for (let i = 0; i < positions.length / 3; i++) {
          positions[i * 3 + 1] -= minY;
        }
      }
      plane.attributes.position.needsUpdate = true;
      plane.computeVertexNormals();
      plane.computeBoundingBox();
      plane.computeBoundingSphere();
    }

    return plane;
  }, [
    size,
    segments,
    heightScale,
    noiseEnabled,
    noiseSeed,
    noiseFrequency,
    noiseOctaves,
    noisePersistence,
    noiseLacunarity,
  ]);

  return <primitive object={geometry} />;
};
