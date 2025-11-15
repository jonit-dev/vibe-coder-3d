/**
 * Light Component Definition
 * Handles lighting for 3D scenes including directional, point, and spot lights
 */

import { Types } from 'bitecs';
import { z } from 'zod';

import { ComponentCategory, ComponentFactory } from '../../ComponentRegistry';
import { EntityId } from '../../types';

// BitECS component interface for Light component
export interface ILightBitECSComponent {
  lightType: Record<number, number>;
  colorR: Record<number, number>;
  colorG: Record<number, number>;
  colorB: Record<number, number>;
  intensity: Record<number, number>;
  enabled: Record<number, number>;
  castShadow: Record<number, number>;
  directionX: Record<number, number>;
  directionY: Record<number, number>;
  directionZ: Record<number, number>;
  range: Record<number, number>;
  decay: Record<number, number>;
  angle: Record<number, number>;
  penumbra: Record<number, number>;
  shadowMapSize: Record<number, number>;
  shadowBias: Record<number, number>;
  shadowRadius: Record<number, number>;
  needsUpdate: Record<number, number>;
}

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
  serialize: (eid: EntityId, component: unknown) => {
    const lightTypeMap = ['directional', 'point', 'spot', 'ambient'];
    const lightComponent = component as ILightBitECSComponent;

    return {
      lightType: lightTypeMap[lightComponent.lightType[eid]] as
        | 'directional'
        | 'point'
        | 'spot'
        | 'ambient',
      color: {
        r: lightComponent.colorR[eid] ?? 1.0,
        g: lightComponent.colorG[eid] ?? 1.0,
        b: lightComponent.colorB[eid] ?? 1.0,
      },
      intensity: lightComponent.intensity[eid] ?? 1.0,
      enabled: Boolean(lightComponent.enabled[eid] ?? 1),
      castShadow: Boolean(lightComponent.castShadow[eid] ?? 1),
      // Directional Light Properties
      directionX: lightComponent.directionX[eid] ?? 0.0,
      directionY: lightComponent.directionY[eid] ?? -1.0,
      directionZ: lightComponent.directionZ[eid] ?? 0.0,
      // Point Light Properties
      range: lightComponent.range[eid] ?? 10.0,
      decay: lightComponent.decay[eid] ?? 1.0,
      // Spot Light Properties
      angle: lightComponent.angle[eid] ?? Math.PI / 6,
      penumbra: lightComponent.penumbra[eid] ?? 0.1,
      // Shadow Properties (simplified)
      shadowMapSize: lightComponent.shadowMapSize[eid] ?? 4096,
      shadowBias: lightComponent.shadowBias[eid] ?? -0.0005,
      shadowRadius: lightComponent.shadowRadius[eid] ?? 0.2,
    };
  },
  deserialize: (eid: EntityId, data: LightData, component: unknown) => {
    const lightTypeMap = { directional: 0, point: 1, spot: 2, ambient: 3 };
    const lightComponent = component as ILightBitECSComponent;

    lightComponent.lightType[eid] = lightTypeMap[data.lightType as keyof typeof lightTypeMap] ?? 0;

    lightComponent.colorR[eid] = data.color?.r ?? 1.0;
    lightComponent.colorG[eid] = data.color?.g ?? 1.0;
    lightComponent.colorB[eid] = data.color?.b ?? 1.0;
    lightComponent.intensity[eid] = data.intensity ?? 1.0;
    lightComponent.enabled[eid] = data.enabled !== false ? 1 : 0;
    lightComponent.castShadow[eid] = data.castShadow !== false ? 1 : 0;

    // Directional Light Properties
    lightComponent.directionX[eid] = data.directionX ?? 0.0;
    lightComponent.directionY[eid] = data.directionY ?? -1.0;
    lightComponent.directionZ[eid] = data.directionZ ?? 0.0;

    // Point Light Properties
    lightComponent.range[eid] = data.range ?? 10.0;
    lightComponent.decay[eid] = data.decay ?? 1.0;

    // Spot Light Properties
    lightComponent.angle[eid] = data.angle ?? Math.PI / 6;
    lightComponent.penumbra[eid] = data.penumbra ?? 0.1;

    // Shadow Properties (simplified)
    lightComponent.shadowMapSize[eid] = data.shadowMapSize ?? 4096;
    lightComponent.shadowBias[eid] = data.shadowBias ?? -0.0005;
    lightComponent.shadowRadius[eid] = data.shadowRadius ?? 0.2;

    lightComponent.needsUpdate[eid] = 1; // Mark for update
  },
  dependencies: ['Transform'],
  conflicts: ['MeshRenderer'], // Light conflicts with MeshRenderer
  metadata: {
    description: 'Light source for illuminating 3D scenes',
    version: '1.0.0',
  },
});

export default lightComponent;
