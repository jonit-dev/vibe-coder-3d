import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { AnimationSystem, animationApi, animationSystem } from '../AnimationSystem';
import { componentRegistry } from '@core/lib/ecs/ComponentRegistry';
import type { IAnimationComponent, IClip } from '@core/components/animation/AnimationComponent';

// Mock dependencies
vi.mock('@core/lib/ecs/ComponentRegistry');
vi.mock('@core/lib/events', () => ({
  emit: vi.fn(),
}));

vi.mock('@core/lib/logger', () => ({
  Logger: {
    create: () => ({
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

const mockComponentRegistry = vi.mocked(componentRegistry);
const mockEmit = vi.mocked(await import('@core/lib/events')).emit;

describe('AnimationSystem', () => {
  let scene: THREE.Scene;
  let testEntity: number;
  let testComponent: IAnimationComponent;
  let testClip: IClip;
  let mockMesh: THREE.Mesh;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup test scene
    scene = new THREE.Scene();
    testEntity = 123;

    // Create test mesh with userData
    mockMesh = new THREE.Mesh(
      new THREE.BoxGeometry(),
      new THREE.MeshBasicMaterial()
    );
    mockMesh.userData.entityId = testEntity;
    mockMesh.name = 'root';
    scene.add(mockMesh);

    // Setup test clip
    testClip = {
      id: 'test-clip',
      name: 'Test Clip',
      duration: 2,
      loop: true,
      timeScale: 1,
      tracks: [],
    };

    // Setup test component
    testComponent = {
      activeClipId: 'test-clip',
      blendIn: 0.2,
      blendOut: 0.2,
      layer: 0,
      weight: 1,
      playing: true,
      time: 0,
      clips: [testClip],
      version: 1,
    };

    // Setup component registry mocks
    mockComponentRegistry.getEntitiesWithComponent.mockReturnValue([testEntity]);
    mockComponentRegistry.getComponentData.mockReturnValue(testComponent);
    mockComponentRegistry.updateComponent.mockImplementation(() => {});

    // Reset animation system
    AnimationSystem.init(scene);
  });

  describe('initialization', () => {
    it('should initialize with a scene', () => {
      const newScene = new THREE.Scene();
      AnimationSystem.init(newScene);
      // Should not throw
    });

    it('should accept scene via update method', () => {
      const newScene = new THREE.Scene();
      const system = new (AnimationSystem.constructor as any)();
      system.update(newScene, 0.016);
      // Should not throw
    });
  });

  describe('update', () => {
    it('should update entities with animation components', () => {
      AnimationSystem.update(scene, 0.016);

      expect(mockComponentRegistry.getEntitiesWithComponent).toHaveBeenCalledWith('Animation');
      expect(mockComponentRegistry.getComponentData).toHaveBeenCalledWith(testEntity, 'Animation');
      expect(mockComponentRegistry.updateComponent).toHaveBeenCalledWith(
        testEntity,
        'Animation',
        expect.objectContaining({
          time: expect.any(Number),
          playing: expect.any(Boolean),
        })
      );
    });

    it('should skip entities without animation components', () => {
      mockComponentRegistry.getComponentData.mockReturnValueOnce(null);

      AnimationSystem.update(scene, 0.016);

      expect(mockComponentRegistry.updateComponent).not.toHaveBeenCalled();
    });

    it('should handle multiple entities', () => {
      const entity2 = 456;
      const entity2Component: IAnimationComponent = {
        ...testComponent,
        activeClipId: 'clip-2',
      };

      mockComponentRegistry.getEntitiesWithComponent.mockReturnValue([testEntity, entity2]);
      mockComponentRegistry.getComponentData
        .mockReturnValueOnce(testComponent)
        .mockReturnValueOnce(entity2Component);

      AnimationSystem.update(scene, 0.016);

      expect(mockComponentRegistry.getComponentData).toHaveBeenCalledTimes(2);
      expect(mockComponentRegistry.updateComponent).toHaveBeenCalledTimes(2);
    });

    it('should update animation time based on deltaTime', () => {
      const deltaTime = 0.1;
      AnimationSystem.update(scene, deltaTime);

      const expectedTime = deltaTime * 1 * 1; // deltaTime * timeScale * clip.timeScale
      expect(mockComponentRegistry.updateComponent).toHaveBeenCalledWith(
        testEntity,
        'Animation',
        expect.objectContaining({
          time: expect.closeTo(expectedTime, 0.001),
        })
      );
    });

    it('should respect clip time scale', () => {
      const scaledClip: IClip = {
        ...testClip,
        timeScale: 2,
      };
      testComponent.clips = [scaledClip];

      const deltaTime = 0.1;
      AnimationSystem.update(scene, deltaTime);

      const expectedTime = deltaTime * 1 * 2; // deltaTime * timeScale * clip.timeScale
      expect(mockComponentRegistry.updateComponent).toHaveBeenCalledWith(
        testEntity,
        'Animation',
        expect.objectContaining({
          time: expect.closeTo(expectedTime, 0.001),
        })
      );
    });

    it('should handle looping animation', () => {
      // Set initial time close to duration
      const componentWithTime: IAnimationComponent = {
        ...testComponent,
        time: 1.9,
      };
      mockComponentRegistry.getComponentData.mockReturnValue(componentWithTime);

      const deltaTime = 0.2; // Will push time past duration (2.0)
      AnimationSystem.update(scene, deltaTime);

      // Should loop back to beginning
      expect(mockComponentRegistry.updateComponent).toHaveBeenCalledWith(
        testEntity,
        'Animation',
        expect.objectContaining({
          time: expect.closeTo(0.1, 0.001), // 1.9 + 0.2 - 2.0 = 0.1
          playing: true, // Should still be playing due to loop
        })
      );

      expect(mockEmit).toHaveBeenCalledWith('animation:loop', {
        entityId: testEntity,
        clipId: testClip.id,
        loopCount: expect.any(Number),
      });
    });

    it('should stop non-looping animation at end', () => {
      const nonLoopingClip: IClip = {
        ...testClip,
        loop: false,
      };
      testComponent.clips = [nonLoopingClip];

      // Set initial time close to duration
      const componentWithTime: IAnimationComponent = {
        ...testComponent,
        time: 1.9,
      };
      mockComponentRegistry.getComponentData.mockReturnValue(componentWithTime);

      const deltaTime = 0.2; // Will push time past duration (2.0)
      AnimationSystem.update(scene, deltaTime);

      expect(mockComponentRegistry.updateComponent).toHaveBeenCalledWith(
        testEntity,
        'Animation',
        expect.objectContaining({
          time: 2.0, // Should clamp to duration
          playing: false, // Should stop playing
        })
      );

      expect(mockEmit).toHaveBeenCalledWith('animation:ended', {
        entityId: testEntity,
        clipId: nonLoopingClip.id,
      });
    });
  });

  describe('animation playback control', () => {
    beforeEach(() => {
      // Manually create state for the entity by calling update once
      AnimationSystem.update(scene, 0);
    });

    describe('play', () => {
      it('should start playing an animation', () => {
        animationApi.play(testEntity, testClip.id);

        const state = animationApi.getState(testEntity);
        expect(state?.playing).toBe(true);
        expect(state?.clipId).toBe(testClip.id);
        expect(state?.time).toBe(0);
      });

      it('should support fade in', () => {
        animationApi.play(testEntity, testClip.id, { fade: 0.5 });

        const state = animationApi.getState(testEntity);
        expect(state?.playing).toBe(true);

        expect(mockEmit).toHaveBeenCalledWith('animation:play', {
          entityId: testEntity,
          clipId: testClip.id,
          fade: 0.5,
          loop: true,
        });
      });

      it('should respect loop option', () => {
        animationApi.play(testEntity, testClip.id, { loop: false });

        const state = animationApi.getState(testEntity);
        expect(state?.loop).toBe(false);
      });

      it('should warn if entity state not found', () => {
        const unknownEntity = 999;
        animationApi.play(unknownEntity, 'unknown-clip');

        // Should not throw and should log warning
        expect(mockEmit).not.toHaveBeenCalledWith(
          'animation:play',
          expect.objectContaining({ entityId: unknownEntity })
        );
      });
    });

    describe('pause', () => {
      it('should pause animation', () => {
        animationApi.pause(testEntity);

        const state = animationApi.getState(testEntity);
        expect(state?.playing).toBe(false);

        expect(mockEmit).toHaveBeenCalledWith('animation:pause', {
          entityId: testEntity,
        });
      });

      it('should handle pause on unknown entity', () => {
        const unknownEntity = 999;
        expect(() => animationApi.pause(unknownEntity)).not.toThrow();
      });
    });

    describe('stop', () => {
      it('should stop animation immediately', () => {
        animationApi.stop(testEntity);

        const state = animationApi.getState(testEntity);
        expect(state?.playing).toBe(false);
        expect(state?.time).toBe(0);
        expect(state?.clipId).toBeNull();

        expect(mockEmit).toHaveBeenCalledWith('animation:stop', {
          entityId: testEntity,
          fade: undefined,
        });
      });

      it('should support fade out', () => {
        animationApi.stop(testEntity, { fade: 0.5 });

        expect(mockEmit).toHaveBeenCalledWith('animation:stop', {
          entityId: testEntity,
          fade: 0.5,
        });
      });

      it('should handle stop on unknown entity', () => {
        const unknownEntity = 999;
        expect(() => animationApi.stop(unknownEntity)).not.toThrow();
      });
    });

    describe('setTime', () => {
      it('should set playback time', () => {
        animationApi.setTime(testEntity, 1.5);

        const state = animationApi.getState(testEntity);
        expect(state?.time).toBe(1.5);
      });

      it('should clamp negative time to 0', () => {
        animationApi.setTime(testEntity, -1);

        const state = animationApi.getState(testEntity);
        expect(state?.time).toBe(0);
      });

      it('should handle setTime on unknown entity', () => {
        const unknownEntity = 999;
        expect(() => animationApi.setTime(unknownEntity, 1)).not.toThrow();
      });
    });
  });

  describe('state management', () => {
    beforeEach(() => {
      // Create state for entity
      AnimationSystem.update(scene, 0);
    });

    describe('getState', () => {
      it('should return current animation state', () => {
        const state = animationApi.getState(testEntity);

        expect(state).toEqual({
          time: expect.any(Number),
          playing: expect.any(Boolean),
          clipId: expect.any(String),
          loop: expect.any(Boolean),
          timeScale: expect.any(Number),
        });
      });

      it('should return null for unknown entity', () => {
        const unknownEntity = 999;
        const state = animationApi.getState(unknownEntity);
        expect(state).toBeNull();
      });
    });

    describe('getClip', () => {
      it('should return null (not implemented)', () => {
        const clip = animationApi.getClip(testEntity, testClip.id);
        expect(clip).toBeNull();
      });
    });

    describe('getAllClips', () => {
      it('should return empty array (not implemented)', () => {
        const clips = animationApi.getAllClips(testEntity);
        expect(clips).toEqual([]);
      });
    });
  });

  describe('Three.js integration', () => {
    it('should find entity object by userData.entityId', () => {
      // Mock the evaluator to return some transforms
      const mockEvaluator = {
        evaluate: vi.fn().mockReturnValue({
          transforms: new Map([
            ['root', { position: new THREE.Vector3(1, 2, 3) }],
          ]),
          morphs: new Map(),
          materials: new Map(),
          events: [],
        }),
        clearCache: vi.fn(),
      };

      // Replace evaluator temporarily
      (AnimationSystem as any).evaluator = mockEvaluator;

      AnimationSystem.update(scene, 0.016);

      // The position should be applied to the mesh
      expect(mockMesh.position.x).toBe(1);
      expect(mockMesh.position.y).toBe(2);
      expect(mockMesh.position.z).toBe(3);
    });

    it('should apply morph target influences', () => {
      // Create mesh with morph targets
      const morphMesh = new THREE.Mesh(
        new THREE.BoxGeometry(),
        new THREE.MeshBasicMaterial()
      );
      morphMesh.morphTargetInfluences = [0, 0];
      morphMesh.morphTargetDictionary = { smile: 0, blink: 1 };
      morphMesh.userData.entityId = testEntity;
      scene.add(morphMesh);

      // Mock evaluator to return morph data
      const mockEvaluator = {
        evaluate: vi.fn().mockReturnValue({
          transforms: new Map(),
          morphs: new Map([
            ['root', { smile: 0.8, blink: 0.2 }],
          ]),
          materials: new Map(),
          events: [],
        }),
        clearCache: vi.fn(),
      };

      (AnimationSystem as any).evaluator = mockEvaluator;

      AnimationSystem.update(scene, 0.016);

      expect(morphMesh.morphTargetInfluences[0]).toBe(0.8); // smile
      expect(morphMesh.morphTargetInfluences[1]).toBe(0.2); // blink
    });

    it('should apply material properties', () => {
      // Create mesh with material
      const material = new THREE.MeshBasicMaterial({ opacity: 1 });
      const meshWithMaterial = new THREE.Mesh(
        new THREE.BoxGeometry(),
        material
      );
      meshWithMaterial.userData.entityId = testEntity;
      scene.add(meshWithMaterial);

      // Mock evaluator to return material data
      const mockEvaluator = {
        evaluate: vi.fn().mockReturnValue({
          transforms: new Map(),
          morphs: new Map(),
          materials: new Map([
            ['root', { opacity: 0.5, transparent: true }],
          ]),
          events: [],
        }),
        clearCache: vi.fn(),
      };

      (AnimationSystem as any).evaluator = mockEvaluator;

      AnimationSystem.update(scene, 0.016);

      expect(material.opacity).toBe(0.5);
      expect((material as any).transparent).toBe(true);
      expect(material.needsUpdate).toBe(true);
    });

    it('should handle missing Three.js objects gracefully', () => {
      // Create entity without corresponding Three.js object
      const orphanEntity = 789;
      mockComponentRegistry.getEntitiesWithComponent.mockReturnValue([orphanEntity]);
      mockComponentRegistry.getComponentData.mockReturnValue(testComponent);

      expect(() => AnimationSystem.update(scene, 0.016)).not.toThrow();
    });
  });

  describe('event emission', () => {
    beforeEach(() => {
      // Mock evaluator to return events
      const mockEvaluator = {
        evaluate: vi.fn().mockReturnValue({
          transforms: new Map(),
          morphs: new Map(),
          materials: new Map(),
          events: [
            { type: 'marker', name: 'footstep', params: { volume: 0.5 } },
          ],
        }),
        clearCache: vi.fn(),
      };

      (AnimationSystem as any).evaluator = mockEvaluator;
    });

    it('should emit animation marker events', () => {
      AnimationSystem.update(scene, 0.016);

      expect(mockEmit).toHaveBeenCalledWith('animation:marker', {
        entityId: testEntity,
        markerName: 'footstep',
        time: expect.any(Number),
        params: { volume: 0.5 },
      });
    });

    it('should emit multiple marker events', () => {
      const mockEvaluator = {
        evaluate: vi.fn().mockReturnValue({
          transforms: new Map(),
          morphs: new Map(),
          materials: new Map(),
          events: [
            { type: 'marker', name: 'event1', params: {} },
            { type: 'marker', name: 'event2', params: {} },
          ],
        }),
        clearCache: vi.fn(),
      };

      (AnimationSystem as any).evaluator = mockEvaluator;

      AnimationSystem.update(scene, 0.016);

      expect(mockEmit).toHaveBeenCalledWith('animation:marker', {
        entityId: testEntity,
        markerName: 'event1',
        time: expect.any(Number),
        params: {},
      });

      expect(mockEmit).toHaveBeenCalledWith('animation:marker', {
        entityId: testEntity,
        markerName: 'event2',
        time: expect.any(Number),
        params: {},
      });
    });
  });

  describe('cache management', () => {
    it('should clear cache', () => {
      AnimationSystem.clearCache();
      // Should not throw
    });

    it('should clear cache on cleanup', () => {
      AnimationSystem.cleanup();
      // Should not throw
    });

    it('should handle cleanup with active animations', () => {
      // Create some state first
      AnimationSystem.update(scene, 0);
      animationApi.play(testEntity, testClip.id);

      AnimationSystem.cleanup();

      // State should be cleared
      expect(animationApi.getState(testEntity)).toBeNull();
    });
  });

  describe('performance and error handling', () => {
    it('should handle missing scene gracefully', () => {
      const system = new (AnimationSystem.constructor as any)();
      expect(() => system.update(null, 0.016)).not.toThrow();
    });

    it('should handle component registry errors gracefully', () => {
      mockComponentRegistry.getEntitiesWithComponent.mockImplementation(() => {
        throw new Error('Registry error');
      });

      expect(() => AnimationSystem.update(scene, 0.016)).not.toThrow();
    });

    it('should handle evaluator errors gracefully', () => {
      const mockEvaluator = {
        evaluate: vi.fn().mockImplementation(() => {
          throw new Error('Evaluation error');
        }),
        clearCache: vi.fn(),
      };

      (AnimationSystem as any).evaluator = mockEvaluator;

      expect(() => AnimationSystem.update(scene, 0.016)).toThrow('Evaluation error');
    });
  });

  describe('animationSystem function', () => {
    it('should be a wrapper around AnimationSystem.update', () => {
      const updateSpy = vi.spyOn(AnimationSystem, 'update');

      animationSystem(scene, 0.016);

      expect(updateSpy).toHaveBeenCalledWith(scene, 0.016);
    });
  });

  describe('animationApi export', () => {
    it('should expose the same API as AnimationSystem', () => {
      expect(animationApi.play).toBeTypeOf('function');
      expect(animationApi.pause).toBeTypeOf('function');
      expect(animationApi.stop).toBeTypeOf('function');
      expect(animationApi.setTime).toBeTypeOf('function');
      expect(animationApi.getState).toBeTypeOf('function');
      expect(animationApi.getClip).toBeTypeOf('function');
      expect(animationApi.getAllClips).toBeTypeOf('function');
    });
  });
});