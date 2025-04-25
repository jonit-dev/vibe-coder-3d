import { AssetKeys, AssetManifest } from '@/core/types/assets';

import {
  nightStalkerModelMetadata,
  nightStalkerTextureMetadata,
} from './nightStalkerAssetsMetadata';

export const assets: AssetManifest = {
  [AssetKeys.NightStalkerModel]: nightStalkerModelMetadata,
  [AssetKeys.NightStalkerTexture]: nightStalkerTextureMetadata,
};

export function getAssetMetadata(key: AssetKeys) {
  return assets[key];
}
