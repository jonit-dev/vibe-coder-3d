import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { TsxFormatHandler } from '../TsxFormatHandler';
import { FsSceneStore } from '../../../../core/lib/serialization/common/FsSceneStore';

/**
 * Integration test simulating the full save workflow:
 * 1. User creates a scene with materials
 * 2. User saves the scene
 * 3. Verify materials are saved as separate files in src/game/assets/
 * 4. Verify scene file only contains entity data + asset references
 */
describe('TsxFormatHandler - Full Save Workflow Integration', () => {
  const testScenesDir = './test-output-integration/scenes';
  const testAssetsDir = './test-output-integration/assets';

  beforeEach(async () => {
    // Clean up
    await fs.rm('./test-output-integration', { recursive: true, force: true });

    // Create directories
    await fs.mkdir(testScenesDir, { recursive: true });
    await fs.mkdir(testAssetsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm('./test-output-integration', { recursive: true, force: true });
  });

  it('should save scene with Red material and confirm proper references', async () => {
    // Step 1: User creates a scene with a "Red" material
    const sceneData = {
      entities: [
        {
          id: 0,
          name: 'Ground',
          components: {
            PersistentId: { id: 'ground-123' },
            Transform: {
              position: [0, -0.5, 0],
              scale: [20, 0.1, 20],
            },
            MeshRenderer: {
              meshId: 'cube',
              materialId: 'red', // References the Red material
            },
          },
        },
      ],
      materials: [
        {
          id: 'red',
          name: 'Red',
          shader: 'standard',
          materialType: 'solid',
          color: '#ff0000',
          metalness: 0,
          roughness: 0.7,
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
      inputAssets: [
        {
          name: 'Default Input',
          controlSchemes: [],
          actionMaps: [],
        },
      ],
    };

    // Step 2: User saves the scene (simulate the save endpoint call)
    const store = new FsSceneStore(testScenesDir);
    const handler = new TsxFormatHandler(store, testScenesDir);

    // Temporarily patch to use test directories
    const originalSave = handler.save.bind(handler);
    handler.save = async function (args) {
      // Override import to use test directory
      const mod = await import('../../../assets-api/FsAssetStore');
      const OriginalFsAssetStore = mod.FsAssetStore;

      // Patch the class
      const PatchedFsAssetStore = class extends OriginalFsAssetStore {
        constructor() {
          super(testAssetsDir, testScenesDir);
        }
      };

      // Replace temporarily
      Object.defineProperty(mod, 'FsAssetStore', {
        value: PatchedFsAssetStore,
        writable: true,
        configurable: true,
      });

      try {
        return await originalSave(args);
      } finally {
        // Restore original
        Object.defineProperty(mod, 'FsAssetStore', {
          value: OriginalFsAssetStore,
          writable: true,
          configurable: true,
        });
      }
    };

    const saveResult = await handler.save({
      name: 'TestScene',
      payload: sceneData,
    });

    expect(saveResult.filename).toBe('TestScene.tsx');

    // Step 3: Verify Red material was saved as a separate file
    const redMaterialPath = path.join(testAssetsDir, 'materials/red.material.tsx');
    const materialExists = await fs
      .access(redMaterialPath)
      .then(() => true)
      .catch(() => false);

    expect(materialExists).toBe(true);

    const materialContent = await fs.readFile(redMaterialPath, 'utf-8');
    expect(materialContent).toContain('defineMaterial');
    expect(materialContent).toContain('"id": "red"');
    expect(materialContent).toContain('"name": "Red"');
    expect(materialContent).toContain('"color": "#ff0000"');

    // Step 4: Verify input asset was saved
    const inputPath = path.join(testAssetsDir, 'inputs/DefaultInput.input.tsx');
    const inputExists = await fs
      .access(inputPath)
      .then(() => true)
      .catch(() => false);

    expect(inputExists).toBe(true);

    // Step 5: Verify scene file has ONLY entity data + references
    const scenePath = path.join(testScenesDir, 'TestScene.tsx');
    const sceneContent = await fs.readFile(scenePath, 'utf-8');

    // Must have defineScene
    expect(sceneContent).toContain('import { defineScene }');
    expect(sceneContent).toContain('export default defineScene({');

    // Must have metadata
    expect(sceneContent).toContain('metadata:');
    expect(sceneContent).toContain('"name": "TestScene"');

    // Must have entities with compressed data (defaults omitted)
    expect(sceneContent).toContain('entities:');
    expect(sceneContent).toContain('"name": "Ground"');
    expect(sceneContent).toContain('MeshRenderer');
    expect(sceneContent).toContain('"materialId": "red"');

    // Must have asset references
    expect(sceneContent).toContain('assetReferences:');
    expect(sceneContent).toContain('@/materials/red');
    expect(sceneContent).toContain('@/inputs/DefaultInput');

    // Must NOT have inline material data
    expect(sceneContent).not.toContain('materials: [');
    expect(sceneContent).not.toContain('"shader": "standard"');
    expect(sceneContent).not.toContain('#ff0000');

    // Must NOT have inline input data
    expect(sceneContent).not.toContain('inputAssets: [');
    expect(sceneContent).not.toContain('controlSchemes');

    // Step 6: Verify scene is KISS (concise)
    const lines = sceneContent.split('\n');
    expect(lines.length).toBeLessThan(60); // Much smaller than 387!

    console.log(`✅ Scene saved with ${lines.length} lines (was 387 before)`);
    console.log(`✅ Material saved to: ${redMaterialPath}`);
    console.log(`✅ Input saved to: ${inputPath}`);
  });

  it('should handle multiple materials and deduplicate correctly', async () => {
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
              materialId: 'blue',
            },
          },
        },
        {
          id: 3,
          name: 'Cube3',
          components: {
            MeshRenderer: {
              meshId: 'cube',
              materialId: 'red', // Duplicate - should reuse
            },
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

    // Same patching as before
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
      name: 'MultiMaterialScene',
      payload: sceneData,
    });

    // Verify 2 material files created (not 3, because red is reused)
    const materialsDir = path.join(testAssetsDir, 'materials');
    const materialFiles = await fs.readdir(materialsDir);

    expect(materialFiles.length).toBe(2);
    expect(materialFiles).toContain('red.material.tsx');
    expect(materialFiles).toContain('blue.material.tsx');

    // Verify scene has both references
    const scenePath = path.join(testScenesDir, 'MultiMaterialScene.tsx');
    const sceneContent = await fs.readFile(scenePath, 'utf-8');

    expect(sceneContent).toContain('@/materials/red');
    expect(sceneContent).toContain('@/materials/blue');

    // Count reference occurrences (should appear once each in assetReferences)
    const redMatches = sceneContent.match(/@\/materials\/red/g);
    const blueMatches = sceneContent.match(/@\/materials\/blue/g);

    expect(redMatches?.length).toBe(1);
    expect(blueMatches?.length).toBe(1);
  });

  it('should create directory structure if it does not exist', async () => {
    // Delete everything to simulate first run
    await fs.rm('./test-output-integration', { recursive: true, force: true });

    const sceneData = {
      entities: [
        {
          id: 1,
          name: 'Test',
          components: {
            Transform: { position: [0, 0, 0] },
          },
        },
      ],
      materials: [
        {
          id: 'test',
          name: 'Test',
          color: '#ffffff',
          shader: 'standard',
          materialType: 'solid',
        },
      ],
    };

    const store = new FsSceneStore(testScenesDir);
    const handler = new TsxFormatHandler(store, testScenesDir);

    // Patch as before
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

    // Should create directories automatically
    await expect(
      handler.save({
        name: 'FirstScene',
        payload: sceneData,
      }),
    ).resolves.toBeDefined();

    // Verify directories were created
    const sceneDirExists = await fs
      .access(testScenesDir)
      .then(() => true)
      .catch(() => false);
    const assetsDirExists = await fs
      .access(path.join(testAssetsDir, 'materials'))
      .then(() => true)
      .catch(() => false);

    expect(sceneDirExists).toBe(true);
    expect(assetsDirExists).toBe(true);
  });
});
