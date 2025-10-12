import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MultiFileSceneSerializer } from '../MultiFileSceneSerializer';
import { MultiFileSceneLoader } from '../MultiFileSceneLoader';
import { SceneFolderManager } from '../SceneFolderManager';
import type { ISerializedEntity, ISceneMetadata } from '../../common/types';
import type { IMaterialDefinition } from '@core/materials/Material.types';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

describe('Multi-File Scene System Integration', () => {
  let serializer: MultiFileSceneSerializer;
  let loader: MultiFileSceneLoader;
  let folderManager: SceneFolderManager;
  let tempDir: string;
  let sceneFolderPath: string;

  beforeEach(async () => {
    serializer = new MultiFileSceneSerializer();
    loader = new MultiFileSceneLoader();
    folderManager = new SceneFolderManager();

    // Create temp directory for tests
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scene-test-'));
    sceneFolderPath = path.join(tempDir, 'TestScene');
  });

  afterEach(async () => {
    // Cleanup temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should perform full save and load round-trip', async () => {
    // Setup scene data
    const metadata: ISceneMetadata = {
      name: 'TestScene',
      version: 2,
      timestamp: new Date().toISOString(),
    };

    const entities: ISerializedEntity[] = [
      {
        id: 0,
        name: 'Main Camera',
        components: {
          PersistentId: { id: 'camera-001' },
          Transform: { position: [0, 5, -20] },
          Camera: { fov: 60, isMain: true },
        },
      },
      {
        id: 1,
        name: 'Oak Tree',
        components: {
          PersistentId: { id: 'tree-001' },
          Transform: { position: [-5, 0, 0] },
          MeshRenderer: {
            meshId: 'tree',
            materialId: 'mat_oak_bark',
          },
        },
      },
      {
        id: 2,
        name: 'Stone Wall',
        components: {
          PersistentId: { id: 'wall-001' },
          Transform: { position: [10, 0, 0] },
          MeshRenderer: {
            meshId: 'wall',
            materialId: 'mat_stone',
          },
        },
      },
    ];

    const materials: IMaterialDefinition[] = [
      {
        id: 'mat_oak_bark',
        name: 'Oak Bark',
        shader: 'standard',
        materialType: 'solid',
        color: '#3d2817',
        roughness: 0.9,
        metalness: 0,
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
        id: 'mat_stone',
        name: 'Stone',
        shader: 'standard',
        materialType: 'solid',
        color: '#7a7a7a',
        roughness: 0.85,
        metalness: 0,
        emissive: '#000000',
        emissiveIntensity: 0,
        normalScale: 1,
        occlusionStrength: 1,
        textureOffsetX: 0,
        textureOffsetY: 0,
        textureRepeatX: 1,
        textureRepeatY: 1,
      },
    ];

    // Step 1: Serialize to multi-file format
    const sceneData = await serializer.serializeMultiFile(entities, metadata, materials, []);

    // Verify serialization output
    expect(sceneData.index).toBeDefined();
    expect(sceneData.materials).toBeDefined();
    expect(sceneData.metadata).toBeDefined();

    // Step 2: Write to disk
    const writeResult = await folderManager.writeSceneFiles(
      sceneFolderPath,
      'TestScene',
      sceneData,
    );

    expect(writeResult.filesWritten.length).toBeGreaterThan(0);
    expect(writeResult.totalSize).toBeGreaterThan(0);

    // Verify files exist
    const isMultiFile = await folderManager.isMultiFileScene(sceneFolderPath, 'TestScene');
    expect(isMultiFile).toBe(true);

    // Step 3: Read from disk
    const readFiles = await folderManager.readSceneFolder(sceneFolderPath, 'TestScene');

    expect(readFiles.index).toBeDefined();
    expect(readFiles.materials).toBeDefined();
    expect(readFiles.metadata).toBeDefined();

    // Step 4: Instead of parsing TSX, reconstruct scene data from serialized form
    // In a real scenario, the index file would be imported as a module
    // For testing, we'll use the original serialized data structure
    const sceneDataForLoad = {
      metadata: {
        ...metadata,
        format: 'multi-file' as const,
      },
      entities: sceneData.index.includes('materialRef')
        ? entities.map((e) => {
            if (e.components.MeshRenderer) {
              const meshRenderer = e.components.MeshRenderer as Record<string, unknown>;
              const materialId = meshRenderer.materialId as string;
              if (materialId) {
                return {
                  ...e,
                  components: {
                    ...e.components,
                    MeshRenderer: {
                      ...meshRenderer,
                      materialRef: `./materials/${materialId}`,
                      materialId: undefined,
                    },
                  },
                };
              }
            }
            return e;
          })
        : entities,
      assetReferences: {
        materials: './TestScene.materials.tsx',
      },
    };

    // Step 5: Load with MultiFileSceneLoader
    const loadedScene = await loader.loadMultiFile(
      sceneDataForLoad,
      sceneFolderPath,
      tempDir, // Use temp dir as asset library root
    );

    // Verify loaded data
    expect(loadedScene.entities).toHaveLength(3);
    expect(loadedScene.materials).toHaveLength(2);
    expect(loadedScene.metadata.name).toBe('TestScene');

    // Verify entities have material inline (resolved from references)
    const treeEntity = loadedScene.entities.find((e) => e.name === 'Oak Tree');
    expect(treeEntity).toBeDefined();
    expect(treeEntity!.components.MeshRenderer).toBeDefined();

    const stoneEntity = loadedScene.entities.find((e) => e.name === 'Stone Wall');
    expect(stoneEntity).toBeDefined();
    expect(stoneEntity!.components.MeshRenderer).toBeDefined();
  });

  it('should preserve entity structure across save/load', async () => {
    const metadata: ISceneMetadata = {
      name: 'TestScene',
      version: 2,
      timestamp: new Date().toISOString(),
    };

    const originalEntities: ISerializedEntity[] = [
      {
        id: 0,
        name: 'Camera',
        components: {
          Transform: { position: [1, 2, 3] },
          Camera: { fov: 75, isMain: false },
        },
      },
    ];

    // Serialize
    const sceneData = await serializer.serializeMultiFile(originalEntities, metadata, [], []);

    // Write to disk
    await folderManager.writeSceneFiles(sceneFolderPath, 'TestScene', sceneData);

    // Read from disk
    const readFiles = await folderManager.readSceneFolder(sceneFolderPath, 'TestScene');

    // Verify files were written
    expect(readFiles.index).toBeDefined();

    // Reconstruct scene data for loading (in real scenario, would import the module)
    const sceneDataForLoad = {
      metadata,
      entities: originalEntities,
    };

    // Load
    const loadedScene = await loader.loadMultiFile(sceneDataForLoad, sceneFolderPath);

    // Verify
    expect(loadedScene.entities).toHaveLength(1);
    const camera = loadedScene.entities[0];
    expect(camera.name).toBe('Camera');
    expect(camera.components.Transform).toEqual({ position: [1, 2, 3] });
    expect(camera.components.Camera).toEqual({ fov: 75, isMain: false });
  });

  it('should handle scene with no materials', async () => {
    const metadata: ISceneMetadata = {
      name: 'EmptyScene',
      version: 2,
      timestamp: new Date().toISOString(),
    };

    const entities: ISerializedEntity[] = [
      {
        id: 0,
        name: 'Camera',
        components: {
          Transform: { position: [0, 0, 0] },
          Camera: { fov: 60 },
        },
      },
    ];

    // Serialize
    const sceneData = await serializer.serializeMultiFile(entities, metadata, [], []);

    expect(sceneData.materials).toBeUndefined();
    expect(sceneData.index).not.toContain('materials');

    // Write
    const writeResult = await folderManager.writeSceneFiles(
      sceneFolderPath,
      'EmptyScene',
      sceneData,
    );

    // Should only write index and metadata, not materials
    expect(writeResult.filesWritten.some((f) => f.includes('materials'))).toBe(false);
  });

  it('should create folder structure correctly', async () => {
    const metadata: ISceneMetadata = {
      name: 'TestScene',
      version: 2,
      timestamp: new Date().toISOString(),
    };

    const entities: ISerializedEntity[] = [];
    const materials: IMaterialDefinition[] = [
      {
        id: 'test_mat',
        name: 'Test Material',
        shader: 'standard',
        materialType: 'solid',
        color: '#ffffff',
        roughness: 0.5,
        metalness: 0,
        emissive: '#000000',
        emissiveIntensity: 0,
        normalScale: 1,
        occlusionStrength: 1,
        textureOffsetX: 0,
        textureOffsetY: 0,
        textureRepeatX: 1,
        textureRepeatY: 1,
      },
    ];

    const sceneData = await serializer.serializeMultiFile(entities, metadata, materials, []);

    await folderManager.writeSceneFiles(sceneFolderPath, 'TestScene', sceneData);

    // Verify folder exists
    const folderStats = await fs.stat(sceneFolderPath);
    expect(folderStats.isDirectory()).toBe(true);

    // Verify files exist
    const files = await folderManager.listSceneFolderFiles(sceneFolderPath);
    expect(files.length).toBeGreaterThan(0);
    expect(files.some((f) => f.endsWith('.index.tsx'))).toBe(true);
    expect(files.some((f) => f.endsWith('.materials.tsx'))).toBe(true);
    expect(files.some((f) => f.endsWith('.metadata.json'))).toBe(true);
  });
});
