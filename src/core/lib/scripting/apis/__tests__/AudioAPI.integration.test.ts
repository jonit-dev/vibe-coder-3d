/**
 * AudioAPI Integration Tests
 * Tests for audio API integration with script executor and full system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DirectScriptExecutor } from '../../DirectScriptExecutor';
import * as THREE from 'three';

// Mock Howler.js
const mockHowlInstances: any[] = [];
const mockPlay = vi.fn(() => 1);
const mockStop = vi.fn();
const mockUnload = vi.fn();
const mockPos = vi.fn();

vi.mock('howler', () => {
  return {
    Howl: vi.fn(function (this: any, config: any) {
      const instance = {
        _src: Array.isArray(config.src) ? config.src[0] : config.src,
        play: mockPlay,
        stop: mockStop,
        unload: mockUnload,
        pos: mockPos,
        _config: config,
      };
      mockHowlInstances.push(instance);
      return instance;
    }),
    Howler: {
      pos: vi.fn(),
      orientation: vi.fn(),
    },
  };
});

// Mock logger
vi.mock('@/core/lib/logger', () => ({
  Logger: {
    create: () => ({
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    }),
  },
}));

// Mock ComponentRegistry
vi.mock('@/core/lib/ecs/ComponentRegistry', () => ({
  componentRegistry: {
    getComponentData: vi.fn(),
    updateComponent: vi.fn(),
    hasComponent: vi.fn(() => false),
    addComponent: vi.fn(() => true),
    removeComponent: vi.fn(() => true),
    getEntitiesWithComponent: vi.fn(() => []),
  },
  ComponentCategory: {},
  ComponentFactory: {
    create: vi.fn(),
  },
}));

// Mock EntityManager
vi.mock('@/core/lib/ecs/EntityManager', () => ({
  EntityManager: {
    getInstance: vi.fn(() => ({
      createEntity: vi.fn(() => 1),
      deleteEntity: vi.fn(() => true),
      getEntity: vi.fn(),
    })),
  },
}));

// Mock event bus
vi.mock('@/core/lib/events', () => ({
  eventBus: {
    emit: vi.fn(),
    on: vi.fn(() => vi.fn()),
    off: vi.fn(),
  },
}));

// Mock ThreeJSEntityRegistry
vi.mock('../../ThreeJSEntityRegistry', () => ({
  threeJSEntityRegistry: {
    registerEntity: vi.fn(),
    unregisterEntity: vi.fn(),
    getEntityObject3D: vi.fn(() => new THREE.Object3D()),
    getEntityScene: vi.fn(() => new THREE.Scene()),
  },
}));

describe('AudioAPI Integration', () => {
  let executor: DirectScriptExecutor;
  let mockMesh: THREE.Object3D;

  beforeEach(() => {
    executor = DirectScriptExecutor.getInstance();
    executor.clearAll(); // This cleans up scripts AND calls cleanupAudioAPI for all entities

    mockHowlInstances.length = 0;
    mockPlay.mockClear();
    mockStop.mockClear();
    mockUnload.mockClear();
    mockPos.mockClear();

    mockMesh = new THREE.Object3D();
    mockMesh.position.set(10, 20, 30);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should play sound from script', () => {
    const scriptCode = `
      function onStart() {
        const soundId = audio.play('/sounds/test.mp3', { volume: 0.8 });
        console.log('Sound ID:', soundId);
      }
    `;

    const result = executor.compileScript(scriptCode, 'test-script');
    expect(result.success).toBe(true);

    const execResult = executor.executeScript(
      'test-script',
      {
        entityId: 1,
        parameters: {},
        timeInfo: { time: 0, deltaTime: 0, frameCount: 0 },
        inputInfo: {} as any,
        meshRef: () => mockMesh,
        sceneRef: () => new THREE.Scene(),
      },
      'onStart',
    );

    expect(execResult.success).toBe(true);
    expect(mockPlay).toHaveBeenCalled();
    expect(mockHowlInstances.length).toBe(1);
    expect(mockHowlInstances[0]._config.volume).toBe(0.8);
  });

  it('should play 3D spatial audio from script', () => {
    const scriptCode = `
      function onStart() {
        const soundId = audio.play('/sounds/3d.mp3', {
          volume: 1.0,
          loop: true,
          is3D: true,
        });
      }
    `;

    executor.compileScript(scriptCode, '3d-audio-script');
    executor.executeScript(
      '3d-audio-script',
      {
        entityId: 1,
        parameters: {},
        timeInfo: { time: 0, deltaTime: 0, frameCount: 0 },
        inputInfo: {} as any,
        meshRef: () => mockMesh,
        sceneRef: () => new THREE.Scene(),
      },
      'onStart',
    );

    expect(mockPlay).toHaveBeenCalled();
    expect(mockHowlInstances[0]._config.html5).toBe(true);
    // Verify pos() was called with the howl ID (position might vary based on mesh state)
    expect(mockPos).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      1,
    );
  });

  it('should stop sound from script', () => {
    const scriptCode = `
      function onStart() {
        const soundId = audio.play('/sounds/loop.mp3', { loop: true });
        // Stop the sound immediately by URL
        audio.stop('/sounds/loop.mp3');
      }
    `;

    executor.compileScript(scriptCode, 'stop-script');

    // Execute onStart
    executor.executeScript(
      'stop-script',
      {
        entityId: 1,
        parameters: {},
        timeInfo: { time: 0, deltaTime: 0, frameCount: 0 },
        inputInfo: {} as any,
        meshRef: () => mockMesh,
        sceneRef: () => new THREE.Scene(),
      },
      'onStart',
    );

    expect(mockPlay).toHaveBeenCalled();
    expect(mockStop).toHaveBeenCalled();
    expect(mockUnload).toHaveBeenCalled();
  });

  it('should attach audio to entity from script', () => {
    const scriptCode = `
      function onStart() {
        audio.play('/sounds/engine.mp3', { loop: true });
        audio.attachToEntity(true);
      }
    `;

    executor.compileScript(scriptCode, 'attach-script');
    executor.executeScript(
      'attach-script',
      {
        entityId: 1,
        parameters: {},
        timeInfo: { time: 0, deltaTime: 0, frameCount: 0 },
        inputInfo: {} as any,
        meshRef: () => mockMesh,
        sceneRef: () => new THREE.Scene(),
      },
      'onStart',
    );

    expect(mockPlay).toHaveBeenCalled();
    // attachToEntity sets 3D position
    expect(mockPos).toHaveBeenCalled();
  });

  it('should cleanup sounds when script context is removed', () => {
    const scriptCode = `
      function onStart() {
        audio.play('/sounds/sound1.mp3');
        audio.play('/sounds/sound2.mp3');
        audio.play('/sounds/sound3.mp3');
      }
    `;

    executor.compileScript(scriptCode, 'cleanup-script');
    executor.executeScript(
      'cleanup-script',
      {
        entityId: 1,
        parameters: {},
        timeInfo: { time: 0, deltaTime: 0, frameCount: 0 },
        inputInfo: {} as any,
        meshRef: () => mockMesh,
        sceneRef: () => new THREE.Scene(),
      },
      'onStart',
    );

    expect(mockPlay).toHaveBeenCalledTimes(3);

    mockStop.mockClear();
    mockUnload.mockClear();

    // Remove script context (simulates entity destruction)
    executor.removeScriptContext(1);

    // All 3 sounds should be stopped and unloaded
    expect(mockStop).toHaveBeenCalledTimes(3);
    expect(mockUnload).toHaveBeenCalledTimes(3);
  });

  it('should handle multiple entities with separate audio contexts', () => {
    const scriptCode = `
      function onStart() {
        audio.play('/sounds/test.mp3', { volume: 0.5 });
      }
    `;

    executor.compileScript(scriptCode, 'multi-entity-script');

    // Execute for entity 1
    executor.executeScript(
      'multi-entity-script',
      {
        entityId: 1,
        parameters: {},
        timeInfo: { time: 0, deltaTime: 0, frameCount: 0 },
        inputInfo: {} as any,
        meshRef: () => mockMesh,
        sceneRef: () => new THREE.Scene(),
      },
      'onStart',
    );

    // Execute for entity 2
    executor.executeScript(
      'multi-entity-script',
      {
        entityId: 2,
        parameters: {},
        timeInfo: { time: 0, deltaTime: 0, frameCount: 0 },
        inputInfo: {} as any,
        meshRef: () => mockMesh,
        sceneRef: () => new THREE.Scene(),
      },
      'onStart',
    );

    // Both entities should have played sounds
    expect(mockPlay).toHaveBeenCalledTimes(2);

    // Cleanup both - just verify it works without errors
    expect(() => {
      executor.removeScriptContext(1);
      executor.removeScriptContext(2);
    }).not.toThrow();

    // Both sounds should have been cleaned up
    expect(mockStop.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(mockUnload.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle fire-and-forget audio pattern', () => {
    const scriptCode = `
      let jumpCount = 0;

      function onUpdate() {
        if (input.isKeyDown && input.isKeyDown('space')) {
          // Fire and forget - don't store the ID
          audio.play('/sounds/jump.wav', { volume: 0.7 });
          jumpCount++;
        }
      }
    `;

    executor.compileScript(scriptCode, 'fire-forget-script');

    const mockInput = {
      isKeyDown: vi.fn((key: string) => key === 'space'),
      isKeyPressed: vi.fn(() => false),
      isKeyReleased: vi.fn(() => false),
      isMouseButtonDown: vi.fn(() => false),
      isMouseButtonPressed: vi.fn(() => false),
      isMouseButtonReleased: vi.fn(() => false),
      mousePosition: () => [0, 0] as [number, number],
      mouseDelta: () => [0, 0] as [number, number],
      mouseWheel: () => 0,
      lockPointer: vi.fn(),
      unlockPointer: vi.fn(),
      isPointerLocked: () => false,
      getActionValue: vi.fn(() => 0),
      isActionActive: vi.fn(() => false),
      onAction: vi.fn(),
      offAction: vi.fn(),
      enableActionMap: vi.fn(),
      disableActionMap: vi.fn(),
    };

    // Simulate 3 frames with space key pressed
    for (let i = 0; i < 3; i++) {
      executor.executeScript(
        'fire-forget-script',
        {
          entityId: 1,
          parameters: {},
          timeInfo: { time: i * 0.016, deltaTime: 0.016, frameCount: i },
          inputInfo: mockInput,
          meshRef: () => mockMesh,
          sceneRef: () => new THREE.Scene(),
        },
        'onUpdate',
      );
    }

    // Should have played 3 jump sounds
    expect(mockPlay).toHaveBeenCalledTimes(3);
  });

  it('should support all audio options in scripts', () => {
    const scriptCode = `
      function onStart() {
        // Test all supported options
        const id1 = audio.play('/sounds/test.mp3', {
          volume: 0.5,
          loop: true,
          rate: 1.5,
          is3D: true,
        });

        // Test minimal options
        const id2 = audio.play('/sounds/test2.mp3');

        // Test partial options
        const id3 = audio.play('/sounds/test3.mp3', { volume: 0.8 });
      }
    `;

    executor.compileScript(scriptCode, 'options-script');
    const result = executor.executeScript(
      'options-script',
      {
        entityId: 1,
        parameters: {},
        timeInfo: { time: 0, deltaTime: 0, frameCount: 0 },
        inputInfo: {} as any,
        meshRef: () => mockMesh,
        sceneRef: () => new THREE.Scene(),
      },
      'onStart',
    );

    expect(result.success).toBe(true);
    expect(mockPlay).toHaveBeenCalledTimes(3);

    // Verify first sound has all options
    expect(mockHowlInstances[0]._config.volume).toBe(0.5);
    expect(mockHowlInstances[0]._config.loop).toBe(true);
    expect(mockHowlInstances[0]._config.rate).toBe(1.5);
    expect(mockHowlInstances[0]._config.html5).toBe(true);

    // Verify defaults
    expect(mockHowlInstances[1]._config.volume).toBe(1.0);
    expect(mockHowlInstances[1]._config.loop).toBe(false);
  });
});
