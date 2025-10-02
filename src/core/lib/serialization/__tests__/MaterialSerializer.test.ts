import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MaterialSerializer } from '../MaterialSerializer';
import { MaterialRegistry } from '@core/materials/MaterialRegistry';
import type { IMaterialDefinition } from '@core/materials';

describe('MaterialSerializer', () => {
  let serializer: MaterialSerializer;
  let registry: MaterialRegistry;

  beforeEach(() => {
    serializer = new MaterialSerializer();
    registry = MaterialRegistry.getInstance();
    // Clear registry
    registry.clearMaterials();
  });

  describe('serialize', () => {
    it('should serialize default material only', () => {
      const result = serializer.serialize();
      // MaterialRegistry always has a default material
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('default');
    });

    it('should serialize single material', () => {
      const material: IMaterialDefinition = {
        id: 'test-mat',
        name: 'Test Material',
        shader: 'standard',
        materialType: 'solid',
        color: '#ff0000',
        metalness: 0.5,
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

      registry.upsert(material);

      const result = serializer.serialize();
      // Should have default + test-mat
      expect(result).toHaveLength(2);
      const testMat = result.find((m) => m.id === 'test-mat');
      expect(testMat).toMatchObject({
        id: 'test-mat',
        name: 'Test Material',
        shader: 'standard',
        color: '#ff0000',
      });
    });

    it('should serialize multiple materials', () => {
      const materials: IMaterialDefinition[] = [
        {
          id: 'mat1',
          name: 'Material 1',
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
        {
          id: 'mat2',
          name: 'Material 2',
          shader: 'unlit',
          materialType: 'texture',
          color: '#00ff00',
          metalness: 0,
          roughness: 0.7,
          emissive: '#000000',
          emissiveIntensity: 0,
          albedoTexture: '/test.png',
          normalScale: 1,
          occlusionStrength: 1,
          textureOffsetX: 0,
          textureOffsetY: 0,
          textureRepeatX: 1,
          textureRepeatY: 1,
        },
      ];

      materials.forEach((mat) => registry.upsert(mat));

      const result = serializer.serialize();
      // Should have default + mat1 + mat2
      expect(result).toHaveLength(3);
      expect(result.some((m) => m.id === 'mat1')).toBe(true);
      expect(result.some((m) => m.id === 'mat2')).toBe(true);
    });
  });

  describe('deserialize', () => {
    it('should deserialize empty array', () => {
      expect(() => serializer.deserialize([])).not.toThrow();
      expect(registry.get('any')).toBeUndefined();
    });

    it('should deserialize single material', () => {
      const materials = [
        {
          id: 'test-mat',
          name: 'Test Material',
          shader: 'standard',
          materialType: 'solid',
          color: '#ff0000',
          metalness: 0.5,
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
      ];

      serializer.deserialize(materials);

      const result = registry.get('test-mat');
      expect(result).toBeDefined();
      expect(result?.name).toBe('Test Material');
      expect(result?.color).toBe('#ff0000');
    });

    it('should deserialize multiple materials', () => {
      const materials = [
        {
          id: 'mat1',
          name: 'Material 1',
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
        {
          id: 'mat2',
          name: 'Material 2',
          shader: 'unlit',
          materialType: 'solid',
          color: '#00ff00',
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
      ];

      serializer.deserialize(materials);

      expect(registry.get('mat1')).toBeDefined();
      expect(registry.get('mat2')).toBeDefined();
    });

    it('should handle invalid material data gracefully', () => {
      const invalidMaterials = [
        { id: 'invalid' }, // Missing required fields
      ];

      // Should not throw but may log warnings
      expect(() => serializer.deserialize(invalidMaterials)).not.toThrow();
    });

    it('should overwrite existing materials', () => {
      const material1 = {
        id: 'test-mat',
        name: 'Original',
        shader: 'standard' as const,
        materialType: 'solid' as const,
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
      };

      serializer.deserialize([material1]);
      expect(registry.get('test-mat')?.name).toBe('Original');

      const material2 = {
        ...material1,
        name: 'Updated',
      };

      serializer.deserialize([material2]);
      expect(registry.get('test-mat')?.name).toBe('Updated');
    });
  });

  describe('clear', () => {
    it('should clear all materials', () => {
      const materials = [
        {
          id: 'mat1',
          name: 'Material 1',
          shader: 'standard' as const,
          materialType: 'solid' as const,
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
      ];

      serializer.deserialize(materials);
      expect(registry.get('mat1')).toBeDefined();

      serializer.clear();
      expect(registry.get('mat1')).toBeUndefined();
    });
  });

  describe('round-trip serialization', () => {
    it('should preserve data through serialize -> deserialize cycle', () => {
      const originalMaterials: IMaterialDefinition[] = [
        {
          id: 'test-mat',
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
      ];

      originalMaterials.forEach((mat) => registry.upsert(mat));

      const serialized = serializer.serialize();

      // Clear and deserialize
      registry.clearMaterials();
      serializer.deserialize(serialized);

      const result = registry.get('test-mat');
      expect(result).toBeDefined();
      expect(result?.name).toBe('Test Material');
      expect(result?.color).toBe('#ff6600');
      expect(result?.metalness).toBe(0.3);
      expect(result?.roughness).toBe(0.6);
    });
  });
});
