/**
 * Pond Rocks Shape
 * Groups decorative rocks around pond edges
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { z } from 'zod';

import type { ICustomShapeDescriptor } from '@core/lib/rendering/shapes/IShapeDescriptor';

const paramsSchema = z.object({
  count: z.number().int().min(1).max(20).default(4),
  rockSize: z.number().min(0.1).max(2).default(0.6),
  spreadRadius: z.number().min(1).max(15).default(2.8),
  randomSeed: z.number().min(0).max(1000).default(42),
  detail: z.number().int().min(0).max(3).default(0),
});

export const shape: ICustomShapeDescriptor<typeof paramsSchema> = {
  meta: {
    id: 'pond-rocks',
    name: 'Pond Rocks',
    category: 'Environment',
    tags: ['rock', 'stone', 'pond', 'decoration', 'nature'],
    version: '1.0.0',
    defaultColor: '#7A7A7A',
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
        { x: -2.8, y: 0.05, z: -1.5, rotation: 35, scaleX: 1.0, scaleY: 0.67, scaleZ: 1.08 },
        { x: 2.5, y: 0.06, z: 1.8, rotation: -55, scaleX: 0.92, scaleY: 0.63, scaleZ: 1.0 },
        { x: -2.2, y: 0.07, z: 2.3, rotation: 88, scaleX: 1.17, scaleY: 0.75, scaleZ: 1.13 },
        { x: 2.8, y: 0.05, z: -2.2, rotation: -102, scaleX: 1.08, scaleY: 0.7, scaleZ: 1.03 },
      ];

      for (let i = 0; i < params.count; i++) {
        const position = positions[i % positions.length];
        const seed = params.randomSeed + i;

        const sizeVariation = 0.9 + seededRandom(seed) * 0.2;
        const finalSize = params.rockSize * sizeVariation;

        const geometry = new THREE.IcosahedronGeometry(finalSize, params.detail);

        const scaleX = position.scaleX + (seededRandom(seed + 1) - 0.5) * 0.1;
        const scaleY = position.scaleY + (seededRandom(seed + 2) - 0.5) * 0.1;
        const scaleZ = position.scaleZ + (seededRandom(seed + 3) - 0.5) * 0.1;

        geometry.scale(scaleX, scaleY, scaleZ);

        const normalizedX = (position.x / params.spreadRadius) * params.spreadRadius;
        const normalizedY = position.y;
        const normalizedZ = (position.z / params.spreadRadius) * params.spreadRadius;

        geometry.translate(normalizedX, normalizedY, normalizedZ);
        geometry.rotateY((position.rotation * Math.PI) / 180);

        const randomRotationX = (seededRandom(seed + 4) - 0.5) * 0.2;
        const randomRotationZ = (seededRandom(seed + 5) - 0.5) * 0.2;
        geometry.rotateX(randomRotationX);
        geometry.rotateZ(randomRotationZ);

        geometries.push(geometry);
      }

      const merged = mergeGeometries(geometries, false);
      return merged ?? new THREE.BufferGeometry();
    }, [params.count, params.rockSize, params.spreadRadius, params.randomSeed, params.detail]);

    return <primitive object={mergedGeometry} />;
  },
};
