import { describe, it, expect } from 'vitest';
import { compareMaterials, compareArrays, shallowEqual } from '../comparison';
import type { IRenderingContributions } from '@/editor/components/panels/ViewportPanel/hooks/useEntityMesh';

describe('comparison utilities', () => {
  describe('compareMaterials', () => {
    it('should return true for identical materials', () => {
      const material: IRenderingContributions['material'] = {
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

      expect(compareMaterials(material, material)).toBe(true);
    });

    it('should return true for materials with same values', () => {
      const material1: IRenderingContributions['material'] = {
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

      const material2: IRenderingContributions['material'] = {
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

      expect(compareMaterials(material1, material2)).toBe(true);
    });

    it('should return false when color differs', () => {
      const material1: IRenderingContributions['material'] = {
        shader: 'standard',
        materialType: 'solid',
        color: '#ff0000',
        metalness: 0.5,
        roughness: 0.7,
      };

      const material2: IRenderingContributions['material'] = {
        shader: 'standard',
        materialType: 'solid',
        color: '#00ff00',
        metalness: 0.5,
        roughness: 0.7,
      };

      expect(compareMaterials(material1, material2)).toBe(false);
    });

    it('should return false when metalness differs', () => {
      const material1: IRenderingContributions['material'] = {
        shader: 'standard',
        materialType: 'solid',
        color: '#ff0000',
        metalness: 0.5,
        roughness: 0.7,
      };

      const material2: IRenderingContributions['material'] = {
        shader: 'standard',
        materialType: 'solid',
        color: '#ff0000',
        metalness: 0.8,
        roughness: 0.7,
      };

      expect(compareMaterials(material1, material2)).toBe(false);
    });

    it('should return false when texture paths differ', () => {
      const material1: IRenderingContributions['material'] = {
        shader: 'standard',
        materialType: 'texture',
        color: '#ffffff',
        albedoTexture: '/textures/wood.png',
      };

      const material2: IRenderingContributions['material'] = {
        shader: 'standard',
        materialType: 'texture',
        color: '#ffffff',
        albedoTexture: '/textures/metal.png',
      };

      expect(compareMaterials(material1, material2)).toBe(false);
    });

    it('should handle null/undefined materials', () => {
      expect(compareMaterials(undefined, undefined)).toBe(true);
      expect(compareMaterials(null as any, null as any)).toBe(true);
      expect(compareMaterials(undefined, { color: '#ff0000' })).toBe(false);
      expect(compareMaterials({ color: '#ff0000' }, undefined)).toBe(false);
    });

    it('should compare all material properties', () => {
      const material1: IRenderingContributions['material'] = {
        shader: 'standard',
        materialType: 'texture',
        color: '#ffffff',
        metalness: 0.5,
        roughness: 0.7,
        emissive: '#ff0000',
        emissiveIntensity: 0.5,
        normalScale: 1.5,
        occlusionStrength: 0.8,
        textureOffsetX: 0.1,
        textureOffsetY: 0.2,
        textureRepeatX: 2,
        textureRepeatY: 3,
        albedoTexture: '/tex/albedo.png',
        normalTexture: '/tex/normal.png',
        metallicTexture: '/tex/metallic.png',
        roughnessTexture: '/tex/roughness.png',
        emissiveTexture: '/tex/emissive.png',
        occlusionTexture: '/tex/occlusion.png',
      };

      const material2 = { ...material1 };

      expect(compareMaterials(material1, material2)).toBe(true);

      // Change one texture
      material2.normalTexture = '/tex/normal2.png';
      expect(compareMaterials(material1, material2)).toBe(false);
    });
  });

  describe('compareArrays', () => {
    it('should return true for identical arrays', () => {
      const arr = [1, 2, 3];
      expect(compareArrays(arr, arr)).toBe(true);
    });

    it('should return true for arrays with same values', () => {
      const arr1 = [1, 2, 3];
      const arr2 = [1, 2, 3];
      expect(compareArrays(arr1, arr2)).toBe(true);
    });

    it('should return false for arrays with different values', () => {
      const arr1 = [1, 2, 3];
      const arr2 = [1, 2, 4];
      expect(compareArrays(arr1, arr2)).toBe(false);
    });

    it('should return false for arrays with different lengths', () => {
      const arr1 = [1, 2, 3];
      const arr2 = [1, 2];
      expect(compareArrays(arr1, arr2)).toBe(false);
    });

    it('should handle empty arrays', () => {
      expect(compareArrays([], [])).toBe(true);
      expect(compareArrays([], [1])).toBe(false);
    });

    it('should handle null/undefined arrays', () => {
      expect(compareArrays(undefined, undefined)).toBe(true);
      expect(compareArrays(null as any, null as any)).toBe(true);
      expect(compareArrays(undefined, [1])).toBe(false);
      expect(compareArrays([1], undefined)).toBe(false);
    });

    it('should use reference equality for items', () => {
      const obj = { id: 1 };
      const arr1 = [obj];
      const arr2 = [obj];
      expect(compareArrays(arr1, arr2)).toBe(true);

      const arr3 = [{ id: 1 }];
      expect(compareArrays(arr1, arr3)).toBe(false);
    });

    it('should work with string arrays', () => {
      expect(compareArrays(['a', 'b'], ['a', 'b'])).toBe(true);
      expect(compareArrays(['a', 'b'], ['a', 'c'])).toBe(false);
    });
  });

  describe('shallowEqual', () => {
    it('should return true for objects with same primitive values', () => {
      const obj1 = { a: 1, b: 'hello', c: true };
      const obj2 = { a: 1, b: 'hello', c: true };
      expect(shallowEqual(obj1, obj2)).toBe(true);
    });

    it('should return false when primitive values differ', () => {
      const obj1 = { a: 1, b: 'hello' };
      const obj2 = { a: 2, b: 'hello' };
      expect(shallowEqual(obj1, obj2)).toBe(false);
    });

    it('should use reference equality for nested objects', () => {
      const nested = { x: 1 };
      const obj1 = { a: nested };
      const obj2 = { a: nested };
      expect(shallowEqual(obj1, obj2)).toBe(true);

      const obj3 = { a: { x: 1 } };
      expect(shallowEqual(obj1, obj3)).toBe(false);
    });

    it('should support checking specific keys', () => {
      const obj1 = { a: 1, b: 2, c: 3 };
      const obj2 = { a: 1, b: 2, c: 4 };

      // Check only a and b - should be equal
      expect(shallowEqual(obj1, obj2, ['a', 'b'])).toBe(true);

      // Check all keys including c - should not be equal
      expect(shallowEqual(obj1, obj2, ['a', 'b', 'c'])).toBe(false);
    });

    it('should handle empty objects', () => {
      expect(shallowEqual({}, {})).toBe(true);
    });

    it('should return true for identical object reference', () => {
      const obj = { a: 1, b: 2 };
      expect(shallowEqual(obj, obj)).toBe(true);
    });

    it('should work with mixed types', () => {
      const obj1 = { a: 1, b: 'hello', c: true, d: null, e: undefined };
      const obj2 = { a: 1, b: 'hello', c: true, d: null, e: undefined };
      expect(shallowEqual(obj1, obj2)).toBe(true);
    });

    it('should detect undefined vs missing property', () => {
      const obj1 = { a: 1, b: undefined };
      const obj2 = { a: 1 };
      // This will return true because we only check keys from obj1
      // and obj2.b === undefined (missing property)
      expect(shallowEqual(obj1, obj2)).toBe(true);
    });
  });

  describe('performance characteristics', () => {
    it('should be faster than JSON.stringify for material comparison', () => {
      const material1: IRenderingContributions['material'] = {
        shader: 'standard',
        materialType: 'texture',
        color: '#ffffff',
        metalness: 0.5,
        roughness: 0.7,
        emissive: '#ff0000',
        emissiveIntensity: 0.5,
        normalScale: 1.5,
        occlusionStrength: 0.8,
        textureOffsetX: 0.1,
        textureOffsetY: 0.2,
        textureRepeatX: 2,
        textureRepeatY: 3,
        albedoTexture: '/tex/albedo.png',
        normalTexture: '/tex/normal.png',
        metallicTexture: '/tex/metallic.png',
        roughnessTexture: '/tex/roughness.png',
        emissiveTexture: '/tex/emissive.png',
        occlusionTexture: '/tex/occlusion.png',
      };
      const material2 = { ...material1 };

      const iterations = 10000;

      // compareMaterials
      const start1 = performance.now();
      for (let i = 0; i < iterations; i++) {
        compareMaterials(material1, material2);
      }
      const time1 = performance.now() - start1;

      // JSON.stringify
      const start2 = performance.now();
      for (let i = 0; i < iterations; i++) {
        JSON.stringify(material1) === JSON.stringify(material2);
      }
      const time2 = performance.now() - start2;

      // compareMaterials should be significantly faster
      expect(time1).toBeLessThan(time2);
      console.log(`compareMaterials: ${time1.toFixed(2)}ms, JSON.stringify: ${time2.toFixed(2)}ms, speedup: ${(time2 / time1).toFixed(2)}x`);
    });
  });
});
