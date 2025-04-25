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
    initialAnimation: 'Standing_Idle',
    animations: ['/assets/models/NightStalker/animations/NightStalker_Standing_Idle.glb'],
  } as IModelConfig,
};

export const nightStalkerTextureMetadata: ITextureAssetMetadata = {
  key: AssetKeys.NightStalkerTexture,
  type: 'texture',
  url: '/assets/models/NightStalker/textures/NightStalker.png',
  config: {
    repeat: [1, 1],
  } as ITextureConfig,
};
