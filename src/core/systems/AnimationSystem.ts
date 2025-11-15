import * as THREE from 'three';
import { componentRegistry } from '@core/lib/ecs/ComponentRegistry';
import type {
  IAnimationComponent,
  IAnimationApi,
  IAnimationPlaybackState,
  IClip,
} from '@core/components/animation/AnimationComponent';
import { TimelineEvaluator, type ITimelineEvaluation } from '@core/lib/animation/TimelineEvaluator';
import { emit } from '@core/lib/events';
import { Logger } from '@core/lib/logger';
import { AnimationRegistry } from '@core/animation/AnimationRegistry';

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
  loop?: boolean; // Optional - if not set, uses clip.loop
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
  update(scene: THREE.Scene, deltaTime: number, isPlaying: boolean = false): void {
    if (!this.scene) {
      this.scene = scene;
    }

    const entities = componentRegistry.getEntitiesWithComponent('Animation');

    for (const entityId of entities) {
      this.updateEntity(entityId, deltaTime, isPlaying);
    }
  }

  /**
   * Update a single entity's animation
   */
  private updateEntity(entityId: number, deltaTime: number, isPlaying: boolean): void {
    const component = componentRegistry.getComponentData<IAnimationComponent>(
      entityId,
      'Animation',
    );
    if (!component) return;

    const state = this.getOrCreateState(entityId, component);

    // Validate that activeBindingId exists in clipBindings
    const hasValidBinding = component.clipBindings.some(b => b.clipId === state.activeClipId);
    if (state.activeClipId && !hasValidBinding) {
      // Clear invalid active binding
      state.activeClipId = null;
      state.playing = false;
      componentRegistry.updateComponent(entityId, 'Animation', {
        ...component,
        activeBindingId: undefined,
        playing: false,
      });
      return;
    }

    // Auto-play animation when editor enters play mode
    if (isPlaying && !state.playing && state.activeClipId) {
      state.playing = true;
      state.time = 0;
    }

    if (!state.playing || !state.activeClipId) return;

    const registry = AnimationRegistry.getInstance();
    const clip = registry.get(state.activeClipId);
    if (!clip) return;

    // Update time
    state.time += deltaTime * state.timeScale * clip.timeScale;

    // Handle looping (use state.loop if set explicitly, otherwise use clip.loop)
    if (state.time >= clip.duration) {
      const loopCount = Math.floor(state.time / clip.duration);
      const shouldLoop = state.loop !== undefined ? state.loop : clip.loop;
      if (shouldLoop) {
        state.time = state.time % clip.duration;
        emit('animation:loop', { entityId, clipId: clip.id, loopCount });
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
        if (state.fadingOut) {
          state.fadingOut = false;
          state.playing = false;
          state.time = 0;
          state.activeClipId = null;
          state.fadeTime = 0;
          state.fadeDuration = 0;
        } else {
          state.fadingOut = false;
        }
      }
    }

    if (!state.playing || !state.activeClipId) {
      componentRegistry.updateComponent(entityId, 'Animation', {
        ...component,
        time: state.time,
        playing: state.playing,
        activeBindingId: state.activeClipId || undefined,
      });
      return;
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

    // Update component with full state
    componentRegistry.updateComponent(entityId, 'Animation', {
      ...component,
      time: state.time,
      playing: state.playing,
      activeBindingId: state.activeClipId || undefined,
    });
  }

  /**
   * Apply evaluated animation to Three.js objects
   */
  private applyEvaluation(entityId: number, evaluation: ITimelineEvaluation): void {
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

      const material = target.material as THREE.Material & Record<string, unknown>;
      for (const [name, value] of Object.entries(props)) {
        if (name in material) {
          material[name] = value;
        }
      }
      // Only set needsUpdate if the material has this property
      if ('needsUpdate' in material) {
        material.needsUpdate = true;
      }
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
  private getOrCreateState(
    entityId: number,
    component: IAnimationComponent,
  ): IEntityAnimationState {
    let state = this.states.get(entityId);

    if (!state) {
      state = {
        entityId,
        activeClipId: component.activeBindingId || null,
        playing: component.playing,
        time: component.time,
        timeScale: 1,
        loop: undefined, // Will use clip.loop if not set
        fadingIn: false,
        fadingOut: false,
        fadeTime: 0,
        fadeDuration: 0,
      };
      this.states.set(entityId, state);
    } else {
      // Sync state with component if needed
      state.activeClipId = component.activeBindingId || state.activeClipId;
      state.playing = component.playing;
      state.time = component.time;
    }
    return state;
  }

  /**
   * Play an animation clip
   */
  play(entityId: number, clipId: string, opts?: { fade?: number; loop?: boolean }): void {
    const component = componentRegistry.getComponentData<IAnimationComponent>(
      entityId,
      'Animation',
    );
    if (!component) {
      logger.warn('Cannot play animation: component not found', { entityId, clipId });
      return;
    }

    const state = this.getOrCreateState(entityId, component);

    // Update state
    state.activeClipId = clipId;
    state.playing = true;
    state.time = 0;
    state.loop = opts?.loop; // Leave undefined if not specified - will use clip.loop

    if (opts?.fade && opts.fade > 0) {
      state.fadingIn = true;
      state.fadeTime = 0;
      state.fadeDuration = opts.fade;
    }

    // Update component to reflect new state
    componentRegistry.updateComponent(entityId, 'Animation', {
      ...component,
      activeBindingId: clipId,
      playing: true,
      time: 0,
    });

    emit('animation:play', { entityId, clipId, fade: opts?.fade, loop: opts?.loop });
  }

  /**
   * Pause animation
   */
  pause(entityId: number): void {
    const component = componentRegistry.getComponentData<IAnimationComponent>(
      entityId,
      'Animation',
    );
    if (!component) return;

    const state = this.getOrCreateState(entityId, component);
    state.playing = false;

    componentRegistry.updateComponent(entityId, 'Animation', {
      ...component,
      playing: false,
    });

    emit('animation:pause', { entityId });
  }

  /**
   * Stop animation
   */
  stop(entityId: number, opts?: { fade?: number }): void {
    const component = componentRegistry.getComponentData<IAnimationComponent>(
      entityId,
      'Animation',
    );
    if (!component) return;

    const state = this.getOrCreateState(entityId, component);

    if (opts?.fade && opts.fade > 0) {
      state.fadingOut = true;
      state.fadeTime = 0;
      state.fadeDuration = opts.fade;
    } else {
      state.playing = false;
      state.time = 0;
      state.activeClipId = null;

      componentRegistry.updateComponent(entityId, 'Animation', {
        ...component,
        playing: false,
        time: 0,
        activeBindingId: undefined,
      });
    }

    emit('animation:stop', { entityId, fade: opts?.fade });
  }

  /**
   * Set playback time
   */
  setTime(entityId: number, time: number): void {
    const component = componentRegistry.getComponentData<IAnimationComponent>(
      entityId,
      'Animation',
    );
    if (!component) {
      // Unknown entity – nothing to do, but don't throw (editor may probe freely)
      return;
    }

    const state = this.getOrCreateState(entityId, component);

    // Clamp time to [0, clip.duration]
    state.time = Math.max(0, time);

    // Ensure there is an active clip to evaluate. Prefer existing state,
    // then component's active binding, then fall back to the first binding.
    if (!state.activeClipId) {
      const fallbackClipId =
        component.activeBindingId ?? component.clipBindings[0]?.clipId ?? null;
      state.activeClipId = fallbackClipId;
    }

    if (!state.activeClipId) {
      return;
    }

    const registry = AnimationRegistry.getInstance();
    const clip = registry.get(state.activeClipId);
    if (!clip) {
      return;
    }

    if (state.time > clip.duration) {
      state.time = clip.duration;
    }

    // Evaluate and apply immediately so editor scrubbing updates the viewport
    const evaluation = this.evaluator.evaluate(clip, state.time);
    this.applyEvaluation(entityId, evaluation);

    // Keep ECS component in sync with the runtime state
    componentRegistry.updateComponent(entityId, 'Animation', {
      ...component,
      time: state.time,
      activeBindingId: state.activeClipId || undefined,
      playing: state.playing,
    });
  }

  /**
   * Get animation playback state
   */
  getState(entityId: number): IAnimationPlaybackState | null {
    const component = componentRegistry.getComponentData<IAnimationComponent>(
      entityId,
      'Animation',
    );
    if (!component) return null;

    const state = this.states.get(entityId);
    if (!state) return null;

    const registry = AnimationRegistry.getInstance();
    const clip = state.activeClipId ? registry.get(state.activeClipId) : null;
    const loop = state.loop ?? clip?.loop ?? true;

    return {
      time: state.time,
      playing: state.playing,
      clipId: state.activeClipId,
      loop,
      timeScale: state.timeScale,
    };
  }

  /**
   * Get animation clip
   */
  getClip(_entityId: number, clipId: string): IClip | null {
    const registry = AnimationRegistry.getInstance();
    return registry.get(clipId) || null;
  }

  /**
   * Get all clips for entity
   */
  getAllClips(entityId: number): IClip[] {
    const component = componentRegistry.getComponentData<IAnimationComponent>(
      entityId,
      'Animation',
    );
    if (!component) return [];

    // Get all clips from bindings via AnimationRegistry
    const registry = AnimationRegistry.getInstance();
    const clips: IClip[] = [];
    for (const binding of component.clipBindings) {
      const asset = registry.get(binding.clipId);
      if (asset) {
        clips.push(asset);
      }
    }
    return clips;
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
export function animationSystem(scene: THREE.Scene, deltaTime: number, isPlaying: boolean = false): void {
  AnimationSystem.update(scene, deltaTime, isPlaying);
}

// Export API for external use
export const animationApi = AnimationSystem as IAnimationApi;
