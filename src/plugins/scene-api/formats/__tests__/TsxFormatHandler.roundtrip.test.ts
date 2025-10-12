import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { TsxFormatHandler } from '../TsxFormatHandler';
import { FsSceneStore } from '../../../../core/lib/serialization/common/FsSceneStore';

/**
 * Round-trip test: Save with new format, load back, verify data integrity
 */
describe('TsxFormatHandler - Save/Load Round-Trip', () => {
  const testScenesDir = './test-roundtrip/scenes';
  const testAssetsDir = './test-roundtrip/assets';

  beforeEach(async () => {
    await fs.rm('./test-roundtrip', { recursive: true, force: true });
    await fs.mkdir(testScenesDir, { recursive: true });
    await fs.mkdir(testAssetsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm('./test-roundtrip', { recursive: true, force: true });
  });

  it('should save and load scene with materials correctly', async () => {
    const originalSceneData = {
      entities: [
        {
          id: 0,
          name: 'Cube',
          components: {
            PersistentId: { id: 'cube-123' },
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
          metalness: 0.5,
          roughness: 0.3,
        },
      ],
      description: 'Test scene',
    };

    const store = new FsSceneStore(testScenesDir);
    const handler = new TsxFormatHandler(store, testScenesDir);

    // Patch to use test directories
    const originalSave = handler.save.bind(handler);
    handler.save = async function (args) {
      const mod = await import('../../../assets-api/FsAssetStore');
      const OriginalFsAssetStore = mod.FsAssetStore;
      const PatchedFsAssetStore = class extends OriginalFsAssetStore {
        constructor() {
          super(testAssetsDir, testScenesDir);
        }
      };
      Object.defineProperty(mod, 'FsAssetStore', {
        value: PatchedFsAssetStore,
        writable: true,
        configurable: true,
      });
      try {
        return await originalSave(args);
      } finally {
        Object.defineProperty(mod, 'FsAssetStore', {
          value: OriginalFsAssetStore,
          writable: true,
          configurable: true,
        });
      }
    };

    // SAVE
    const saveResult = await handler.save({
      name: 'RoundTripTest',
      payload: originalSceneData,
    });

    expect(saveResult.filename).toBe('RoundTripTest.tsx');

    // Verify scene file format
    const scenePath = path.join(testScenesDir, 'RoundTripTest.tsx');
    const sceneContent = await fs.readFile(scenePath, 'utf-8');

    // Should have ID-based references, not inline data
    expect(sceneContent).toContain('assetReferences');
    expect(sceneContent).toContain('materials: ["red"]');
    expect(sceneContent).not.toContain('"shader": "standard"');
    expect(sceneContent).not.toContain('#ff0000');

    // Verify material file was created
    const materialPath = path.join(testAssetsDir, 'materials/red.material.tsx');
    const materialExists = await fs
      .access(materialPath)
      .then(() => true)
      .catch(() => false);
    expect(materialExists).toBe(true);

    // LOAD
    const loadResult = await handler.load({
      name: 'RoundTripTest',
    });

    expect(loadResult.filename).toBe('RoundTripTest.tsx');
    expect(loadResult.data).toBeDefined();

    const loadedData = loadResult.data as any;

    // Verify entities
    expect(loadedData.entities).toHaveLength(1);
    expect(loadedData.entities[0].name).toBe('Cube');
    expect(loadedData.entities[0].components.Transform.position).toEqual([0, 0, 0]);

    // Verify materials were resolved
    expect(loadedData.materials).toHaveLength(1);
    expect(loadedData.materials[0].id).toBe('red');
    expect(loadedData.materials[0].color).toBe('#ff0000');
    expect(loadedData.materials[0].metalness).toBe(0.5);

    // Verify MeshRenderer has materialId (not inline material)
    const meshRenderer = loadedData.entities[0].components.MeshRenderer;
    expect(meshRenderer.materialId).toBe('red');
    expect(meshRenderer.material).toBeUndefined();
  });

  it('should handle multiple materials in round-trip', async () => {
    const sceneData = {
      entities: [
        {
          id: 1,
          name: 'RedCube',
          components: {
            MeshRenderer: { meshId: 'cube', materialId: 'red' },
          },
        },
        {
          id: 2,
          name: 'BlueCube',
          components: {
            MeshRenderer: { meshId: 'cube', materialId: 'blue' },
          },
        },
      ],
      materials: [
        {
          id: 'red',
          name: 'Red',
          color: '#ff0000',
          shader: 'standard',
          materialType: 'solid',
        },
        {
          id: 'blue',
          name: 'Blue',
          color: '#0000ff',
          shader: 'standard',
          materialType: 'solid',
        },
      ],
    };

    const store = new FsSceneStore(testScenesDir);
    const handler = new TsxFormatHandler(store, testScenesDir);

    // Patch
    const originalSave = handler.save.bind(handler);
    handler.save = async function (args) {
      const mod = await import('../../../assets-api/FsAssetStore');
      const OriginalFsAssetStore = mod.FsAssetStore;
      const PatchedFsAssetStore = class extends OriginalFsAssetStore {
        constructor() {
          super(testAssetsDir, testScenesDir);
        }
      };
      Object.defineProperty(mod, 'FsAssetStore', {
        value: PatchedFsAssetStore,
        writable: true,
        configurable: true,
      });
      try {
        return await originalSave(args);
      } finally {
        Object.defineProperty(mod, 'FsAssetStore', {
          value: OriginalFsAssetStore,
          writable: true,
          configurable: true,
        });
      }
    };

    // Save
    await handler.save({
      name: 'MultiMaterial',
      payload: sceneData,
    });

    // Load
    const loadResult = await handler.load({ name: 'MultiMaterial' });
    const loadedData = loadResult.data as any;

    // Verify both materials loaded
    expect(loadedData.materials).toHaveLength(2);

    const redMaterial = loadedData.materials.find((m: any) => m.id === 'red');
    const blueMaterial = loadedData.materials.find((m: any) => m.id === 'blue');

    expect(redMaterial).toBeDefined();
    expect(redMaterial.color).toBe('#ff0000');

    expect(blueMaterial).toBeDefined();
    expect(blueMaterial.color).toBe('#0000ff');

    // Verify entities reference correct materials
    expect(loadedData.entities[0].components.MeshRenderer.materialId).toBe('red');
    expect(loadedData.entities[1].components.MeshRenderer.materialId).toBe('blue');
  });

  it('should maintain entity count and IDs through round-trip', async () => {
    const sceneData = {
      entities: Array.from({ length: 10 }, (_, i) => ({
        id: i,
        name: `Entity${i}`,
        components: {
          Transform: { position: [i, i, i] },
        },
      })),
      materials: [],
    };

    const store = new FsSceneStore(testScenesDir);
    const handler = new TsxFormatHandler(store, testScenesDir);

    // Patch
    const originalSave = handler.save.bind(handler);
    handler.save = async function (args) {
      const mod = await import('../../../assets-api/FsAssetStore');
      const OriginalFsAssetStore = mod.FsAssetStore;
      const PatchedFsAssetStore = class extends OriginalFsAssetStore {
        constructor() {
          super(testAssetsDir, testScenesDir);
        }
      };
      Object.defineProperty(mod, 'FsAssetStore', {
        value: PatchedFsAssetStore,
        writable: true,
        configurable: true,
      });
      try {
        return await originalSave(args);
      } finally {
        Object.defineProperty(mod, 'FsAssetStore', {
          value: OriginalFsAssetStore,
          writable: true,
          configurable: true,
        });
      }
    };

    // Save
    await handler.save({
      name: 'ManyEntities',
      payload: sceneData,
    });

    // Load
    const loadResult = await handler.load({ name: 'ManyEntities' });
    const loadedData = loadResult.data as any;

    // Verify all entities preserved
    expect(loadedData.entities).toHaveLength(10);

    for (let i = 0; i < 10; i++) {
      expect(loadedData.entities[i].id).toBe(i);
      expect(loadedData.entities[i].name).toBe(`Entity${i}`);
      expect(loadedData.entities[i].components.Transform.position).toEqual([i, i, i]);
    }
  });

  it('should verify scene file is KISS (concise)', async () => {
    const sceneData = {
      entities: [
        {
          id: 1,
          name: 'Test',
          components: {
            Transform: { position: [0, 0, 0] },
            MeshRenderer: { meshId: 'cube', materialId: 'red' },
          },
        },
      ],
      materials: [
        {
          id: 'red',
          name: 'Red',
          color: '#ff0000',
          shader: 'standard',
          materialType: 'solid',
        },
      ],
    };

    const store = new FsSceneStore(testScenesDir);
    const handler = new TsxFormatHandler(store, testScenesDir);

    // Patch
    const originalSave = handler.save.bind(handler);
    handler.save = async function (args) {
      const mod = await import('../../../assets-api/FsAssetStore');
      const OriginalFsAssetStore = mod.FsAssetStore;
      const PatchedFsAssetStore = class extends OriginalFsAssetStore {
        constructor() {
          super(testAssetsDir, testScenesDir);
        }
      };
      Object.defineProperty(mod, 'FsAssetStore', {
        value: PatchedFsAssetStore,
        writable: true,
        configurable: true,
      });
      try {
        return await originalSave(args);
      } finally {
        Object.defineProperty(mod, 'FsAssetStore', {
          value: OriginalFsAssetStore,
          writable: true,
          configurable: true,
        });
      }
    };

    await handler.save({
      name: 'SimpleScene',
      payload: sceneData,
    });

    const scenePath = path.join(testScenesDir, 'SimpleScene.tsx');
    const sceneContent = await fs.readFile(scenePath, 'utf-8');
    const lines = sceneContent.split('\n');

    // Should be very concise
    expect(lines.length).toBeLessThan(50);

    // Should have only what's needed
    expect(sceneContent).toContain('defineScene');
    expect(sceneContent).toContain('metadata');
    expect(sceneContent).toContain('entities');
    expect(sceneContent).toContain('assetReferences');
    expect(sceneContent).toContain('materials: ["red"]');

    // Should NOT have verbose inline data
    expect(sceneContent).not.toContain('materials: [');
    expect(sceneContent).not.toContain('prefabs: [');
    expect(sceneContent).not.toContain('inputAssets: [');

    console.log(`✅ Scene file is KISS: ${lines.length} lines (ID-based references)`);
  });
});
