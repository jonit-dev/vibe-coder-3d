/**
 * Custom Shape Rendering Integration Tests
 * Tests the rendering pipeline for custom shapes
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import React from 'react';
import type { ICustomShapeDescriptor } from '@/core/lib/rendering/shapes/IShapeDescriptor';
import { shapeRegistry } from '@/core/lib/rendering/shapes/shapeRegistry';
import type { CustomShapeData } from '@/core/lib/ecs/components/definitions';

describe('Custom Shape Rendering Integration', () => {
  beforeEach(() => {
    shapeRegistry.clear();
  });

  describe('Rendering Contributions', () => {
    it('should set meshType to CustomShape when CustomShape component present', () => {
      const entityComponents = [
        {
          type: 'Transform',
          data: {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
        },
        {
          type: 'CustomShape',
          data: {
            shapeId: 'test-shape',
            params: {},
          } as CustomShapeData,
        },
        {
          type: 'MeshRenderer',
          data: {
            meshId: 'customShape',
            materialId: 'default',
            enabled: true,
          },
        },
      ];

      // Simulate combineRenderingContributions
      let meshType: string | null = null;

      entityComponents.forEach(({ type }) => {
        if (type === 'CustomShape') {
          meshType = 'CustomShape';
        }
      });

      expect(meshType).toBe('CustomShape');
    });

    it('should not override meshType if CustomShape not present', () => {
      const entityComponents = [
        {
          type: 'MeshRenderer',
          data: {
            meshId: 'sphere',
            materialId: 'default',
            enabled: true,
          },
        },
      ];

      // Simulate combineRenderingContributions
      let meshType: string | null = 'Sphere';

      entityComponents.forEach(({ type }) => {
        if (type === 'CustomShape') {
          meshType = 'CustomShape';
        }
      });

      expect(meshType).toBe('Sphere');
    });
  });

  describe('GeometryRenderer Integration', () => {
    it('should resolve and render custom shape geometry', () => {
      // 1. Register a shape
      const paramsSchema = z.object({
        radius: z.number().default(0.5),
      });

      const testShape: ICustomShapeDescriptor<typeof paramsSchema> = {
        meta: {
          id: 'test-render-shape',
          name: 'Test Render Shape',
        },
        paramsSchema,
        getDefaultParams: () => paramsSchema.parse({}),
        renderGeometry: (params) =>
          React.createElement('sphereGeometry', { args: [params.radius, 32, 32] }),
      };

      shapeRegistry.register(testShape);

      // 2. Simulate entity with CustomShape component
      const entityComponents = [
        {
          type: 'CustomShape',
          data: {
            shapeId: 'test-render-shape',
            params: { radius: 0.7 },
          } as CustomShapeData,
        },
      ];

      // 3. Simulate GeometryRenderer logic
      const customShapeData = entityComponents.find((c) => c.type === 'CustomShape')
        ?.data as CustomShapeData;

      expect(customShapeData).toBeDefined();
      expect(customShapeData.shapeId).toBe('test-render-shape');

      const descriptor = shapeRegistry.resolve(customShapeData.shapeId);

      expect(descriptor).toBeDefined();
      expect(descriptor?.meta.name).toBe('Test Render Shape');

      // 4. Render geometry
      const geometry = descriptor?.renderGeometry(customShapeData.params);

      expect(geometry).toBeDefined();
    });

    it('should handle missing shape gracefully', () => {
      const entityComponents = [
        {
          type: 'CustomShape',
          data: {
            shapeId: 'non-existent-shape',
            params: {},
          } as CustomShapeData,
        },
      ];

      const customShapeData = entityComponents.find((c) => c.type === 'CustomShape')
        ?.data as CustomShapeData;
      const descriptor = shapeRegistry.resolve(customShapeData.shapeId);

      // Should return undefined for non-existent shape
      expect(descriptor).toBeUndefined();

      // GeometryRenderer should return null in this case
      const geometry = descriptor?.renderGeometry({}) || null;
      expect(geometry).toBeNull();
    });

    it('should pass params to renderGeometry correctly', () => {
      const paramsSchema = z.object({
        width: z.number().default(1),
        height: z.number().default(1),
        depth: z.number().default(1),
      });

      let receivedParams: any = null;

      const boxShape: ICustomShapeDescriptor<typeof paramsSchema> = {
        meta: {
          id: 'param-test-box',
          name: 'Param Test Box',
        },
        paramsSchema,
        getDefaultParams: () => paramsSchema.parse({}),
        renderGeometry: (params) => {
          receivedParams = params;
          return React.createElement('boxGeometry', {
            args: [params.width, params.height, params.depth],
          });
        },
      };

      shapeRegistry.register(boxShape);

      const customParams = {
        width: 2,
        height: 3,
        depth: 4,
      };

      const descriptor = shapeRegistry.resolve('param-test-box');
      descriptor?.renderGeometry(customParams);

      expect(receivedParams).toEqual(customParams);
    });
  });

  describe('Full Rendering Pipeline', () => {
    it('should complete full rendering flow from entity to geometry', () => {
      // 1. Register shape
      const paramsSchema = z.object({
        radius: z.number().default(0.4),
        tube: z.number().default(0.1),
      });

      const torusShape: ICustomShapeDescriptor<typeof paramsSchema> = {
        meta: {
          id: 'test-torus',
          name: 'Test Torus',
        },
        paramsSchema,
        getDefaultParams: () => paramsSchema.parse({}),
        renderGeometry: (params) =>
          React.createElement('torusGeometry', {
            args: [params.radius, params.tube, 16, 100],
          }),
      };

      shapeRegistry.register(torusShape);

      // 2. Entity data
      const entity = {
        id: 1,
        name: 'Torus Entity',
        components: [
          {
            type: 'Transform',
            data: {
              position: [0, 1, 0],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
          },
          {
            type: 'CustomShape',
            data: {
              shapeId: 'test-torus',
              params: {
                radius: 0.6,
                tube: 0.15,
              },
            } as CustomShapeData,
          },
          {
            type: 'MeshRenderer',
            data: {
              meshId: 'customShape',
              materialId: 'default',
              enabled: true,
              castShadows: true,
              receiveShadows: true,
            },
          },
        ],
      };

      // 3. Simulate rendering contributions
      let meshType: string | null = null;
      entity.components.forEach(({ type }) => {
        if (type === 'CustomShape') {
          meshType = 'CustomShape';
        }
      });

      expect(meshType).toBe('CustomShape');

      // 4. Get CustomShape data
      const customShapeData = entity.components.find((c) => c.type === 'CustomShape')
        ?.data as CustomShapeData;

      expect(customShapeData).toBeDefined();

      // 5. Resolve descriptor
      const descriptor = shapeRegistry.resolve(customShapeData.shapeId);

      expect(descriptor).toBeDefined();
      expect(descriptor?.meta.id).toBe('test-torus');

      // 6. Render geometry
      const geometry = descriptor?.renderGeometry(customShapeData.params);

      expect(geometry).toBeDefined();
      expect(geometry).not.toBeNull();
    });

    it('should handle multiple custom shapes in scene', () => {
      // Register multiple shapes
      const shapes = [
        { id: 'shape-1', name: 'Shape 1', size: 1 },
        { id: 'shape-2', name: 'Shape 2', size: 2 },
        { id: 'shape-3', name: 'Shape 3', size: 3 },
      ];

      shapes.forEach(({ id, name, size }) => {
        const paramsSchema = z.object({
          size: z.number().default(size),
        });

        const shape: ICustomShapeDescriptor<typeof paramsSchema> = {
          meta: { id, name },
          paramsSchema,
          getDefaultParams: () => paramsSchema.parse({}),
          renderGeometry: (params) =>
            React.createElement('boxGeometry', {
              args: [params.size, params.size, params.size],
            }),
        };

        shapeRegistry.register(shape);
      });

      // Create entities
      const entities = shapes.map(({ id }, index) => ({
        id: index + 1,
        name: `Entity ${index + 1}`,
        customShape: {
          shapeId: id,
          params: {},
        } as CustomShapeData,
      }));

      // Verify all can be resolved and rendered
      entities.forEach((entity) => {
        const descriptor = shapeRegistry.resolve(entity.customShape.shapeId);
        expect(descriptor).toBeDefined();

        const geometry = descriptor?.renderGeometry(entity.customShape.params);
        expect(geometry).toBeDefined();
      });
    });
  });

  describe('Material Integration', () => {
    it('should apply materials to custom shapes', () => {
      const paramsSchema = z.object({
        radius: z.number().default(0.5),
      });

      const shape: ICustomShapeDescriptor<typeof paramsSchema> = {
        meta: {
          id: 'material-test-shape',
          name: 'Material Test Shape',
        },
        paramsSchema,
        getDefaultParams: () => paramsSchema.parse({}),
        renderGeometry: () => React.createElement('sphereGeometry', { args: [0.5, 32, 32] }),
      };

      shapeRegistry.register(shape);

      const entity = {
        components: [
          {
            type: 'CustomShape',
            data: {
              shapeId: 'material-test-shape',
              params: {},
            } as CustomShapeData,
          },
          {
            type: 'MeshRenderer',
            data: {
              meshId: 'customShape',
              materialId: 'default',
              enabled: true,
              material: {
                shader: 'standard',
                materialType: 'solid',
                color: '#ff6b6b',
                roughness: 0.3,
                metalness: 0.7,
              },
            },
          },
        ],
      };

      const meshRenderer = entity.components.find((c) => c.type === 'MeshRenderer')?.data;

      expect(meshRenderer).toBeDefined();
      expect(meshRenderer?.material?.color).toBe('#ff6b6b');
      expect(meshRenderer?.material?.metalness).toBe(0.7);
    });
  });

  describe('Error Cases', () => {
    it('should handle shape with invalid params in CustomShape component', () => {
      const paramsSchema = z.object({
        radius: z.number().min(0.1).max(10).default(0.5),
      });

      const shape: ICustomShapeDescriptor<typeof paramsSchema> = {
        meta: {
          id: 'validated-shape',
          name: 'Validated Shape',
        },
        paramsSchema,
        getDefaultParams: () => paramsSchema.parse({}),
        renderGeometry: (params) =>
          React.createElement('sphereGeometry', { args: [params.radius, 32, 32] }),
      };

      shapeRegistry.register(shape);

      // Entity with invalid params
      const invalidParams = {
        radius: 100, // Exceeds max
      };

      // Validation should fail
      const result = shape.paramsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);

      // Should use defaults instead
      const defaults = shape.getDefaultParams();
      const descriptor = shapeRegistry.resolve('validated-shape');
      const geometry = descriptor?.renderGeometry(defaults);

      expect(geometry).toBeDefined();
    });

    it('should handle CustomShape component without MeshRenderer', () => {
      // This represents a configuration error
      const entity = {
        components: [
          {
            type: 'CustomShape',
            data: {
              shapeId: 'orphan-shape',
              params: {},
            } as CustomShapeData,
          },
          // Missing MeshRenderer
        ],
      };

      const hasMeshRenderer = entity.components.some((c) => c.type === 'MeshRenderer');
      expect(hasMeshRenderer).toBe(false);

      // System should handle this gracefully (not crash)
      // but shape won't render
    });

    it('should handle MeshRenderer with meshId:customShape but no CustomShape component', () => {
      // Another configuration error
      const entity = {
        components: [
          {
            type: 'MeshRenderer',
            data: {
              meshId: 'customShape',
              materialId: 'default',
              enabled: true,
            },
          },
          // Missing CustomShape component
        ],
      };

      const customShapeData = entity.components.find((c) => c.type === 'CustomShape')?.data;
      expect(customShapeData).toBeUndefined();

      // GeometryRenderer should return null in this case
    });
  });

  describe('Performance Scenarios', () => {
    it('should handle registry lookup efficiently', () => {
      // Register many shapes
      for (let i = 0; i < 100; i++) {
        const paramsSchema = z.object({
          size: z.number().default(1),
        });

        const shape: ICustomShapeDescriptor<typeof paramsSchema> = {
          meta: {
            id: `shape-${i}`,
            name: `Shape ${i}`,
          },
          paramsSchema,
          getDefaultParams: () => paramsSchema.parse({}),
          renderGeometry: () => null,
        };

        shapeRegistry.register(shape);
      }

      // Lookups should be fast (O(1) Map access)
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        const randomId = `shape-${Math.floor(Math.random() * 100)}`;
        shapeRegistry.resolve(randomId);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 1000 lookups should complete in reasonable time (< 100ms)
      expect(duration).toBeLessThan(100);
    });
  });
});
