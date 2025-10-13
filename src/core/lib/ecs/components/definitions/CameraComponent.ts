/**
 * Camera Component Definition
 * Handles camera rendering perspectives and viewports
 */

import { Types } from 'bitecs';
import { z } from 'zod';

import { ComponentCategory, ComponentFactory } from '../../ComponentRegistry';
import { EntityId } from '../../types';
import { getSkyboxPaths } from '@/utils/skyboxLoader';

// Dynamically loaded skybox paths (lazy-loaded for performance)
let SKYBOX_TEXTURES: string[] | null = null;

const getSkyboxTextures = (): string[] => {
  if (!SKYBOX_TEXTURES) {
    SKYBOX_TEXTURES = getSkyboxPaths();
  }
  return SKYBOX_TEXTURES;
};

const getSkyboxIndex = (path: string): number => {
  const textures = getSkyboxTextures();
  const index = textures.indexOf(path);
  return index >= 0 ? index : 0;
};

const getSkyboxPath = (index: number): string => {
  const textures = getSkyboxTextures();
  return textures[index] || '';
};

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
  skyboxTexture: z.string().optional(), // Path to skybox texture
  backgroundColor: z
    .object({
      r: z.number().min(0).max(1),
      g: z.number().min(0).max(1),
      b: z.number().min(0).max(1),
      a: z.number().min(0).max(1),
    })
    .optional(),
  // Camera Control Mode - Unity-style camera controls
  controlMode: z.enum(['locked', 'free']).optional(),
  // Camera Follow Properties
  enableSmoothing: z.boolean().optional(),
  followTarget: z.number().optional(), // Entity ID to follow
  followOffset: z
    .object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    })
    .optional(),
  smoothingSpeed: z.number().min(0.1).max(10).optional(),
  // Viewport Rectangle for multi-camera rendering
  viewportRect: z
    .object({
      x: z.number().min(0).max(1), // Normalized coordinates (0-1)
      y: z.number().min(0).max(1),
      width: z.number().min(0).max(1),
      height: z.number().min(0).max(1),
    })
    .optional(),
  // HDR and Tone Mapping
  hdr: z.boolean().optional(),
  toneMapping: z.enum(['none', 'linear', 'reinhard', 'cineon', 'aces']).optional(),
  toneMappingExposure: z.number().optional(),
  // Post-processing
  enablePostProcessing: z.boolean().optional(),
  postProcessingPreset: z.enum(['none', 'cinematic', 'realistic', 'stylized']).optional(),
  rotationSmoothing: z.number().min(0.1).max(10).optional(),
  // Skybox Transform Properties (like Unity/Unreal)
  skyboxScale: z
    .object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    })
    .optional(),
  skyboxRotation: z
    .object({
      x: z.number(), // Euler angles in degrees
      y: z.number(),
      z: z.number(),
    })
    .optional(),
  skyboxRepeat: z
    .object({
      u: z.number().min(0.1), // UV repeat
      v: z.number().min(0.1),
    })
    .optional(),
  skyboxOffset: z
    .object({
      u: z.number(), // UV offset
      v: z.number(),
    })
    .optional(),
  skyboxIntensity: z.number().min(0).max(5).optional(), // HDR intensity multiplier
  skyboxBlur: z.number().min(0).max(1).optional(), // Blur amount (0-1)
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
    skyboxTexture: Types.ui32, // Store as index/hash for performance
    backgroundR: Types.f32,
    backgroundG: Types.f32,
    backgroundB: Types.f32,
    backgroundA: Types.f32,
    // Camera Control Mode
    controlMode: Types.ui8, // 0=locked, 1=free
    // Viewport Rectangle
    viewportX: Types.f32,
    viewportY: Types.f32,
    viewportWidth: Types.f32,
    viewportHeight: Types.f32,
    // HDR and Tone Mapping
    hdr: Types.ui8,
    toneMapping: Types.ui8, // 0=none, 1=linear, 2=reinhard, 3=cineon, 4=aces
    toneMappingExposure: Types.f32,
    // Post-processing
    enablePostProcessing: Types.ui8,
    postProcessingPreset: Types.ui8, // 0=none, 1=cinematic, 2=realistic, 3=stylized
    // Camera Animation & Follow
    enableSmoothing: Types.ui8,
    followTarget: Types.ui32,
    followOffsetX: Types.f32,
    followOffsetY: Types.f32,
    followOffsetZ: Types.f32,
    smoothingSpeed: Types.f32,
    rotationSmoothing: Types.f32,
    needsUpdate: Types.ui8,
    // Skybox Transform Properties
    skyboxScaleX: Types.f32,
    skyboxScaleY: Types.f32,
    skyboxScaleZ: Types.f32,
    skyboxRotationX: Types.f32,
    skyboxRotationY: Types.f32,
    skyboxRotationZ: Types.f32,
    skyboxRepeatU: Types.f32,
    skyboxRepeatV: Types.f32,
    skyboxOffsetU: Types.f32,
    skyboxOffsetV: Types.f32,
    skyboxIntensity: Types.f32,
    skyboxBlur: Types.f32,
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
      skyboxTexture: getSkyboxPath(component.skyboxTexture[eid] ?? 0),
      backgroundColor: {
        r: component.backgroundR[eid] ?? 0.0,
        g: component.backgroundG[eid] ?? 0.0,
        b: component.backgroundB[eid] ?? 0.0,
        a: component.backgroundA[eid] ?? 1.0,
      },
      // Camera Control Mode
      controlMode: (['locked', 'free'][component.controlMode[eid]] || 'free') as 'locked' | 'free',
      // Viewport Rectangle
      viewportRect: {
        x: component.viewportX[eid] ?? 0.0,
        y: component.viewportY[eid] ?? 0.0,
        width: component.viewportWidth[eid] ?? 1.0,
        height: component.viewportHeight[eid] ?? 1.0,
      },
      // HDR and Tone Mapping
      hdr: Boolean(component.hdr[eid] ?? 0),
      toneMapping: (['none', 'linear', 'reinhard', 'cineon', 'aces'][component.toneMapping[eid]] ||
        'none') as 'none' | 'linear' | 'reinhard' | 'cineon' | 'aces',
      toneMappingExposure: component.toneMappingExposure[eid] ?? 1.0,
      // Post-processing
      enablePostProcessing: Boolean(component.enablePostProcessing[eid] ?? 0),
      postProcessingPreset: (['none', 'cinematic', 'realistic', 'stylized'][
        component.postProcessingPreset[eid]
      ] || 'none') as 'none' | 'cinematic' | 'realistic' | 'stylized',
      // Camera Animation & Follow
      enableSmoothing: Boolean(component.enableSmoothing[eid] ?? 0),
      followTarget: component.followTarget[eid] ?? 0,
      followOffset: {
        x: component.followOffsetX[eid] ?? 0.0,
        y: component.followOffsetY[eid] ?? 5.0,
        z: component.followOffsetZ[eid] ?? -10.0,
      },
      smoothingSpeed: component.smoothingSpeed[eid] ?? 2.0,
      rotationSmoothing: component.rotationSmoothing[eid] ?? 1.5,
      // Skybox Transform Properties
      skyboxScale: {
        x: component.skyboxScaleX[eid] ?? 1.0,
        y: component.skyboxScaleY[eid] ?? 1.0,
        z: component.skyboxScaleZ[eid] ?? 1.0,
      },
      skyboxRotation: {
        x: component.skyboxRotationX[eid] ?? 0.0,
        y: component.skyboxRotationY[eid] ?? 0.0,
        z: component.skyboxRotationZ[eid] ?? 0.0,
      },
      skyboxRepeat: {
        u: component.skyboxRepeatU[eid] ?? 1.0,
        v: component.skyboxRepeatV[eid] ?? 1.0,
      },
      skyboxOffset: {
        u: component.skyboxOffsetU[eid] ?? 0.0,
        v: component.skyboxOffsetV[eid] ?? 0.0,
      },
      skyboxIntensity: component.skyboxIntensity[eid] ?? 1.0,
      skyboxBlur: component.skyboxBlur[eid] ?? 0.0,
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
    component.skyboxTexture[eid] = getSkyboxIndex(data.skyboxTexture || '');
    component.backgroundR[eid] = data.backgroundColor?.r ?? 0.0;
    component.backgroundG[eid] = data.backgroundColor?.g ?? 0.0;
    component.backgroundB[eid] = data.backgroundColor?.b ?? 0.0;
    component.backgroundA[eid] = data.backgroundColor?.a ?? 1.0;

    // Camera Control Mode
    const controlModeMap = { locked: 0, free: 1 };
    component.controlMode[eid] =
      controlModeMap[data.controlMode as keyof typeof controlModeMap] ?? 1; // Default to free (1)

    // Viewport Rectangle
    component.viewportX[eid] = data.viewportRect?.x ?? 0.0;
    component.viewportY[eid] = data.viewportRect?.y ?? 0.0;
    component.viewportWidth[eid] = data.viewportRect?.width ?? 1.0;
    component.viewportHeight[eid] = data.viewportRect?.height ?? 1.0;

    // HDR and Tone Mapping
    component.hdr[eid] = data.hdr ? 1 : 0;
    const toneMappingMap = { none: 0, linear: 1, reinhard: 2, cineon: 3, aces: 4 };
    component.toneMapping[eid] =
      toneMappingMap[data.toneMapping as keyof typeof toneMappingMap] ?? 0;
    component.toneMappingExposure[eid] = data.toneMappingExposure ?? 1.0;

    // Post-processing
    component.enablePostProcessing[eid] = data.enablePostProcessing ? 1 : 0;
    const postProcessingMap = { none: 0, cinematic: 1, realistic: 2, stylized: 3 };
    component.postProcessingPreset[eid] =
      postProcessingMap[data.postProcessingPreset as keyof typeof postProcessingMap] ?? 0;

    // Camera Animation & Follow
    component.enableSmoothing[eid] = data.enableSmoothing ? 1 : 0;
    component.followTarget[eid] = data.followTarget ?? 0;
    component.followOffsetX[eid] = data.followOffset?.x ?? 0.0;
    component.followOffsetY[eid] = data.followOffset?.y ?? 5.0;
    component.followOffsetZ[eid] = data.followOffset?.z ?? -10.0;
    component.smoothingSpeed[eid] = data.smoothingSpeed ?? 2.0;
    component.rotationSmoothing[eid] = data.rotationSmoothing ?? 1.5;

    // Skybox Transform Properties
    component.skyboxScaleX[eid] = data.skyboxScale?.x ?? 1.0;
    component.skyboxScaleY[eid] = data.skyboxScale?.y ?? 1.0;
    component.skyboxScaleZ[eid] = data.skyboxScale?.z ?? 1.0;
    component.skyboxRotationX[eid] = data.skyboxRotation?.x ?? 0.0;
    component.skyboxRotationY[eid] = data.skyboxRotation?.y ?? 0.0;
    component.skyboxRotationZ[eid] = data.skyboxRotation?.z ?? 0.0;
    component.skyboxRepeatU[eid] = data.skyboxRepeat?.u ?? 1.0;
    component.skyboxRepeatV[eid] = data.skyboxRepeat?.v ?? 1.0;
    component.skyboxOffsetU[eid] = data.skyboxOffset?.u ?? 0.0;
    component.skyboxOffsetV[eid] = data.skyboxOffset?.v ?? 0.0;
    component.skyboxIntensity[eid] = data.skyboxIntensity ?? 1.0;
    component.skyboxBlur[eid] = data.skyboxBlur ?? 0.0;

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
