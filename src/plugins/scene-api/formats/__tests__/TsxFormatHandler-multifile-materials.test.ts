import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TsxFormatHandler } from '../TsxFormatHandler';
import { FsSceneStore } from '@core/lib/serialization/common/FsSceneStore';
import { promises as fs } from 'fs';
import path from 'path';

describe('TsxFormatHandler - Multi-File Material Persistence', () => {
  const TEST_DIR = '/tmp/tsx-multifile-material-test';
  let store: FsSceneStore;
  let handler: TsxFormatHandler;

  beforeEach(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
    await fs.mkdir(TEST_DIR, { recursive: true });
    store = new FsSceneStore(TEST_DIR);
    handler = new TsxFormatHandler(store, TEST_DIR);
  });

  afterEach(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  it('should save material with materialId and persist to materials file', async () => {
    const payload = {
      entities: [
        {
          id: 1,
          name: 'Ground',
          components: {
            Transform: { position: [0, -0.5, 0], scale: [20, 0.1, 20] },
            MeshRenderer: {
              meshId: 'cube',
              materialId: 'test123',
            },
          },
        },
      ],
      materials: [
        {
          id: 'test123',
          name: 'Test Material',
          shader: 'standard',
          materialType: 'solid',
          color: '#ff6600',
          metalness: 0.3,
          roughness: 0.6,
          emissive: '#000000',
          emissiveIntensity: 0,
          normalScale: 1,
          occlusionStrength: 1,
          textureOffsetX: 0,
          textureOffsetY: 0,
          textureRepeatX: 1,
          textureRepeatY: 1,
        },
      ],
    };

    // Save
    const saveResult = await handler.save({ name: 'TestScene', payload });
    expect(saveResult.filename).toBe('TestScene/TestScene.index.tsx');

    // Verify index file contains materialRef
    const indexFile = await fs.readFile(
      path.join(TEST_DIR, 'TestScene/TestScene.index.tsx'),
      'utf-8',
    );
    expect(indexFile).toContain('"materialRef": "./materials/test123"');

    // Verify materials file contains the material
    const materialsFile = await fs.readFile(
      path.join(TEST_DIR, 'TestScene/TestScene.materials.tsx'),
      'utf-8',
    );
    expect(materialsFile).toContain('"id": "test123"');
    expect(materialsFile).toContain('"name": "Test Material"');
    expect(materialsFile).toContain('"color": "#ff6600"');
  });

  it('should load scene and resolve material reference to materialId', async () => {
    const payload = {
      entities: [
        {
          id: 1,
          name: 'Cube',
          components: {
            Transform: { position: [0, 0, 0] },
            MeshRenderer: {
              meshId: 'cube',
              materialId: 'myMaterial',
            },
          },
        },
      ],
      materials: [
        {
          id: 'myMaterial',
          name: 'My Material',
          shader: 'standard',
          materialType: 'solid',
          color: '#00ff00',
          metalness: 0,
          roughness: 0.5,
          emissive: '#000000',
          emissiveIntensity: 0,
          normalScale: 1,
          occlusionStrength: 1,
          textureOffsetX: 0,
          textureOffsetY: 0,
          textureRepeatX: 1,
          textureRepeatY: 1,
        },
      ],
    };

    // Save
    await handler.save({ name: 'TestScene', payload });

    // Load
    const loadResult = await handler.load({ name: 'TestScene' });
    const data = loadResult.data as { entities: any[]; materials: any[] };

    expect(data.entities).toHaveLength(1);

    // After load, materialRef is resolved to inline material, then normalized to materialId
    expect(data.entities[0].components.MeshRenderer).toHaveProperty('materialId');
    expect(data.entities[0].components.MeshRenderer.materialId).toBeDefined();

    // Materials should be in the materials array
    expect(data.materials).toBeDefined();
    expect(data.materials.length).toBeGreaterThan(0);

    // Find myMaterial in materials array
    const myMaterial = data.materials.find((m: any) => m.id === 'myMaterial');
    expect(myMaterial).toBeDefined();
    expect(myMaterial.color).toBe('#00ff00');
  });

  it('should handle multiple materials correctly', async () => {
    const payload = {
      entities: [
        {
          id: 1,
          name: 'Cube1',
          components: {
            Transform: { position: [0, 0, 0] },
            MeshRenderer: { meshId: 'cube', materialId: 'mat1' },
          },
        },
        {
          id: 2,
          name: 'Cube2',
          components: {
            Transform: { position: [5, 0, 0] },
            MeshRenderer: { meshId: 'cube', materialId: 'mat2' },
          },
        },
      ],
      materials: [
        {
          id: 'mat1',
          name: 'Material 1',
          shader: 'standard',
          materialType: 'solid',
          color: '#ff0000',
          metalness: 0,
          roughness: 0.5,
          emissive: '#000000',
          emissiveIntensity: 0,
          normalScale: 1,
          occlusionStrength: 1,
          textureOffsetX: 0,
          textureOffsetY: 0,
          textureRepeatX: 1,
          textureRepeatY: 1,
        },
        {
          id: 'mat2',
          name: 'Material 2',
          shader: 'standard',
          materialType: 'solid',
          color: '#0000ff',
          metalness: 0,
          roughness: 0.5,
          emissive: '#000000',
          emissiveIntensity: 0,
          normalScale: 1,
          occlusionStrength: 1,
          textureOffsetX: 0,
          textureOffsetY: 0,
          textureRepeatX: 1,
          textureRepeatY: 1,
        },
      ],
    };

    await handler.save({ name: 'MultiMat', payload });

    const materialsFile = await fs.readFile(
      path.join(TEST_DIR, 'MultiMat/MultiMat.materials.tsx'),
      'utf-8',
    );
    expect(materialsFile).toContain('"id": "mat1"');
    expect(materialsFile).toContain('"id": "mat2"');
    expect(materialsFile).toContain('"color": "#ff0000"');
    expect(materialsFile).toContain('"color": "#0000ff"');
  });
});
