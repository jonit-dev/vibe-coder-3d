/**
 * CustomShapeComponent Unit Tests
 * Tests for the CustomShape ECS component serialization and deserialization
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createWorld } from 'bitecs';
import { customShapeComponent, type CustomShapeData } from '../CustomShapeComponent';
import { componentRegistry } from '../../../ComponentRegistry';

describe('CustomShapeComponent', () => {
  let world: any;
  let eid: number;

  beforeEach(() => {
    world = createWorld();
    eid = 1; // Simple entity ID for testing
  });

  describe('Component Definition', () => {
    it('should have correct component ID', () => {
      expect(customShapeComponent.id).toBe('CustomShape');
    });

    it('should have correct component name', () => {
      expect(customShapeComponent.name).toBe('Custom Shape');
    });

    it('should be in Rendering category', () => {
      expect(customShapeComponent.category).toBe('rendering');
    });

    it('should have Transform as dependency', () => {
      expect(customShapeComponent.dependencies).toContain('Transform');
    });

    it('should conflict with Camera and Light', () => {
      expect(customShapeComponent.conflicts).toContain('Camera');
      expect(customShapeComponent.conflicts).toContain('Light');
    });

    it('should be incompatible with Camera and Light', () => {
      expect(customShapeComponent.incompatibleComponents).toContain('Camera');
      expect(customShapeComponent.incompatibleComponents).toContain('Light');
    });
  });

  describe('Schema Validation', () => {
    it('should validate valid CustomShape data', () => {
      const validData: CustomShapeData = {
        shapeId: 'test-shape',
        params: {
          size: 1,
          color: 'red',
        },
      };

      const result = customShapeComponent.schema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require shapeId', () => {
      const invalidData = {
        params: {},
      };

      const result = customShapeComponent.schema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should allow empty params object', () => {
      const validData: CustomShapeData = {
        shapeId: 'test-shape',
        params: {},
      };

      const result = customShapeComponent.schema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should default params to empty object', () => {
      const data = {
        shapeId: 'test-shape',
      };

      const result = customShapeComponent.schema.parse(data);
      expect(result.params).toEqual({});
    });

    it('should allow various param types', () => {
      const validData: CustomShapeData = {
        shapeId: 'test-shape',
        params: {
          number: 42,
          string: 'hello',
          boolean: true,
          array: [1, 2, 3],
          nested: {
            value: 'test',
          },
        },
      };

      const result = customShapeComponent.schema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Serialization', () => {
    it('should serialize CustomShape data correctly', () => {
      const testData: CustomShapeData = {
        shapeId: 'test-shape',
        params: {
          size: 2,
          segments: 32,
        },
      };

      // Create mock BitECS component structure
      const mockComponent = {
        shapeIdHash: new Uint32Array(10),
        paramsHash: new Uint32Array(10),
      };

      // First deserialize to populate component
      customShapeComponent.deserialize(eid, testData, mockComponent);

      // Then serialize back
      const serialized = customShapeComponent.serialize(eid, mockComponent);

      expect(serialized).toBeDefined();
      expect(serialized.shapeId).toBe('test-shape');
      expect(serialized.params).toEqual({
        size: 2,
        segments: 32,
      });
    });

    it('should serialize with empty params', () => {
      const testData: CustomShapeData = {
        shapeId: 'minimal-shape',
        params: {},
      };

      const mockComponent = {
        shapeIdHash: new Uint32Array(10),
        paramsHash: new Uint32Array(10),
      };

      customShapeComponent.deserialize(eid, testData, mockComponent);
      const serialized = customShapeComponent.serialize(eid, mockComponent);

      expect(serialized.shapeId).toBe('minimal-shape');
      expect(serialized.params).toEqual({});
    });

    it('should handle complex nested params', () => {
      const testData: CustomShapeData = {
        shapeId: 'complex-shape',
        params: {
          geometry: {
            type: 'sphere',
            radius: 0.5,
          },
          material: {
            color: '#ff0000',
            metalness: 0.7,
          },
          transform: {
            position: [0, 1, 0],
            rotation: [0, 45, 0],
          },
        },
      };

      const mockComponent = {
        shapeIdHash: new Uint32Array(10),
        paramsHash: new Uint32Array(10),
      };

      customShapeComponent.deserialize(eid, testData, mockComponent);
      const serialized = customShapeComponent.serialize(eid, mockComponent);

      expect(serialized.params).toEqual(testData.params);
    });
  });

  describe('Deserialization', () => {
    it('should deserialize CustomShape data correctly', () => {
      const testData: CustomShapeData = {
        shapeId: 'test-shape',
        params: {
          radius: 0.5,
          segments: 64,
        },
      };

      const mockComponent = {
        shapeIdHash: new Uint32Array(10),
        paramsHash: new Uint32Array(10),
      };

      customShapeComponent.deserialize(eid, testData, mockComponent);

      // Verify we can serialize it back (this tests round-trip integrity)
      const serialized = customShapeComponent.serialize(eid, mockComponent);
      expect(serialized.shapeId).toBe(testData.shapeId);
      expect(serialized.params).toEqual(testData.params);
    });

    it('should handle missing params gracefully', () => {
      const testData = {
        shapeId: 'test-shape',
        // params missing, should default to {}
      };

      const mockComponent = {
        shapeIdHash: new Uint32Array(10),
        paramsHash: new Uint32Array(10),
      };

      customShapeComponent.deserialize(eid, testData, mockComponent);
      const serialized = customShapeComponent.serialize(eid, mockComponent);

      expect(serialized.params).toEqual({});
    });

    it('should handle empty shapeId gracefully', () => {
      const testData: CustomShapeData = {
        shapeId: '',
        params: {},
      };

      const mockComponent = {
        shapeIdHash: new Uint32Array(10),
        paramsHash: new Uint32Array(10),
      };

      expect(() => {
        customShapeComponent.deserialize(eid, testData, mockComponent);
      }).not.toThrow();
    });
  });

  describe('Round-trip Serialization', () => {
    it('should maintain data integrity through serialize/deserialize cycle', () => {
      const originalData: CustomShapeData = {
        shapeId: 'torus-knot',
        params: {
          radius: 0.4,
          tube: 0.1,
          tubularSegments: 64,
          radialSegments: 8,
          p: 2,
          q: 3,
        },
      };

      const mockComponent = {
        shapeIdHash: new Uint32Array(10),
        paramsHash: new Uint32Array(10),
      };

      // Deserialize -> Serialize
      customShapeComponent.deserialize(eid, originalData, mockComponent);
      const roundTrip = customShapeComponent.serialize(eid, mockComponent);

      expect(roundTrip).toEqual(originalData);
    });

    it('should handle multiple entities independently', () => {
      const data1: CustomShapeData = {
        shapeId: 'shape-1',
        params: { size: 1 },
      };

      const data2: CustomShapeData = {
        shapeId: 'shape-2',
        params: { size: 2 },
      };

      const mockComponent = {
        shapeIdHash: new Uint32Array(10),
        paramsHash: new Uint32Array(10),
      };

      const eid1 = 1;
      const eid2 = 2;

      customShapeComponent.deserialize(eid1, data1, mockComponent);
      customShapeComponent.deserialize(eid2, data2, mockComponent);

      const serialized1 = customShapeComponent.serialize(eid1, mockComponent);
      const serialized2 = customShapeComponent.serialize(eid2, mockComponent);

      expect(serialized1.shapeId).toBe('shape-1');
      expect(serialized1.params).toEqual({ size: 1 });

      expect(serialized2.shapeId).toBe('shape-2');
      expect(serialized2.params).toEqual({ size: 2 });
    });
  });

  describe('Real-world Shape Examples', () => {
    it('should handle Torus Knot params', () => {
      const torusKnotData: CustomShapeData = {
        shapeId: 'example-torus-knot',
        params: {
          radius: 0.4,
          tube: 0.1,
          tubularSegments: 64,
          radialSegments: 8,
          p: 2,
          q: 3,
        },
      };

      const mockComponent = {
        shapeIdHash: new Uint32Array(10),
        paramsHash: new Uint32Array(10),
      };

      customShapeComponent.deserialize(eid, torusKnotData, mockComponent);
      const serialized = customShapeComponent.serialize(eid, mockComponent);

      expect(serialized).toEqual(torusKnotData);
    });

    it('should handle Parametric Sphere params', () => {
      const sphereData: CustomShapeData = {
        shapeId: 'parametric-sphere',
        params: {
          radius: 0.5,
          widthSegments: 32,
          heightSegments: 16,
        },
      };

      const mockComponent = {
        shapeIdHash: new Uint32Array(10),
        paramsHash: new Uint32Array(10),
      };

      customShapeComponent.deserialize(eid, sphereData, mockComponent);
      const serialized = customShapeComponent.serialize(eid, mockComponent);

      expect(serialized).toEqual(sphereData);
    });
  });

  describe('Error Handling', () => {
    it('should handle serialization without deserialization', () => {
      // Use a fresh entity ID to avoid collisions with previous tests
      const freshEid = 99;

      const mockComponent = {
        shapeIdHash: new Uint32Array(100),
        paramsHash: new Uint32Array(100),
      };

      // Don't deserialize anything - hash for this eid will be 0
      // This simulates a corrupted or uninitialized component

      // Should not throw during serialization
      expect(() => {
        customShapeComponent.serialize(freshEid, mockComponent);
      }).not.toThrow();

      // Should return empty string for shapeId and empty params for uninitialized component
      const serialized = customShapeComponent.serialize(freshEid, mockComponent);
      expect(serialized.shapeId).toBe('');
      expect(serialized.params).toEqual({});
    });

    it('should validate data before deserializing', () => {
      const invalidData = {
        // Missing shapeId
        params: { size: 1 },
      };

      // Schema validation would catch this before deserialization
      const result = customShapeComponent.schema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Type Safety', () => {
    it('should enforce CustomShapeData type', () => {
      // This test verifies TypeScript type safety at compile time
      const data: CustomShapeData = {
        shapeId: 'test-shape',
        params: {
          anyKey: 'anyValue',
        },
      };

      expect(data.shapeId).toBe('test-shape');
      expect(data.params).toBeDefined();
    });

    it('should export CustomShapeData type', () => {
      // Verify the type is exported and usable
      const data: CustomShapeData = {
        shapeId: 'exported-type-test',
        params: {},
      };

      const result = customShapeComponent.schema.parse(data);
      expect(result).toEqual(data);
    });
  });
});
