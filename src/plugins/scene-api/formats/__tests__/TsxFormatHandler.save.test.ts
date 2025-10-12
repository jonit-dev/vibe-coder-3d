import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { TsxFormatHandler } from '../TsxFormatHandler';
import { FsSceneStore } from '../../../../core/lib/serialization/common/FsSceneStore';

describe('TsxFormatHandler - Save with Asset References', () => {
  const testDir = './test-output/scenes';
  const assetsDir = './test-output/assets';
  let handler: TsxFormatHandler;
  let store: FsSceneStore;

  beforeEach(async () => {
    // Clean up test directories
    await fs.rm(testDir, { recursive: true, force: true });
    await fs.rm(assetsDir, { recursive: true, force: true });

    // Create fresh directories
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(assetsDir, { recursive: true });

    // Create handler
    store = new FsSceneStore(testDir);
    handler = new TsxFormatHandler(store, testDir);

    // Mock FsAssetStore to use test directory
    const originalImport = handler['save'];
    // @ts-ignore - Patching for test
    handler['save'] = async function (args) {
      // Temporarily override asset store paths
      const { FsAssetStore } = await import('../../../assets-api/FsAssetStore');
      const originalConstructor = FsAssetStore;
      const TestAssetStore = class extends FsAssetStore {
        constructor() {
          super(assetsDir, testDir);
        }
      };
      // @ts-ignore
      global.FsAssetStore = TestAssetStore;
      const result = await originalImport.call(this, args);
      // @ts-ignore
      global.FsAssetStore = originalConstructor;
      return result;
    }.bind(handler);
  });

  afterEach(async () => {
    // Clean up
    await fs.rm(testDir, { recursive: true, force: true });
    await fs.rm(assetsDir, { recursive: true, force: true });
  });

  it('should save materials as separate files', async () => {
    const sceneData = {
      entities: [
        {
          id: 1,
          name: 'Cube',
          components: {
            Transform: { position: [0, 0, 0] },
            MeshRenderer: {
              meshId: 'cube',
              materialId: 'red',
            },
          },
        },
      ],
      materials: [
        {
          id: 'red',
          name: 'Red Material',
          shader: 'standard',
          materialType: 'solid',
          color: '#ff0000',
          metalness: 0,
          roughness: 0.7,
        },
      ],
    };

    await handler.save({
      name: 'TestScene',
      payload: sceneData,
    });

    // Check that material file was created
    const materialPath = path.join(assetsDir, 'materials/red.material.tsx');
    const exists = await fs
      .access(materialPath)
      .then(() => true)
      .catch(() => false);

    expect(exists).toBe(true);

    // Check material file content
    const materialContent = await fs.readFile(materialPath, 'utf-8');
    expect(materialContent).toContain('defineMaterial');
    expect(materialContent).toContain('"id": "red"');
    expect(materialContent).toContain('"color": "#ff0000"');
  });

  it('should save scene with asset references, not inline data', async () => {
    const sceneData = {
      entities: [
        {
          id: 1,
          name: 'Cube',
          components: {
            Transform: { position: [0, 0, 0] },
            MeshRenderer: {
              meshId: 'cube',
              materialId: 'red',
            },
          },
        },
      ],
      materials: [
        {
          id: 'red',
          name: 'Red Material',
          shader: 'standard',
          materialType: 'solid',
          color: '#ff0000',
          metalness: 0,
          roughness: 0.7,
        },
      ],
    };

    await handler.save({
      name: 'TestScene',
      payload: sceneData,
    });

    // Check scene file
    const scenePath = path.join(testDir, 'TestScene.tsx');
    const sceneContent = await fs.readFile(scenePath, 'utf-8');

    // Should have asset references
    expect(sceneContent).toContain('assetReferences');
    expect(sceneContent).toContain('@/materials/red');

    // Should NOT have inline material data
    expect(sceneContent).not.toContain('materials: [');
    expect(sceneContent).not.toContain('"shader": "standard"');
  });

  it('should save input assets as separate files', async () => {
    const sceneData = {
      entities: [
        {
          id: 1,
          name: 'Player',
          components: {
            Transform: { position: [0, 0, 0] },
          },
        },
      ],
      inputAssets: [
        {
          name: 'Player Input',
          controlSchemes: [
            {
              name: 'Keyboard',
              deviceRequirements: [{ deviceType: 'keyboard', optional: false }],
            },
          ],
          actionMaps: [],
        },
      ],
    };

    await handler.save({
      name: 'TestScene',
      payload: sceneData,
    });

    // Check that input file was created
    const inputPath = path.join(assetsDir, 'inputs/PlayerInput.input.tsx');
    const exists = await fs
      .access(inputPath)
      .then(() => true)
      .catch(() => false);

    expect(exists).toBe(true);

    // Check scene file has reference
    const scenePath = path.join(testDir, 'TestScene.tsx');
    const sceneContent = await fs.readFile(scenePath, 'utf-8');
    expect(sceneContent).toContain('@/inputs/PlayerInput');
    expect(sceneContent).not.toContain('inputAssets: [');
  });

  it('should deduplicate materials and save each once', async () => {
    const sceneData = {
      entities: [
        {
          id: 1,
          name: 'Cube1',
          components: {
            MeshRenderer: {
              meshId: 'cube',
              materialId: 'red',
            },
          },
        },
        {
          id: 2,
          name: 'Cube2',
          components: {
            MeshRenderer: {
              meshId: 'cube',
              materialId: 'red', // Same material
            },
          },
        },
      ],
      materials: [
        {
          id: 'red',
          name: 'Red Material',
          shader: 'standard',
          materialType: 'solid',
          color: '#ff0000',
        },
      ],
    };

    await handler.save({
      name: 'TestScene',
      payload: sceneData,
    });

    // Check that only ONE material file was created
    const materialFiles = await fs.readdir(path.join(assetsDir, 'materials'));
    expect(materialFiles.length).toBe(1);
    expect(materialFiles[0]).toBe('red.material.tsx');

    // Check scene has one reference
    const scenePath = path.join(testDir, 'TestScene.tsx');
    const sceneContent = await fs.readFile(scenePath, 'utf-8');
    const matches = sceneContent.match(/@\/materials\/red/g);
    expect(matches?.length).toBe(1);
  });

  it('should create KISS scene file with minimal content', async () => {
    const sceneData = {
      entities: [
        {
          id: 1,
          name: 'Camera',
          components: {
            Transform: { position: [0, 0, -10] },
            Camera: { fov: 60, isMain: true },
          },
        },
      ],
      materials: [
        {
          id: 'default',
          name: 'Default',
          shader: 'standard',
          materialType: 'solid',
          color: '#cccccc',
        },
      ],
      inputAssets: [],
      prefabs: [],
    };

    await handler.save({
      name: 'SimpleScene',
      payload: sceneData,
    });

    const scenePath = path.join(testDir, 'SimpleScene.tsx');
    const sceneContent = await fs.readFile(scenePath, 'utf-8');

    // Should be concise
    const lines = sceneContent.split('\n').length;
    expect(lines).toBeLessThan(50); // Much smaller than 387 lines!

    // Should have key elements
    expect(sceneContent).toContain('defineScene');
    expect(sceneContent).toContain('metadata');
    expect(sceneContent).toContain('entities');
    expect(sceneContent).toContain('assetReferences');

    // Should NOT have inline data
    expect(sceneContent).not.toContain('materials: [');
    expect(sceneContent).not.toContain('inputAssets: [');
    expect(sceneContent).not.toContain('prefabs: [');
  });
});
