import { describe, it, expect, beforeEach } from 'vitest';
import { ECSWorld } from '../World';

describe('ECSWorld', () => {
  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ECSWorld.getInstance();
      const instance2 = ECSWorld.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('world creation', () => {
    it('should create a world with time properties', () => {
      const world = ECSWorld.getInstance().getWorld();

      expect(world).toBeDefined();
      expect(world.time).toBeDefined();
      expect(world.time!.delta).toBe(0);
      expect(world.time!.elapsed).toBe(0);
      expect(typeof world.time!.then).toBe('number');
    });

    it('should initialize time.then with performance.now()', () => {
      const beforeTime = performance.now();
      const ecsWorld = ECSWorld.getInstance();
      ecsWorld.reset(); // Reset to get fresh timing
      const world = ecsWorld.getWorld();
      const afterTime = performance.now();

      expect(world.time!.then).toBeGreaterThanOrEqual(beforeTime);
      expect(world.time!.then).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('reset functionality', () => {
    let ecsWorld: ECSWorld;

    beforeEach(() => {
      ecsWorld = ECSWorld.getInstance();
    });

    it('should reset the world', () => {
      const originalWorld = ecsWorld.getWorld();

      // Modify the world
      originalWorld.customProperty = 'test';
      originalWorld.time!.delta = 16.67;
      originalWorld.time!.elapsed = 1000;

      // Reset the world
      ecsWorld.reset();
      const newWorld = ecsWorld.getWorld();

      // Should be a different object
      expect(newWorld).not.toBe(originalWorld);

      // Should have fresh time properties
      expect(newWorld.time!.delta).toBe(0);
      expect(newWorld.time!.elapsed).toBe(0);
      expect(newWorld.time!.then).toBeGreaterThan(originalWorld.time!.then);

      // Should not have custom properties
      expect(newWorld.customProperty).toBeUndefined();
    });

    it('should maintain singleton behavior after reset', () => {
      ecsWorld.reset();
      const instance1 = ECSWorld.getInstance();
      const instance2 = ECSWorld.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBe(ecsWorld);
    });

    it('should create valid BitECS world after reset', () => {
      ecsWorld.reset();
      const world = ecsWorld.getWorld();

      // BitECS worlds should be plain objects that can accept custom properties
      expect(typeof world).toBe('object');
      expect(world).not.toBeNull();

      // Should be able to add custom properties (BitECS pattern)
      world.testProperty = 'test';
      expect(world.testProperty).toBe('test');
    });
  });

  describe('world properties', () => {
    it('should allow setting custom properties on the world', () => {
      const world = ECSWorld.getInstance().getWorld();

      world.customSystemData = { entities: [], components: [] };
      world.frameCount = 0;

      expect(world.customSystemData).toBeDefined();
      expect(world.frameCount).toBe(0);
    });

    it('should preserve custom properties until reset', () => {
      const ecsWorld = ECSWorld.getInstance();
      const world = ecsWorld.getWorld();

      world.persistentData = 'should persist';

      // Access world again - should be same instance
      const sameWorld = ecsWorld.getWorld();
      expect(sameWorld.persistentData).toBe('should persist');

      // Reset should clear custom properties
      ecsWorld.reset();
      const newWorld = ecsWorld.getWorld();
      expect(newWorld.persistentData).toBeUndefined();
    });
  });

  describe('time management', () => {
    it('should allow updating time properties', () => {
      const world = ECSWorld.getInstance().getWorld();
      const initialTime = world.time!.then;

      // Simulate time update
      world.time!.delta = 16.67; // ~60 FPS
      world.time!.elapsed += world.time!.delta;
      world.time!.then = performance.now();

      expect(world.time!.delta).toBe(16.67);
      expect(world.time!.elapsed).toBeGreaterThan(0);
      expect(world.time!.then).toBeGreaterThan(initialTime);
    });

    it('should maintain time object reference', () => {
      const world = ECSWorld.getInstance().getWorld();
      const timeRef = world.time;

      // Time object should remain the same reference
      expect(world.time).toBe(timeRef);

      // But values can be updated
      timeRef!.delta = 10;
      expect(world.time!.delta).toBe(10);
    });
  });

  describe('type safety', () => {
    it('should have correctly typed world interface', () => {
      const world = ECSWorld.getInstance().getWorld();

      // Time properties should be properly typed
      const delta: number = world.time!.delta;
      const elapsed: number = world.time!.elapsed;
      const then: number = world.time!.then;

      expect(typeof delta).toBe('number');
      expect(typeof elapsed).toBe('number');
      expect(typeof then).toBe('number');
    });

    it('should support arbitrary property assignment', () => {
      const world = ECSWorld.getInstance().getWorld();

      // Should support string indexer
      world['dynamicProperty'] = 'test';
      expect(world['dynamicProperty']).toBe('test');

      // Should support direct property assignment
      (world as any).anotherProperty = 42;
      expect((world as any).anotherProperty).toBe(42);
    });
  });

  describe('integration with BitECS', () => {
    it('should create world compatible with BitECS operations', () => {
      const world = ECSWorld.getInstance().getWorld();

      // BitECS worlds should be plain objects
      expect(world.constructor).toBe(Object);

      // Should not have special prototype methods that might interfere
      expect(Object.getPrototypeOf(world)).toBe(Object.prototype);
    });

    it('should handle multiple resets without issues', () => {
      const ecsWorld = ECSWorld.getInstance();

      // Multiple resets should not cause issues
      for (let i = 0; i < 5; i++) {
        ecsWorld.reset();
        const world = ecsWorld.getWorld();

        expect(world.time).toBeDefined();
        expect(world.time!.delta).toBe(0);
        expect(world.time!.elapsed).toBe(0);
        expect(typeof world.time!.then).toBe('number');
      }
    });
  });
});
