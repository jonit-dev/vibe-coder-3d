import { useAnimations } from '@react-three/drei';
import { RefObject, useEffect } from 'react';
import * as THREE from 'three';

export interface IAnimationConfig {
  isStatic?: boolean;
  loop?: boolean;
  timeScale?: number;
  clampWhenFinished?: boolean;
  blendDuration?: number;
  crossFadeEnabled?: boolean;
  disableAnimations?: boolean;
}

export interface IUseModelAnimationsOptions {
  initialAnimation?: string;
  onReady?: (actions: Record<string, THREE.AnimationAction>, names: string[]) => void;
  animationConfig?: IAnimationConfig;
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

    // Skip playing animations if disableAnimations is true
    if (options?.animationConfig?.disableAnimations) return;

    if (options?.initialAnimation && actions && actions[options.initialAnimation]) {
      const action = actions[options.initialAnimation];
      if (action) {
        action.reset();

        // Apply animation config if provided
        if (options.animationConfig) {
          if (options.animationConfig.loop !== undefined)
            action.loop = options.animationConfig.loop ? THREE.LoopRepeat : THREE.LoopOnce;
          if (options.animationConfig.timeScale !== undefined)
            action.timeScale = options.animationConfig.timeScale;
          if (options.animationConfig.clampWhenFinished !== undefined)
            action.clampWhenFinished = options.animationConfig.clampWhenFinished;
        }

        action.fadeIn(options.animationConfig?.blendDuration || 0.2).play();
      }
    } else if (actions && names.length > 0 && actions[names[0]]) {
      const action = actions[names[0]];
      if (action) {
        action.reset();

        // Apply animation config if provided
        if (options?.animationConfig) {
          if (options.animationConfig.loop !== undefined)
            action.loop = options.animationConfig.loop ? THREE.LoopRepeat : THREE.LoopOnce;
          if (options.animationConfig.timeScale !== undefined)
            action.timeScale = options.animationConfig.timeScale;
          if (options.animationConfig.clampWhenFinished !== undefined)
            action.clampWhenFinished = options.animationConfig.clampWhenFinished;
        }

        action.fadeIn(options?.animationConfig?.blendDuration || 0.2).play();
      }
    }
  }, [actions, names, options, ref]);

  // Create animation controls object with methods
  const animationControls: IAnimationControls = {
    actions,
    names,

    play: (name: string, fadeInDuration: number = 0.2) => {
      if (options?.animationConfig?.disableAnimations) return;
      if (!actions[name]) {
        console.warn(`Animation not found or null: ${name}`);
        return;
      }

      const action = actions[name];
      if (action) {
        action.reset();

        // Apply animation config if provided
        if (options?.animationConfig) {
          if (options.animationConfig.loop !== undefined)
            action.loop = options.animationConfig.loop ? THREE.LoopRepeat : THREE.LoopOnce;
          if (options.animationConfig.timeScale !== undefined)
            action.timeScale = options.animationConfig.timeScale;
          if (options.animationConfig.clampWhenFinished !== undefined)
            action.clampWhenFinished = options.animationConfig.clampWhenFinished;
        }

        action.fadeIn(options?.animationConfig?.blendDuration || fadeInDuration).play();
      }
    },

    stop: (name?: string, fadeOutDuration: number = 0.2) => {
      const blendDuration = options?.animationConfig?.blendDuration || fadeOutDuration;

      if (name) {
        // Stop specific animation
        if (!actions[name]) {
          console.warn(`Animation not found or null: ${name}`);
          return;
        }
        actions[name]?.fadeOut(blendDuration);
      } else {
        // Stop all animations
        Object.values(actions).forEach((action) => {
          if (action) action.fadeOut(blendDuration);
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
      if (options?.animationConfig?.disableAnimations) return;
      if (!actions[name]) {
        console.warn(`Animation not found or null: ${name}`);
        return;
      }
      actions[name]?.fadeIn(options?.animationConfig?.blendDuration || duration);
    },

    fadeOut: (name: string, duration: number = 0.2) => {
      if (!actions[name]) {
        console.warn(`Animation not found or null: ${name}`);
        return;
      }
      actions[name]?.fadeOut(options?.animationConfig?.blendDuration || duration);
    },
  };

  return animationControls;
}
