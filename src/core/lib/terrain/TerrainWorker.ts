import type { TerrainData } from '@/core/lib/ecs/components/definitions/TerrainComponent';
import { Logger } from '@/core/lib/logger';

export interface ITerrainWorkerMessage {
  type: 'GENERATE_TERRAIN';
  config: TerrainData;
  id: string;
}

export interface ITerrainWorkerResponse {
  type: 'TERRAIN_GENERATED';
  id: string;
  positions: Float32Array;
  indices: Uint32Array;
  normals: Float32Array;
  uvs: Float32Array;
}

export interface ITerrainGeometryData {
  positions: Float32Array;
  indices: Uint32Array;
  normals: Float32Array;
  uvs: Float32Array;
}

class TerrainWorkerManager {
  private worker: Worker | null = null;
  private pendingRequests = new Map<string, (data: ITerrainGeometryData) => void>();
  private isSupported = typeof Worker !== 'undefined';
  private logger = Logger.create('TerrainWorker');

  constructor() {
    if (this.isSupported) {
      this.initializeWorker();
    }
  }

  private initializeWorker() {
    try {
      // Create worker with terrain generation code
      const workerCode = `
        // Deterministic hash in [0,1] based on integer grid + seed
        function hash2(ix, iy, seed) {
          const x = ix + seed * 374761393;
          const y = iy + seed * 668265263;
          const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
          return n - Math.floor(n);
        }

        function valueNoise2D(x, y, frequency, octaves, persistence, lacunarity, seed) {
          let amp = 1;
          let freq = frequency;
          let sum = 0;
          let norm = 0;

          for (let o = 0; o < octaves; o++) {
            const xi = Math.floor(x * freq);
            const yi = Math.floor(y * freq);

            const h = (ix, iy) => hash2(ix, iy, seed);

            const fx = x * freq - xi;
            const fy = y * freq - yi;

            const v00 = h(xi, yi);
            const v10 = h(xi + 1, yi);
            const v01 = h(xi, yi + 1);
            const v11 = h(xi + 1, yi + 1);

            const lerp = (a, b, t) => a + (b - a) * t;
            const smooth = (t) => t * t * (3 - 2 * t);

            const i1 = lerp(v00, v10, smooth(fx));
            const i2 = lerp(v01, v11, smooth(fx));
            const val = lerp(i1, i2, smooth(fy));

            const shaped = Math.pow(val, 1.2);
            sum += shaped * amp;
            norm += amp;
            amp *= persistence;
            freq *= lacunarity;
          }

          return norm > 0 ? sum / norm : 0;
        }

        function generateTerrainGeometry(config) {
          const { size, segments, heightScale, noiseEnabled, noiseSeed, noiseFrequency, 
                  noiseOctaves, noisePersistence, noiseLacunarity } = config;
          
          const [w, d] = size;
          const [sx, sz] = segments;
          
          // Generate vertices
          const positions = new Float32Array(sx * sz * 3);
          const uvs = new Float32Array(sx * sz * 2);
          
          let minY = Number.POSITIVE_INFINITY;
          
          for (let z = 0; z < sz; z++) {
            for (let x = 0; x < sx; x++) {
              const i = z * sx + x;
              
              // Position
              const px = (x / (sx - 1) - 0.5) * w;
              const pz = (z / (sz - 1) - 0.5) * d;
              
              let py = 0;
              
              if (noiseEnabled) {
                const nx = x / (sx - 1);
                const nz = z / (sz - 1);

                // Base multi-octave noise
                let n = valueNoise2D(nx, nz, noiseFrequency, noiseOctaves, 
                                   noisePersistence, noiseLacunarity, noiseSeed);

                // Add large-scale undulation
                const largeScale = valueNoise2D(nx, nz, Math.max(1.0, noiseFrequency * 0.25), 
                                               2, 0.6, 2.0, noiseSeed + 17);
                n = n * 0.7 + largeScale * 0.3;

                // Rim mountains effect
                const cx = 0.5;
                const cz = 0.5;
                const dx = Math.abs(nx - cx) * 2;
                const dz = Math.abs(nz - cz) * 2;
                const edge = Math.min(1, Math.pow(Math.max(dx, dz), 1.25));
                const rim = edge * edge;
                const valley = 1.0 - edge;
                n = n * (0.7 + 0.3 * valley) + rim * 0.45;

                py = n * heightScale;
              }
              
              positions[i * 3] = px;
              positions[i * 3 + 1] = py;
              positions[i * 3 + 2] = pz;
              
              // UV coordinates
              uvs[i * 2] = x / (sx - 1);
              uvs[i * 2 + 1] = z / (sz - 1);
              
              if (py < minY) minY = py;
            }
          }
          
          // Adjust to ground level
          if (isFinite(minY) && minY !== 0) {
            for (let i = 0; i < positions.length / 3; i++) {
              positions[i * 3 + 1] -= minY;
            }
          }
          
          // Generate indices
          const indices = new Uint32Array((sx - 1) * (sz - 1) * 6);
          let idx = 0;
          
          for (let z = 0; z < sz - 1; z++) {
            for (let x = 0; x < sx - 1; x++) {
              const a = z * sx + x;
              const b = z * sx + x + 1;
              const c = (z + 1) * sx + x;
              const d = (z + 1) * sx + x + 1;
              
              // Two triangles per quad
              indices[idx++] = a;
              indices[idx++] = c;
              indices[idx++] = b;
              
              indices[idx++] = b;
              indices[idx++] = c;
              indices[idx++] = d;
            }
          }
          
          // Calculate normals
          const normals = new Float32Array(sx * sz * 3);
          
          for (let i = 0; i < indices.length; i += 3) {
            const i1 = indices[i] * 3;
            const i2 = indices[i + 1] * 3;
            const i3 = indices[i + 2] * 3;
            
            const v1x = positions[i2] - positions[i1];
            const v1y = positions[i2 + 1] - positions[i1 + 1];
            const v1z = positions[i2 + 2] - positions[i1 + 2];
            
            const v2x = positions[i3] - positions[i1];
            const v2y = positions[i3 + 1] - positions[i1 + 1];
            const v2z = positions[i3 + 2] - positions[i1 + 2];
            
            // Cross product
            const nx = v1y * v2z - v1z * v2y;
            const ny = v1z * v2x - v1x * v2z;
            const nz = v1x * v2y - v1y * v2x;
            
            // Add to vertices (will be normalized later)
            normals[indices[i] * 3] += nx;
            normals[indices[i] * 3 + 1] += ny;
            normals[indices[i] * 3 + 2] += nz;
            
            normals[indices[i + 1] * 3] += nx;
            normals[indices[i + 1] * 3 + 1] += ny;
            normals[indices[i + 1] * 3 + 2] += nz;
            
            normals[indices[i + 2] * 3] += nx;
            normals[indices[i + 2] * 3 + 1] += ny;
            normals[indices[i + 2] * 3 + 2] += nz;
          }
          
          // Normalize normals
          for (let i = 0; i < normals.length; i += 3) {
            const x = normals[i];
            const y = normals[i + 1];
            const z = normals[i + 2];
            const len = Math.sqrt(x * x + y * y + z * z);
            
            if (len > 0) {
              normals[i] = x / len;
              normals[i + 1] = y / len;
              normals[i + 2] = z / len;
            }
          }
          
          return { positions, indices, normals, uvs };
        }

        self.onmessage = function(e) {
          const { type, config, id } = e.data;
          
          if (type === 'GENERATE_TERRAIN') {
            try {
              const geometryData = generateTerrainGeometry(config);
              
              self.postMessage({
                type: 'TERRAIN_GENERATED',
                id,
                ...geometryData
              }, [
                geometryData.positions.buffer,
                geometryData.indices.buffer,
                geometryData.normals.buffer,
                geometryData.uvs.buffer
              ]);
            } catch (error) {
              self.postMessage({
                type: 'TERRAIN_ERROR',
                id,
                error: error.message
              });
            }
          }
        };
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.worker = new Worker(URL.createObjectURL(blob));

      this.worker.onmessage = this.handleWorkerMessage.bind(this);
      this.worker.onerror = (error) => {
        console.error('TerrainWorker error:', error);
      };
    } catch (error) {
      console.warn('Failed to create terrain worker:', error);
      this.isSupported = false;
    }
  }

  private handleWorkerMessage(e: MessageEvent<ITerrainWorkerResponse>) {
    const { type, id } = e.data;

    if (type === 'TERRAIN_GENERATED') {
      const resolver = this.pendingRequests.get(id);
      if (resolver) {
        const { positions, indices, normals, uvs } = e.data;
        resolver({ positions, indices, normals, uvs });
        this.pendingRequests.delete(id);
      }
    }
  }

  async generateTerrain(config: TerrainData): Promise<ITerrainGeometryData> {
    // Fallback to synchronous generation if worker not supported
    if (!this.isSupported || !this.worker) {
      return this.generateTerrainSync(config);
    }

    const id = crypto.randomUUID();

    return new Promise((resolve) => {
      this.pendingRequests.set(id, resolve);
      this.worker!.postMessage({
        type: 'GENERATE_TERRAIN',
        config,
        id,
      } as ITerrainWorkerMessage);
    });
  }

  private generateTerrainSync(config: TerrainData): ITerrainGeometryData {
    // Fallback synchronous implementation (simplified version)
    const { size, segments } = config;
    const [w, d] = size;
    const [sx, sz] = segments;

    const positions = new Float32Array(sx * sz * 3);
    const uvs = new Float32Array(sx * sz * 2);
    const indices = new Uint32Array((sx - 1) * (sz - 1) * 6);
    const normals = new Float32Array(sx * sz * 3);

    // Simple flat terrain for fallback
    for (let z = 0; z < sz; z++) {
      for (let x = 0; x < sx; x++) {
        const i = z * sx + x;
        positions[i * 3] = (x / (sx - 1) - 0.5) * w;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = (z / (sz - 1) - 0.5) * d;

        uvs[i * 2] = x / (sx - 1);
        uvs[i * 2 + 1] = z / (sz - 1);

        normals[i * 3] = 0;
        normals[i * 3 + 1] = 1;
        normals[i * 3 + 2] = 0;
      }
    }

    // Generate indices
    let idx = 0;
    for (let z = 0; z < sz - 1; z++) {
      for (let x = 0; x < sx - 1; x++) {
        const a = z * sx + x;
        const b = z * sx + x + 1;
        const c = (z + 1) * sx + x;
        const d = (z + 1) * sx + x + 1;

        indices[idx++] = a;
        indices[idx++] = c;
        indices[idx++] = b;

        indices[idx++] = b;
        indices[idx++] = c;
        indices[idx++] = d;
      }
    }

    return { positions, indices, normals, uvs };
  }

  dispose() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingRequests.clear();
  }
}

// Singleton instance
export const terrainWorker = new TerrainWorkerManager();
