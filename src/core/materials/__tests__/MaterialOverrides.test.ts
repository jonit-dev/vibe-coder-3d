import { describe, it, expect } from 'vitest';
import {
  applyOverrides,
  mergeOverrides,
  createEmptyOverrides,
  isOverridesEmpty,
  type IMaterialOverrides,
} from '../MaterialOverrides';
import type { IMaterialDefinition } from '../Material.types';

describe('MaterialOverrides', () => {
  const baseMaterial: IMaterialDefinition = {
    id: 'base-material',
    name: 'Base Material',
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
  };

  const testOverrides: IMaterialOverrides = {
    color: '#00ff00',
    metalness: 0.8,
    roughness: 0.1,
    emissiveIntensity: 0.5,
  };

  describe('applyOverrides', () => {
    it('should apply overrides to base material', () => {
      const result = applyOverrides(baseMaterial, testOverrides);

      expect(result).toEqual({
        ...baseMaterial,
        color: '#00ff00',
        metalness: 0.8,
        roughness: 0.1,
        emissiveIntensity: 0.5,
      });
    });

    it('should return base material when no overrides provided', () => {
      const result = applyOverrides(baseMaterial, undefined);
      expect(result).toEqual(baseMaterial);
    });

    it('should return base material when empty overrides provided', () => {
      const result = applyOverrides(baseMaterial, {});
      expect(result).toEqual(baseMaterial);
    });

    it('should preserve unspecified properties from base material', () => {
      const partialOverrides: IMaterialOverrides = {
        color: '#0000ff',
      };

      const result = applyOverrides(baseMaterial, partialOverrides);

      expect(result.color).toBe('#0000ff');
      expect(result.metalness).toBe(baseMaterial.metalness);
      expect(result.roughness).toBe(baseMaterial.roughness);
      expect(result.name).toBe(baseMaterial.name);
      expect(result.id).toBe(baseMaterial.id);
    });

    it('should handle texture overrides', () => {
      const textureOverrides: IMaterialOverrides = {
        albedoTexture: '/new-texture.jpg',
        normalTexture: '/new-normal.jpg',
      };

      const result = applyOverrides(baseMaterial, textureOverrides);

      expect(result.albedoTexture).toBe('/new-texture.jpg');
      expect(result.normalTexture).toBe('/new-normal.jpg');
    });

    it('should override with zero values', () => {
      const zeroOverrides: IMaterialOverrides = {
        metalness: 0,
        roughness: 0,
        emissiveIntensity: 0,
      };

      const result = applyOverrides(baseMaterial, zeroOverrides);

      expect(result.metalness).toBe(0);
      expect(result.roughness).toBe(0);
      expect(result.emissiveIntensity).toBe(0);
    });

    it('should not mutate original material', () => {
      const originalMaterial = { ...baseMaterial };
      const result = applyOverrides(baseMaterial, testOverrides);

      expect(baseMaterial).toEqual(originalMaterial);
      expect(result).not.toBe(baseMaterial);
    });
  });

  describe('mergeOverrides', () => {
    const baseOverrides: IMaterialOverrides = {
      color: '#ff0000',
      metalness: 0.5,
      roughness: 0.3,
    };

    const additionalOverrides: IMaterialOverrides = {
      color: '#00ff00', // Should override base color
      emissiveIntensity: 0.8, // New property
    };

    it('should merge two override objects', () => {
      const result = mergeOverrides(baseOverrides, additionalOverrides);

      expect(result).toEqual({
        color: '#00ff00', // From additional (overrides base)
        metalness: 0.5, // From base (preserved)
        roughness: 0.3, // From base (preserved)
        emissiveIntensity: 0.8, // From additional (new)
      });
    });

    it('should return base overrides when additional is undefined', () => {
      const result = mergeOverrides(baseOverrides, undefined);
      expect(result).toEqual(baseOverrides);
    });

    it('should return base overrides when additional is empty', () => {
      const result = mergeOverrides(baseOverrides, {});
      expect(result).toEqual(baseOverrides);
    });

    it('should handle empty base overrides', () => {
      const result = mergeOverrides({}, additionalOverrides);
      expect(result).toEqual(additionalOverrides);
    });

    it('should handle both overrides being empty', () => {
      const result = mergeOverrides({}, {});
      expect(result).toEqual({});
    });

    it('should not mutate original override objects', () => {
      const originalBase = { ...baseOverrides };
      const originalAdditional = { ...additionalOverrides };

      const result = mergeOverrides(baseOverrides, additionalOverrides);

      expect(baseOverrides).toEqual(originalBase);
      expect(additionalOverrides).toEqual(originalAdditional);
      expect(result).not.toBe(baseOverrides);
      expect(result).not.toBe(additionalOverrides);
    });
  });

  describe('createEmptyOverrides', () => {
    it('should create empty overrides object', () => {
      const result = createEmptyOverrides();
      expect(result).toEqual({});
    });

    it('should return new object each time', () => {
      const result1 = createEmptyOverrides();
      const result2 = createEmptyOverrides();

      expect(result1).toEqual(result2);
      expect(result1).not.toBe(result2);
    });
  });

  describe('isOverridesEmpty', () => {
    it('should return true for empty overrides object', () => {
      expect(isOverridesEmpty({})).toBe(true);
    });

    it('should return false for overrides with properties', () => {
      expect(isOverridesEmpty({ color: '#ff0000' })).toBe(false);
      expect(isOverridesEmpty({ metalness: 0 })).toBe(false);
      expect(isOverridesEmpty(testOverrides)).toBe(false);
    });

    it('should return true for overrides created by createEmptyOverrides', () => {
      const empty = createEmptyOverrides();
      expect(isOverridesEmpty(empty)).toBe(true);
    });

    it('should handle object with undefined values', () => {
      const overridesWithUndefined: IMaterialOverrides = {
        color: undefined,
        metalness: undefined,
      };

      // Note: Object.keys counts undefined properties, so this returns false
      // This is consistent with JavaScript behavior
      expect(isOverridesEmpty(overridesWithUndefined)).toBe(false);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle layered overrides application', () => {
      // Simulate a material with base properties, entity overrides, and temporary overrides
      const entityOverrides: IMaterialOverrides = {
        color: '#ff0000',
        metalness: 0.8,
      };

      const temporaryOverrides: IMaterialOverrides = {
        color: '#00ff00', // Override entity color
        emissiveIntensity: 1.0, // Add new property
      };

      // Apply entity overrides first
      const withEntityOverrides = applyOverrides(baseMaterial, entityOverrides);

      // Then apply temporary overrides
      const finalResult = applyOverrides(withEntityOverrides, temporaryOverrides);

      expect(finalResult).toEqual({
        ...baseMaterial,
        color: '#00ff00', // From temporary overrides
        metalness: 0.8, // From entity overrides
        emissiveIntensity: 1.0, // From temporary overrides
      });
    });

    it('should handle material preview with overrides', () => {
      // Simulate previewing material changes without modifying the base
      const previewOverrides: IMaterialOverrides = {
        color: '#ffff00',
        roughness: 0.9,
        normalScale: 2.0,
      };

      const previewMaterial = applyOverrides(baseMaterial, previewOverrides);

      expect(previewMaterial.color).toBe('#ffff00');
      expect(previewMaterial.roughness).toBe(0.9);
      expect(previewMaterial.normalScale).toBe(2.0);

      // Original should remain unchanged
      expect(baseMaterial.color).toBe('#ff0000');
      expect(baseMaterial.roughness).toBe(0.3);
      expect(baseMaterial.normalScale).toBe(1);
    });

    it('should support clearing overrides', () => {
      // Apply overrides then clear them
      const withOverrides = applyOverrides(baseMaterial, testOverrides);
      const clearedOverrides = applyOverrides(withOverrides, createEmptyOverrides());

      // Should be same as applying empty overrides to the modified material
      expect(clearedOverrides).toEqual(withOverrides);

      // To truly "clear" overrides, you'd need to re-apply the base material
      const backToBase = applyOverrides(baseMaterial, createEmptyOverrides());
      expect(backToBase).toEqual(baseMaterial);
    });
  });
});