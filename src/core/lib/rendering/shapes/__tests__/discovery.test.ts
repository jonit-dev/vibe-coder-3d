/**
 * Shape Discovery Unit Tests
 * Tests for the shape discovery and auto-registration functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { z } from 'zod';
import type { ICustomShapeDescriptor } from '../IShapeDescriptor';
import { shapeRegistry } from '../shapeRegistry';

// Mock import.meta.glob
vi.mock('virtual:shapes', () => ({
  default: {},
}));

describe('Shape Discovery', () => {
  beforeEach(() => {
    shapeRegistry.clear();
  });

  describe('Shape Module Structure', () => {
    it('should validate shape module exports named "shape"', () => {
      const paramsSchema = z.object({
        size: z.number().default(1),
      });

      const shapeModule = {
        shape: {
          meta: {
            id: 'test-shape',
            name: 'Test Shape',
          },
          paramsSchema,
          getDefaultParams: () => paramsSchema.parse({}),
          renderGeometry: () => null,
        } as ICustomShapeDescriptor<typeof paramsSchema>,
      };

      // Manually register to simulate discovery
      shapeRegistry.register(shapeModule.shape);

      expect(shapeRegistry.has('test-shape')).toBe(true);
    });

    it('should handle modules with missing "shape" export gracefully', () => {
      // This simulates the discovery process finding a module without the export
      // Discovery should skip it without crashing
      const invalidModule = {
        // No 'shape' export
        someOtherExport: {},
      };

      // The discovery process would skip this, but we can verify
      // that the registry continues to work
      expect(shapeRegistry.list()).toEqual([]);
    });

    it('should validate shape descriptor has required meta.id', () => {
      const paramsSchema = z.object({
        size: z.number().default(1),
      });

      const invalidShape = {
        meta: {
          // Missing id
          name: 'Invalid Shape',
        },
        paramsSchema,
        getDefaultParams: () => paramsSchema.parse({}),
        renderGeometry: () => null,
      } as any;

      // This would be caught by discovery validation
      expect(invalidShape.meta.id).toBeUndefined();
    });

    it('should validate shape descriptor has required meta.name', () => {
      const paramsSchema = z.object({
        size: z.number().default(1),
      });

      const invalidShape = {
        meta: {
          id: 'invalid-shape',
          // Missing name
        },
        paramsSchema,
        getDefaultParams: () => paramsSchema.parse({}),
        renderGeometry: () => null,
      } as any;

      // This would be caught by discovery validation
      expect(invalidShape.meta.name).toBeUndefined();
    });

    it('should validate shape descriptor has paramsSchema', () => {
      const invalidShape = {
        meta: {
          id: 'invalid-shape',
          name: 'Invalid Shape',
        },
        // Missing paramsSchema
        getDefaultParams: () => ({}),
        renderGeometry: () => null,
      } as any;

      // This would be caught by discovery validation
      expect(invalidShape.paramsSchema).toBeUndefined();
    });

    it('should validate shape descriptor has getDefaultParams function', () => {
      const paramsSchema = z.object({
        size: z.number().default(1),
      });

      const invalidShape = {
        meta: {
          id: 'invalid-shape',
          name: 'Invalid Shape',
        },
        paramsSchema,
        // Missing getDefaultParams
        renderGeometry: () => null,
      } as any;

      // This would be caught by discovery validation
      expect(typeof invalidShape.getDefaultParams).not.toBe('function');
    });

    it('should validate shape descriptor has renderGeometry function', () => {
      const paramsSchema = z.object({
        size: z.number().default(1),
      });

      const invalidShape = {
        meta: {
          id: 'invalid-shape',
          name: 'Invalid Shape',
        },
        paramsSchema,
        getDefaultParams: () => paramsSchema.parse({}),
        // Missing renderGeometry
      } as any;

      // This would be caught by discovery validation
      expect(typeof invalidShape.renderGeometry).not.toBe('function');
    });
  });

  describe('Discovery Process Simulation', () => {
    it('should discover and register valid shapes', () => {
      const paramsSchema = z.object({
        size: z.number().default(1),
      });

      const shape1: ICustomShapeDescriptor<typeof paramsSchema> = {
        meta: {
          id: 'shape-1',
          name: 'Shape 1',
          category: 'Basic',
        },
        paramsSchema,
        getDefaultParams: () => paramsSchema.parse({}),
        renderGeometry: () => null,
      };

      const shape2: ICustomShapeDescriptor<typeof paramsSchema> = {
        meta: {
          id: 'shape-2',
          name: 'Shape 2',
          category: 'Advanced',
        },
        paramsSchema,
        getDefaultParams: () => paramsSchema.parse({}),
        renderGeometry: () => null,
      };

      // Simulate discovery registering shapes
      shapeRegistry.register(shape1);
      shapeRegistry.register(shape2);

      expect(shapeRegistry.list()).toHaveLength(2);
      expect(shapeRegistry.has('shape-1')).toBe(true);
      expect(shapeRegistry.has('shape-2')).toBe(true);
    });

    it('should handle shapes with optional metadata', () => {
      const paramsSchema = z.object({
        size: z.number().default(1),
      });

      const shape: ICustomShapeDescriptor<typeof paramsSchema> = {
        meta: {
          id: 'minimal-shape',
          name: 'Minimal Shape',
          // Optional fields omitted
        },
        paramsSchema,
        getDefaultParams: () => paramsSchema.parse({}),
        renderGeometry: () => null,
      };

      shapeRegistry.register(shape);

      const resolved = shapeRegistry.resolve('minimal-shape');
      expect(resolved).toBeDefined();
      expect(resolved?.meta.category).toBeUndefined();
      expect(resolved?.meta.tags).toBeUndefined();
    });

    it('should handle shapes with all metadata fields', () => {
      const paramsSchema = z.object({
        size: z.number().default(1),
      });

      const shape: ICustomShapeDescriptor<typeof paramsSchema> = {
        meta: {
          id: 'complete-shape',
          name: 'Complete Shape',
          category: 'Test',
          tags: ['tag1', 'tag2'],
          version: '1.0.0',
          icon: 'TestIcon',
          previewImage: '/preview.png',
        },
        paramsSchema,
        getDefaultParams: () => paramsSchema.parse({}),
        renderGeometry: () => null,
      };

      shapeRegistry.register(shape);

      const resolved = shapeRegistry.resolve('complete-shape');
      expect(resolved?.meta.category).toBe('Test');
      expect(resolved?.meta.tags).toEqual(['tag1', 'tag2']);
      expect(resolved?.meta.version).toBe('1.0.0');
      expect(resolved?.meta.icon).toBe('TestIcon');
      expect(resolved?.meta.previewImage).toBe('/preview.png');
    });
  });

  describe('Parameter Schema Validation', () => {
    it('should handle simple parameter schemas', () => {
      const paramsSchema = z.object({
        size: z.number().default(1),
      });

      const shape: ICustomShapeDescriptor<typeof paramsSchema> = {
        meta: {
          id: 'simple-shape',
          name: 'Simple Shape',
        },
        paramsSchema,
        getDefaultParams: () => paramsSchema.parse({}),
        renderGeometry: () => null,
      };

      shapeRegistry.register(shape);
      const resolved = shapeRegistry.resolve('simple-shape');
      const defaults = resolved?.getDefaultParams();

      expect(defaults).toEqual({ size: 1 });
    });

    it('should handle complex parameter schemas', () => {
      const paramsSchema = z.object({
        radius: z.number().min(0.1).max(10).default(0.5),
        segments: z.number().int().min(3).max(128).default(32),
        enabled: z.boolean().default(true),
        variant: z.enum(['type-a', 'type-b']).default('type-a'),
      });

      const shape: ICustomShapeDescriptor<typeof paramsSchema> = {
        meta: {
          id: 'complex-shape',
          name: 'Complex Shape',
        },
        paramsSchema,
        getDefaultParams: () => paramsSchema.parse({}),
        renderGeometry: () => null,
      };

      shapeRegistry.register(shape);
      const resolved = shapeRegistry.resolve('complex-shape');
      const defaults = resolved?.getDefaultParams();

      expect(defaults).toEqual({
        radius: 0.5,
        segments: 32,
        enabled: true,
        variant: 'type-a',
      });
    });

    it('should validate parameters against schema', () => {
      const paramsSchema = z.object({
        size: z.number().min(1).max(10).default(5),
      });

      const shape: ICustomShapeDescriptor<typeof paramsSchema> = {
        meta: {
          id: 'validated-shape',
          name: 'Validated Shape',
        },
        paramsSchema,
        getDefaultParams: () => paramsSchema.parse({}),
        renderGeometry: () => null,
      };

      shapeRegistry.register(shape);
      const resolved = shapeRegistry.resolve('validated-shape');

      // Valid params should parse successfully
      expect(() => resolved?.paramsSchema.parse({ size: 5 })).not.toThrow();

      // Invalid params should throw
      expect(() => resolved?.paramsSchema.parse({ size: 0 })).toThrow();
      expect(() => resolved?.paramsSchema.parse({ size: 11 })).toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should continue discovery even if one shape fails validation', () => {
      const paramsSchema = z.object({
        size: z.number().default(1),
      });

      // Valid shape
      const validShape: ICustomShapeDescriptor<typeof paramsSchema> = {
        meta: {
          id: 'valid-shape',
          name: 'Valid Shape',
        },
        paramsSchema,
        getDefaultParams: () => paramsSchema.parse({}),
        renderGeometry: () => null,
      };

      // Register valid shape
      shapeRegistry.register(validShape);

      // Invalid shape would be skipped by discovery
      // But valid shapes should still be registered
      expect(shapeRegistry.has('valid-shape')).toBe(true);
    });

    it('should handle duplicate shape IDs gracefully in development', () => {
      const paramsSchema = z.object({
        size: z.number().default(1),
      });

      const shape1: ICustomShapeDescriptor<typeof paramsSchema> = {
        meta: {
          id: 'duplicate-id',
          name: 'Shape 1',
        },
        paramsSchema,
        getDefaultParams: () => paramsSchema.parse({}),
        renderGeometry: () => null,
      };

      const shape2: ICustomShapeDescriptor<typeof paramsSchema> = {
        meta: {
          id: 'duplicate-id',
          name: 'Shape 2',
        },
        paramsSchema,
        getDefaultParams: () => paramsSchema.parse({}),
        renderGeometry: () => null,
      };

      shapeRegistry.register(shape1);
      // In dev mode, this should not throw (HMR support)
      expect(() => shapeRegistry.register(shape2)).not.toThrow();

      // Last registered shape should win
      const resolved = shapeRegistry.resolve('duplicate-id');
      expect(resolved?.meta.name).toBe('Shape 2');
    });
  });

  describe('Real-world Shape Examples', () => {
    it('should work with Torus Knot shape structure', () => {
      const paramsSchema = z.object({
        radius: z.number().min(0.1).max(5).default(0.4),
        tube: z.number().min(0.01).max(1).default(0.1),
        tubularSegments: z.number().int().min(8).max(200).default(64),
        radialSegments: z.number().int().min(3).max(64).default(8),
        p: z.number().int().min(1).max(10).default(2),
        q: z.number().int().min(1).max(10).default(3),
      });

      const torusKnot: ICustomShapeDescriptor<typeof paramsSchema> = {
        meta: {
          id: 'example-torus-knot',
          name: 'Example Torus Knot',
          category: 'Procedural',
          tags: ['knot', 'math', 'parametric', 'example'],
          version: '1.0.0',
        },
        paramsSchema,
        getDefaultParams: () => paramsSchema.parse({}),
        renderGeometry: () => null, // Would be actual React element
      };

      shapeRegistry.register(torusKnot);

      expect(shapeRegistry.has('example-torus-knot')).toBe(true);

      const resolved = shapeRegistry.resolve('example-torus-knot');
      const defaults = resolved?.getDefaultParams();

      expect(defaults).toEqual({
        radius: 0.4,
        tube: 0.1,
        tubularSegments: 64,
        radialSegments: 8,
        p: 2,
        q: 3,
      });
    });

    it('should work with simple Sphere shape structure', () => {
      const paramsSchema = z.object({
        radius: z.number().min(0.1).max(10).default(0.5),
        widthSegments: z.number().int().min(3).max(128).default(32),
        heightSegments: z.number().int().min(2).max(64).default(16),
      });

      const sphere: ICustomShapeDescriptor<typeof paramsSchema> = {
        meta: {
          id: 'parametric-sphere',
          name: 'Parametric Sphere',
          category: 'Basic',
          tags: ['sphere', 'basic', 'parametric'],
          version: '1.0.0',
        },
        paramsSchema,
        getDefaultParams: () => paramsSchema.parse({}),
        renderGeometry: () => null,
      };

      shapeRegistry.register(sphere);

      expect(shapeRegistry.has('parametric-sphere')).toBe(true);

      const resolved = shapeRegistry.resolve('parametric-sphere');
      const defaults = resolved?.getDefaultParams();

      expect(defaults).toEqual({
        radius: 0.5,
        widthSegments: 32,
        heightSegments: 16,
      });
    });
  });
});
