import { useEffect, useRef } from 'react';
import * as THREE from 'three';

import { AssetKeys, IModelConfig } from '@/core/types/assets';

import { useAssetResource } from './useAssetResource';

type UseAssetProps = Partial<IModelConfig>;

export function useAsset(key: AssetKeys, overrides?: UseAssetProps) {
  const { asset, config } = useAssetResource(key);
  const ref = useRef<THREE.Object3D | null>(null);

  useEffect(() => {
    if (asset && ref.current) {
      const mergedConfig = { ...config, ...overrides } as IModelConfig;
      let [x, y, z] = mergedConfig.position ?? [0, 0, 0];
      if (mergedConfig.offset) {
        x += mergedConfig.offset[0];
        y += mergedConfig.offset[1];
        z += mergedConfig.offset[2];
      }
      ref.current.position.set(x, y, z);
      if (mergedConfig.scale !== undefined) {
        if (typeof mergedConfig.scale === 'number') {
          ref.current.scale.set(mergedConfig.scale, mergedConfig.scale, mergedConfig.scale);
        } else {
          ref.current.scale.set(...mergedConfig.scale);
        }
      }
      if (mergedConfig.rotation) {
        ref.current.rotation.set(...mergedConfig.rotation);
      }
    }
  }, [asset, config, overrides]);

  // Only return .scene if asset has it (GLTF), otherwise undefined
  const model = asset && 'scene' in asset ? (asset as { scene: THREE.Object3D }).scene : undefined;

  return { gltf: asset, model, ref, config };
}

// Usage: Wrap component in <Suspense fallback={...}> to handle loading state.
