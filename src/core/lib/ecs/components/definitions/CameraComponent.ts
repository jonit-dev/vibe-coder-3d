/**
 * Camera Component Definition
 * Handles camera rendering perspectives and viewports
 */

import { Types } from 'bitecs';
import { z } from 'zod';

import { ComponentCategory, ComponentFactory } from '../../ComponentRegistry';
import { EntityId } from '../../types';

// Camera Schema
const CameraSchema = z.object({
  fov: z.number(),
  near: z.number(),
  far: z.number(),
  projectionType: z.enum(['perspective', 'orthographic']),
  orthographicSize: z.number(),
  depth: z.number(),
  isMain: z.boolean(),
  clearFlags: z.enum(['skybox', 'solidColor', 'depthOnly', 'dontClear']).optional(),
  backgroundColor: z
    .object({
      r: z.number().min(0).max(1),
      g: z.number().min(0).max(1),
      b: z.number().min(0).max(1),
      a: z.number().min(0).max(1),
    })
    .optional(),
});

// Camera Component Definition
export const cameraComponent = ComponentFactory.create({
  id: 'Camera',
  name: 'Camera',
  category: ComponentCategory.Rendering,
  schema: CameraSchema,
  incompatibleComponents: ['MeshRenderer'], // Cameras shouldn't have mesh renderers
  fields: {
    fov: Types.f32,
    near: Types.f32,
    far: Types.f32,
    projectionType: Types.ui8,
    orthographicSize: Types.f32,
    depth: Types.i32,
    isMain: Types.ui8,
    clearFlags: Types.ui8,
    backgroundR: Types.f32,
    backgroundG: Types.f32,
    backgroundB: Types.f32,
    backgroundA: Types.f32,
    needsUpdate: Types.ui8,
  },
  serialize: (eid: EntityId, component: any) => {
    const serialized = {
      fov: component.fov[eid],
      near: component.near[eid],
      far: component.far[eid],
      projectionType: (component.projectionType[eid] === 1 ? 'orthographic' : 'perspective') as
        | 'perspective'
        | 'orthographic',
      orthographicSize: component.orthographicSize[eid],
      depth: component.depth[eid],
      isMain: Boolean(component.isMain[eid]),
      clearFlags: (['skybox', 'solidColor', 'depthOnly', 'dontClear'][component.clearFlags[eid]] ||
        'skybox') as 'skybox' | 'solidColor' | 'depthOnly' | 'dontClear',
      backgroundColor: {
        r: component.backgroundR[eid] ?? 0.0,
        g: component.backgroundG[eid] ?? 0.0,
        b: component.backgroundB[eid] ?? 0.0,
        a: component.backgroundA[eid] ?? 1.0,
      },
    };
    return serialized;
  },
  deserialize: (eid: EntityId, data, component: any) => {
    component.fov[eid] = data.fov;
    component.near[eid] = data.near;
    component.far[eid] = data.far;
    component.projectionType[eid] = data.projectionType === 'orthographic' ? 1 : 0;
    component.orthographicSize[eid] = data.orthographicSize || 10;
    component.depth[eid] = data.depth || 0;
    component.isMain[eid] = data.isMain ? 1 : 0;
    const clearFlagsMap = { skybox: 0, solidColor: 1, depthOnly: 2, dontClear: 3 };
    component.clearFlags[eid] = clearFlagsMap[data.clearFlags as keyof typeof clearFlagsMap] ?? 0;
    component.backgroundR[eid] = data.backgroundColor?.r ?? 0.0;
    component.backgroundG[eid] = data.backgroundColor?.g ?? 0.0;
    component.backgroundB[eid] = data.backgroundColor?.b ?? 0.0;
    component.backgroundA[eid] = data.backgroundColor?.a ?? 1.0;
    component.needsUpdate[eid] = 1; // Mark for update
  },
  dependencies: ['Transform'],
  conflicts: ['MeshRenderer'], // Camera conflicts with MeshRenderer
  metadata: {
    description: 'Camera for rendering perspectives and viewports',
    version: '1.0.0',
  },
});

export type CameraData = z.infer<typeof CameraSchema>;
