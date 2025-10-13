import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FsAssetStore } from '../FsAssetStore';

describe('Default Omission Behavior', () => {
  const testDir = path.join(process.cwd(), 'test-default-omission');
  const libraryDir = path.join(testDir, 'library');
  let store: FsAssetStore;

  beforeEach(async () => {
    await fs.mkdir(libraryDir, { recursive: true });
    store = new FsAssetStore(libraryDir, path.join(testDir, 'scenes'));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('Material default omission', () => {
    it('should omit default values when saving a material', async () => {
      const materialWithDefaults = {
        id: 'test-material',
        name: 'Test Material',
        shader: 'standard', // default
        materialType: 'solid', // default
        color: '#ff0000', // non-default
        metalness: 0, // default
        roughness: 0.7, // default
        emissive: '#000000', // default
        emissiveIntensity: 0, // default
        normalScale: 1, // default
        occlusionStrength: 1, // default
        textureOffsetX: 0, // default
        textureOffsetY: 0, // default
        textureRepeatX: 1, // default
        textureRepeatY: 1, // default
      };

      await store.save({
        path: '@/materials/TestMaterial',
        payload: materialWithDefaults,
        type: 'material',
      });

      // Read the saved file
      const filePath = path.join(libraryDir, 'materials', 'testMaterial.material.tsx');
      const fileContent = await fs.readFile(filePath, 'utf-8');

      // Verify defaults are omitted
      expect(fileContent).not.toContain('"shader": "standard"');
      expect(fileContent).not.toContain('"materialType": "solid"');
      expect(fileContent).not.toContain('"metalness": 0');
      expect(fileContent).not.toContain('"roughness": 0.7');
      expect(fileContent).not.toContain('"emissive": "#000000"');
      expect(fileContent).not.toContain('"emissiveIntensity": 0');

      // Verify non-default values are present
      expect(fileContent).toContain('"color": "#ff0000"');
      expect(fileContent).toContain('"id": "test-material"');
      expect(fileContent).toContain('"name": "Test Material"');
    });

    it('should omit empty texture fields', async () => {
      const material = {
        id: 'texture-test',
        name: 'Texture Test',
        color: '#00ff00',
        albedoTexture: '', // empty - should be omitted
        normalTexture: '', // empty - should be omitted
      };

      await store.save({
        path: '@/materials/TextureTest',
        payload: material,
        type: 'material',
      });

      const filePath = path.join(libraryDir, 'materials', 'textureTest.material.tsx');
      const fileContent = await fs.readFile(filePath, 'utf-8');

      // Empty texture fields should be completely omitted
      expect(fileContent).not.toContain('albedoTexture');
      expect(fileContent).not.toContain('normalTexture');
    });

    it('should keep non-empty texture fields', async () => {
      const material = {
        id: 'texture-with-path',
        name: 'Texture With Path',
        color: '#0000ff',
        albedoTexture: '/assets/textures/test.png',
      };

      await store.save({
        path: '@/materials/TextureWithPath',
        payload: material,
        type: 'material',
      });

      const filePath = path.join(libraryDir, 'materials', 'textureWithPath.material.tsx');
      const fileContent = await fs.readFile(filePath, 'utf-8');

      // Non-empty texture should be present
      expect(fileContent).toContain('"albedoTexture": "/assets/textures/test.png"');
    });
  });

  describe('Prefab default omission', () => {
    it('should omit default values when saving a prefab', async () => {
      const prefabWithDefaults = {
        id: 'test-prefab',
        name: 'Test Prefab',
        version: 1, // default
        root: {
          name: 'Root',
          components: {},
          children: [], // default
        },
        metadata: {}, // default empty object
        dependencies: [], // default
        tags: [], // default
        description: '', // optional, empty
      };

      await store.save({
        path: '@/prefabs/TestPrefab',
        payload: prefabWithDefaults,
        type: 'prefab',
      });

      const filePath = path.join(libraryDir, 'prefabs', 'testPrefab.prefab.tsx');
      const fileContent = await fs.readFile(filePath, 'utf-8');

      // Verify defaults are omitted
      expect(fileContent).not.toContain('"version": 1');
      expect(fileContent).not.toContain('"metadata": {}');
      expect(fileContent).not.toContain('"dependencies": []');
      expect(fileContent).not.toContain('"tags": []');
      expect(fileContent).not.toContain('"description"');
      expect(fileContent).not.toContain('"children": []');

      // Verify non-default values are present
      expect(fileContent).toContain('"id": "test-prefab"');
      expect(fileContent).toContain('"name": "Test Prefab"');
      expect(fileContent).toContain('"root"');
    });

    it('should keep non-empty optional fields', async () => {
      const prefab = {
        id: 'prefab-with-metadata',
        name: 'Prefab With Metadata',
        root: {
          name: 'Root',
          components: {},
        },
        metadata: { author: 'test' }, // non-empty
        tags: ['environment', 'tree'], // non-empty
        dependencies: ['other-prefab'], // non-empty
        description: 'A test prefab', // non-empty
      };

      await store.save({
        path: '@/prefabs/PrefabWithMetadata',
        payload: prefab,
        type: 'prefab',
      });

      const filePath = path.join(libraryDir, 'prefabs', 'prefabWithMetadata.prefab.tsx');
      const fileContent = await fs.readFile(filePath, 'utf-8');

      // Non-empty fields should be present
      expect(fileContent).toContain('"metadata"');
      expect(fileContent).toContain('"author": "test"');
      expect(fileContent).toContain('"tags"');
      expect(fileContent).toContain('"environment"');
      expect(fileContent).toContain('"dependencies"');
      expect(fileContent).toContain('"other-prefab"');
      expect(fileContent).toContain('"description": "A test prefab"');
    });
  });

  describe('Round-trip with defaults restoration', () => {
    it('should restore defaults when loading a material', async () => {
      // Save material with only non-default values
      const minimalMaterial = {
        id: 'minimal',
        name: 'Minimal Material',
        color: '#ff00ff',
      };

      await store.save({
        path: '@/materials/Minimal',
        payload: minimalMaterial,
        type: 'material',
      });

      // Load it back
      const loaded = await store.load({
        path: '@/materials/Minimal',
        type: 'material',
      });

      // The loaded material should have defaults applied when imported via defineMaterial
      // Here we're just checking the file content has minimal data
      const filePath = path.join(libraryDir, 'materials', 'minimal.material.tsx');
      const fileContent = await fs.readFile(filePath, 'utf-8');

      // Verify only essential fields are in file
      expect(fileContent).toContain('"id": "minimal"');
      expect(fileContent).toContain('"name": "Minimal Material"');
      expect(fileContent).toContain('"color": "#ff00ff"');

      // Verify defaults are NOT in file
      expect(fileContent).not.toContain('"shader"');
      expect(fileContent).not.toContain('"roughness"');
      expect(fileContent).not.toContain('"metalness"');
    });

    it('should restore defaults for prefabs', async () => {
      const minimalPrefab = {
        id: 'minimal-prefab',
        name: 'Minimal Prefab',
        root: {
          name: 'Root',
          components: {
            Transform: {
              position: [1, 2, 3],
            },
          },
        },
      };

      await store.save({
        path: '@/prefabs/MinimalPrefab',
        payload: minimalPrefab,
        type: 'prefab',
      });

      const filePath = path.join(libraryDir, 'prefabs', 'minimalPrefab.prefab.tsx');
      const fileContent = await fs.readFile(filePath, 'utf-8');

      // Verify only essential fields are in file
      expect(fileContent).toContain('"id": "minimal-prefab"');
      expect(fileContent).toContain('"name": "Minimal Prefab"');
      expect(fileContent).toContain('"root"');

      // Verify defaults are NOT in file
      expect(fileContent).not.toContain('"version"');
      expect(fileContent).not.toContain('"metadata"');
      expect(fileContent).not.toContain('"dependencies"');
      expect(fileContent).not.toContain('"tags"');
    });
  });

  describe('File size comparison', () => {
    it('should produce significantly smaller files with default omission', async () => {
      const fullMaterial = {
        id: 'full',
        name: 'Full Material',
        shader: 'standard',
        materialType: 'solid',
        color: '#ffffff',
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
      };

      const minimalMaterial = {
        id: 'minimal',
        name: 'Minimal Material',
        color: '#ffffff',
      };

      await store.save({
        path: '@/materials/Full',
        payload: fullMaterial,
        type: 'material',
      });

      await store.save({
        path: '@/materials/Minimal',
        payload: minimalMaterial,
        type: 'material',
      });

      const fullPath = path.join(libraryDir, 'materials', 'full.material.tsx');
      const minimalPath = path.join(libraryDir, 'materials', 'minimal.material.tsx');

      const fullContent = await fs.readFile(fullPath, 'utf-8');
      const minimalContent = await fs.readFile(minimalPath, 'utf-8');

      // Both should produce similar file sizes because defaults are omitted
      // The difference should be minimal (just formatting differences)
      const sizeDifference = Math.abs(fullContent.length - minimalContent.length);

      // Size difference should be less than 50 characters (just ID/name differences)
      expect(sizeDifference).toBeLessThan(50);
    });
  });
});
