import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { TsxFormatHandler } from '../TsxFormatHandler';
import { FsSceneStore } from '../../../../core/lib/serialization/common/FsSceneStore';

/**
 * Test that material IDs match filenames for proper resolution
 * Critical: Entity materialId must match the filename for loading to work
 */
describe('TsxFormatHandler - ID/Filename Matching', () => {
  const testScenesDir = './test-id-match/scenes';
  const testAssetsDir = './test-id-match/assets';

  beforeEach(async () => {
    await fs.rm('./test-id-match', { recursive: true, force: true });
    await fs.mkdir(testScenesDir, { recursive: true });
    await fs.mkdir(testAssetsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm('./test-id-match', { recursive: true, force: true });
  });

  it('should create material files with IDs as filenames', async () => {
    const sceneData = {
      entities: [
        {
          id: 1,
          name: 'Cube',
          components: {
            MeshRenderer: {
              meshId: 'cube',
              materialId: 'test123', // ID used in entity
            },
          },
        },
      ],
      materials: [
        {
          id: 'test123', // MUST match filename
          name: 'Test Material', // Name can be different
          shader: 'standard',
          materialType: 'solid',
          color: '#ff6600',
        },
      ],
    };

    const store = new FsSceneStore(testScenesDir);
    const handler = new TsxFormatHandler(store, testScenesDir);

    // Patch for testing
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
      name: 'IdMatchTest',
      payload: sceneData,
    });

    // Verify filename matches ID
    const materialPath = path.join(testAssetsDir, 'materials/test123.material.tsx');
    const exists = await fs
      .access(materialPath)
      .then(() => true)
      .catch(() => false);

    expect(exists).toBe(true);

    // Verify file contains correct ID
    const materialContent = await fs.readFile(materialPath, 'utf-8');
    expect(materialContent).toContain('"id": "test123"');
    expect(materialContent).toContain('"name": "Test Material"');
  });

  it('should create scene references matching material IDs', async () => {
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
          id: 'red', // Filename will be red.material.tsx
          name: 'Red Material',
          color: '#ff0000',
          shader: 'standard',
          materialType: 'solid',
        },
        {
          id: 'blue', // Filename will be blue.material.tsx
          name: 'Blue Material',
          color: '#0000ff',
          shader: 'standard',
          materialType: 'solid',
        },
      ],
    };

    const store = new FsSceneStore(testScenesDir);
    const handler = new TsxFormatHandler(store, testScenesDir);

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
      name: 'MultiIdTest',
      payload: sceneData,
    });

    // Verify files created with ID names
    const redExists = await fs
      .access(path.join(testAssetsDir, 'materials/red.material.tsx'))
      .then(() => true)
      .catch(() => false);

    const blueExists = await fs
      .access(path.join(testAssetsDir, 'materials/blue.material.tsx'))
      .then(() => true)
      .catch(() => false);

    expect(redExists).toBe(true);
    expect(blueExists).toBe(true);

    // Verify scene references match IDs
    const scenePath = path.join(testScenesDir, 'MultiIdTest.tsx');
    const sceneContent = await fs.readFile(scenePath, 'utf-8');

    expect(sceneContent).toContain('@/materials/red');
    expect(sceneContent).toContain('@/materials/blue');
  });

  it('should load scene correctly when IDs match filenames', async () => {
    const sceneData = {
      entities: [
        {
          id: 1,
          name: 'TestCube',
          components: {
            Transform: { position: [0, 0, 0] },
            MeshRenderer: {
              meshId: 'cube',
              materialId: 'orange',
            },
          },
        },
      ],
      materials: [
        {
          id: 'orange',
          name: 'Orange Material',
          shader: 'standard',
          materialType: 'solid',
          color: '#ff9900',
          metalness: 0.2,
          roughness: 0.5,
        },
      ],
    };

    const store = new FsSceneStore(testScenesDir);
    const handler = new TsxFormatHandler(store, testScenesDir);

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
      name: 'LoadTest',
      payload: sceneData,
    });

    // Load
    const loadResult = await handler.load({ name: 'LoadTest' });
    const loadedData = loadResult.data as any;

    // Verify material loaded correctly
    expect(loadedData.materials).toHaveLength(1);
    expect(loadedData.materials[0].id).toBe('orange');
    expect(loadedData.materials[0].name).toBe('Orange Material');
    expect(loadedData.materials[0].color).toBe('#ff9900');
    expect(loadedData.materials[0].metalness).toBe(0.2);

    // Verify entity references correct material
    const meshRenderer = loadedData.entities[0].components.MeshRenderer;
    expect(meshRenderer.materialId).toBe('orange');
  });

  it('should handle materials with special characters in IDs', async () => {
    const sceneData = {
      entities: [
        {
          id: 1,
          name: 'Cube',
          components: {
            MeshRenderer: {
              meshId: 'cube',
              materialId: 'test_material_01', // Underscore and numbers
            },
          },
        },
      ],
      materials: [
        {
          id: 'test_material_01',
          name: 'Test Material 01',
          color: '#ffffff',
          shader: 'standard',
          materialType: 'solid',
        },
      ],
    };

    const store = new FsSceneStore(testScenesDir);
    const handler = new TsxFormatHandler(store, testScenesDir);

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
      name: 'SpecialCharsTest',
      payload: sceneData,
    });

    // Verify file created with ID
    const materialPath = path.join(testAssetsDir, 'materials/test_material_01.material.tsx');
    const exists = await fs
      .access(materialPath)
      .then(() => true)
      .catch(() => false);

    expect(exists).toBe(true);

    // Load and verify
    const loadResult = await handler.load({ name: 'SpecialCharsTest' });
    const loadedData = loadResult.data as any;

    expect(loadedData.materials[0].id).toBe('test_material_01');
  });

  it('should document ID/filename convention in scene comments', async () => {
    const sceneData = {
      entities: [
        {
          id: 1,
          name: 'Cube',
          components: {
            MeshRenderer: { meshId: 'cube', materialId: 'doc_test' },
          },
        },
      ],
      materials: [
        {
          id: 'doc_test',
          name: 'Documentation Test',
          color: '#00ff00',
          shader: 'standard',
          materialType: 'solid',
        },
      ],
    };

    const store = new FsSceneStore(testScenesDir);
    const handler = new TsxFormatHandler(store, testScenesDir);

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
      name: 'DocTest',
      payload: sceneData,
    });

    const scenePath = path.join(testScenesDir, 'DocTest.tsx');
    const sceneContent = await fs.readFile(scenePath, 'utf-8');

    // Scene should be KISS and self-documenting
    expect(sceneContent).toContain('defineScene');
    expect(sceneContent).toContain('assetReferences');
    expect(sceneContent).toContain('@/materials/doc_test');

    // Entity should reference ID
    expect(sceneContent).toContain('"materialId": "doc_test"');

    console.log('✅ ID/filename convention verified:');
    console.log('   Entity materialId: "doc_test"');
    console.log('   Asset reference: @/materials/doc_test');
    console.log('   File location: materials/doc_test.material.tsx');
  });
});
