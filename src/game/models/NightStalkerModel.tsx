import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { nightStalkerModelMetadata } from '@/config/assets/nightStalkerAssetsMetadata';
import { useAnimationFromAsset } from '@/core/hooks/useAnimationFromAsset';
import { useAsset } from '@/core/hooks/useAsset';
import { useModelDebug } from '@/core/hooks/useModelDebug';
import { AssetKeys, IModelConfig } from '@/core/types/assets';

// Define our own IAnimationControls interface since the original was deleted
export interface IAnimationControls {
  actions: Record<string, THREE.AnimationAction | null>;
  names: string[];
  play: (name: string) => void;
}

interface INightStalkerModelProps {
  onAnimationsReady?: (actions: Record<string, THREE.AnimationAction | null>) => void;
  debug?: boolean;
}

export function NightStalkerModel({ debug = true, onAnimationsReady }: INightStalkerModelProps) {
  const modelRef = useRef<THREE.Object3D>(null);

  // Use asset system to load model with its configuration
  const { model, config } = useAsset(AssetKeys.NightStalkerModel);

  // Ensure we're working with a model config
  const modelConfig = config as IModelConfig;

  // Memoize animationUrls array to prevent re-renders
  const animationSources = useMemo(() => {
    if (!modelConfig?.animations) return [];
    // Default to 'gltf' type for all animations; adjust if you support more types
    return modelConfig.animations.map((anim: string) => ({ url: anim, type: 'gltf' as const }));
  }, [modelConfig?.animations]);

  // Check if model is loaded
  useEffect(() => {
    if (debug) {
      console.log('🔴 NightStalker model loaded:', !!model);
      console.log('🔴 NightStalker config:', {
        animations: modelConfig?.animations,
        urls: animationSources.map((source) => source.url),
      });
    }
  }, [model, animationSources, modelConfig, debug]);

  // Load animations
  const animControls = useAnimationFromAsset({
    model,
    animationSources,
    debug,
  });

  // Notify when animations are ready
  useEffect(() => {
    if (onAnimationsReady && animControls.actions) {
      if (debug) {
        console.log('🔴 NightStalker animations ready:', Object.keys(animControls.actions));
      }
      onAnimationsReady(animControls.actions);
    }
  }, [animControls, onAnimationsReady, debug]);

  // Handle debug visualizations
  const { renderDebugElements } = useModelDebug({
    model,
    config: modelConfig || nightStalkerModelMetadata.config,
    debug,
  });

  if (!model) return null;

  return (
    <group position={modelConfig?.position || [0, 0, 0]}>
      <primitive ref={modelRef} object={model} dispose={null} scale={modelConfig?.scale || 1} />
      {renderDebugElements}
    </group>
  );
}
