import { useAnimations } from '@react-three/drei';
import { RefObject, useEffect } from 'react';
import * as THREE from 'three';

export interface IUseModelAnimationsOptions {
  initialAnimation?: string;
  onReady?: (actions: Record<string, THREE.AnimationAction>, names: string[]) => void;
}

export interface IAnimationControls {
  actions: Record<string, THREE.AnimationAction | null>;
  names: string[];
  play: (name: string, fadeInDuration?: number) => void;
  stop: (name?: string, fadeOutDuration?: number) => void;
  reset: (name: string) => void;
  fadeIn: (name: string, duration?: number) => void;
  fadeOut: (name: string, duration?: number) => void;
}

export function useModelAnimations(
  clips: THREE.AnimationClip[],
  ref: RefObject<THREE.Object3D>,
  options?: IUseModelAnimationsOptions,
): IAnimationControls {
  const { actions, names } = useAnimations(clips, ref);

  useEffect(() => {
    if (!actions || !names.length) return;
    // Filter out null actions for onReady
    const filteredActions: Record<string, THREE.AnimationAction> = {};
    for (const key in actions) {
      if (actions[key]) filteredActions[key] = actions[key] as THREE.AnimationAction;
    }
    if (options?.onReady) options.onReady(filteredActions, names);

    if (options?.initialAnimation && actions && actions[options.initialAnimation]) {
      actions[options.initialAnimation]?.reset().fadeIn(0.2).play();
    } else if (actions && names.length > 0 && actions[names[0]]) {
      actions[names[0]]?.reset().fadeIn(0.2).play();
    }
  }, [actions, names, options, ref]);

  // Create animation controls object with methods
  const animationControls: IAnimationControls = {
    actions,
    names,

    play: (name: string, fadeInDuration: number = 0.2) => {
      if (!actions[name]) {
        console.warn(`Animation not found or null: ${name}`);
        return;
      }

      // We can optionally stop all other animations when playing a new one
      // Object.values(actions).forEach(action => action?.fadeOut?.(0.2));

      actions[name]?.reset().fadeIn(fadeInDuration).play();
    },

    stop: (name?: string, fadeOutDuration: number = 0.2) => {
      if (name) {
        // Stop specific animation
        if (!actions[name]) {
          console.warn(`Animation not found or null: ${name}`);
          return;
        }
        actions[name]?.fadeOut(fadeOutDuration);
      } else {
        // Stop all animations
        Object.values(actions).forEach((action) => {
          if (action) action.fadeOut(fadeOutDuration);
        });
      }
    },

    reset: (name: string) => {
      if (!actions[name]) {
        console.warn(`Animation not found or null: ${name}`);
        return;
      }
      actions[name]?.reset();
    },

    fadeIn: (name: string, duration: number = 0.2) => {
      if (!actions[name]) {
        console.warn(`Animation not found or null: ${name}`);
        return;
      }
      actions[name]?.fadeIn(duration);
    },

    fadeOut: (name: string, duration: number = 0.2) => {
      if (!actions[name]) {
        console.warn(`Animation not found or null: ${name}`);
        return;
      }
      actions[name]?.fadeOut(duration);
    },
  };

  return animationControls;
}
