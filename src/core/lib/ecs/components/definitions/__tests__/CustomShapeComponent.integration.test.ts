/**
 * CustomShape Component Integration Tests
 * Validates TypeScript → JSON serialization for Rust consumption
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createWorld, addEntity, addComponent, removeEntity } from 'bitecs';
import {
  customShapeComponent,
  type CustomShapeData,
  transformComponent,
} from '../index';
import { serializeEntity } from '../../../EntitySerializer';

describe('CustomShape Component Integration', () => {
  let world: any;
  let eid: number;

  beforeEach(() => {
    world = createWorld();
    eid = addEntity(world);
    addComponent(world, transformComponent.component, eid);
  });

  afterEach(() => {
    if (world && eid) {
      removeEntity(world, eid);
    }
  });

  describe('TypeScript → JSON Serialization', () => {
    it('should serialize helix shape with all parameters', () => {
      const shapeData: CustomShapeData = {
        shapeId: 'helix',
        params: {
          radius: 0.6,
          height: 3.0,
          tubeRadius: 0.15,
          coils: 4.0,
          segments: 64,
          tubeSegments: 16,
        },
      };

      addComponent(world, customShapeComponent.component, eid);
      customShapeComponent.deserialize(eid, shapeData, customShapeComponent.component);

      const serialized = customShapeComponent.serialize(eid, customShapeComponent.component);

      expect(serialized).toEqual({
        shapeId: 'helix',
        params: {
          radius: 0.6,
          height: 3.0,
          tubeRadius: 0.15,
          coils: 4.0,
          segments: 64,
          tubeSegments: 16,
        },
      });
    });

    it('should serialize star shape with default params', () => {
      const shapeData: CustomShapeData = {
        shapeId: 'star',
        params: {},
      };

      addComponent(world, customShapeComponent.component, eid);
      customShapeComponent.deserialize(eid, shapeData, customShapeComponent.component);

      const serialized = customShapeComponent.serialize(eid, customShapeComponent.component);

      expect(serialized.shapeId).toBe('star');
      expect(serialized.params).toEqual({});
    });

    it('should serialize tree shape with environment parameters', () => {
      const shapeData: CustomShapeData = {
        shapeId: 'tree',
        params: {
          trunkRadius: 0.15,
          trunkHeight: 2.0,
          foliageRadius: 1.0,
          foliageHeight: 1.5,
          segments: 16,
        },
      };

      addComponent(world, customShapeComponent.component, eid);
      customShapeComponent.deserialize(eid, shapeData, customShapeComponent.component);

      const serialized = customShapeComponent.serialize(eid, customShapeComponent.component);

      expect(serialized).toEqual({
        shapeId: 'tree',
        params: {
          trunkRadius: 0.15,
          trunkHeight: 2.0,
          foliageRadius: 1.0,
          foliageHeight: 1.5,
          segments: 16,
        },
      });
    });

    it('should serialize ramp shape for structural testing', () => {
      const shapeData: CustomShapeData = {
        shapeId: 'ramp',
        params: {
          width: 2.0,
          height: 1.0,
          depth: 1.5,
        },
      };

      addComponent(world, customShapeComponent.component, eid);
      customShapeComponent.deserialize(eid, shapeData, customShapeComponent.component);

      const serialized = customShapeComponent.serialize(eid, customShapeComponent.component);

      expect(serialized).toEqual({
        shapeId: 'ramp',
        params: {
          width: 2.0,
          height: 1.0,
          depth: 1.5,
        },
      });
    });
  });

  describe('All 15 Shapes Serialization', () => {
    const testShapes: Array<{ shapeId: string; params: Record<string, unknown> }> = [
      // Math shapes
      {
        shapeId: 'helix',
        params: { radius: 0.5, height: 2.0, tubeRadius: 0.1, coils: 3.0, segments: 32, tubeSegments: 8 },
      },
      {
        shapeId: 'mobiusstrip',
        params: { radius: 0.5, width: 0.3, segments: 64 },
      },
      {
        shapeId: 'torusknot',
        params: { radius: 0.5, tube: 0.15, tubularSegments: 64, radialSegments: 8, p: 2, q: 3 },
      },

      // Decorative shapes
      {
        shapeId: 'star',
        params: { outerRadius: 0.5, innerRadius: 0.25, points: 5, thickness: 0.2 },
      },
      {
        shapeId: 'heart',
        params: { size: 0.5, depth: 0.2, segments: 32 },
      },
      {
        shapeId: 'diamond',
        params: { radius: 0.4, height: 0.8, tableRatio: 0.6, facets: 8 },
      },
      {
        shapeId: 'cross',
        params: { armLength: 0.8, armWidth: 0.2 },
      },
      {
        shapeId: 'tube',
        params: { radius: 1.0, tubeRadius: 0.2, radialSegments: 32, tubularSegments: 64 },
      },

      // Structural shapes
      {
        shapeId: 'ramp',
        params: { width: 1.0, height: 1.0, depth: 1.0 },
      },
      {
        shapeId: 'stairs',
        params: { width: 1.0, height: 1.0, depth: 1.0, numSteps: 5 },
      },
      {
        shapeId: 'spiralstairs',
        params: { radius: 0.8, height: 2.0, numSteps: 10, turns: 1.0 },
      },

      // Environment shapes
      {
        shapeId: 'tree',
        params: { trunkRadius: 0.1, trunkHeight: 1.0, foliageRadius: 0.5, foliageHeight: 1.0, segments: 8 },
      },
      {
        shapeId: 'rock',
        params: { radius: 0.5, irregularity: 0.3, segments: 16 },
      },
      {
        shapeId: 'bush',
        params: { radius: 0.5, segments: 8 },
      },
      {
        shapeId: 'grass',
        params: { bladeWidth: 0.02, bladeHeight: 0.3, numBlades: 10 },
      },
    ];

    testShapes.forEach(({ shapeId, params }) => {
      it(`should serialize ${shapeId} shape`, () => {
        const shapeData: CustomShapeData = { shapeId, params };

        addComponent(world, customShapeComponent.component, eid);
        customShapeComponent.deserialize(eid, shapeData, customShapeComponent.component);

        const serialized = customShapeComponent.serialize(eid, customShapeComponent.component);

        expect(serialized.shapeId).toBe(shapeId);
        expect(serialized.params).toEqual(params);
      });
    });
  });

  describe('JSON Structure for Rust', () => {
    it('should produce valid JSON structure matching Rust CustomShape struct', () => {
      const shapeData: CustomShapeData = {
        shapeId: 'helix',
        params: {
          radius: 0.5,
          height: 2.0,
          tubeRadius: 0.1,
          coils: 3.0,
          segments: 32,
          tubeSegments: 8,
        },
      };

      addComponent(world, customShapeComponent.component, eid);
      customShapeComponent.deserialize(eid, shapeData, customShapeComponent.component);

      const serialized = customShapeComponent.serialize(eid, customShapeComponent.component);
      const json = JSON.stringify(serialized);
      const parsed = JSON.parse(json);

      // Verify structure matches Rust struct
      expect(parsed).toHaveProperty('shapeId');
      expect(typeof parsed.shapeId).toBe('string');
      expect(parsed).toHaveProperty('params');
      expect(typeof parsed.params).toBe('object');

      // Verify params are properly typed
      expect(typeof parsed.params.radius).toBe('number');
      expect(typeof parsed.params.height).toBe('number');
      expect(typeof parsed.params.coils).toBe('number');
      expect(typeof parsed.params.segments).toBe('number');
    });

    it('should handle camelCase parameter naming for Rust deserialization', () => {
      const shapeData: CustomShapeData = {
        shapeId: 'helix',
        params: {
          tubeRadius: 0.1, // camelCase
          tubeSegments: 8,  // camelCase
        },
      };

      addComponent(world, customShapeComponent.component, eid);
      customShapeComponent.deserialize(eid, shapeData, customShapeComponent.component);

      const serialized = customShapeComponent.serialize(eid, customShapeComponent.component);

      // Verify camelCase is preserved (Rust will use #[serde(rename_all = "camelCase")])
      expect(serialized.params).toHaveProperty('tubeRadius');
      expect(serialized.params).toHaveProperty('tubeSegments');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty params gracefully', () => {
      const shapeData: CustomShapeData = {
        shapeId: 'star',
        params: {},
      };

      addComponent(world, customShapeComponent.component, eid);
      customShapeComponent.deserialize(eid, shapeData, customShapeComponent.component);

      const serialized = customShapeComponent.serialize(eid, customShapeComponent.component);

      expect(serialized.shapeId).toBe('star');
      expect(serialized.params).toEqual({});
    });

    it('should handle missing shapeId', () => {
      const shapeData: CustomShapeData = {
        shapeId: '',
        params: {},
      };

      addComponent(world, customShapeComponent.component, eid);
      customShapeComponent.deserialize(eid, shapeData, customShapeComponent.component);

      const serialized = customShapeComponent.serialize(eid, customShapeComponent.component);

      expect(serialized.shapeId).toBe('');
    });
  });

  describe('Full Entity Serialization', () => {
    it('should serialize complete entity with Transform and CustomShape', () => {
      // Add transform
      const transformData = {
        position: [1, 2, 3],
        rotation: [0, 90, 0], // Euler angles in degrees
        scale: [1, 1, 1],
      };
      transformComponent.deserialize(eid, transformData, transformComponent.component);

      // Add custom shape
      const shapeData: CustomShapeData = {
        shapeId: 'ramp',
        params: {
          width: 2.0,
          height: 1.0,
          depth: 1.5,
        },
      };
      addComponent(world, customShapeComponent.component, eid);
      customShapeComponent.deserialize(eid, shapeData, customShapeComponent.component);

      // Serialize entity (this would be used when exporting scenes)
      const entityData = {
        components: {
          Transform: transformComponent.serialize(eid, transformComponent.component),
          CustomShape: customShapeComponent.serialize(eid, customShapeComponent.component),
        },
      };

      expect(entityData.components.Transform).toEqual(transformData);
      expect(entityData.components.CustomShape).toEqual(shapeData);

      // Verify JSON roundtrip
      const json = JSON.stringify(entityData);
      const parsed = JSON.parse(json);
      expect(parsed.components.CustomShape.shapeId).toBe('ramp');
      expect(parsed.components.CustomShape.params.width).toBe(2.0);
    });
  });
});
