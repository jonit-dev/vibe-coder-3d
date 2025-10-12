/**
 * Example Torus Knot Shape
 * Demonstrates how to create a custom shape with parameters
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { z } from 'zod';

import type { ICustomShapeDescriptor } from '@core/lib/rendering/shapes/IShapeDescriptor';

/**
 * Define shape parameters with Zod validation
 * All parameters should have sensible defaults and constraints
 */
const paramsSchema = z.object({
  radius: z.number().min(0.1).max(5).default(0.4),
  tube: z.number().min(0.01).max(1).default(0.1),
  tubularSegments: z.number().int().min(8).max(200).default(64),
  radialSegments: z.number().int().min(3).max(64).default(8),
  p: z.number().int().min(1).max(10).default(2),
  q: z.number().int().min(1).max(10).default(3),
});

/**
 * Export the shape descriptor (MUST be named 'shape')
 */
export const shape: ICustomShapeDescriptor<typeof paramsSchema> = {
  meta: {
    id: 'example-torus-knot',
    name: 'Example Torus Knot',
    category: 'Procedural',
    tags: ['knot', 'math', 'parametric', 'example'],
    version: '1.0.0',
  },

  paramsSchema,

  getDefaultParams: () => paramsSchema.parse({}),

  renderGeometry: (params: z.infer<typeof paramsSchema>) => {
    // Use useMemo to prevent recreating geometry on every render
    // Include all params in the dependency array
    const geometry = useMemo(
      () =>
        new THREE.TorusKnotGeometry(
          params.radius,
          params.tube,
          params.tubularSegments,
          params.radialSegments,
          params.p,
          params.q,
        ),
      [
        params.radius,
        params.tube,
        params.tubularSegments,
        params.radialSegments,
        params.p,
        params.q,
      ],
    );

    // Return the geometry as a React Three Fiber primitive
    return <primitive object={geometry} />;
  },
};
