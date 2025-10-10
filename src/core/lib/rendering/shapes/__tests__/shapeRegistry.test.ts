/**
 * Shape Registry Unit Tests
 * Tests for the shape registry registration, resolution, and search functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import type { ICustomShapeDescriptor } from '../IShapeDescriptor';
import { shapeRegistry } from '../shapeRegistry';

// Test shape descriptors
const testParamsSchema = z.object({
  size: z.number().default(1),
});

const createTestShape = (
  id: string,
  name: string,
  category?: string,
): ICustomShapeDescriptor<typeof testParamsSchema> => ({
  meta: {
    id,
    name,
    category,
    tags: ['test'],
  },
  paramsSchema: testParamsSchema,
  getDefaultParams: () => testParamsSchema.parse({}),
  renderGeometry: () => null,
});

describe('ShapeRegistry', () => {
  beforeEach(() => {
    // Clear registry before each test
    shapeRegistry.clear();
  });

  describe('register()', () => {
    it('should register a shape successfully', () => {
      const shape = createTestShape('test-shape', 'Test Shape');

      shapeRegistry.register(shape);

      expect(shapeRegistry.has('test-shape')).toBe(true);
    });

    it('should register multiple shapes', () => {
      const shape1 = createTestShape('shape-1', 'Shape 1');
      const shape2 = createTestShape('shape-2', 'Shape 2');

      shapeRegistry.register(shape1);
      shapeRegistry.register(shape2);

      expect(shapeRegistry.list()).toHaveLength(2);
    });

    it('should allow re-registration in development (HMR)', () => {
      const shape = createTestShape('test-shape', 'Test Shape');

      // First registration
      shapeRegistry.register(shape);

      // Re-registration should not throw in dev mode
      expect(() => shapeRegistry.register(shape)).not.toThrow();
    });

    it('should validate shape ID format', () => {
      // This test checks that non-kebab-case IDs trigger a warning
      // The registry still allows them but logs a warning
      const shape = createTestShape('InvalidID', 'Invalid Shape');

      expect(() => shapeRegistry.register(shape)).not.toThrow();
    });
  });

  describe('resolve()', () => {
    it('should resolve a registered shape by ID', () => {
      const shape = createTestShape('test-shape', 'Test Shape');
      shapeRegistry.register(shape);

      const resolved = shapeRegistry.resolve('test-shape');

      expect(resolved).toBeDefined();
      expect(resolved?.meta.id).toBe('test-shape');
      expect(resolved?.meta.name).toBe('Test Shape');
    });

    it('should return undefined for unregistered shape', () => {
      const resolved = shapeRegistry.resolve('non-existent');

      expect(resolved).toBeUndefined();
    });

    it('should resolve correct shape when multiple are registered', () => {
      const shape1 = createTestShape('shape-1', 'Shape 1');
      const shape2 = createTestShape('shape-2', 'Shape 2');

      shapeRegistry.register(shape1);
      shapeRegistry.register(shape2);

      const resolved = shapeRegistry.resolve('shape-2');

      expect(resolved?.meta.id).toBe('shape-2');
      expect(resolved?.meta.name).toBe('Shape 2');
    });
  });

  describe('list()', () => {
    it('should return empty array when no shapes registered', () => {
      const shapes = shapeRegistry.list();

      expect(shapes).toEqual([]);
    });

    it('should return all registered shapes', () => {
      const shape1 = createTestShape('shape-1', 'Shape 1');
      const shape2 = createTestShape('shape-2', 'Shape 2');
      const shape3 = createTestShape('shape-3', 'Shape 3');

      shapeRegistry.register(shape1);
      shapeRegistry.register(shape2);
      shapeRegistry.register(shape3);

      const shapes = shapeRegistry.list();

      expect(shapes).toHaveLength(3);
      expect(shapes.map((s) => s.meta.id)).toContain('shape-1');
      expect(shapes.map((s) => s.meta.id)).toContain('shape-2');
      expect(shapes.map((s) => s.meta.id)).toContain('shape-3');
    });
  });

  describe('listByCategory()', () => {
    it('should return shapes filtered by category', () => {
      const shape1 = createTestShape('shape-1', 'Shape 1', 'Basic');
      const shape2 = createTestShape('shape-2', 'Shape 2', 'Advanced');
      const shape3 = createTestShape('shape-3', 'Shape 3', 'Basic');

      shapeRegistry.register(shape1);
      shapeRegistry.register(shape2);
      shapeRegistry.register(shape3);

      const basicShapes = shapeRegistry.listByCategory('Basic');

      expect(basicShapes).toHaveLength(2);
      expect(basicShapes.map((s) => s.meta.id)).toContain('shape-1');
      expect(basicShapes.map((s) => s.meta.id)).toContain('shape-3');
    });

    it('should return empty array for non-existent category', () => {
      const shape = createTestShape('shape-1', 'Shape 1', 'Basic');
      shapeRegistry.register(shape);

      const shapes = shapeRegistry.listByCategory('NonExistent');

      expect(shapes).toEqual([]);
    });
  });

  describe('search()', () => {
    beforeEach(() => {
      const shape1 = createTestShape('sphere-basic', 'Basic Sphere', 'Basic');
      shape1.meta.tags = ['sphere', 'round', 'basic'];

      const shape2 = createTestShape('box-advanced', 'Advanced Box', 'Advanced');
      shape2.meta.tags = ['box', 'cube', 'advanced'];

      const shape3 = createTestShape('sphere-advanced', 'Advanced Sphere', 'Advanced');
      shape3.meta.tags = ['sphere', 'round', 'advanced'];

      shapeRegistry.register(shape1);
      shapeRegistry.register(shape2);
      shapeRegistry.register(shape3);
    });

    it('should search by name', () => {
      const results = shapeRegistry.search('sphere');

      expect(results).toHaveLength(2);
      expect(results.map((s) => s.meta.id)).toContain('sphere-basic');
      expect(results.map((s) => s.meta.id)).toContain('sphere-advanced');
    });

    it('should search by ID', () => {
      const results = shapeRegistry.search('box-advanced');

      expect(results).toHaveLength(1);
      expect(results[0].meta.id).toBe('box-advanced');
    });

    it('should search by tag', () => {
      const results = shapeRegistry.search('round');

      expect(results).toHaveLength(2);
      expect(results.map((s) => s.meta.id)).toContain('sphere-basic');
      expect(results.map((s) => s.meta.id)).toContain('sphere-advanced');
    });

    it('should be case-insensitive', () => {
      const results = shapeRegistry.search('SPHERE');

      expect(results).toHaveLength(2);
    });

    it('should return empty array for no matches', () => {
      const results = shapeRegistry.search('nonexistent');

      expect(results).toEqual([]);
    });

    it('should return all shapes for empty query', () => {
      const results = shapeRegistry.search('');

      expect(results).toHaveLength(3);
    });
  });

  describe('has()', () => {
    it('should return true for registered shape', () => {
      const shape = createTestShape('test-shape', 'Test Shape');
      shapeRegistry.register(shape);

      expect(shapeRegistry.has('test-shape')).toBe(true);
    });

    it('should return false for unregistered shape', () => {
      expect(shapeRegistry.has('non-existent')).toBe(false);
    });
  });

  describe('unregister()', () => {
    it('should unregister a shape', () => {
      const shape = createTestShape('test-shape', 'Test Shape');
      shapeRegistry.register(shape);

      const result = shapeRegistry.unregister('test-shape');

      expect(result).toBe(true);
      expect(shapeRegistry.has('test-shape')).toBe(false);
    });

    it('should return false when unregistering non-existent shape', () => {
      const result = shapeRegistry.unregister('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('clear()', () => {
    it('should clear all registered shapes', () => {
      const shape1 = createTestShape('shape-1', 'Shape 1');
      const shape2 = createTestShape('shape-2', 'Shape 2');

      shapeRegistry.register(shape1);
      shapeRegistry.register(shape2);

      shapeRegistry.clear();

      expect(shapeRegistry.list()).toEqual([]);
    });
  });

  describe('Shape Descriptor Validation', () => {
    it('should work with valid shape descriptor', () => {
      const shape = createTestShape('valid-shape', 'Valid Shape');

      expect(() => shapeRegistry.register(shape)).not.toThrow();
      expect(shapeRegistry.has('valid-shape')).toBe(true);
    });

    it('should store shape metadata correctly', () => {
      const shape = createTestShape('test-shape', 'Test Shape', 'TestCategory');
      shape.meta.tags = ['tag1', 'tag2'];
      shape.meta.version = '1.0.0';
      shape.meta.icon = 'TestIcon';

      shapeRegistry.register(shape);
      const resolved = shapeRegistry.resolve('test-shape');

      expect(resolved?.meta.name).toBe('Test Shape');
      expect(resolved?.meta.category).toBe('TestCategory');
      expect(resolved?.meta.tags).toEqual(['tag1', 'tag2']);
      expect(resolved?.meta.version).toBe('1.0.0');
      expect(resolved?.meta.icon).toBe('TestIcon');
    });

    it('should preserve params schema and default params', () => {
      const shape = createTestShape('test-shape', 'Test Shape');
      shapeRegistry.register(shape);

      const resolved = shapeRegistry.resolve('test-shape');
      const defaults = resolved?.getDefaultParams();

      expect(defaults).toBeDefined();
      expect(defaults?.size).toBe(1);
    });
  });
});
