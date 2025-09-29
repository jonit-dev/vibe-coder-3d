import { describe, it, expect } from 'vitest';
import {
  MaterialDefinitionSchema,
  MaterialShaderSchema,
  MaterialTypeSchema,
  type IMaterialDefinition,
} from '../Material.types';

describe('Material.types', () => {
  describe('MaterialShaderSchema', () => {
    it('should accept valid shader types', () => {
      expect(MaterialShaderSchema.parse('standard')).toBe('standard');
      expect(MaterialShaderSchema.parse('unlit')).toBe('unlit');
    });

    it('should reject invalid shader types', () => {
      expect(() => MaterialShaderSchema.parse('invalid')).toThrow();
      expect(() => MaterialShaderSchema.parse('')).toThrow();
      expect(() => MaterialShaderSchema.parse(null)).toThrow();
    });

    it('should use default value when undefined in object', () => {
      const result = MaterialShaderSchema.optional().default('standard').parse(undefined);
      expect(result).toBe('standard');
    });
  });

  describe('MaterialTypeSchema', () => {
    it('should accept valid material types', () => {
      expect(MaterialTypeSchema.parse('solid')).toBe('solid');
      expect(MaterialTypeSchema.parse('texture')).toBe('texture');
    });

    it('should reject invalid material types', () => {
      expect(() => MaterialTypeSchema.parse('invalid')).toThrow();
      expect(() => MaterialTypeSchema.parse('')).toThrow();
      expect(() => MaterialTypeSchema.parse(null)).toThrow();
    });

    it('should use default value when undefined in object', () => {
      const result = MaterialTypeSchema.optional().default('solid').parse(undefined);
      expect(result).toBe('solid');
    });
  });

  describe('MaterialDefinitionSchema', () => {
    const validMaterial: IMaterialDefinition = {
      id: 'test-material',
      name: 'Test Material',
      shader: 'standard',
      materialType: 'solid',
      color: '#ff0000',
      metalness: 0.5,
      roughness: 0.3,
      emissive: '#000000',
      emissiveIntensity: 0,
      normalScale: 1,
      occlusionStrength: 1,
      textureOffsetX: 0,
      textureOffsetY: 0,
      textureRepeatX: 1,
      textureRepeatY: 1,
    };

    it('should validate complete material definition', () => {
      const result = MaterialDefinitionSchema.parse(validMaterial);
      expect(result).toEqual(validMaterial);
    });

    it('should validate minimal material definition with defaults', () => {
      const minimal = {
        id: 'minimal',
        name: 'Minimal Material',
      };

      const result = MaterialDefinitionSchema.parse(minimal);

      expect(result).toEqual({
        id: 'minimal',
        name: 'Minimal Material',
        shader: 'standard',
        materialType: 'solid',
        color: '#cccccc',
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
      });
    });

    it('should accept optional texture paths', () => {
      const materialWithTextures = {
        ...validMaterial,
        albedoTexture: '/textures/albedo.jpg',
        normalTexture: '/textures/normal.jpg',
        metallicTexture: '/textures/metallic.jpg',
        roughnessTexture: '/textures/roughness.jpg',
        emissiveTexture: '/textures/emissive.jpg',
        occlusionTexture: '/textures/occlusion.jpg',
      };

      const result = MaterialDefinitionSchema.parse(materialWithTextures);
      expect(result.albedoTexture).toBe('/textures/albedo.jpg');
      expect(result.normalTexture).toBe('/textures/normal.jpg');
    });

    it('should reject material without required id', () => {
      const { id, ...materialWithoutId } = validMaterial;
      expect(() => MaterialDefinitionSchema.parse(materialWithoutId)).toThrow();
    });

    it('should reject material without required name', () => {
      const { name, ...materialWithoutName } = validMaterial;
      expect(() => MaterialDefinitionSchema.parse(materialWithoutName)).toThrow();
    });

    it('should accept various color formats', () => {
      // Zod doesn't validate color format by default, it just validates that it's a string
      const validColors = [
        '#ff0000',
        '#fff',
        'red',
        'rgb(255, 0, 0)',
        'hsl(0, 100%, 50%)',
      ];

      validColors.forEach(color => {
        const materialWithColor = { ...validMaterial, color };
        const result = MaterialDefinitionSchema.parse(materialWithColor);
        expect(result.color).toBe(color);
      });
    });

    it('should reject invalid numeric values', () => {
      const invalidMetalness = { ...validMaterial, metalness: 'not-a-number' };
      expect(() => MaterialDefinitionSchema.parse(invalidMetalness)).toThrow();

      const negativeRoughness = { ...validMaterial, roughness: -0.5 };
      // Note: Currently the schema doesn't enforce min/max bounds, but this could be added
      const result = MaterialDefinitionSchema.parse(negativeRoughness);
      expect(result.roughness).toBe(-0.5);
    });

    it('should handle edge case values', () => {
      const edgeCases = {
        ...validMaterial,
        metalness: 0,
        roughness: 1,
        emissiveIntensity: 10,
        normalScale: 0,
        occlusionStrength: 2,
        textureOffsetX: -5,
        textureOffsetY: 5,
      };

      const result = MaterialDefinitionSchema.parse(edgeCases);
      expect(result.metalness).toBe(0);
      expect(result.roughness).toBe(1);
      expect(result.emissiveIntensity).toBe(10);
    });

    it('should strip unknown properties', () => {
      const materialWithExtra = {
        ...validMaterial,
        unknownProperty: 'should be removed',
        anotherUnknown: 123,
      };

      const result = MaterialDefinitionSchema.parse(materialWithExtra);
      expect(result).not.toHaveProperty('unknownProperty');
      expect(result).not.toHaveProperty('anotherUnknown');
    });

    it('should validate unlit shader materials', () => {
      const unlitMaterial = {
        ...validMaterial,
        shader: 'unlit' as const,
      };

      const result = MaterialDefinitionSchema.parse(unlitMaterial);
      expect(result.shader).toBe('unlit');
    });

    it('should validate texture-type materials', () => {
      const textureMaterial = {
        ...validMaterial,
        materialType: 'texture' as const,
        albedoTexture: '/textures/albedo.jpg',
      };

      const result = MaterialDefinitionSchema.parse(textureMaterial);
      expect(result.materialType).toBe('texture');
      expect(result.albedoTexture).toBe('/textures/albedo.jpg');
    });
  });
});