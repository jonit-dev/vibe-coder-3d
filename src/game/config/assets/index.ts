import { AssetKeys, AssetManifest } from '@/core';

// Asset metadata for pre-configured game assets
// Note: Custom models imported via drag-and-drop don't use this system
export const assets: AssetManifest = {
  // Add asset metadata here as needed
};

export function getAssetMetadata(key: AssetKeys) {
  return assets[key];
}
