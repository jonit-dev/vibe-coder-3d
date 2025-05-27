import { z } from 'zod';
import React from 'react';
import { FiEye } from 'react-icons/fi';
import { ComponentManifest, IRenderingContributions } from '../types';
import { ComponentCategory } from '@core/types/component-registry';

interface MeshRendererData {
  meshId: string; // e.g., 'cube', 'sphere'
  materialId: string; // Identifier for a material asset or definition
  enabled: boolean;
  castShadows: boolean;
  receiveShadows: boolean;
  material: {
    color: string; // hex color
    metalness: number;
    roughness: number;
    emissive: string; // hex color
    emissiveIntensity: number;
  };
}

const MeshRendererSchema = z.object({
  meshId: z.string().default('cube'),
  materialId: z.string().default('default'), // Default material identifier
  enabled: z.boolean().default(true),
  castShadows: z.boolean().default(true),
  receiveShadows: z.boolean().default(true),
  material: z.object({
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color").default('#3399ff'),
    metalness: z.number().min(0).max(1).default(0.0),
    roughness: z.number().min(0).max(1).default(0.5),
    emissive: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color").default('#000000'),
    emissiveIntensity: z.number().min(0).default(0.0),
  }),
});

const meshRendererManifest: ComponentManifest<MeshRendererData> = {
  id: 'MeshRenderer', // Matches KnownComponentTypes.MESH_RENDERER
  name: 'Mesh Renderer',
  category: ComponentCategory.Rendering,
  description: 'Renders 3D mesh geometry.',
  icon: React.createElement(FiEye, { className: 'w-4 h-4' }),
  schema: MeshRendererSchema,
  getDefaultData: () => MeshRendererSchema.parse({}), // Get defaults from Zod
  getRenderingContributions: (data: MeshRendererData): IRenderingContributions => {
    const meshIdToTypeMap: { [key: string]: string } = {
      cube: 'Cube', sphere: 'Sphere', cylinder: 'Cylinder',
      cone: 'Cone', torus: 'Torus', plane: 'Plane', capsule: 'Cube', // Assuming capsule maps to a Cube for rendering
    };
    return {
      meshType: meshIdToTypeMap[data.meshId] || 'Cube', // Default to Cube if meshId is unknown
      material: data.material,
      visible: data.enabled,
      castShadow: data.castShadows,
      receiveShadow: data.receiveShadows,
    };
  },
  removable: true,
};

export default meshRendererManifest;
