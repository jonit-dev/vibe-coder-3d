/**
 * Light Component Definition
 * Handles lighting for 3D scenes including directional, point, and spot lights
 */

import { Types } from 'bitecs';
import { z } from 'zod';

import { ComponentCategory, ComponentFactory } from '../../ComponentRegistry';
import { EntityId } from '../../types';

// Zod schema for Light component validation
export const LightSchema = z.object({
  lightType: z.enum(['directional', 'point', 'spot', 'ambient']),
  color: z.object({
    r: z.number().min(0).max(1),
    g: z.number().min(0).max(1),
    b: z.number().min(0).max(1),
  }),
  intensity: z.number().min(0),
  enabled: z.boolean(),
  castShadow: z.boolean(),
  // Directional Light Properties
  directionX: z.number().optional(),
  directionY: z.number().optional(),
  directionZ: z.number().optional(),
  // Point Light Properties
  range: z.number().positive().optional(),
  decay: z.number().min(0).optional(),
  // Spot Light Properties
  angle: z.number().min(0).max(Math.PI).optional(),
  penumbra: z.number().min(0).max(1).optional(),
  // Shadow Properties (simplified - only the reliable ones)
  shadowMapSize: z.number().int().positive().optional(),
  shadowBias: z.number().optional(),
  shadowRadius: z.number().positive().optional(),
});

export type LightData = z.infer<typeof LightSchema>;

// Light Component Definition
export const lightComponent = ComponentFactory.create({
  id: 'Light',
  name: 'Light',
  category: ComponentCategory.Rendering,
  schema: LightSchema,
  incompatibleComponents: ['MeshRenderer'], // Lights shouldn't have mesh renderers
  fields: {
    lightType: Types.ui8, // 0=directional, 1=point, 2=spot, 3=ambient
    colorR: Types.f32,
    colorG: Types.f32,
    colorB: Types.f32,
    intensity: Types.f32,
    enabled: Types.ui8,
    castShadow: Types.ui8,
    // Directional Light Properties
    directionX: Types.f32,
    directionY: Types.f32,
    directionZ: Types.f32,
    // Point Light Properties
    range: Types.f32,
    decay: Types.f32,
    // Spot Light Properties
    angle: Types.f32,
    penumbra: Types.f32,
    // Shadow Properties (simplified)
    shadowMapSize: Types.ui32,
    shadowBias: Types.f32,
    shadowRadius: Types.f32,
    needsUpdate: Types.ui8,
  },
  serialize: (eid: EntityId, component: Record<string, Record<number, number>>) => {
    const lightTypeMap = ['directional', 'point', 'spot', 'ambient'];

    return {
      lightType: lightTypeMap[component.lightType[eid]] as
        | 'directional'
        | 'point'
        | 'spot'
        | 'ambient',
      color: {
        r: component.colorR[eid] ?? 1.0,
        g: component.colorG[eid] ?? 1.0,
        b: component.colorB[eid] ?? 1.0,
      },
      intensity: component.intensity[eid] ?? 1.0,
      enabled: Boolean(component.enabled[eid] ?? 1),
      castShadow: Boolean(component.castShadow[eid] ?? 1),
      // Directional Light Properties
      directionX: component.directionX[eid] ?? 0.0,
      directionY: component.directionY[eid] ?? -1.0,
      directionZ: component.directionZ[eid] ?? 0.0,
      // Point Light Properties
      range: component.range[eid] ?? 10.0,
      decay: component.decay[eid] ?? 1.0,
      // Spot Light Properties
      angle: component.angle[eid] ?? Math.PI / 6,
      penumbra: component.penumbra[eid] ?? 0.1,
      // Shadow Properties (simplified)
      shadowMapSize: component.shadowMapSize[eid] ?? 1024,
      shadowBias: component.shadowBias[eid] ?? -0.0001,
      shadowRadius: component.shadowRadius[eid] ?? 1.0,
    };
  },
  deserialize: (eid: EntityId, data, component: Record<string, Record<number, number>>) => {
    const lightTypeMap = { directional: 0, point: 1, spot: 2, ambient: 3 };
    component.lightType[eid] = lightTypeMap[data.lightType as keyof typeof lightTypeMap] ?? 0;

    component.colorR[eid] = data.color?.r ?? 1.0;
    component.colorG[eid] = data.color?.g ?? 1.0;
    component.colorB[eid] = data.color?.b ?? 1.0;
    component.intensity[eid] = data.intensity ?? 1.0;
    component.enabled[eid] = data.enabled !== false ? 1 : 0;
    component.castShadow[eid] = data.castShadow !== false ? 1 : 0;

    // Directional Light Properties
    component.directionX[eid] = data.directionX ?? 0.0;
    component.directionY[eid] = data.directionY ?? -1.0;
    component.directionZ[eid] = data.directionZ ?? 0.0;

    // Point Light Properties
    component.range[eid] = data.range ?? 10.0;
    component.decay[eid] = data.decay ?? 1.0;

    // Spot Light Properties
    component.angle[eid] = data.angle ?? Math.PI / 6;
    component.penumbra[eid] = data.penumbra ?? 0.1;

    // Shadow Properties (simplified)
    component.shadowMapSize[eid] = data.shadowMapSize ?? 1024;
    component.shadowBias[eid] = data.shadowBias ?? -0.0001;
    component.shadowRadius[eid] = data.shadowRadius ?? 1.0;

    component.needsUpdate[eid] = 1; // Mark for update
  },
  dependencies: ['Transform'],
  conflicts: ['MeshRenderer'], // Light conflicts with MeshRenderer
  metadata: {
    description: 'Light source for illuminating 3D scenes',
    version: '1.0.0',
  },
});

export default lightComponent;
