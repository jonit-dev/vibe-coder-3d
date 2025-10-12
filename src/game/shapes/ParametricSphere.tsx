/**
 * Parametric Sphere Shape
 * A simple example shape demonstrating parameter control
 */

import { z } from 'zod';

import type { ICustomShapeDescriptor } from '@core';

const paramsSchema = z.object({
  radius: z.number().min(0.1).max(10).default(0.5),
  widthSegments: z.number().int().min(3).max(128).default(32),
  heightSegments: z.number().int().min(2).max(64).default(16),
});

export const shape: ICustomShapeDescriptor<typeof paramsSchema> = {
  meta: {
    id: 'parametric-sphere',
    name: 'Parametric Sphere',
    category: 'Basic',
    tags: ['sphere', 'basic', 'parametric'],
    version: '1.0.0',
  },

  paramsSchema,

  getDefaultParams: () => paramsSchema.parse({}),

  renderGeometry: (params) => (
    <sphereGeometry args={[params.radius, params.widthSegments, params.heightSegments]} />
  ),
};
