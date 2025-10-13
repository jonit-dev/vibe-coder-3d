/**
 * Pond Water Shape
 * A circular water surface for pond features
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { z } from 'zod';

import type { ICustomShapeDescriptor } from '@core/lib/rendering/shapes/IShapeDescriptor';

const paramsSchema = z.object({
  radius: z.number().min(0.5).max(20).default(3),
  height: z.number().min(0.01).max(1).default(0.05),
  radialSegments: z.number().int().min(8).max(128).default(32),
});

export const shape: ICustomShapeDescriptor<typeof paramsSchema> = {
  meta: {
    id: 'pond-water',
    name: 'Pond Water',
    category: 'Environment',
    tags: ['water', 'pond', 'nature', 'environment'],
    version: '1.0.0',
    defaultColor: '#4A90A4',
  },

  paramsSchema,

  getDefaultParams: () => paramsSchema.parse({}),

  renderGeometry: (params: z.infer<typeof paramsSchema>) => {
    const geometry = useMemo(
      () =>
        new THREE.CylinderGeometry(
          params.radius,
          params.radius,
          params.height,
          params.radialSegments,
        ),
      [params.radius, params.height, params.radialSegments],
    );

    return <primitive object={geometry} />;
  },
};
