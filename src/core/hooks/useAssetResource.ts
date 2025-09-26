import { useGLTF, useTexture } from '@react-three/drei';

import { getAssetMetadata } from '@/game/config/assets';
import { AssetKeys } from '@/core/types/assets';

export function useAssetResource(key: AssetKeys) {
  const metadata = getAssetMetadata(key);
  if (!metadata) throw new Error(`Asset metadata not found for key: ${key}`);
  switch (metadata.type) {
    case 'gltf':
      return { asset: useGLTF(metadata.url), config: metadata.config };
    case 'texture':
      return { asset: useTexture(metadata.url), config: metadata.config };
    default:
      throw new Error(`Unsupported asset type: ${metadata.type}`);
  }
}
