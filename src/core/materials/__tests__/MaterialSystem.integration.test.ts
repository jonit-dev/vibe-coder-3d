import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MeshStandardMaterial, MeshBasicMaterial, Texture } from 'three';
import { MaterialRegistry } from '../MaterialRegistry';
import { createThreeMaterialFrom } from '../MaterialConverter';
import type { IMaterialDefinition } from '../Material.types';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Material System Integration', () => {
  let registry: MaterialRegistry;

  beforeEach(() => {
    // Clear localStorage mock
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();

    // Get fresh instance
    (MaterialRegistry as any).instance = null;
    registry = MaterialRegistry.getInstance();
  });

  describe('complete material workflow', () => {
    it('should handle complete material creation and Three.js integration', () => {
      // 1. Create a material definition
      const materialDef: IMaterialDefinition = {
        id: 'test-pbr-material',
        name: 'Test PBR Material',
        shader: 'standard',
        materialType: 'solid',
        color: '#ff6b35',
        metalness: 0.7,
        roughness: 0.3,
        emissive: '#001122',
        emissiveIntensity: 0.1,
        normalScale: 1.2,
        occlusionStrength: 0.8,
        textureOffsetX: 0.1,
        textureOffsetY: 0.2,
      };

      // 2. Register the material
      registry.upsert(materialDef);

      // 3. Verify it can be retrieved
      const retrieved = registry.get('test-pbr-material');
      expect(retrieved).toEqual(materialDef);

      // 4. Create Three.js material from definition
      const threeMaterial = createThreeMaterialFrom(materialDef, {});

      // 5. Verify Three.js material properties
      expect(threeMaterial).toBeInstanceOf(MeshStandardMaterial);
      const stdMaterial = threeMaterial as MeshStandardMaterial;

      expect(stdMaterial.color.getHexString()).toBe('ff6b35');
      expect(stdMaterial.metalness).toBe(0.7);
      expect(stdMaterial.roughness).toBe(0.3);
      expect(stdMaterial.emissive.getHexString()).toBe('001122');
      expect(stdMaterial.emissiveIntensity).toBe(0.1);

      // 6. Verify asset metadata
      const metas = registry.getAssetMetas();
      const testMeta = metas.find(m => m.id === 'test-pbr-material');
      expect(testMeta).toEqual({
        id: 'test-pbr-material',
        name: 'Test PBR Material',
        path: '/assets/materials/test-pbr-material.mat.json',
      });
    });

    it('should handle textured material workflow', () => {
      // 1. Create a textured material definition
      const materialDef: IMaterialDefinition = {
        id: 'textured-material',
        name: 'Textured Material',
        shader: 'standard',
        materialType: 'texture',
        color: '#ffffff',
        metalness: 0.5,
        roughness: 0.5,
        emissive: '#000000',
        emissiveIntensity: 0,
        normalScale: 1,
        occlusionStrength: 1,
        textureOffsetX: 0,
        textureOffsetY: 0,
        albedoTexture: 'diffuse.jpg',
        normalTexture: 'normal.jpg',
        metallicTexture: 'metallic.jpg',
        roughnessTexture: 'roughness.jpg',
      };

      // 2. Create mock textures
      const mockTexture = new Texture();
      const textures = {
        'diffuse.jpg': mockTexture,
        'normal.jpg': mockTexture,
        'metallic.jpg': mockTexture,
        'roughness.jpg': mockTexture,
      };

      // 3. Register the material
      registry.upsert(materialDef);

      // 4. Create Three.js material with textures
      const threeMaterial = createThreeMaterialFrom(materialDef, textures);
      const stdMaterial = threeMaterial as MeshStandardMaterial;

      // 5. Verify textures are applied
      expect(stdMaterial.map).toBe(mockTexture);
      expect(stdMaterial.normalMap).toBe(mockTexture);
      expect(stdMaterial.metalnessMap).toBe(mockTexture);
      expect(stdMaterial.roughnessMap).toBe(mockTexture);

      // 6. Verify color is white when texture is present
      expect(stdMaterial.color.getHexString()).toBe('ffffff');
    });

    it('should handle unlit material workflow', () => {
      // 1. Create an unlit material definition
      const materialDef: IMaterialDefinition = {
        id: 'unlit-material',
        name: 'Unlit Material',
        shader: 'unlit',
        materialType: 'solid',
        color: '#00ff88',
        metalness: 0,
        roughness: 1,
        emissive: '#000000',
        emissiveIntensity: 0,
        normalScale: 1,
        occlusionStrength: 1,
        textureOffsetX: 0,
        textureOffsetY: 0,
      };

      // 2. Register the material
      registry.upsert(materialDef);

      // 3. Create Three.js material
      const threeMaterial = createThreeMaterialFrom(materialDef, {});

      // 4. Verify it's a basic material
      expect(threeMaterial).toBeInstanceOf(MeshBasicMaterial);
      expect(threeMaterial.color.getHexString()).toBe('00ff88');
    });

    it('should handle material persistence workflow', async () => {
      // 1. Create a material
      const materialDef: IMaterialDefinition = {
        id: 'persistent-material',
        name: 'Persistent Material',
        shader: 'standard',
        materialType: 'solid',
        color: '#purple',
        metalness: 0.8,
        roughness: 0.2,
        emissive: '#000000',
        emissiveIntensity: 0,
        normalScale: 1,
        occlusionStrength: 1,
        textureOffsetX: 0,
        textureOffsetY: 0,
      };

      // 2. Register and save the material
      registry.upsert(materialDef);
      await registry.saveToAsset(materialDef);

      // 3. Verify localStorage was called correctly
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'material_persistent-material',
        JSON.stringify(materialDef, null, 2)
      );

      // 4. Mock loading from storage
      localStorageMock.getItem.mockReturnValue(JSON.stringify(materialDef));

      // 5. Load the material
      const loaded = await registry.loadFromAsset('persistent-material');

      // 6. Verify loaded material matches original
      expect(loaded).toEqual(materialDef);
    });

    it('should handle material registry synchronous access', () => {
      // 1. Create a material
      const materialDef: IMaterialDefinition = {
        id: 'sync-material',
        name: 'Sync Material',
        shader: 'standard',
        materialType: 'solid',
        color: '#42a5f5',
        metalness: 0.3,
        roughness: 0.7,
        emissive: '#000000',
        emissiveIntensity: 0,
        normalScale: 1,
        occlusionStrength: 1,
        textureOffsetX: 0,
        textureOffsetY: 0,
      };

      // 2. Register the material
      registry.upsert(materialDef);

      // 3. Get Three.js material synchronously
      const threeMaterial = registry.getThreeMaterial('sync-material');

      // 4. Verify it works
      expect(threeMaterial).toBeInstanceOf(MeshStandardMaterial);
      expect(threeMaterial.color.getHexString()).toBe('42a5f5');

      // 5. Verify fallback for non-existent material
      const fallbackMaterial = registry.getThreeMaterial('non-existent');
      expect(fallbackMaterial).toBeInstanceOf(MeshStandardMaterial);
      expect(fallbackMaterial.color.getHexString()).toBe('cccccc'); // Default color
    });

    it('should handle default material', () => {
      // 1. Verify default material exists
      const defaultMaterial = registry.get('default');
      expect(defaultMaterial).toBeDefined();
      expect(defaultMaterial?.name).toBe('Default Material');
      expect(defaultMaterial?.shader).toBe('standard');
      expect(defaultMaterial?.color).toBe('#cccccc');

      // 2. Verify Three.js material creation for default
      const threeMaterial = registry.getThreeMaterial('default');
      expect(threeMaterial).toBeInstanceOf(MeshStandardMaterial);
      expect(threeMaterial.color.getHexString()).toBe('cccccc');
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle missing material gracefully', () => {
      const result = registry.get('non-existent-material');
      expect(result).toBeUndefined();
    });

    it('should handle invalid material data gracefully', async () => {
      localStorageMock.getItem.mockReturnValue('{"invalid": json}');

      const result = await registry.loadFromAsset('invalid-material');
      expect(result).toBeNull();
    });

    it('should handle material removal', () => {
      const materialDef: IMaterialDefinition = {
        id: 'removable-material',
        name: 'Removable Material',
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
      };

      // Add material
      registry.upsert(materialDef);
      expect(registry.get('removable-material')).toBeDefined();

      // Remove material
      registry.remove('removable-material');
      expect(registry.get('removable-material')).toBeUndefined();

      // Verify asset path mapping is also cleared
      expect(registry.getByAssetPath('/assets/materials/removable-material.mat.json')).toBeUndefined();
    });
  });
});