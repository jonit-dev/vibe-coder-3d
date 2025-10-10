/**
 * Tests for CRUD type schemas
 */

import { describe, it, expect } from 'vitest';
import {
  PrimitiveOptionsSchema,
  ModelOptionsSchema,
  CloneOverridesSchema,
  TransformOptionsSchema,
  MaterialOptionsSchema,
  PhysicsOptionsSchema,
} from '../crud.types';

describe('CRUD Type Schemas', () => {
  describe('TransformOptionsSchema', () => {
    it('should validate valid transform options', () => {
      const valid = {
        position: [1, 2, 3] as [number, number, number],
        rotation: [0, 45, 0] as [number, number, number],
        scale: [1, 1, 1] as [number, number, number],
      };

      expect(() => TransformOptionsSchema.parse(valid)).not.toThrow();
    });

    it('should accept uniform scale as number', () => {
      const valid = { scale: 2 };
      expect(() => TransformOptionsSchema.parse(valid)).not.toThrow();
    });

    it('should reject invalid position tuple', () => {
      const invalid = { position: [1, 2] }; // Missing third element
      expect(() => TransformOptionsSchema.parse(invalid)).toThrow();
    });
  });

  describe('MaterialOptionsSchema', () => {
    it('should validate valid material options', () => {
      const valid = {
        color: '#ff0000',
        metalness: 0.5,
        roughness: 0.7,
      };

      expect(() => MaterialOptionsSchema.parse(valid)).not.toThrow();
    });

    it('should reject metalness out of range', () => {
      const invalid = { metalness: 1.5 }; // > 1
      expect(() => MaterialOptionsSchema.parse(invalid)).toThrow();
    });

    it('should reject negative roughness', () => {
      const invalid = { roughness: -0.1 };
      expect(() => MaterialOptionsSchema.parse(invalid)).toThrow();
    });
  });

  describe('PhysicsOptionsSchema', () => {
    it('should validate valid physics options', () => {
      const valid = {
        body: 'dynamic' as const,
        collider: 'box' as const,
        mass: 1.5,
      };

      expect(() => PhysicsOptionsSchema.parse(valid)).not.toThrow();
    });

    it('should reject invalid body type', () => {
      const invalid = { body: 'invalid' };
      expect(() => PhysicsOptionsSchema.parse(invalid)).toThrow();
    });

    it('should reject negative mass', () => {
      const invalid = { mass: -1 };
      expect(() => PhysicsOptionsSchema.parse(invalid)).toThrow();
    });

    it('should reject zero mass', () => {
      const invalid = { mass: 0 };
      expect(() => PhysicsOptionsSchema.parse(invalid)).toThrow();
    });
  });

  describe('PrimitiveOptionsSchema', () => {
    it('should validate complete primitive options', () => {
      const valid = {
        name: 'TestCube',
        parent: 123,
        transform: {
          position: [0, 5, 0] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          scale: 1.5,
        },
        material: {
          color: '#44ccff',
          metalness: 0.2,
          roughness: 0.6,
        },
        physics: {
          body: 'dynamic' as const,
          collider: 'box' as const,
          mass: 2,
        },
      };

      expect(() => PrimitiveOptionsSchema.parse(valid)).not.toThrow();
    });

    it('should accept empty options', () => {
      expect(() => PrimitiveOptionsSchema.parse({})).not.toThrow();
    });

    it('should accept partial options', () => {
      const partial = {
        name: 'PartialCube',
        material: { color: '#ff0000' },
      };

      expect(() => PrimitiveOptionsSchema.parse(partial)).not.toThrow();
    });

    it('should reject negative parent ID', () => {
      const invalid = { parent: -1 };
      expect(() => PrimitiveOptionsSchema.parse(invalid)).toThrow();
    });
  });

  describe('ModelOptionsSchema', () => {
    it('should validate valid model options', () => {
      const valid = {
        name: 'TestModel',
        transform: { position: [0, 0, 0] as [number, number, number] },
        physics: {
          body: 'static' as const,
          collider: 'mesh' as const,
        },
      };

      expect(() => ModelOptionsSchema.parse(valid)).not.toThrow();
    });

    it('should allow mesh collider for models', () => {
      const valid = {
        physics: { collider: 'mesh' as const },
      };

      expect(() => ModelOptionsSchema.parse(valid)).not.toThrow();
    });

    it('should allow box collider for models', () => {
      const valid = {
        physics: { collider: 'box' as const },
      };

      expect(() => ModelOptionsSchema.parse(valid)).not.toThrow();
    });
  });

  describe('CloneOverridesSchema', () => {
    it('should validate valid clone overrides', () => {
      const valid = {
        name: 'Clone',
        parent: 456,
        transform: {
          position: [5, 0, 0] as [number, number, number],
        },
      };

      expect(() => CloneOverridesSchema.parse(valid)).not.toThrow();
    });

    it('should accept empty overrides', () => {
      expect(() => CloneOverridesSchema.parse({})).not.toThrow();
    });

    it('should accept partial overrides', () => {
      const partial = { name: 'NewName' };
      expect(() => CloneOverridesSchema.parse(partial)).not.toThrow();
    });
  });
});
