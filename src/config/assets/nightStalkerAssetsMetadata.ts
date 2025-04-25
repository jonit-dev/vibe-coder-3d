import {
  AssetKeys,
  IModelAssetMetadata,
  IModelConfig,
  ITextureAssetMetadata,
  ITextureConfig,
} from '@/core/types/assets';

export const nightStalkerModelMetadata: IModelAssetMetadata = {
  key: AssetKeys.NightStalkerModel,
  type: 'gltf',
  url: '/assets/models/NightStalker/glb/NightStalker_T_Pose.glb',
  config: {
    scale: 1.0,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    offset: [0, 0, 0],

    // Animation settings
    initialAnimation: 'Standing_Idle',
    animations: ['/assets/models/NightStalker/animations/NightStalker_Standing_Idle.glb'],
    animationConfig: {
      isStatic: false,
      loop: true,
      timeScale: 1.0,
      clampWhenFinished: false,
      blendDuration: 0.5,
      crossFadeEnabled: true,
    },

    // Game engine related properties
    physics: {
      enabled: true,
      mass: 80,
      friction: 0.5,
      restitution: 0.1,
      linearDamping: 0.1,
      angularDamping: 0.1,
      useGravity: true,
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
    gameObject: {
      tag: 'player',
      layer: 'character',
      isInteractive: true,
      isSelectable: true,
      castShadows: true,
      receiveShadows: true,
      cullingEnabled: true,
      LODLevels: [
        { distance: 0, detail: 'high' },
        { distance: 10, detail: 'medium' },
        { distance: 30, detail: 'low' },
      ],
    },
  } as IModelConfig,
};

export const nightStalkerTextureMetadata: ITextureAssetMetadata = {
  key: AssetKeys.NightStalkerTexture,
  type: 'texture',
  url: '/assets/models/NightStalker/textures/NightStalker.png',
  config: {
    repeat: [1, 1],
    filter: 'linear',
    mipmap: true,
    anisotropy: 16,
    encoding: 'sRGB',
    flipY: true,
    premultiplyAlpha: false,
    wrapS: 'repeat',
    wrapT: 'repeat',
    generateMipmaps: true,
    compression: 'default',
  } as ITextureConfig,
};
