import { useGLTF, useTexture } from '@react-three/drei';

// Supported asset types
export type AssetType = 'gltf' | 'texture';

function getAssetType(url: string): AssetType | undefined {
  if (url.endsWith('.glb') || url.endsWith('.gltf')) return 'gltf';
  if (
    url.endsWith('.jpg') ||
    url.endsWith('.jpeg') ||
    url.endsWith('.png') ||
    url.endsWith('.webp')
  )
    return 'texture';
  return undefined;
}

export function useAsset(url: string): any {
  const type = getAssetType(url);
  if (type === 'gltf') {
    return useGLTF(url);
  }
  if (type === 'texture') {
    return useTexture(url);
  }
  throw new Error(`Unsupported asset type for url: ${url}`);
}

// Usage: Wrap component in <Suspense fallback={...}> to handle loading state.
