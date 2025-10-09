/**
 * TransformAccessor Tests - Verifying script rotation API works correctly
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createComponentsProxy } from '../ComponentAccessors';
import { ComponentMutationBuffer } from '../../../mutations/ComponentMutationBuffer';
import { componentRegistry } from '../../../ComponentRegistry';
import type { ITransformAccessor } from '../types';

// Mock ComponentRegistry
vi.mock('../../../ComponentRegistry', () => ({
  componentRegistry: {
    hasComponent: vi.fn(),
    get: vi.fn(),
    getComponentData: vi.fn(),
  },
}));

describe('TransformAccessor', () => {
  let buffer: ComponentMutationBuffer;
  let entityId: number;
  let mockTransformData: any;

  beforeEach(() => {
    buffer = new ComponentMutationBuffer();
    entityId = 1;
    vi.clearAllMocks();

    // Setup initial transform data (in degrees)
    mockTransformData = {
      position: [0, 0, 0],
      rotation: [0, 0, 0], // degrees
      scale: [1, 1, 1],
    };

    vi.mocked(componentRegistry.hasComponent).mockReturnValue(true);
    vi.mocked(componentRegistry.get).mockReturnValue({
      id: 'Transform',
      schema: {},
    } as never);
    vi.mocked(componentRegistry.getComponentData).mockReturnValue(mockTransformData);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Transform Accessor', () => {
    it('should provide get() method that returns transform data', () => {
      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.Transform as ITransformAccessor;

      const data = accessor.get();

      expect(data).toEqual(mockTransformData);
      expect(componentRegistry.getComponentData).toHaveBeenCalledWith(entityId, 'Transform');
    });

    it('should return null from get() if component data is unavailable', () => {
      vi.mocked(componentRegistry.getComponentData).mockReturnValue(undefined);

      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.Transform as ITransformAccessor;

      const data = accessor.get();

      expect(data).toBeNull();
    });
  });

  describe('Rotation Unit Conversion - Degrees to Radians', () => {
    it('should convert degrees to radians for rotation getter', () => {
      // Mock transform data with rotation in degrees
      mockTransformData.rotation = [90, 45, 30]; // degrees

      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.Transform as ITransformAccessor;

      const rotation = accessor.get()?.rotation;

      // Convert expected degrees to radians for comparison
      const expectedRadians = [
        (90 * Math.PI) / 180, // 90 degrees = π/2 radians
        (45 * Math.PI) / 180, // 45 degrees = π/4 radians
        (30 * Math.PI) / 180, // 30 degrees = π/6 radians
      ];

      expect(rotation).toEqual(expectedRadians);
    });

    it('should handle zero rotation correctly', () => {
      mockTransformData.rotation = [0, 0, 0];

      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.Transform as ITransformAccessor;

      const rotation = accessor.get()?.rotation;

      expect(rotation).toEqual([0, 0, 0]);
    });

    it('should handle negative rotation correctly', () => {
      mockTransformData.rotation = [-90, -45, -30];

      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.Transform as ITransformAccessor;

      const rotation = accessor.get()?.rotation;

      const expectedRadians = [(-90 * Math.PI) / 180, (-45 * Math.PI) / 180, (-30 * Math.PI) / 180];

      expect(rotation).toEqual(expectedRadians);
    });
  });

  describe('setRotation - Radians to Degrees Conversion', () => {
    it('should convert radians to degrees when setting rotation', () => {
      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.Transform as ITransformAccessor;

      // Set rotation in radians (like scripts do)
      const rotationRadians = [
        Math.PI / 2, // 90 degrees
        Math.PI / 4, // 45 degrees
        Math.PI / 6, // 30 degrees
      ];

      accessor.setRotation(...rotationRadians);

      expect(buffer.size).toBe(1);

      const applied: unknown[] = [];
      buffer.flush((eid, cid, field, value) => {
        if (field === 'rotation') applied.push(value);
      });

      // Should be converted to degrees for ECS storage
      const rotation = applied[0] as [number, number, number];
      expect(rotation[0]).toBeCloseTo(90, 5);
      expect(rotation[1]).toBeCloseTo(45, 5);
      expect(rotation[2]).toBeCloseTo(30, 5);
    });

    it('should handle zero rotation in radians', () => {
      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.Transform as ITransformAccessor;

      accessor.setRotation(0, 0, 0);

      const applied: unknown[] = [];
      buffer.flush((eid, cid, field, value) => {
        if (field === 'rotation') applied.push(value);
      });

      expect(applied[0]).toEqual([0, 0, 0]);
    });

    it('should handle negative rotation in radians', () => {
      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.Transform as ITransformAccessor;

      accessor.setRotation(-Math.PI / 2, -Math.PI / 4, -Math.PI / 6);

      const applied: unknown[] = [];
      buffer.flush((eid, cid, field, value) => {
        if (field === 'rotation') applied.push(value);
      });

      const rotation = applied[0] as [number, number, number];
      expect(rotation[0]).toBeCloseTo(-90, 5);
      expect(rotation[1]).toBeCloseTo(-45, 5);
      expect(rotation[2]).toBeCloseTo(-30, 5);
    });
  });

  describe('rotate - Delta Rotation in Radians', () => {
    it('should add delta rotation in radians to current degrees', () => {
      // Start with 45 degrees rotation
      mockTransformData.rotation = [45, 45, 45];

      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.Transform as ITransformAccessor;

      // Add 90 degrees (π/2 radians) to each axis
      accessor.rotate(Math.PI / 2, Math.PI / 2, Math.PI / 2);

      const applied: unknown[] = [];
      buffer.flush((eid, cid, field, value) => {
        if (field === 'rotation') applied.push(value);
      });

      // Should be 45 + 90 = 135 degrees
      expect(applied[0]).toEqual([135, 135, 135]);
    });

    it('should handle zero delta rotation', () => {
      mockTransformData.rotation = [0, 0, 0];

      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.Transform as ITransformAccessor;

      accessor.rotate(0, 0, 0);

      const applied: unknown[] = [];
      buffer.flush((eid, cid, field, value) => {
        if (field === 'rotation') applied.push(value);
      });

      expect(applied[0]).toEqual([0, 0, 0]);
    });

    it('should handle negative delta rotation', () => {
      mockTransformData.rotation = [90, 90, 90];

      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.Transform as ITransformAccessor;

      // Subtract 45 degrees (-π/4 radians)
      accessor.rotate(-Math.PI / 4, -Math.PI / 4, -Math.PI / 4);

      const applied: unknown[] = [];
      buffer.flush((eid, cid, field, value) => {
        if (field === 'rotation') applied.push(value);
      });

      // Should be 90 - 45 = 45 degrees
      expect(applied[0]).toEqual([45, 45, 45]);
    });
  });

  describe('Direction Vectors - Degrees to Radians Conversion', () => {
    it('should compute forward vector using stored degrees', () => {
      // 90 degrees rotation around Y axis (pointing right)
      mockTransformData.rotation = [0, 90, 0];

      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.Transform as ITransformAccessor;

      const forward = accessor.forward();

      // At 90 degrees Y rotation, forward should be [1, 0, 0] (right)
      expect(forward[0]).toBeCloseTo(1, 5);
      expect(forward[1]).toBeCloseTo(0, 5);
      expect(forward[2]).toBeCloseTo(0, 5);
    });

    it('should compute right vector using stored degrees', () => {
      // 90 degrees rotation around Y axis
      mockTransformData.rotation = [0, 90, 0];

      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.Transform as ITransformAccessor;

      const right = accessor.right();

      // At 90 degrees Y rotation, right should be [0, 0, -1] (back)
      expect(right[0]).toBeCloseTo(0, 5);
      expect(right[1]).toBeCloseTo(0, 5);
      expect(right[2]).toBeCloseTo(-1, 5);
    });

    it('should compute up vector using stored degrees', () => {
      // 90 degrees rotation around X axis (pointing down)
      mockTransformData.rotation = [90, 0, 0];

      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.Transform as ITransformAccessor;

      const up = accessor.up();

      // At 90 degrees X rotation, up should be [0, 0, -1] (back)
      expect(up[0]).toBeCloseTo(0, 5);
      expect(up[1]).toBeCloseTo(0, 5);
      expect(up[2]).toBeCloseTo(-1, 5);
    });

    it('should handle zero rotation for direction vectors', () => {
      mockTransformData.rotation = [0, 0, 0];

      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.Transform as ITransformAccessor;

      const forward = accessor.forward();
      const right = accessor.right();
      const up = accessor.up();

      expect(forward[0]).toBeCloseTo(0, 5);
      expect(forward[1]).toBeCloseTo(0, 5);
      expect(forward[2]).toBeCloseTo(1, 5);
      expect(right[0]).toBeCloseTo(1, 5);
      expect(right[1]).toBeCloseTo(0, 5);
      expect(right[2]).toBeCloseTo(0, 5);
      expect(up[0]).toBeCloseTo(0, 5);
      expect(up[1]).toBeCloseTo(1, 5);
      expect(up[2]).toBeCloseTo(0, 5);
    });
  });

  describe('lookAt - Radians to Degrees Conversion', () => {
    it('should compute look-at rotation and convert to degrees', () => {
      // Entity at (0, 0, 0), looking at (1, 1, 1)
      mockTransformData.position = [0, 0, 0];

      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.Transform as ITransformAccessor;

      accessor.lookAt([1, 1, 1]);

      const applied: unknown[] = [];
      buffer.flush((eid, cid, field, value) => {
        if (field === 'rotation') applied.push(value);
      });

      // Should compute pitch and yaw in degrees
      const rotation = applied[0] as [number, number, number];
      expect(rotation[0]).toBeCloseTo(-35.26, 1); // Pitch ≈ -35.26 degrees
      expect(rotation[1]).toBeCloseTo(45, 1); // Yaw ≈ 45 degrees
      expect(rotation[2]).toBe(0); // Roll = 0
    });

    it('should handle looking straight forward', () => {
      mockTransformData.position = [0, 0, 0];

      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.Transform as ITransformAccessor;

      accessor.lookAt([0, 0, 1]); // Look along Z axis

      const applied: unknown[] = [];
      buffer.flush((eid, cid, field, value) => {
        if (field === 'rotation') applied.push(value);
      });

      // Should be zero rotation
      const rotation = applied[0] as [number, number, number];
      expect(rotation[0]).toBeCloseTo(0, 5);
      expect(rotation[1]).toBeCloseTo(0, 5);
      expect(rotation[2]).toBeCloseTo(0, 5);
    });
  });

  describe('Integration - Full Rotation Workflow', () => {
    it('should handle complete script rotation workflow', () => {
      // Simulate a script that rotates an entity over time
      mockTransformData.rotation = [0, 0, 0];

      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.Transform as ITransformAccessor;

      // Script rotates by 90 degrees (π/2 radians) per frame for 4 frames
      for (let i = 0; i < 4; i++) {
        accessor.rotate(Math.PI / 2, Math.PI / 2, Math.PI / 2);

        // Simulate the mutation being applied back to the mock data
        buffer.flush((eid, cid, field, value) => {
          if (field === 'rotation') {
            mockTransformData.rotation = value as [number, number, number];
          }
        });
      }

      // Check the final rotation value
      const rotation = mockTransformData.rotation;
      expect(rotation[0]).toBeCloseTo(360, 5);
      expect(rotation[1]).toBeCloseTo(360, 5);
      expect(rotation[2]).toBeCloseTo(360, 5);
    });

    it('should maintain precision across multiple small rotations', () => {
      mockTransformData.rotation = [0, 0, 0];

      const proxy = createComponentsProxy(entityId, buffer);
      const accessor = proxy.Transform as ITransformAccessor;

      // Many small rotations (1 degree each, π/180 radians)
      for (let i = 0; i < 10; i++) {
        accessor.rotate(Math.PI / 180, Math.PI / 180, Math.PI / 180);

        // Simulate the mutation being applied back to the mock data
        buffer.flush((eid, cid, field, value) => {
          if (field === 'rotation') {
            mockTransformData.rotation = value as [number, number, number];
          }
        });
      }

      // Should accumulate to 10 degrees
      const rotation = mockTransformData.rotation;
      expect(rotation[0]).toBeCloseTo(10, 5);
      expect(rotation[1]).toBeCloseTo(10, 5);
      expect(rotation[2]).toBeCloseTo(10, 5);
    });
  });
});
