import { AssetKeys, AssetManifest } from '@/core';

import { nightStalkerModelMetadata } from './nightStalkerAssetsMetadata';

export const assets: AssetManifest = {
  [AssetKeys.NightStalkerModel]: nightStalkerModelMetadata,
};

export function getAssetMetadata(key: AssetKeys) {
  return assets[key];
}
