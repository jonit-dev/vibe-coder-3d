import { z } from 'zod';
import React from 'react';
import { FiMove } from 'react-icons/fi';
import { ComponentManifest } from '../types';
import { ComponentCategory } from '@core/types/component-registry';

interface TransformData {
  position: [number, number, number];
  rotation: [number, number, number, number]; // Quaternion
  scale: [number, number, number];
}

const TransformSchema = z.object({
  position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  rotation: z.tuple([z.number(), z.number(), z.number(), z.number()]).default([0, 0, 0, 1]), // Quaternion default
  scale: z.tuple([z.number(), z.number(), z.number()]).default([1, 1, 1]),
});

const transformManifest: ComponentManifest<TransformData> = {
  id: 'Transform', // Matches KnownComponentTypes.TRANSFORM
  name: 'Transform',
  category: ComponentCategory.Core,
  description: 'Position, rotation, and scale of an entity.',
  icon: React.createElement(FiMove, { className: 'w-4 h-4' }),
  schema: TransformSchema,
  getDefaultData: () => TransformSchema.parse({}), // Get defaults from Zod
  removable: false,
  // No rendering or physics contributions from Transform itself in this model
};

export default transformManifest;
