import { describe, it, expect, beforeEach } from 'vitest';
import {
  MaterialDeduplicator,
  hashMaterial,
  generateMaterialId,
  extractMaterialFromMeshRenderer,
  replaceMaterialWithReference,
} from '../MaterialHasher';

describe('MaterialHasher', () => {
  describe('hashMaterial', () => {
    it('should generate consistent hash for same material', () => {
      const material = {
        color: '#ff0000',
        roughness: 0.7,
        metalness: 0,
      };

      const hash1 = hashMaterial(material);
      const hash2 = hashMaterial(material);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(8); // Simple hash is 8 chars
    });

    it('should generate different hashes for different materials', () => {
      const material1 = { color: '#ff0000' };
      const material2 = { color: '#00ff00' };

      const hash1 = hashMaterial(material1);
      const hash2 = hashMaterial(material2);

      expect(hash1).not.toBe(hash2);
    });

    it('should be order-independent', () => {
      const material1 = {
        color: '#ff0000',
        roughness: 0.7,
        metalness: 0,
      };

      const material2 = {
        metalness: 0,
        color: '#ff0000',
        roughness: 0.7,
      };

      const hash1 = hashMaterial(material1);
      const hash2 = hashMaterial(material2);

      expect(hash1).toBe(hash2);
    });
  });

  describe('generateMaterialId', () => {
    it('should generate material ID with prefix', () => {
      const material = { color: '#ff0000' };
      const id = generateMaterialId(material);

      expect(id).toMatch(/^mat_[a-f0-9]{8}$/); // 8 chars hash
    });

    it('should use custom prefix', () => {
      const material = { color: '#ff0000' };
      const id = generateMaterialId(material, 'custom');

      expect(id).toMatch(/^custom_[a-f0-9]{8}$/); // 8 chars hash
    });
  });

  describe('MaterialDeduplicator', () => {
    let deduplicator: MaterialDeduplicator;

    beforeEach(() => {
      deduplicator = new MaterialDeduplicator();
    });

    it('should add new material and return ID', () => {
      const material = { color: '#ff0000', roughness: 0.7 };
      const id = deduplicator.addMaterial(material);

      expect(id).toMatch(/^mat_/);
      expect(deduplicator.getMaterialCount()).toBe(1);
    });

    it('should deduplicate identical materials', () => {
      const material = { color: '#ff0000', roughness: 0.7 };

      const id1 = deduplicator.addMaterial(material);
      const id2 = deduplicator.addMaterial(material);

      expect(id1).toBe(id2);
      expect(deduplicator.getMaterialCount()).toBe(1);
    });

    it('should store different materials separately', () => {
      const material1 = { color: '#ff0000' };
      const material2 = { color: '#00ff00' };

      const id1 = deduplicator.addMaterial(material1);
      const id2 = deduplicator.addMaterial(material2);

      expect(id1).not.toBe(id2);
      expect(deduplicator.getMaterialCount()).toBe(2);
    });

    it('should use proposed ID if provided and not conflicting', () => {
      const material = { color: '#ff0000' };
      const id = deduplicator.addMaterial(material, 'my-material');

      expect(id).toBe('my-material');
    });

    it('should handle ID collisions by appending counter', () => {
      const material1 = { color: '#ff0000' };
      const material2 = { color: '#00ff00' };

      const id1 = deduplicator.addMaterial(material1, 'mat');
      const id2 = deduplicator.addMaterial(material2, 'mat');

      expect(id1).toBe('mat');
      expect(id2).toBe('mat_1');
    });

    it('should retrieve material by ID', () => {
      const material = { color: '#ff0000', roughness: 0.7 };
      const id = deduplicator.addMaterial(material, 'test-mat');

      const retrieved = deduplicator.getMaterialById(id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('test-mat');
      expect(retrieved?.color).toBe('#ff0000');
    });

    it('should return all unique materials', () => {
      const mat1 = { color: '#ff0000' };
      const mat2 = { color: '#00ff00' };

      deduplicator.addMaterial(mat1);
      deduplicator.addMaterial(mat2);
      deduplicator.addMaterial(mat1); // Duplicate

      const materials = deduplicator.getMaterials();

      expect(materials).toHaveLength(2);
    });

    it('should calculate deduplication stats', () => {
      const mat = { color: '#ff0000' };

      // Add same material 5 times
      for (let i = 0; i < 5; i++) {
        deduplicator.addMaterial(mat);
      }

      const stats = deduplicator.getStats();

      expect(stats.uniqueMaterials).toBe(1);
      expect(stats.totalReferences).toBe(1); // Only 1 ID registered
    });

    it('should clear all materials', () => {
      deduplicator.addMaterial({ color: '#ff0000' });
      deduplicator.addMaterial({ color: '#00ff00' });

      expect(deduplicator.getMaterialCount()).toBe(2);

      deduplicator.clear();

      expect(deduplicator.getMaterialCount()).toBe(0);
    });
  });

  describe('extractMaterialFromMeshRenderer', () => {
    it('should extract material from MeshRenderer data', () => {
      const meshData = {
        meshId: 'cube',
        materialId: 'default',
        material: {
          color: '#ff0000',
          roughness: 0.7,
        },
      };

      const material = extractMaterialFromMeshRenderer(meshData);

      expect(material).toEqual({
        color: '#ff0000',
        roughness: 0.7,
      });
    });

    it('should return undefined if no material present', () => {
      const meshData = {
        meshId: 'cube',
        materialId: 'default',
      };

      const material = extractMaterialFromMeshRenderer(meshData);

      expect(material).toBeUndefined();
    });

    it('should return undefined if material is not an object', () => {
      const meshData = {
        meshId: 'cube',
        material: 'string-value',
      };

      const material = extractMaterialFromMeshRenderer(meshData);

      expect(material).toBeUndefined();
    });
  });

  describe('replaceMaterialWithReference', () => {
    it('should replace inline material with materialId', () => {
      const meshData = {
        meshId: 'cube',
        enabled: true,
        material: {
          color: '#ff0000',
          roughness: 0.7,
        },
      };

      const result = replaceMaterialWithReference(meshData, 'mat_abc123');

      expect(result).toEqual({
        meshId: 'cube',
        enabled: true,
        materialId: 'mat_abc123',
      });
      expect(result).not.toHaveProperty('material');
    });

    it('should preserve other properties', () => {
      const meshData = {
        meshId: 'cube',
        enabled: true,
        castShadows: true,
        material: { color: '#ff0000' },
      };

      const result = replaceMaterialWithReference(meshData, 'mat_123');

      expect(result).toMatchObject({
        meshId: 'cube',
        enabled: true,
        castShadows: true,
        materialId: 'mat_123',
      });
    });
  });
});
