import * as THREE from 'three';
import { componentRegistry } from '@core/lib/ecs/ComponentRegistry';
import type { IAnimationComponent, IAnimationApi, IClip, IAnimationPlaybackState } from '@core/components/animation/AnimationComponent';
import { TimelineEvaluator, type ITimelineEvaluation } from '@core/lib/animation/TimelineEvaluator';
import { emit } from '@core/lib/events';
import { Logger } from '@core/lib/logger';

const logger = Logger.create('AnimationSystem');

/**
 * Active animation state per entity
 */
interface IEntityAnimationState {
  entityId: number;
  activeClipId: string | null;
  playing: boolean;
  time: number;
  timeScale: number;
  loop: boolean;
  fadingIn: boolean;
  fadingOut: boolean;
  fadeTime: number;
  fadeDuration: number;
}

/**
 * AnimationSystem - Handles animation playback for all entities
 */
class AnimationSystemImpl implements IAnimationApi {
  private evaluator = new TimelineEvaluator();
  private states = new Map<number, IEntityAnimationState>();
  private scene: THREE.Scene | null = null;

  /**
   * Initialize the system with a Three.js scene
   */
  init(scene: THREE.Scene): void {
    this.scene = scene;
  }

  /**
   * Update all animations (called each frame)
   */
  update(scene: THREE.Scene, deltaTime: number): void {
    if (!this.scene) {
      this.scene = scene;
    }

    const entities = componentRegistry.getEntitiesWithComponent('Animation');

    for (const entityId of entities) {
      this.updateEntity(entityId, deltaTime);
    }
  }

  /**
   * Update a single entity's animation
   */
  private updateEntity(entityId: number, deltaTime: number): void {
    const component = componentRegistry.getComponentData<IAnimationComponent>(entityId, 'Animation');
    if (!component) return;

    const state = this.getOrCreateState(entityId, component);
    if (!state.playing || !state.activeClipId) return;

    const clip = component.clips.find((c) => c.id === state.activeClipId);
    if (!clip) return;

    // Update time
    state.time += deltaTime * state.timeScale * clip.timeScale;

    // Handle looping
    if (state.time >= clip.duration) {
      if (state.loop) {
        state.time = state.time % clip.duration;
        emit('animation:loop', { entityId, clipId: clip.id, loopCount: Math.floor(state.time / clip.duration) });
      } else {
        state.time = clip.duration;
        state.playing = false;
        emit('animation:ended', { entityId, clipId: clip.id });
      }
    }

    // Update fade state
    if (state.fadingIn || state.fadingOut) {
      state.fadeTime += deltaTime;
      if (state.fadeTime >= state.fadeDuration) {
        state.fadingIn = false;
        state.fadingOut = false;
      }
    }

    // Evaluate and apply animation
    const evaluation = this.evaluator.evaluate(clip, state.time);
    this.applyEvaluation(entityId, evaluation);

    // Emit events
    for (const event of evaluation.events) {
      emit('animation:marker', {
        entityId,
        markerName: event.name,
        time: state.time,
        params: event.params,
      });
    }

    // Update component time
    componentRegistry.updateComponent(entityId, 'Animation', {
      ...component,
      time: state.time,
      playing: state.playing,
    });
  }

  /**
   * Apply evaluated animation to Three.js objects
   */
  private applyEvaluation(
    entityId: number,
    evaluation: ITimelineEvaluation
  ): void {
    if (!this.scene) return;

    // Find the entity's Three.js object
    const object = this.findEntityObject(entityId, this.scene);
    if (!object) return;

    // Apply transforms
    for (const [targetPath, transform] of evaluation.transforms) {
      const target = targetPath === 'root' ? object : object.getObjectByName(targetPath);
      if (!target) continue;

      if (transform.position) {
        target.position.copy(transform.position);
      }
      if (transform.rotation) {
        target.quaternion.copy(transform.rotation);
      }
      if (transform.scale) {
        target.scale.copy(transform.scale);
      }
    }

    // Apply morph targets
    for (const [targetPath, morphs] of evaluation.morphs) {
      const target = targetPath === 'root' ? object : object.getObjectByName(targetPath);
      if (!target || !(target instanceof THREE.Mesh)) continue;

      if (target.morphTargetInfluences && target.morphTargetDictionary) {
        for (const [name, weight] of Object.entries(morphs)) {
          const index = target.morphTargetDictionary[name];
          if (index !== undefined) {
            target.morphTargetInfluences[index] = weight;
          }
        }
      }
    }

    // Apply material properties
    for (const [targetPath, props] of evaluation.materials) {
      const target = targetPath === 'root' ? object : object.getObjectByName(targetPath);
      if (!target || !(target instanceof THREE.Mesh)) continue;

      const material = target.material as THREE.Material & Record<string, any>;
      for (const [name, value] of Object.entries(props)) {
        if (name in material) {
          material[name] = value;
        }
      }
      material.needsUpdate = true;
    }
  }

  /**
   * Find Three.js object for entity
   */
  private findEntityObject(entityId: number, scene: THREE.Scene): THREE.Object3D | null {
    // Look for object with matching userData.entityId
    let found: THREE.Object3D | null = null;
    scene.traverse((obj) => {
      if (obj.userData.entityId === entityId) {
        found = obj;
      }
    });
    return found;
  }

  /**
   * Get or create animation state for entity
   */
  private getOrCreateState(entityId: number, component: IAnimationComponent): IEntityAnimationState {
    let state = this.states.get(entityId);
    if (!state) {
      state = {
        entityId,
        activeClipId: component.activeClipId || null,
        playing: component.playing,
        time: component.time,
        timeScale: 1,
        loop: true,
        fadingIn: false,
        fadingOut: false,
        fadeTime: 0,
        fadeDuration: 0,
      };
      this.states.set(entityId, state);
    }
    return state;
  }

  /**
   * Play an animation clip
   */
  play(entityId: number, clipId: string, opts?: { fade?: number; loop?: boolean }): void {
    const state = this.states.get(entityId);
    if (!state) {
      logger.warn('Cannot play animation: entity state not found', { entityId, clipId });
      return;
    }

    state.activeClipId = clipId;
    state.playing = true;
    state.time = 0;
    state.loop = opts?.loop ?? true;

    if (opts?.fade && opts.fade > 0) {
      state.fadingIn = true;
      state.fadeTime = 0;
      state.fadeDuration = opts.fade;
    }

    emit('animation:play', { entityId, clipId, fade: opts?.fade, loop: opts?.loop });
  }

  /**
   * Pause animation
   */
  pause(entityId: number): void {
    const state = this.states.get(entityId);
    if (state) {
      state.playing = false;
      emit('animation:pause', { entityId });
    }
  }

  /**
   * Stop animation
   */
  stop(entityId: number, opts?: { fade?: number }): void {
    const state = this.states.get(entityId);
    if (!state) return;

    if (opts?.fade && opts.fade > 0) {
      state.fadingOut = true;
      state.fadeTime = 0;
      state.fadeDuration = opts.fade;
    } else {
      state.playing = false;
      state.time = 0;
      state.activeClipId = null;
    }

    emit('animation:stop', { entityId, fade: opts?.fade });
  }

  /**
   * Set playback time
   */
  setTime(entityId: number, time: number): void {
    const state = this.states.get(entityId);
    if (state) {
      state.time = Math.max(0, time);
    }
  }

  /**
   * Get animation playback state
   */
  getState(entityId: number): IAnimationPlaybackState | null {
    const state = this.states.get(entityId);
    if (!state) return null;

    return {
      time: state.time,
      playing: state.playing,
      clipId: state.activeClipId,
      loop: state.loop,
      timeScale: state.timeScale,
    };
  }

  /**
   * Get animation clip
   */
  getClip(_entityId: number, _clipId: string): IClip | null {
    // This requires component registry access - should be passed in
    return null;
  }

  /**
   * Get all clips for entity
   */
  getAllClips(_entityId: number): IClip[] {
    // This requires component registry access - should be passed in
    return [];
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.evaluator.clearCache();
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.states.clear();
    this.evaluator.clearCache();
  }
}

// Export singleton instance
export const AnimationSystem = new AnimationSystemImpl();

// Export the update function for use in engine loop
export function animationSystem(scene: THREE.Scene, deltaTime: number): void {
  AnimationSystem.update(scene, deltaTime);
}

// Export API for external use
export const animationApi = AnimationSystem as IAnimationApi;
