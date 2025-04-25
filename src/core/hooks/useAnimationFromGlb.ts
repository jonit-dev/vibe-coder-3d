import { useAnimations, useGLTF } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

interface IUseAnimationFromGlbOptions {
  model: THREE.Object3D | null;
  animationUrls: string[];
  debug?: boolean;
}

/**
 * A simplified hook for loading animations from external GLB files and applying them to a model.
 */
export function useAnimationFromGlb({
  model,
  animationUrls,
  debug = true,
}: IUseAnimationFromGlbOptions) {
  if (debug) {
    console.log('🔴 useAnimationFromGlb CALLED with:', {
      modelExists: !!model,
      animationUrls,
    });
  }

  const [clips, setClips] = useState<THREE.AnimationClip[]>([]);
  const modelRef = useRef<THREE.Object3D | null>(null);

  // Memoize animation GLTFs to prevent re-renders
  const animationGltfs = useMemo(() => {
    if (debug) {
      console.log(`🔴 Loading animations, count:`, animationUrls.length);
    }

    return animationUrls.map((url) => useGLTF(url));
  }, [animationUrls, debug]);

  // Update model ref
  useEffect(() => {
    modelRef.current = model;
    if (debug) {
      console.log('🔴 Model ref updated:', { modelExists: !!model });
    }
  }, [model, debug]);

  // Extract animation clips from animation GLTFs
  useEffect(() => {
    if (debug) {
      console.log('🔴 Animation extraction effect running');
    }

    if (!model) {
      if (debug) {
        console.log('🔴 No model available, skipping animation extraction');
      }
      return;
    }

    const newClips: THREE.AnimationClip[] = [];

    // Add model's own animations if any
    if ('animations' in (model as any) && (model as any).animations?.length > 0) {
      newClips.push(...(model as any).animations);
      if (debug) {
        console.log(
          '🔴 Base model animations:',
          (model as any).animations.map((c: THREE.AnimationClip) => c.name),
        );
      }
    } else if (debug) {
      console.log('🔴 Base model has NO animations');
    }

    // Add animations from external GLBs
    animationGltfs.forEach((gltf, index) => {
      if (gltf?.animations?.length) {
        if (debug) {
          console.log(
            `🔴 Animations found in ${animationUrls[index]}:`,
            gltf.animations.map((c) => c.name),
          );

          // Log bones for debugging
          const modelBones: string[] = [];
          model.traverse((obj) => {
            if (obj.type === 'Bone') modelBones.push(obj.name);
          });
          console.log('🔴 Base model bones:', modelBones);

          // Log animation bones
          const animBones: string[] = [];
          gltf.scene.traverse((obj) => {
            if (obj.type === 'Bone') animBones.push(obj.name);
          });
          console.log(`🔴 Animation GLB[${index}] bones:`, animBones);
        }

        newClips.push(...gltf.animations);
      } else if (debug) {
        console.warn(`🔴 NO animations found in ${animationUrls[index]}`);
        console.log('gltf object:', gltf);
      }
    });

    if (debug) {
      console.log(
        '🔴 Total collected animation clips:',
        newClips.map((c) => c.name),
      );
    }

    setClips(newClips);
  }, [model, animationGltfs, animationUrls, debug]);

  // Use drei's useAnimations to create actions from clips
  const { actions, names } = useAnimations(clips, modelRef);

  if (debug) {
    console.log('🔴 useAnimations result:', { actions, names, clipsCount: clips.length });
  }

  // Auto-play first animation if available
  useEffect(() => {
    if (names.length > 0 && actions[names[0]]) {
      if (debug) console.log('Auto-playing animation:', names[0]);
      const action = actions[names[0]];
      if (action) {
        action.reset();
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.play();
      }
    } else if (debug && names.length === 0) {
      console.warn('No animation actions available to play');
    }
  }, [actions, names, debug]);

  // Memoize the return object to prevent identity changes on each render
  const controls = useMemo(() => {
    return {
      actions,
      names,
      play: (name: string) => {
        if (actions[name]) {
          if (debug) console.log('Playing animation:', name);
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
