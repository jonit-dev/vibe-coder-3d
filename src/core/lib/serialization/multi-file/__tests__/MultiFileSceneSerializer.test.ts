import { describe, it, expect, beforeEach } from 'vitest';
import { MultiFileSceneSerializer } from '../MultiFileSceneSerializer';
import type { ISerializedEntity, ISceneMetadata } from '../../common/types';
import type { IMaterialDefinition } from '@core/materials/Material.types';
import type { IPrefabDefinition } from '@core/prefabs/Prefab.types';

describe('MultiFileSceneSerializer', () => {
  let serializer: MultiFileSceneSerializer;
  let metadata: ISceneMetadata;
  let entities: ISerializedEntity[];
  let materials: IMaterialDefinition[];

  beforeEach(() => {
    serializer = new MultiFileSceneSerializer();

    metadata = {
      name: 'TestScene',
      version: 2,
      timestamp: '2025-10-11T00:00:00.000Z',
    };

    entities = [
      {
        id: 0,
        name: 'Main Camera',
        components: {
          Transform: { position: [0, 5, -20] },
          Camera: { fov: 60, isMain: true },
        },
      },
      {
        id: 1,
        name: 'Tree',
        components: {
          Transform: { position: [-5, 0, 0] },
          MeshRenderer: {
            meshId: 'tree',
            materialId: 'mat_tree_green',
          },
        },
      },
      {
        id: 2,
        name: 'Rock',
        components: {
          Transform: { position: [5, 0, 0] },
          MeshRenderer: {
            meshId: 'rock',
            materialId: 'mat_stone',
          },
        },
      },
    ];

    materials = [
      {
        id: 'mat_tree_green',
        name: 'Tree Green',
        shader: 'standard',
        materialType: 'solid',
        color: '#2d5016',
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
  });

  describe('serializeMultiFile', () => {
    it('should generate index file with entities', () => {
      const result = serializer.serializeMultiFile(entities, metadata, materials, [], undefined, {
        extractMaterials: false,
      });

      expect(result.index).toContain('defineScene');
      expect(result.index).toContain('TestScene');
      expect(result.index).toContain('Main Camera');
      expect(result.index).toContain('Tree');
      expect(result.index).toContain('Rock');
    });

    it('should extract materials to separate file', () => {
      const result = serializer.serializeMultiFile(entities, metadata, materials, []);

      expect(result.materials).toBeDefined();
      expect(result.materials).toContain('defineMaterials');
      expect(result.materials).toContain('mat_tree_green');
      expect(result.materials).toContain('mat_stone');
      expect(result.materials).toContain('Tree Green');
      expect(result.materials).toContain('#2d5016');
    });

    it('should replace material IDs with references in entities', () => {
      const result = serializer.serializeMultiFile(entities, metadata, materials, []);

      expect(result.index).toContain('materialRef');
      expect(result.index).toContain('./materials/mat_tree_green');
      expect(result.index).toContain('./materials/mat_stone');
      expect(result.index).not.toContain('"materialId"');
    });

    it('should include assetReferences in index when materials extracted', () => {
      const result = serializer.serializeMultiFile(entities, metadata, materials, []);

      expect(result.index).toContain('assetReferences');
      expect(result.index).toContain('materials');
      expect(result.index).toContain('./TestScene.materials.tsx');
    });

    it('should not extract materials when option disabled', () => {
      const result = serializer.serializeMultiFile(entities, metadata, materials, [], undefined, {
        extractMaterials: false,
      });

      expect(result.materials).toBeUndefined();
      expect(result.index).not.toContain('assetReferences');
      expect(result.index).toContain('materialId');
    });

    it('should extract prefabs to separate file', () => {
      const prefabs: IPrefabDefinition[] = [
        {
          id: 'tree_prefab',
          name: 'Tree Prefab',
          version: 1,
          root: {
            name: 'Tree',
            components: {
              Transform: { position: [0, 0, 0] },
            },
          },
          metadata: {},
          dependencies: [],
          tags: [],
        },
      ];

      const result = serializer.serializeMultiFile(entities, metadata, materials, prefabs);

      expect(result.prefabs).toBeDefined();
      expect(result.prefabs).toContain('definePrefabs');
      expect(result.prefabs).toContain('tree_prefab');
      expect(result.prefabs).toContain('Tree Prefab');
    });

    it('should generate metadata file', () => {
      const result = serializer.serializeMultiFile(entities, metadata, materials, []);

      expect(result.metadata).toBeDefined();
      const metadataObj = JSON.parse(result.metadata!);
      expect(metadataObj.name).toBe('TestScene');
      expect(metadataObj.stats.materialCount).toBe(2);
      expect(metadataObj.stats.prefabCount).toBe(0);
    });

    it('should handle scenes with no materials', () => {
      const result = serializer.serializeMultiFile(entities, metadata, [], []);

      expect(result.materials).toBeUndefined();
      expect(result.index).not.toContain('assetReferences');
    });

    it('should handle entities without MeshRenderer', () => {
      const simpleEntities: ISerializedEntity[] = [
        {
          id: 0,
          name: 'Camera',
          components: {
            Transform: { position: [0, 0, 0] },
            Camera: { fov: 60 },
          },
        },
      ];

      const result = serializer.serializeMultiFile(simpleEntities, metadata, materials, []);

      expect(result.index).toContain('Camera');
      expect(result.index).not.toContain('materialRef');
    });

    it('should preserve material count in metadata', () => {
      const result = serializer.serializeMultiFile(entities, metadata, materials, []);

      const metadataObj = JSON.parse(result.metadata!);
      expect(metadataObj.stats.materialCount).toBe(2);
    });

    it('should generate valid TypeScript syntax in index file', () => {
      const result = serializer.serializeMultiFile(entities, metadata, materials, []);

      // Check for basic TypeScript syntax
      expect(result.index).toContain('import');
      expect(result.index).toContain('export default');
      expect(result.index).toContain('defineScene({');
      expect(result.index).toContain('});');
    });

    it('should generate valid TypeScript syntax in materials file', () => {
      const result = serializer.serializeMultiFile(entities, metadata, materials, []);

      expect(result.materials).toContain('import');
      expect(result.materials).toContain('export default');
      expect(result.materials).toContain('defineMaterials(');
      expect(result.materials).toContain(');');
    });
  });
});
