import { AssetKeys, IModelAssetMetadata, IModelConfig } from '@/core/types/assets';

// Animation keys for NightStalker
export enum NightStalkerAnimationKeys {
  StandingIdle = 'StandingIdle',
  // Add more animation keys as needed
}

// Animation key-value mapping for NightStalker
export const nightStalkerAnimationMap: Record<NightStalkerAnimationKeys, string> = {
  [NightStalkerAnimationKeys.StandingIdle]:
    '/assets/models/NightStalker/animations/NightStalker_Standing_Idle.glb',
  // Add more mappings as needed
};

export const nightStalkerModelMetadata: IModelAssetMetadata = {
  key: AssetKeys.NightStalkerModel,
  type: 'gltf',
  url: '/assets/models/NightStalker/glb/NightStalker_Night_Stalker.glb',
  config: {
    scale: 1.0,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    offset: [0, 0, 0],
    animations: [NightStalkerAnimationKeys.StandingIdle],
    animationConfig: {
      loop: true,
      timeScale: 1.0,
      clampWhenFinished: false,
      blendDuration: 0.5,
      crossFadeEnabled: true,
    },
    collision: {
      enabled: true,
      type: 'characterController',
      shape: 'capsule',
      height: 1.8,
      radius: 0.3,
      offset: [0, 0.9, 0],
      isTrigger: false,
      layer: 'character',
    },
    debugMode: {
      enabled: false,
      showBoundingBox: true,
      showColliders: true,
      showWireframe: false,
      showSkeleton: false,
      showPhysicsForces: false,
      showVelocity: false,
      showObjectPivot: true,
      debugColor: [0, 1, 0],
      logToConsole: false,
    },
  } as IModelConfig,
};
