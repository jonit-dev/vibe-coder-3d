/**
 * Pond Rocks Gray Shape
 * Groups gray decorative rocks around pond edges
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { z } from 'zod';

import type { ICustomShapeDescriptor } from '@core';

const paramsSchema = z.object({
  count: z.number().int().min(1).max(10).default(2),
  rockSize: z.number().min(0.1).max(2).default(0.6),
  spreadRadius: z.number().min(1).max(15).default(2.8),
  randomSeed: z.number().min(0).max(1000).default(42),
  detail: z.number().int().min(0).max(3).default(0),
});

export const shape: ICustomShapeDescriptor<typeof paramsSchema> = {
  meta: {
    id: 'pond-rocks-gray',
    name: 'Pond Rocks Gray',
    category: 'Environment',
    tags: ['rock', 'stone', 'pond', 'decoration', 'nature', 'gray'],
    version: '1.0.0',
  },

  paramsSchema,

  getDefaultParams: () => paramsSchema.parse({}),

  renderGeometry: (params) => {
    const mergedGeometry = useMemo(() => {
      const seededRandom = (seed: number) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
      };
      const geometries: THREE.BufferGeometry[] = [];

      const positions = [
        { x: -2.8, y: 0.05, z: -1.5, rotation: 35, scaleX: 1.0, scaleY: 0.67, scaleZ: 1.08 },
        { x: -2.2, y: 0.07, z: 2.3, rotation: 88, scaleX: 1.17, scaleY: 0.75, scaleZ: 1.13 },
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
