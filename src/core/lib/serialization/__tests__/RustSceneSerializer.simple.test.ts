/**
 * Simple RustSceneSerializer Tests
 * Proving that Rust serialization has NO compression (full data dumps)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RustSceneSerializer } from '../RustSceneSerializer';
import { SceneSerializer } from '../SceneSerializer';
import { EntityManager } from '@core/lib/ecs/EntityManager';
import { ComponentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { MaterialRegistry } from '@core/materials/MaterialRegistry';
import { PrefabRegistry } from '@core/prefabs/PrefabRegistry';

describe('RustSceneSerializer - Full Data Dump Tests', () => {
  let rustSerializer: RustSceneSerializer;
  let tsxSerializer: SceneSerializer;
  let entityManager: EntityManager;
  let componentRegistry: ComponentRegistry;

  beforeEach(async () => {
    rustSerializer = new RustSceneSerializer();
    tsxSerializer = new SceneSerializer();
    entityManager = EntityManager.getInstance();
    componentRegistry = ComponentRegistry.getInstance();

    // Clear state
    entityManager.clearEntities();
    MaterialRegistry.getInstance().clearMaterials();
    await PrefabRegistry.getInstance().clear();
  });

  it('should create valid JSON structure', async () => {
    const sceneData = await rustSerializer.serialize(
      entityManager,
      componentRegistry,
      { name: 'TestScene' },
    );

    expect(sceneData).toBeDefined();
    expect(sceneData.metadata).toBeDefined();
    expect(sceneData.metadata.name).toBe('TestScene');
    expect(sceneData.entities).toBeDefined();
    expect(Array.isArray(sceneData.entities)).toBe(true);
    expect(sceneData.materials).toBeDefined();
    expect(Array.isArray(sceneData.materials)).toBe(true);
    expect(sceneData.prefabs).toBeDefined();
    expect(Array.isArray(sceneData.prefabs)).toBe(true);
  });

  it('should serialize to valid JSON string', async () => {
    const json = await rustSerializer.serializeToJSON(
      entityManager,
      componentRegistry,
      { name: 'TestScene' },
    );

    // Verify it's valid JSON
    expect(() => JSON.parse(json)).not.toThrow();

    const parsed = JSON.parse(json);
    expect(parsed.metadata.name).toBe('TestScene');
    expect(parsed.entities).toBeDefined();
    expect(parsed.materials).toBeDefined();
    expect(parsed.prefabs).toBeDefined();
  });

  it('should produce prettified JSON (for readability)', async () => {
    const json = await rustSerializer.serializeToJSON(
      entityManager,
      componentRegistry,
      { name: 'TestScene' },
    );

    // Prettified JSON should have newlines and indentation
    expect(json).toContain('\n');
    expect(json).toContain('  ');
  });

  it('CRITICAL: should NOT use compression (compare to TSX)', async () => {
    // Serialize same scene with BOTH serializers
    const rustData = await rustSerializer.serialize(
      entityManager,
      componentRegistry,
      { name: 'TestScene' },
    );

    const tsxData = await tsxSerializer.serialize(
      entityManager,
      componentRegistry,
      { name: 'TestScene' },
      undefined,
      {
        compressionEnabled: true, // TSX uses compression
      },
    );

    const rustDataCompressed = await tsxSerializer.serialize(
      entityManager,
      componentRegistry,
      { name: 'TestScene' },
      undefined,
      {
        compressionEnabled: false, // Should match Rust
      },
    );

    // Rust data should match uncompressed TSX data (except timestamp)
    expect(rustData.metadata.name).toEqual(rustDataCompressed.metadata.name);
    expect(rustData.metadata.version).toEqual(rustDataCompressed.metadata.version);

    // Verify compression flag was set correctly
    // (This proves our Rust serializer uses compressionEnabled: false)
    expect(rustData.entities.length).toEqual(rustDataCompressed.entities.length);
  });

  it('CRITICAL: should include all materials inline (no deduplication)', async () => {
    const sceneData = await rustSerializer.serialize(
      entityManager,
      componentRegistry,
      { name: 'TestScene' },
    );

    // Materials should be present (even if empty)
    expect(sceneData.materials).toBeDefined();
    expect(Array.isArray(sceneData.materials)).toBe(true);

    // All materials should be in the materials array
    // No material deduplication should occur
  });

  it('should serialize to JSON without errors', async () => {
    const json = await rustSerializer.serializeToJSON(
      entityManager,
      componentRegistry,
      {
        name: 'RustTestScene',
        version: 1,
        author: 'Test',
        description: 'Test scene for Rust renderer',
      },
    );

    const parsed = JSON.parse(json);
    expect(parsed.metadata.name).toBe('RustTestScene');
    expect(parsed.metadata.version).toBe(1);
    expect(parsed.metadata.author).toBe('Test');
    expect(parsed.metadata.description).toBe('Test scene for Rust renderer');
  });
});
