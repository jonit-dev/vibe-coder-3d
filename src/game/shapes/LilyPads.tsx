/**
 * Lily Pads Shape
 * Groups multiple lily pads floating on water surface
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { z } from 'zod';

import type { ICustomShapeDescriptor } from '@core/lib/rendering/shapes/IShapeDescriptor';

const paramsSchema = z.object({
  count: z.number().int().min(1).max(10).default(4),
  padRadius: z.number().min(0.1).max(2).default(0.25),
  padHeight: z.number().min(0.01).max(0.1).default(0.02),
  spreadRadius: z.number().min(1).max(10).default(2.5),
  radialSegments: z.number().int().min(8).max(64).default(16),
  randomSeed: z.number().min(0).max(1000).default(42),
});

export const shape: ICustomShapeDescriptor<typeof paramsSchema> = {
  meta: {
    id: 'lily-pads',
    name: 'Lily Pads',
    category: 'Environment',
    tags: ['lily', 'pond', 'water', 'vegetation', 'nature'],
    version: '1.0.0',
    defaultColor: '#3D7A3F',
  },

  paramsSchema,

  getDefaultParams: () => paramsSchema.parse({}),

  renderGeometry: (params: z.infer<typeof paramsSchema>) => {
    const mergedGeometry = useMemo(() => {
      const seededRandom = (seed: number) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
      };
      const geometries: THREE.BufferGeometry[] = [];

      const positions = [
        { x: -1.2, z: 0.8, rotation: 25, scale: 1.0 },
        { x: 1.5, z: -0.5, rotation: -45, scale: 0.9 },
        { x: 0.3, z: 1.2, rotation: 78, scale: 1.04 },
        { x: -0.8, z: -1.1, rotation: 120, scale: 0.96 },
      ];

      for (let i = 0; i < params.count; i++) {
        const position = positions[i % positions.length];
        const seed = params.randomSeed + i;

        const sizeVariation = 0.9 + seededRandom(seed) * 0.2;
        const finalRadius = params.padRadius * position.scale * sizeVariation;

        const geometry = new THREE.CylinderGeometry(
          finalRadius,
          finalRadius,
          params.padHeight,
          params.radialSegments,
        );

        const normalizedX = (position.x / params.spreadRadius) * params.spreadRadius;
        const normalizedZ = (position.z / params.spreadRadius) * params.spreadRadius;

        geometry.translate(normalizedX, 0, normalizedZ);
        geometry.rotateY((position.rotation * Math.PI) / 180);

        geometries.push(geometry);
      }

      const merged = mergeGeometries(geometries, false);
      return merged ?? new THREE.BufferGeometry();
    }, [
      params.count,
      params.padRadius,
      params.padHeight,
      params.spreadRadius,
      params.radialSegments,
      params.randomSeed,
    ]);

    return <primitive object={mergedGeometry} />;
  },
};
