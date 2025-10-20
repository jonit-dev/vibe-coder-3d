import { describe, it, expect } from 'vitest';
import { getComponentDefaults } from '../defaults/ComponentDefaults';
import { restoreDefaults } from '../utils/DefaultOmitter';

/**
 * Test to verify that GeometryAsset defaults are restored correctly
 * This simulates EXACTLY what EntitySerializer does during deserialization
 */
describe('GeometryAsset Default Restoration', () => {
  it('should have path in defaults', () => {
    const defaults = getComponentDefaults('GeometryAsset');

    console.log('GeometryAsset defaults:', JSON.stringify(defaults, null, 2));

    expect(defaults).toBeDefined();
    expect(defaults).toHaveProperty('path');
    expect(defaults!.path).toBe('');
  });

  it('should restore defaults for compressed scene data', () => {
    // ARRANGE: Exact data from Testphysics.tsx scene file
    const sceneComponentData = {
      path: '/src/game/geometry/battleship.shape.json',
    };

    // ACT: Exactly what EntitySerializer.deserialize() does (line 233-235)
    const defaults = getComponentDefaults('GeometryAsset');
    const restoredData = defaults
      ? restoreDefaults(sceneComponentData, defaults)
      : sceneComponentData;

    // ASSERT: All defaults should be restored
    console.log('Restored data:', JSON.stringify(restoredData, null, 2));

    expect(restoredData).toMatchObject({
      path: '/src/game/geometry/battleship.shape.json',
      geometryId: '',
      materialId: '',
      enabled: true,
      castShadows: true,
      receiveShadows: true,
      options: {
        recomputeNormals: false,
        recomputeTangents: false,
        recenter: false,
        computeBounds: true,
        flipNormals: false,
        scale: 1,
      },
    });
  });

  it('should preserve non-default values and restore missing defaults', () => {
    // ARRANGE: Scene data with some custom values
    const sceneComponentData = {
      path: '/src/game/geometry/battleship.shape.json',
      enabled: false, // non-default
      castShadows: false, // non-default
      // geometryId, materialId, receiveShadows, options omitted
    };

    // ACT
    const defaults = getComponentDefaults('GeometryAsset');
    const restoredData = defaults
      ? restoreDefaults(sceneComponentData, defaults)
      : sceneComponentData;

    // ASSERT
    console.log('Restored with custom values:', JSON.stringify(restoredData, null, 2));

    expect(restoredData).toMatchObject({
      path: '/src/game/geometry/battleship.shape.json',
      geometryId: '', // restored default
      materialId: '', // restored default
      enabled: false, // preserved custom value
      castShadows: false, // preserved custom value
      receiveShadows: true, // restored default
      options: {
        // all defaults restored
        recomputeNormals: false,
        recomputeTangents: false,
        recenter: false,
        computeBounds: true,
        flipNormals: false,
        scale: 1,
      },
    });
  });

  it('should work with empty path (edge case)', () => {
    // ARRANGE
    const sceneComponentData = {
      path: '',
    };

    // ACT
    const defaults = getComponentDefaults('GeometryAsset');
    const restoredData = defaults
      ? restoreDefaults(sceneComponentData, defaults)
      : sceneComponentData;

    // ASSERT
    expect(restoredData.path).toBe('');
    expect(restoredData.enabled).toBe(true);
    expect(restoredData.geometryId).toBe('');
  });
});
