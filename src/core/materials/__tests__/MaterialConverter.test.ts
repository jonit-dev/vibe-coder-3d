import { describe, it, expect } from 'vitest';
import { Color, MeshBasicMaterial, MeshStandardMaterial, Texture } from 'three';
import {
  createThreeMaterialFrom,
  updateThreeMaterialFrom,
  extractTexturesFromMaterial,
} from '../MaterialConverter';
import type { IMaterialDefinition } from '../Material.types';

// Mock Texture constructor for testing
vi.mock('three', async () => {
  const actual = await vi.importActual('three');
  return {
    ...actual,
    Texture: vi.fn().mockImplementation(() => ({
      offset: { set: vi.fn() },
      repeat: { set: vi.fn() },
    })),
  };
});

describe('MaterialConverter', () => {
  const standardMaterial: IMaterialDefinition = {
    id: 'standard-test',
    name: 'Standard Test Material',
    shader: 'standard',
    materialType: 'solid',
    color: '#ff0000',
    metalness: 0.8,
    roughness: 0.2,
    emissive: '#00ff00',
    emissiveIntensity: 0.5,
    normalScale: 1.5,
    occlusionStrength: 0.8,
    textureOffsetX: 0.1,
    textureOffsetY: 0.2,
  };

  const unlitMaterial: IMaterialDefinition = {
    id: 'unlit-test',
    name: 'Unlit Test Material',
    shader: 'unlit',
    materialType: 'solid',
    color: '#0000ff',
    metalness: 0,
    roughness: 0.7,
    emissive: '#000000',
    emissiveIntensity: 0,
    normalScale: 1,
    occlusionStrength: 1,
    textureOffsetX: 0,
    textureOffsetY: 0,
  };

  describe('createThreeMaterialFrom', () => {
    it('should create MeshStandardMaterial for standard shader', () => {
      const material = createThreeMaterialFrom(standardMaterial, {});

      expect(material).toBeInstanceOf(MeshStandardMaterial);
      expect(material.color.getHexString()).toBe('ff0000');
      expect((material as MeshStandardMaterial).metalness).toBe(0.8);
      expect((material as MeshStandardMaterial).roughness).toBe(0.2);
      expect((material as MeshStandardMaterial).emissive.getHexString()).toBe('00ff00');
      expect((material as MeshStandardMaterial).emissiveIntensity).toBe(0.5);
    });

    it('should create MeshBasicMaterial for unlit shader', () => {
      const material = createThreeMaterialFrom(unlitMaterial, {});

      expect(material).toBeInstanceOf(MeshBasicMaterial);
      expect(material.color.getHexString()).toBe('0000ff');
    });

    it('should apply textures to standard material', () => {
      const mockTexture = new Texture();
      const textures = {
        'albedo.jpg': mockTexture,
        'normal.jpg': mockTexture,
        'metallic.jpg': mockTexture,
        'roughness.jpg': mockTexture,
        'emissive.jpg': mockTexture,
        'occlusion.jpg': mockTexture,
      };

      const materialWithTextures = {
        ...standardMaterial,
        albedoTexture: 'albedo.jpg',
        normalTexture: 'normal.jpg',
        metallicTexture: 'metallic.jpg',
        roughnessTexture: 'roughness.jpg',
        emissiveTexture: 'emissive.jpg',
        occlusionTexture: 'occlusion.jpg',
      };

      const material = createThreeMaterialFrom(
        materialWithTextures,
        textures,
      ) as MeshStandardMaterial;

      expect(material.map).toBe(mockTexture);
      expect(material.normalMap).toBe(mockTexture);
      expect(material.metalnessMap).toBe(mockTexture);
      expect(material.roughnessMap).toBe(mockTexture);
      expect(material.emissiveMap).toBe(mockTexture);
      expect(material.aoMap).toBe(mockTexture);
      expect(material.aoMapIntensity).toBe(0.8);
    });

    it('should set color to white when albedo texture is present', () => {
      const mockTexture = new Texture();
      const textures = { 'albedo.jpg': mockTexture };

      const materialWithTexture = {
        ...standardMaterial,
        albedoTexture: 'albedo.jpg',
      };

      const material = createThreeMaterialFrom(materialWithTexture, textures);

      expect(material.color.getHexString()).toBe('ffffff');
    });

    it('should apply texture offset', () => {
      const mockTexture = new Texture();
      const textures = { 'albedo.jpg': mockTexture };

      const materialWithOffset = {
        ...standardMaterial,
        albedoTexture: 'albedo.jpg',
        textureOffsetX: 0.5,
        textureOffsetY: 0.3,
      };

      createThreeMaterialFrom(materialWithOffset, textures);

      expect(mockTexture.offset.set).toHaveBeenCalledWith(0.5, 0.3);
    });

    it('should apply normal scale when normal texture is present', () => {
      const mockTexture = new Texture();
      const textures = { 'normal.jpg': mockTexture };

      const materialWithNormal = {
        ...standardMaterial,
        normalTexture: 'normal.jpg',
        normalScale: 2.0,
      };

      const material = createThreeMaterialFrom(
        materialWithNormal,
        textures,
      ) as MeshStandardMaterial;

      expect(material.normalScale.x).toBe(2.0);
      expect(material.normalScale.y).toBe(2.0);
    });

    it('should handle missing textures gracefully', () => {
      const materialWithMissingTextures = {
        ...standardMaterial,
        albedoTexture: 'missing.jpg',
        normalTexture: 'missing-normal.jpg',
      };

      const material = createThreeMaterialFrom(materialWithMissingTextures, {});

      // Three.js uses null for unset texture properties
      expect(material.map).toBe(null);
      expect((material as MeshStandardMaterial).normalMap).toBe(null);
      expect(material.color.getHexString()).toBe('ff0000'); // Should use base color
    });
  });

  describe('updateThreeMaterialFrom', () => {
    it('should update MeshStandardMaterial properties', () => {
      const material = new MeshStandardMaterial();
      const updatedDefinition = {
        ...standardMaterial,
        color: '#00ff00',
        metalness: 0.5,
        roughness: 0.8,
      };

      updateThreeMaterialFrom(material, updatedDefinition);

      expect(material.color.getHexString()).toBe('00ff00');
      expect(material.metalness).toBe(0.5);
      expect(material.roughness).toBe(0.8);
    });

    it('should update MeshBasicMaterial properties', () => {
      const material = new MeshBasicMaterial();
      const updatedDefinition = {
        ...unlitMaterial,
        color: '#ff00ff',
      };

      updateThreeMaterialFrom(material, updatedDefinition);

      expect(material.color.getHexString()).toBe('ff00ff');
    });

    it('should set color to white when albedo texture is specified', () => {
      const material = new MeshStandardMaterial();
      const updatedDefinition = {
        ...standardMaterial,
        albedoTexture: 'texture.jpg',
      };

      updateThreeMaterialFrom(material, updatedDefinition);

      expect(material.color.getHexString()).toBe('ffffff');
    });

    it('should use base color when no albedo texture', () => {
      const material = new MeshStandardMaterial();
      const updatedDefinition = {
        ...standardMaterial,
        color: '#123456',
        albedoTexture: undefined,
      };

      updateThreeMaterialFrom(material, updatedDefinition);

      expect(material.color.getHexString()).toBe('123456');
    });
  });

  describe('extractTexturesFromMaterial', () => {
    it('should extract all texture types from MeshStandardMaterial', () => {
      const material = new MeshStandardMaterial();
      material.map = new Texture();
      material.normalMap = new Texture();
      material.metalnessMap = new Texture();
      material.roughnessMap = new Texture();
      material.emissiveMap = new Texture();
      material.aoMap = new Texture();

      const textures = extractTexturesFromMaterial(material);

      expect(textures).toEqual([
        'albedoTexture',
        'normalTexture',
        'metallicTexture',
        'roughnessTexture',
        'emissiveTexture',
        'occlusionTexture',
      ]);
    });

    it('should extract only albedo texture from MeshBasicMaterial', () => {
      const material = new MeshBasicMaterial();
      material.map = new Texture();

      const textures = extractTexturesFromMaterial(material);

      expect(textures).toEqual(['albedoTexture']);
    });

    it('should return empty array when no textures are present', () => {
      const standardMaterial = new MeshStandardMaterial();
      const basicMaterial = new MeshBasicMaterial();

      expect(extractTexturesFromMaterial(standardMaterial)).toEqual([]);
      expect(extractTexturesFromMaterial(basicMaterial)).toEqual([]);
    });

    it('should handle partial texture assignment', () => {
      const material = new MeshStandardMaterial();
      material.map = new Texture();
      material.normalMap = new Texture();
      // Other textures remain undefined

      const textures = extractTexturesFromMaterial(material);

      expect(textures).toEqual(['albedoTexture', 'normalTexture']);
    });
  });
});
