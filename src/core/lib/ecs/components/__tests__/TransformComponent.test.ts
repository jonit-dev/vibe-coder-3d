import { describe, it, expect } from 'vitest';
import { TransformComponent, ITransformData } from '../TransformComponent';
import { KnownComponentTypes } from '../../IComponent';

describe('TransformComponent', () => {
  const defaultTransformData: ITransformData = {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  };

  describe('component creation', () => {
    it('should create transform component with default values', () => {
      const component = TransformComponent.create(1, defaultTransformData);

      expect(component.entityId).toBe(1);
      expect(component.type).toBe(KnownComponentTypes.TRANSFORM);
      expect(component.data).toEqual(defaultTransformData);
    });

    it('should create transform component with custom values', () => {
      const customData: ITransformData = {
        position: [1, 2, 3],
        rotation: [90, 0, 45],
        scale: [2, 2, 2],
      };

      const component = TransformComponent.create(1, customData);

      expect(component.data).toEqual(customData);
    });
  });

  describe('validation', () => {
    it('should validate correct transform data', () => {
      const validData: ITransformData = {
        position: [1, 2, 3],
        rotation: [0, 90, 180],
        scale: [1, 1, 1],
      };

      expect(() => TransformComponent.validate(validData)).not.toThrow();
    });

    it('should reject invalid position array', () => {
      const invalidData = {
        position: [1, 2], // Missing z component
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      } as ITransformData;

      expect(() => TransformComponent.validate(invalidData)).toThrow();
    });

    it('should reject non-numeric values', () => {
      const invalidData = {
        position: [1, 'invalid', 3],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      } as unknown as ITransformData;

      expect(() => TransformComponent.validate(invalidData)).toThrow();
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        position: [1, 2, 3],
        // Missing rotation and scale
      } as unknown as ITransformData;

      expect(() => TransformComponent.validate(invalidData)).toThrow();
    });
  });

  describe('fromBitECS conversion', () => {
    it('should convert from BitECS format correctly', () => {
      const bitECSData = {
        x: 1,
        y: 2,
        z: 3,
        rx: 90,
        ry: 0,
        rz: 45,
        sx: 2,
        sy: 2,
        sz: 2,
      };

      const result = TransformComponent.fromBitECS(bitECSData);

      expect(result).toEqual({
        position: [1, 2, 3],
        rotation: [90, 0, 45],
        scale: [2, 2, 2],
      });
    });

    it('should handle partial BitECS data with defaults', () => {
      const bitECSData = {
        x: 1,
        y: 2,
        z: 3,
        // Missing rotation and scale values
      };

      const result = TransformComponent.fromBitECS(bitECSData);

      expect(result).toEqual({
        position: [1, 2, 3],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });
    });
  });

  describe('toBitECS conversion', () => {
    it('should convert to BitECS format correctly', () => {
      const transformData: ITransformData = {
        position: [1, 2, 3],
        rotation: [90, 0, 45],
        scale: [2, 2, 2],
      };

      const result = TransformComponent.toBitECS(transformData);

      expect(result).toEqual({
        x: 1,
        y: 2,
        z: 3,
        rx: 90,
        ry: 0,
        rz: 45,
        sx: 2,
        sy: 2,
        sz: 2,
      });
    });

    it('should handle edge case values', () => {
      const transformData: ITransformData = {
        position: [0, -1, 100],
        rotation: [-90, 180, 270],
        scale: [0.5, 0.1, 10],
      };

      const result = TransformComponent.toBitECS(transformData);

      expect(result).toEqual({
        x: 0,
        y: -1,
        z: 100,
        rx: -90,
        ry: 180,
        rz: 270,
        sx: 0.5,
        sy: 0.1,
        sz: 10,
      });
    });
  });

  describe('component type', () => {
    it('should have correct component type', () => {
      expect(TransformComponent.componentType).toBe(KnownComponentTypes.TRANSFORM);
    });
  });
});
