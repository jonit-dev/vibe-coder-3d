/**
 * Custom Shape Creation Integration Tests
 * Tests the end-to-end flow of creating custom shapes
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import type { ICustomShapeDescriptor } from '@/core/lib/rendering/shapes/IShapeDescriptor';
import { shapeRegistry } from '@/core/lib/rendering/shapes/shapeRegistry';

describe('Custom Shape Creation Integration', () => {
  beforeEach(() => {
    // Clear registry before each test
    shapeRegistry.clear();
  });

  describe('End-to-End Shape Flow', () => {
    it('should complete full lifecycle: register -> resolve -> create', () => {
      // 1. Define a shape
      const paramsSchema = z.object({
        radius: z.number().default(0.5),
        segments: z.number().int().default(32),
      });

      const testShape: ICustomShapeDescriptor<typeof paramsSchema> = {
        meta: {
          id: 'test-sphere',
          name: 'Test Sphere',
          category: 'Test',
        },
        paramsSchema,
        getDefaultParams: () => paramsSchema.parse({}),
        renderGeometry: () => null,
      };

      // 2. Register the shape (simulates discovery)
      shapeRegistry.register(testShape);

      // 3. Verify registration
      expect(shapeRegistry.has('test-sphere')).toBe(true);

      // 4. Resolve the shape (simulates createCustomShape lookup)
      const resolved = shapeRegistry.resolve('test-sphere');
      expect(resolved).toBeDefined();
      expect(resolved?.meta.id).toBe('test-sphere');

      // 5. Get default params (simulates entity creation)
      const params = resolved?.getDefaultParams();
      expect(params).toEqual({
        radius: 0.5,
        segments: 32,
      });

      // 6. Simulate creating an entity with CustomShape component
      const entityData = {
        shapeId: resolved!.meta.id,
        params: params,
      };

      expect(entityData.shapeId).toBe('test-sphere');
      expect(entityData.params).toEqual({
        radius: 0.5,
        segments: 32,
      });
    });

    it('should handle shape creation with custom params', () => {
      const paramsSchema = z.object({
        radius: z.number().min(0.1).max(10).default(0.5),
        segments: z.number().int().min(3).max(128).default(32),
      });

      const shape: ICustomShapeDescriptor<typeof paramsSchema> = {
        meta: {
          id: 'custom-sphere',
          name: 'Custom Sphere',
        },
        paramsSchema,
        getDefaultParams: () => paramsSchema.parse({}),
        renderGeometry: () => null,
      };

      shapeRegistry.register(shape);

      // Simulate user providing custom params
      const customParams = {
        radius: 2.0,
        segments: 64,
      };

      // Validate custom params
      const validated = shape.paramsSchema.parse(customParams);
      expect(validated).toEqual(customParams);

      // Create entity data
      const entityData = {
        shapeId: 'custom-sphere',
        params: validated,
      };

      expect(entityData.params.radius).toBe(2.0);
      expect(entityData.params.segments).toBe(64);
    });

    it('should handle invalid params gracefully', () => {
      const paramsSchema = z.object({
        radius: z.number().min(0.1).max(10).default(0.5),
      });

      const shape: ICustomShapeDescriptor<typeof paramsSchema> = {
        meta: {
          id: 'validated-sphere',
          name: 'Validated Sphere',
        },
        paramsSchema,
        getDefaultParams: () => paramsSchema.parse({}),
        renderGeometry: () => null,
      };

      shapeRegistry.register(shape);

      // Try to create with invalid params
      const invalidParams = {
        radius: 100, // Exceeds max of 10
      };

      // Should throw validation error
      expect(() => shape.paramsSchema.parse(invalidParams)).toThrow();

      // Should fall back to defaults
      const defaults = shape.getDefaultParams();
      expect(defaults.radius).toBe(0.5);
    });
  });

  describe('Multi-Shape Scenarios', () => {
    it('should handle multiple shapes independently', () => {
      // Register multiple shapes
      const sphere = createTestShape('sphere', 'Sphere', { radius: 0.5 });
      const box = createTestShape('box', 'Box', { size: 1.0 });
      const cylinder = createTestShape('cylinder', 'Cylinder', { radius: 0.5, height: 2.0 });

      shapeRegistry.register(sphere);
      shapeRegistry.register(box);
      shapeRegistry.register(cylinder);

      // Verify all are registered
      expect(shapeRegistry.list()).toHaveLength(3);

      // Create entities with different shapes
      const sphereEntity = {
        shapeId: 'sphere',
        params: sphere.getDefaultParams(),
      };

      const boxEntity = {
        shapeId: 'box',
        params: box.getDefaultParams(),
      };

      const cylinderEntity = {
        shapeId: 'cylinder',
        params: cylinder.getDefaultParams(),
      };

      // Verify each has correct params
      expect(sphereEntity.params).toHaveProperty('radius');
      expect(boxEntity.params).toHaveProperty('size');
      expect(cylinderEntity.params).toHaveProperty('height');
    });

    it('should handle shape updates (HMR scenario)', () => {
      // Original shape
      const original = createTestShape('updatable-shape', 'Original', { size: 1 });
      shapeRegistry.register(original);

      const entity1 = {
        shapeId: 'updatable-shape',
        params: original.getDefaultParams(),
      };

      expect(entity1.params).toEqual({ size: 1 });

      // Updated shape (simulates HMR)
      const updated = createTestShape('updatable-shape', 'Updated', { size: 2 });
      shapeRegistry.register(updated);

      // New entities should use new defaults
      const resolved = shapeRegistry.resolve('updatable-shape');
      const entity2 = {
        shapeId: 'updatable-shape',
        params: resolved?.getDefaultParams(),
      };

      expect(entity2.params).toEqual({ size: 2 });
    });
  });

  describe('Error Recovery', () => {
    it('should handle missing shape gracefully', () => {
      // Try to resolve non-existent shape
      const resolved = shapeRegistry.resolve('non-existent-shape');

      expect(resolved).toBeUndefined();

      // Application should handle this by:
      // 1. Logging a warning
      // 2. Either skipping rendering or using a fallback
    });

    it('should handle corrupted params', () => {
      const paramsSchema = z.object({
        radius: z.number().default(0.5),
      });

      const shape: ICustomShapeDescriptor<typeof paramsSchema> = {
        meta: {
          id: 'robust-shape',
          name: 'Robust Shape',
        },
        paramsSchema,
        getDefaultParams: () => paramsSchema.parse({}),
        renderGeometry: () => null,
      };

      shapeRegistry.register(shape);

      // Corrupted params (wrong type)
      const corruptedParams = {
        radius: 'not-a-number', // Should be number
      };

      // Validation should fail
      const result = shape.paramsSchema.safeParse(corruptedParams);
      expect(result.success).toBe(false);

      // Should fall back to defaults
      const defaults = shape.getDefaultParams();
      expect(defaults.radius).toBe(0.5);
    });
  });

  describe('Real-world Shape Examples', () => {
    it('should handle Torus Knot creation flow', () => {
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
          tags: ['knot', 'math', 'parametric'],
        },
        paramsSchema,
        getDefaultParams: () => paramsSchema.parse({}),
        renderGeometry: () => null,
      };

      // Register
      shapeRegistry.register(torusKnot);

      // Resolve
      const resolved = shapeRegistry.resolve('example-torus-knot');
      expect(resolved).toBeDefined();

      // Create with defaults
      const defaultEntity = {
        name: 'Torus Knot 0',
        shapeId: 'example-torus-knot',
        params: resolved!.getDefaultParams(),
      };

      expect(defaultEntity.params).toEqual({
        radius: 0.4,
        tube: 0.1,
        tubularSegments: 64,
        radialSegments: 8,
        p: 2,
        q: 3,
      });

      // Create with custom params
      const customEntity = {
        name: 'Torus Knot 1',
        shapeId: 'example-torus-knot',
        params: paramsSchema.parse({
          radius: 0.6,
          tube: 0.15,
          p: 3,
          q: 5,
        }),
      };

      expect(customEntity.params.p).toBe(3);
      expect(customEntity.params.q).toBe(5);
    });

    it('should handle Parametric Sphere creation flow', () => {
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
        },
        paramsSchema,
        getDefaultParams: () => paramsSchema.parse({}),
        renderGeometry: () => null,
      };

      // Register
      shapeRegistry.register(sphere);

      // Create multiple instances
      const entities = [];
      for (let i = 0; i < 3; i++) {
        entities.push({
          name: `Sphere ${i}`,
          shapeId: 'parametric-sphere',
          params: paramsSchema.parse({
            radius: 0.5 + i * 0.5,
            widthSegments: 32,
            heightSegments: 16,
          }),
        });
      }

      expect(entities).toHaveLength(3);
      expect(entities[0].params.radius).toBe(0.5);
      expect(entities[1].params.radius).toBe(1.0);
      expect(entities[2].params.radius).toBe(1.5);
    });
  });

  describe('Category and Search Integration', () => {
    beforeEach(() => {
      // Register shapes in different categories
      const basic1 = createTestShape('sphere', 'Sphere', { radius: 0.5 }, 'Basic');
      const basic2 = createTestShape('box', 'Box', { size: 1 }, 'Basic');
      const advanced1 = createTestShape('torus', 'Torus', { radius: 0.5 }, 'Advanced');
      const advanced2 = createTestShape('knot', 'Knot', { p: 2, q: 3 }, 'Advanced');

      shapeRegistry.register(basic1);
      shapeRegistry.register(basic2);
      shapeRegistry.register(advanced1);
      shapeRegistry.register(advanced2);
    });

    it('should list shapes by category for menu grouping', () => {
      const basicShapes = shapeRegistry.listByCategory('Basic');
      const advancedShapes = shapeRegistry.listByCategory('Advanced');

      expect(basicShapes).toHaveLength(2);
      expect(advancedShapes).toHaveLength(2);

      // Simulate menu item creation
      const basicMenuItems = basicShapes.map((shape) => ({
        id: shape.meta.id,
        label: shape.meta.name,
      }));

      expect(basicMenuItems).toContainEqual({
        id: 'sphere',
        label: 'Sphere',
      });

      expect(basicMenuItems).toContainEqual({
        id: 'box',
        label: 'Box',
      });
    });

    it('should search shapes for filtering', () => {
      // Search by name
      const sphereResults = shapeRegistry.search('sphere');
      expect(sphereResults).toHaveLength(1);

      // Search by category
      const basicResults = shapeRegistry.listByCategory('Basic');
      expect(basicResults).toHaveLength(2);
    });
  });
});

// Helper function to create test shapes
function createTestShape(
  id: string,
  name: string,
  defaultParams: Record<string, unknown>,
  category?: string,
): ICustomShapeDescriptor<any> {
  const keys = Object.keys(defaultParams);
  const schemaShape: Record<string, any> = {};

  keys.forEach((key) => {
    const value = defaultParams[key];
    if (typeof value === 'number') {
      schemaShape[key] = z.number().default(value);
    } else if (typeof value === 'string') {
      schemaShape[key] = z.string().default(value);
    } else {
      schemaShape[key] = z.any().default(value);
    }
  });

  const paramsSchema = z.object(schemaShape);

  return {
    meta: {
      id,
      name,
      category,
    },
    paramsSchema,
    getDefaultParams: () => paramsSchema.parse({}),
    renderGeometry: () => null,
  };
}
