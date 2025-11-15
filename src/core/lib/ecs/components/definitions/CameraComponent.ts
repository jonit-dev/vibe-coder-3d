/**
 * Camera Component Definition
 * Handles camera rendering perspectives and viewports
 */

import { Types } from 'bitecs';
import { z } from 'zod';

import { getSkyboxPaths } from '@/utils/skyboxLoader';
import { ComponentCategory, ComponentFactory } from '../../ComponentRegistry';
import { EntityId } from '../../types';

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
      r: z.number().min(0).max(1).optional(),
      g: z.number().min(0).max(1).optional(),
      b: z.number().min(0).max(1).optional(),
      a: z.number().min(0).max(1).optional(),
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

export type CameraData = z.infer<typeof CameraSchema>;

// BitECS component type for Camera
interface ICameraBitECSComponent {
  fov: { [eid: number]: number };
  near: { [eid: number]: number };
  far: { [eid: number]: number };
  projectionType: { [eid: number]: number }; // 0=perspective, 1=orthographic
  orthographicSize: { [eid: number]: number };
  depth: { [eid: number]: number };
  isMain: { [eid: number]: number };
  clearFlags: { [eid: number]: number };
  skyboxTexture: { [eid: number]: number };
  backgroundR: { [eid: number]: number };
  backgroundG: { [eid: number]: number };
  backgroundB: { [eid: number]: number };
  backgroundA: { [eid: number]: number };
  // Camera Control Mode
  controlMode: { [eid: number]: number }; // 0=locked, 1=free
  // Viewport Rectangle
  viewportX: { [eid: number]: number };
  viewportY: { [eid: number]: number };
  viewportWidth: { [eid: number]: number };
  viewportHeight: { [eid: number]: number };
  // HDR and Tone Mapping
  hdr: { [eid: number]: number };
  toneMapping: { [eid: number]: number }; // 0=none, 1=linear, 2=reinhard, 3=cineon, 4=aces
  toneMappingExposure: { [eid: number]: number };
  // Post-processing
  enablePostProcessing: { [eid: number]: number };
  postProcessingPreset: { [eid: number]: number }; // 0=none, 1=cinematic, 2=realistic, 3=stylized
  // Camera Animation & Follow
  enableSmoothing: { [eid: number]: number };
  followTarget: { [eid: number]: number };
  followOffsetX: { [eid: number]: number };
  followOffsetY: { [eid: number]: number };
  followOffsetZ: { [eid: number]: number };
  smoothingSpeed: { [eid: number]: number };
  rotationSmoothing: { [eid: number]: number };
  needsUpdate: { [eid: number]: number };
  // Skybox Transform Properties
  skyboxScaleX: { [eid: number]: number };
  skyboxScaleY: { [eid: number]: number };
  skyboxScaleZ: { [eid: number]: number };
  skyboxRotationX: { [eid: number]: number };
  skyboxRotationY: { [eid: number]: number };
  skyboxRotationZ: { [eid: number]: number };
  skyboxRepeatU: { [eid: number]: number };
  skyboxRepeatV: { [eid: number]: number };
  skyboxOffsetU: { [eid: number]: number };
  skyboxOffsetV: { [eid: number]: number };
  skyboxIntensity: { [eid: number]: number };
  skyboxBlur: { [eid: number]: number };
}

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
  serialize: (eid: EntityId, component: unknown) => {
    const cameraComponent = component as ICameraBitECSComponent;
    const serialized = {
      fov: cameraComponent.fov[eid],
      near: cameraComponent.near[eid],
      far: cameraComponent.far[eid],
      projectionType: (cameraComponent.projectionType[eid] === 1
        ? 'orthographic'
        : 'perspective') as 'perspective' | 'orthographic',
      orthographicSize: cameraComponent.orthographicSize[eid],
      depth: cameraComponent.depth[eid],
      isMain: Boolean(cameraComponent.isMain[eid]),
      clearFlags: (['skybox', 'solidColor', 'depthOnly', 'dontClear'][
        cameraComponent.clearFlags[eid]
      ] || 'skybox') as 'skybox' | 'solidColor' | 'depthOnly' | 'dontClear',
      skyboxTexture: getSkyboxPath(cameraComponent.skyboxTexture[eid] ?? 0),
      backgroundColor: {
        r: cameraComponent.backgroundR[eid],
        g: cameraComponent.backgroundG[eid],
        b: cameraComponent.backgroundB[eid],
        a: cameraComponent.backgroundA[eid],
      },
      // Camera Control Mode
      controlMode: (['locked', 'free'][cameraComponent.controlMode[eid]] || 'free') as
        | 'locked'
        | 'free',
      // Viewport Rectangle
      viewportRect: {
        x: cameraComponent.viewportX[eid] ?? 0.0,
        y: cameraComponent.viewportY[eid] ?? 0.0,
        width: cameraComponent.viewportWidth[eid] ?? 1.0,
        height: cameraComponent.viewportHeight[eid] ?? 1.0,
      },
      // HDR and Tone Mapping
      hdr: Boolean(cameraComponent.hdr[eid] ?? 0),
      toneMapping: (['none', 'linear', 'reinhard', 'cineon', 'aces'][
        cameraComponent.toneMapping[eid]
      ] || 'none') as 'none' | 'linear' | 'reinhard' | 'cineon' | 'aces',
      toneMappingExposure: cameraComponent.toneMappingExposure[eid] ?? 1.0,
      // Post-processing
      enablePostProcessing: Boolean(cameraComponent.enablePostProcessing[eid] ?? 0),
      postProcessingPreset: (['none', 'cinematic', 'realistic', 'stylized'][
        cameraComponent.postProcessingPreset[eid]
      ] || 'none') as 'none' | 'cinematic' | 'realistic' | 'stylized',
      // Camera Animation & Follow
      enableSmoothing: Boolean(cameraComponent.enableSmoothing[eid] ?? 0),
      followTarget: cameraComponent.followTarget[eid] ?? 0,
      followOffset: {
        x: cameraComponent.followOffsetX[eid] ?? 0.0,
        y: cameraComponent.followOffsetY[eid] ?? 5.0,
        z: cameraComponent.followOffsetZ[eid] ?? -10.0,
      },
      smoothingSpeed: cameraComponent.smoothingSpeed[eid] ?? 2.0,
      rotationSmoothing: cameraComponent.rotationSmoothing[eid] ?? 1.5,
      // Skybox Transform Properties
      skyboxScale: {
        x: cameraComponent.skyboxScaleX[eid] ?? 1.0,
        y: cameraComponent.skyboxScaleY[eid] ?? 1.0,
        z: cameraComponent.skyboxScaleZ[eid] ?? 1.0,
      },
      skyboxRotation: {
        x: cameraComponent.skyboxRotationX[eid] ?? 0.0,
        y: cameraComponent.skyboxRotationY[eid] ?? 0.0,
        z: cameraComponent.skyboxRotationZ[eid] ?? 0.0,
      },
      skyboxRepeat: {
        u: cameraComponent.skyboxRepeatU[eid] ?? 1.0,
        v: cameraComponent.skyboxRepeatV[eid] ?? 1.0,
      },
      skyboxOffset: {
        u: cameraComponent.skyboxOffsetU[eid] ?? 0.0,
        v: cameraComponent.skyboxOffsetV[eid] ?? 0.0,
      },
      skyboxIntensity: cameraComponent.skyboxIntensity[eid] ?? 1.0,
      skyboxBlur: cameraComponent.skyboxBlur[eid] ?? 0.0,
    };
    return serialized;
  },
  deserialize: (eid: EntityId, data: CameraData, component: unknown) => {
    const cameraComponent = component as ICameraBitECSComponent;
    cameraComponent.fov[eid] = data.fov;
    cameraComponent.near[eid] = data.near;
    cameraComponent.far[eid] = data.far;
    cameraComponent.projectionType[eid] = data.projectionType === 'orthographic' ? 1 : 0;
    cameraComponent.orthographicSize[eid] = data.orthographicSize || 10;
    cameraComponent.depth[eid] = data.depth || 0;
    cameraComponent.isMain[eid] = data.isMain ? 1 : 0;
    const clearFlagsMap = { skybox: 0, solidColor: 1, depthOnly: 2, dontClear: 3 };
    cameraComponent.clearFlags[eid] =
      clearFlagsMap[data.clearFlags as keyof typeof clearFlagsMap] ?? 0;
    cameraComponent.skyboxTexture[eid] = getSkyboxIndex(data.skyboxTexture || '');
    cameraComponent.backgroundR[eid] = data.backgroundColor?.r ?? 0.0;
    cameraComponent.backgroundG[eid] = data.backgroundColor?.g ?? 0.0;
    cameraComponent.backgroundB[eid] = data.backgroundColor?.b ?? 0.0;
    cameraComponent.backgroundA[eid] = data.backgroundColor?.a ?? 1.0;

    // Camera Control Mode
    const controlModeMap = { locked: 0, free: 1 };
    cameraComponent.controlMode[eid] =
      controlModeMap[data.controlMode as keyof typeof controlModeMap] ?? 1; // Default to free (1)

    // Viewport Rectangle
    cameraComponent.viewportX[eid] = data.viewportRect?.x ?? 0.0;
    cameraComponent.viewportY[eid] = data.viewportRect?.y ?? 0.0;
    cameraComponent.viewportWidth[eid] = data.viewportRect?.width ?? 1.0;
    cameraComponent.viewportHeight[eid] = data.viewportRect?.height ?? 1.0;

    // HDR and Tone Mapping
    cameraComponent.hdr[eid] = data.hdr ? 1 : 0;
    const toneMappingMap = { none: 0, linear: 1, reinhard: 2, cineon: 3, aces: 4 };
    cameraComponent.toneMapping[eid] =
      toneMappingMap[data.toneMapping as keyof typeof toneMappingMap] ?? 0;
    cameraComponent.toneMappingExposure[eid] = data.toneMappingExposure ?? 1.0;

    // Post-processing
    cameraComponent.enablePostProcessing[eid] = data.enablePostProcessing ? 1 : 0;
    const postProcessingMap = { none: 0, cinematic: 1, realistic: 2, stylized: 3 };
    cameraComponent.postProcessingPreset[eid] =
      postProcessingMap[data.postProcessingPreset as keyof typeof postProcessingMap] ?? 0;

    // Camera Animation & Follow
    cameraComponent.enableSmoothing[eid] = data.enableSmoothing ? 1 : 0;
    cameraComponent.followTarget[eid] = data.followTarget ?? 0;
    cameraComponent.followOffsetX[eid] = data.followOffset?.x ?? 0.0;
    cameraComponent.followOffsetY[eid] = data.followOffset?.y ?? 5.0;
    cameraComponent.followOffsetZ[eid] = data.followOffset?.z ?? -10.0;
    cameraComponent.smoothingSpeed[eid] = data.smoothingSpeed ?? 2.0;
    cameraComponent.rotationSmoothing[eid] = data.rotationSmoothing ?? 1.5;

    // Skybox Transform Properties
    cameraComponent.skyboxScaleX[eid] = data.skyboxScale?.x ?? 1.0;
    cameraComponent.skyboxScaleY[eid] = data.skyboxScale?.y ?? 1.0;
    cameraComponent.skyboxScaleZ[eid] = data.skyboxScale?.z ?? 1.0;
    cameraComponent.skyboxRotationX[eid] = data.skyboxRotation?.x ?? 0.0;
    cameraComponent.skyboxRotationY[eid] = data.skyboxRotation?.y ?? 0.0;
    cameraComponent.skyboxRotationZ[eid] = data.skyboxRotation?.z ?? 0.0;
    cameraComponent.skyboxRepeatU[eid] = data.skyboxRepeat?.u ?? 1.0;
    cameraComponent.skyboxRepeatV[eid] = data.skyboxRepeat?.v ?? 1.0;
    cameraComponent.skyboxOffsetU[eid] = data.skyboxOffset?.u ?? 0.0;
    cameraComponent.skyboxOffsetV[eid] = data.skyboxOffset?.v ?? 0.0;
    cameraComponent.skyboxIntensity[eid] = data.skyboxIntensity ?? 1.0;
    cameraComponent.skyboxBlur[eid] = data.skyboxBlur ?? 0.0;

    cameraComponent.needsUpdate[eid] = 1; // Mark for update
  },
  dependencies: ['Transform'],
  conflicts: ['MeshRenderer'], // Camera conflicts with MeshRenderer
  metadata: {
    description: 'Camera for rendering perspectives and viewports',
    version: '1.0.0',
  },
});
