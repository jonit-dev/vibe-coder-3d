/**
 * MeshRenderer Component Definition
 * Handles 3D mesh rendering with materials
 */

import { Types } from 'bitecs';
import { z } from 'zod';

import { ComponentCategory, ComponentFactory } from '../../ComponentRegistry';
import { EntityId } from '../../types';
import { getRgbAsHex, setRgbValues } from '../../utils/colorUtils';
import { getStringFromHash, storeString } from '../../utils/stringHashUtils';

// MeshRenderer Schema
const MeshRendererSchema = z.object({
  meshId: z.string(),
  materialId: z.string(),
  enabled: z.boolean().default(true),
  castShadows: z.boolean().default(true),
  receiveShadows: z.boolean().default(true),
  material: z
    .object({
      color: z.string().default('#3399ff'),
      metalness: z.number().default(0),
      roughness: z.number().default(0.5),
      emissive: z.string().default('#000000'),
      emissiveIntensity: z.number().default(0),
    })
    .optional(),
});

// MeshRenderer Component Definition
export const meshRendererComponent = ComponentFactory.create({
  id: 'MeshRenderer',
  name: 'Mesh Renderer',
  category: ComponentCategory.Rendering,
  schema: MeshRendererSchema,
  fields: {
    enabled: Types.ui8,
    castShadows: Types.ui8,
    receiveShadows: Types.ui8,
    materialColorR: Types.f32,
    materialColorG: Types.f32,
    materialColorB: Types.f32,
    metalness: Types.f32,
    roughness: Types.f32,
    emissiveR: Types.f32,
    emissiveG: Types.f32,
    emissiveB: Types.f32,
    emissiveIntensity: Types.f32,
    meshIdHash: Types.ui32,
    materialIdHash: Types.ui32,
  },
  serialize: (eid: EntityId, component: any) => ({
    meshId: getStringFromHash(component.meshIdHash[eid]),
    materialId: getStringFromHash(component.materialIdHash[eid]),
    enabled: Boolean(component.enabled[eid]),
    castShadows: Boolean(component.castShadows[eid]),
    receiveShadows: Boolean(component.receiveShadows[eid]),
    material: {
      color: getRgbAsHex(
        {
          r: component.materialColorR,
          g: component.materialColorG,
          b: component.materialColorB,
        },
        eid,
      ),
      metalness: component.metalness[eid],
      roughness: component.roughness[eid],
      emissive: getRgbAsHex(
        {
          r: component.emissiveR,
          g: component.emissiveG,
          b: component.emissiveB,
        },
        eid,
      ),
      emissiveIntensity: component.emissiveIntensity[eid],
    },
  }),
  deserialize: (eid: EntityId, data, component: any) => {
    component.enabled[eid] = (data.enabled ?? true) ? 1 : 0;
    component.castShadows[eid] = (data.castShadows ?? true) ? 1 : 0;
    component.receiveShadows[eid] = (data.receiveShadows ?? true) ? 1 : 0;
    component.meshIdHash[eid] = storeString(data.meshId);
    component.materialIdHash[eid] = storeString(data.materialId);

    // Set material properties with defaults
    const material = data.material || {};
    setRgbValues(
      {
        r: component.materialColorR,
        g: component.materialColorG,
        b: component.materialColorB,
      },
      eid,
      material.color || '#3399ff',
    );

    component.metalness[eid] = material.metalness ?? 0;
    component.roughness[eid] = material.roughness ?? 0.5;

    setRgbValues(
      {
        r: component.emissiveR,
        g: component.emissiveG,
        b: component.emissiveB,
      },
      eid,
      material.emissive || '#000000',
    );

    component.emissiveIntensity[eid] = material.emissiveIntensity ?? 0;
  },
  dependencies: ['Transform'],
  conflicts: ['Camera'], // MeshRenderer conflicts with Camera
  metadata: {
    description: 'Renders 3D mesh geometry with materials',
    version: '1.0.0',
  },
});

export type MeshRendererData = z.infer<typeof MeshRendererSchema>;
