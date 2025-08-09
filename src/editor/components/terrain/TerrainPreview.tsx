import React, { useRef, useEffect, useMemo } from 'react';
import type { TerrainData } from '@/core/lib/ecs/components/definitions/TerrainComponent';

interface ITerrainPreviewProps {
  terrain: TerrainData;
  size?: number;
  className?: string;
}

// Optimized noise function for preview (simplified version)
function fastNoise2D(
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

  for (let o = 0; o < Math.min(octaves, 4); o++) {
    // Limit octaves for preview
    // Simple hash-based noise
    const xi = Math.floor(x * freq);
    const yi = Math.floor(y * freq);

    const n = Math.sin((xi + seed) * 127.1 + (yi + seed) * 311.7) * 43758.5453123;
    const val = n - Math.floor(n);

    sum += val * amp;
    norm += amp;
    amp *= persistence;
    freq *= lacunarity;
  }

  return norm > 0 ? sum / norm : 0;
}

export const TerrainPreview: React.FC<ITerrainPreviewProps> = ({
  terrain,
  size = 128,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate heightmap preview
  const heightmapData = useMemo(() => {
    if (!terrain.noiseEnabled) {
      return null;
    }

    const data = new Uint8ClampedArray(size * size * 4);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = x / size;
        const ny = y / size;

        let height = fastNoise2D(
          nx,
          ny,
          terrain.noiseFrequency,
          terrain.noiseOctaves,
          terrain.noisePersistence,
          terrain.noiseLacunarity,
          terrain.noiseSeed,
        );

        // Add large-scale features
        const largeScale = fastNoise2D(
          nx,
          ny,
          Math.max(1.0, terrain.noiseFrequency * 0.25),
          2,
          0.6,
          2.0,
          terrain.noiseSeed + 17,
        );
        height = height * 0.7 + largeScale * 0.3;

        // Rim effect
        const cx = 0.5;
        const cz = 0.5;
        const dx = Math.abs(nx - cx) * 2;
        const dz = Math.abs(ny - cz) * 2;
        const edge = Math.min(1, Math.pow(Math.max(dx, dz), 1.25));
        const rim = edge * edge;
        const valley = 1.0 - edge;
        height = height * (0.7 + 0.3 * valley) + rim * 0.45;

        // Convert to grayscale
        const grayscale = Math.floor(Math.max(0, Math.min(1, height)) * 255);
        const index = (y * size + x) * 4;

        data[index] = grayscale; // R
        data[index + 1] = grayscale; // G
        data[index + 2] = grayscale; // B
        data[index + 3] = 255; // A
      }
    }

    return data;
  }, [
    terrain.noiseEnabled,
    terrain.noiseFrequency,
    terrain.noiseOctaves,
    terrain.noisePersistence,
    terrain.noiseLacunarity,
    terrain.noiseSeed,
    size,
  ]);

  // Draw heightmap to canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    if (!heightmapData) {
      // Draw flat terrain
      ctx.fillStyle = '#888888';
      ctx.fillRect(0, 0, size, size);
      return;
    }

    const imageData = new ImageData(heightmapData, size, size);
    ctx.putImageData(imageData, 0, 0);
  }, [heightmapData, size]);

  return (
    <div className={`terrain-preview ${className}`}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="border border-gray-300 rounded shadow-sm"
        style={{
          width: '100px',
          height: '100px',
          imageRendering: 'pixelated',
        }}
      />
      <div className="text-xs text-gray-500 mt-1 text-center">Preview</div>
    </div>
  );
};

// Color-coded terrain preview with elevation coloring
export const ColoredTerrainPreview: React.FC<ITerrainPreviewProps> = ({
  terrain,
  size = 128,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate colored heightmap preview
  const coloredHeightmapData = useMemo(() => {
    if (!terrain.noiseEnabled) {
      return null;
    }

    const data = new Uint8ClampedArray(size * size * 4);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = x / size;
        const ny = y / size;

        let height = fastNoise2D(
          nx,
          ny,
          terrain.noiseFrequency,
          terrain.noiseOctaves,
          terrain.noisePersistence,
          terrain.noiseLacunarity,
          terrain.noiseSeed,
        );

        // Add features like in the main component
        const largeScale = fastNoise2D(
          nx,
          ny,
          Math.max(1.0, terrain.noiseFrequency * 0.25),
          2,
          0.6,
          2.0,
          terrain.noiseSeed + 17,
        );
        height = height * 0.7 + largeScale * 0.3;

        const cx = 0.5,
          cz = 0.5;
        const dx = Math.abs(nx - cx) * 2;
        const dz = Math.abs(ny - cz) * 2;
        const edge = Math.min(1, Math.pow(Math.max(dx, dz), 1.25));
        const rim = edge * edge;
        const valley = 1.0 - edge;
        height = height * (0.7 + 0.3 * valley) + rim * 0.45;

        // Clamp height
        height = Math.max(0, Math.min(1, height));

        // Color based on elevation
        let r: number, g: number, b: number;

        if (height < 0.2) {
          // Water/Low areas - Blue
          r = 30;
          g = 144;
          b = 255;
        } else if (height < 0.4) {
          // Plains - Green
          r = 34 + (height - 0.2) * 100;
          g = 139 + (height - 0.2) * 80;
          b = 34;
        } else if (height < 0.7) {
          // Hills - Brown/Yellow
          r = 139 + (height - 0.4) * 116;
          g = 115 + (height - 0.4) * 85;
          b = 85;
        } else {
          // Mountains - White/Gray
          const t = (height - 0.7) / 0.3;
          r = 139 + t * 116;
          g = 139 + t * 116;
          b = 139 + t * 116;
        }

        const index = (y * size + x) * 4;
        data[index] = Math.floor(r);
        data[index + 1] = Math.floor(g);
        data[index + 2] = Math.floor(b);
        data[index + 3] = 255;
      }
    }

    return data;
  }, [
    terrain.noiseEnabled,
    terrain.noiseFrequency,
    terrain.noiseOctaves,
    terrain.noisePersistence,
    terrain.noiseLacunarity,
    terrain.noiseSeed,
    size,
  ]);

  // Draw colored heightmap to canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    if (!coloredHeightmapData) {
      // Draw flat terrain
      const gradient = ctx.createLinearGradient(0, 0, 0, size);
      gradient.addColorStop(0, '#4a9f4a');
      gradient.addColorStop(1, '#2d5a2d');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
      return;
    }

    const imageData = new ImageData(coloredHeightmapData, size, size);
    ctx.putImageData(imageData, 0, 0);
  }, [coloredHeightmapData, size]);

  return (
    <div className={`terrain-preview colored ${className}`}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="border border-gray-300 rounded shadow-sm"
        style={{
          width: '100px',
          height: '100px',
          imageRendering: 'pixelated',
        }}
      />
      <div className="text-xs text-gray-500 mt-1 text-center">Elevation Map</div>
    </div>
  );
};
