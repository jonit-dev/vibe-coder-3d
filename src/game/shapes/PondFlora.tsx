/**
 * Pond Flora Shape
 * Groups cattails with reeds and heads around pond edges
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { z } from 'zod';

import type { ICustomShapeDescriptor } from '@core';

const paramsSchema = z.object({
  count: z.number().int().min(1).max(20).default(4),
  reedRadius: z.number().min(0.01).max(0.2).default(0.04),
  reedHeight: z.number().min(0.5).max(3).default(1.2),
  headRadius: z.number().min(0.02).max(0.3).default(0.06),
  headHeight: z.number().min(0.1).max(0.5).default(0.25),
  spreadRadius: z.number().min(1).max(15).default(2.5),
  randomSeed: z.number().min(0).max(1000).default(42),
});

export const shape: ICustomShapeDescriptor<typeof paramsSchema> = {
  meta: {
    id: 'pond-flora',
    name: 'Pond Flora',
    category: 'Environment',
    tags: ['cattail', 'reed', 'pond', 'vegetation', 'nature'],
    version: '1.0.0',
  },

  paramsSchema,

  getDefaultParams: () => paramsSchema.parse({}),

  renderGeometry: (params: z.infer<typeof paramsSchema>) => {
    const group = useMemo(() => {
      const seededRandom = (seed: number) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
      };

      const floraGroup = new THREE.Group();

      const cattails = [
        { x: -2.5, z: 0.5, rotation: 15, tilt: 5, heightMult: 1.0 },
        { x: 2.3, z: -0.8, rotation: 0, tilt: 0, heightMult: 0.96 },
        { x: -1.8, z: -2.4, rotation: 0, tilt: 0, heightMult: 1.02 },
        { x: 0.5, z: 2.6, rotation: 0, tilt: 0, heightMult: 0.92 },
      ];

      for (let i = 0; i < params.count; i++) {
        const cattail = cattails[i % cattails.length];
        const seed = params.randomSeed + i;

        const heightVariation = 0.9 + seededRandom(seed) * 0.2;
        const finalReedHeight = params.reedHeight * cattail.heightMult * heightVariation;

        const reedGeometry = new THREE.CylinderGeometry(
          params.reedRadius * 0.75,
          params.reedRadius,
          finalReedHeight,
          8,
        );

        const normalizedX = (cattail.x / params.spreadRadius) * params.spreadRadius;
        const normalizedZ = (cattail.z / params.spreadRadius) * params.spreadRadius;

        reedGeometry.translate(normalizedX, finalReedHeight / 2, normalizedZ);
        reedGeometry.rotateY((cattail.rotation * Math.PI) / 180);
        reedGeometry.rotateZ((cattail.tilt * Math.PI) / 180);

        const reedMesh = new THREE.Mesh(reedGeometry);
        floraGroup.add(reedMesh);

        const headGeometry = new THREE.CylinderGeometry(
          params.headRadius,
          params.headRadius * 0.8,
          params.headHeight,
          8,
        );

        const headY = finalReedHeight + params.headHeight / 2;

        headGeometry.translate(normalizedX, headY, normalizedZ);
        headGeometry.rotateY((cattail.rotation * Math.PI) / 180);
        headGeometry.rotateZ((cattail.tilt * Math.PI) / 180);

        const headMesh = new THREE.Mesh(headGeometry);
        floraGroup.add(headMesh);
      }

      return floraGroup;
    }, [
      params.count,
      params.reedRadius,
      params.reedHeight,
      params.headRadius,
      params.headHeight,
      params.spreadRadius,
      params.randomSeed,
    ]);

    return <primitive object={group} />;
  },
};
