import { useAnimations } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { FBXLoader, GLTFLoader } from 'three-stdlib';

interface IAnimationSource {
  url: string;
  type: 'gltf' | 'fbx';
}

interface IUseAnimationFromAssetOptions {
  model: THREE.Object3D | null;
  animationSources: IAnimationSource[];
  debug?: boolean;
}

/**
 * A hook for loading animations from various file types and applying them to a model.
 */
export function useAnimationFromAsset({
  model,
  animationSources,
  debug = true,
}: IUseAnimationFromAssetOptions) {
  const [clips, setClips] = useState<THREE.AnimationClip[]>([]);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const [loading, setLoading] = useState(true);

  // Loader map for supported types
  const loaderMap = useMemo(
    () => ({
      gltf: new GLTFLoader(),
      fbx: new FBXLoader(),
    }),
    [],
  );

  // Memoize animation assets to prevent re-renders
  const animationAssets = useMemo(() => {
    if (debug) {
      // Debug animation sources
    }
    return animationSources.map(({ url, type }) => ({ url, type }));
  }, [animationSources, debug]);

  // Update model ref
  useEffect(() => {
    modelRef.current = model;
    if (debug) {
      // Debug model update
    }
  }, [model, debug]);

  // Extract animation clips from animation assets
  useEffect(() => {
    setLoading(true);
    let isMounted = true;
    if (debug) {
      // Debug extract animation clips
    }
    if (!model) {
      if (debug) {
        // Debug no model
      }
      return;
    }
    const newClips: THREE.AnimationClip[] = [];
    // Add model's own animations if any
    if (
      'animations' in model &&
      (model as { animations: THREE.AnimationClip[] }).animations?.length > 0
    ) {
      newClips.push(...(model as { animations: THREE.AnimationClip[] }).animations);
      if (debug) {
        // Base model animations found
      }
    } else if (debug) {
      // Debug no base model animations
    }
    // Add animations from external assets
    Promise.all(
      animationAssets.map(async ({ url, type }) => {
        try {
          const loader = loaderMap[type];
          if (!loader) throw new Error(`No loader for type: ${type}`);
          return await new Promise<unknown>((resolve, reject) => {
            loader.load(
              url,
              (asset: unknown) => resolve(asset),
              undefined,
              (err: unknown) => reject(err),
            );
          });
        } catch (err) {
          if (debug) console.warn(`🔴 Failed to load animation: ${url}`, err);
          return null;
        }
      }),
    ).then((assets) => {
      if (!isMounted) return;
      assets.forEach((asset, index) => {
        if (!asset) return;
        let assetClips: THREE.AnimationClip[] = [];
        if (
          animationAssets[index].type === 'gltf' &&
          (asset as { animations?: THREE.AnimationClip[] }).animations
        ) {
          assetClips = (asset as { animations: THREE.AnimationClip[] }).animations;
        } else if (
          animationAssets[index].type === 'fbx' &&
          (asset as { animations?: THREE.AnimationClip[] }).animations
        ) {
          assetClips = (asset as { animations: THREE.AnimationClip[] }).animations;
        } else if (
          animationAssets[index].type === 'fbx' &&
          asset instanceof THREE.Object3D &&
          (asset as { animations: THREE.AnimationClip[] }).animations
        ) {
          assetClips = (asset as { animations: THREE.AnimationClip[] }).animations;
        }
        if (debug) {
          // Animations found in external asset
        }
        newClips.push(...assetClips);
      });
      if (debug) {
        // Total animation clips collected
      }
      setClips([...newClips]);
      setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [model, animationAssets, loaderMap, debug]);

  // Use drei's useAnimations to create actions from clips
  const { actions, names } = useAnimations(clips, modelRef);

  // Auto-play first animation if available, only after loading is complete
  useEffect(() => {
    if (loading) return;
    if (names.length > 0 && actions[names[0]]) {

      const action = actions[names[0]];
      if (action) {
        action.reset();
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.play();
      }
    } else if (debug && names.length === 0) {
      console.warn('No animation actions available to play');
    }
  }, [actions, names, debug, loading]);

  // Memoize the return object to prevent identity changes on each render
  const controls = useMemo(() => {
    return {
      actions,
      names,
      play: (name: string) => {
        if (actions[name]) {
          // Playing animation
          // Stop all current animations
          Object.values(actions).forEach((action) => action?.fadeOut(0.5));
          // Play requested animation
          actions[name]?.reset().fadeIn(0.5).play();
        } else {
          console.warn(`Animation not found: ${name}`);
        }
      },
    };
  }, [actions, names, debug]);

  return controls;
}
