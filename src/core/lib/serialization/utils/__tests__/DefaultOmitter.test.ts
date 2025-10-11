import { describe, it, expect } from 'vitest';
import {
  omitDefaults,
  restoreDefaults,
  roundPrecision,
  calculateCompressionRatio,
} from '../DefaultOmitter';

describe('DefaultOmitter', () => {
  describe('roundPrecision', () => {
    it('should round numbers to 6 decimal places by default', () => {
      expect(roundPrecision(0.10000000149011612)).toBe(0.1);
      expect(roundPrecision(0.699999988079071)).toBe(0.7);
      expect(roundPrecision(1.234567891234)).toBe(1.234568);
    });

    it('should handle custom decimal places', () => {
      expect(roundPrecision(1.234567, 2)).toBe(1.23);
      expect(roundPrecision(1.234567, 4)).toBe(1.2346);
    });

    it('should handle edge cases', () => {
      expect(roundPrecision(0)).toBe(0);
      expect(roundPrecision(-1.5)).toBe(-1.5);
      expect(roundPrecision(NaN)).toBeNaN();
      expect(roundPrecision(Infinity)).toBe(Infinity);
    });
  });

  describe('omitDefaults', () => {
    it('should omit primitive values that match defaults', () => {
      const data = {
        name: 'test',
        enabled: true,
        count: 0,
        value: 1.5,
      };

      const defaults = {
        name: 'default',
        enabled: true, // Match
        count: 0, // Match
        value: 2.0,
      };

      const result = omitDefaults(data, defaults);

      expect(result).toEqual({
        name: 'test',
        value: 1.5,
      });
    });

    it('should omit array values that match defaults', () => {
      const data = {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      };

      const defaults = {
        position: [0, 0, 0], // Match
        rotation: [0, 0, 0], // Match
        scale: [1, 1, 1], // Match
      };

      const result = omitDefaults(data, defaults);
      expect(result).toEqual({});
    });

    it('should keep array values that differ from defaults', () => {
      const data = {
        position: [5, 10, 2],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      };

      const defaults = {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      };

      const result = omitDefaults(data, defaults);
      expect(result).toEqual({
        position: [5, 10, 2],
      });
    });

    it('should handle nested objects', () => {
      const data = {
        transform: {
          position: [0, 0, 0],
          rotation: [45, 0, 0],
          scale: [1, 1, 1],
        },
        color: {
          r: 1,
          g: 1,
          b: 1,
        },
      };

      const defaults = {
        transform: {
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
        color: {
          r: 1,
          g: 1,
          b: 1,
        },
      };

      const result = omitDefaults(data, defaults);

      // transform has non-default rotation, so include only that
      // color is all defaults, so omitted entirely
      expect(result).toEqual({
        transform: {
          rotation: [45, 0, 0],
        },
      });
    });

    it('should round numeric precision', () => {
      const data = {
        value: 0.699999988079071,
        number: 1.234567891234,
      };

      const defaults = {
        value: 0.7,
        number: 1.0,
      };

      const result = omitDefaults(data, defaults);

      // value rounds to 0.7 which matches default, so omitted
      // number rounds to 1.234568 which doesn't match default
      expect(result).toEqual({
        number: 1.234568,
      });
    });

    it('should handle complex Camera-like data', () => {
      const data = {
        fov: 60,
        near: 0.10000000149011612,
        far: 100,
        isMain: true,
        projectionType: 'perspective',
        backgroundColor: { r: 0, g: 0, b: 0, a: 1 },
      };

      const defaults = {
        fov: 75,
        near: 0.1,
        far: 100,
        isMain: false,
        projectionType: 'perspective',
        backgroundColor: { r: 0, g: 0, b: 0, a: 1 },
      };

      const result = omitDefaults(data, defaults);

      // Only non-default values
      expect(result).toEqual({
        fov: 60,
        isMain: true,
      });
    });
  });

  describe('restoreDefaults', () => {
    it('should restore omitted primitive fields', () => {
      const compressed = {
        fov: 60,
        isMain: true,
      };

      const defaults = {
        fov: 75,
        near: 0.1,
        far: 100,
        isMain: false,
      };

      const result = restoreDefaults(compressed, defaults);

      expect(result).toEqual({
        fov: 60,
        near: 0.1,
        far: 100,
        isMain: true,
      });
    });

    it('should restore nested objects', () => {
      const compressed = {
        transform: {
          rotation: [45, 0, 0],
        },
      };

      const defaults = {
        transform: {
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
      };

      const result = restoreDefaults(compressed, defaults);

      expect(result).toEqual({
        transform: {
          position: [0, 0, 0],
          rotation: [45, 0, 0],
          scale: [1, 1, 1],
        },
      });
    });

    it('should handle arrays (override, not merge)', () => {
      const compressed = {
        position: [5, 10, 2],
      };

      const defaults = {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
      };

      const result = restoreDefaults(compressed, defaults);

      expect(result).toEqual({
        position: [5, 10, 2],
        rotation: [0, 0, 0],
      });
    });
  });

  describe('round-trip (omit + restore)', () => {
    it('should preserve original data after round-trip', () => {
      const original = {
        fov: 60,
        near: 0.1,
        far: 100,
        isMain: true,
        projectionType: 'perspective',
        backgroundColor: { r: 0, g: 0, b: 0, a: 1 },
      };

      const defaults = {
        fov: 75,
        near: 0.1,
        far: 100,
        isMain: false,
        projectionType: 'perspective',
        backgroundColor: { r: 0, g: 0, b: 0, a: 1 },
      };

      const compressed = omitDefaults(original, defaults);
      const restored = restoreDefaults(compressed, defaults);

      expect(restored).toEqual(original);
    });

    it('should handle Transform component round-trip', () => {
      const original = {
        position: [5, 10, 2],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      };

      const defaults = {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      };

      const compressed = omitDefaults(original, defaults);
      const restored = restoreDefaults(compressed, defaults);

      expect(restored).toEqual(original);
    });
  });

  describe('calculateCompressionRatio', () => {
    it('should calculate compression ratio correctly', () => {
      const original = 'a'.repeat(100);
      const compressed = 'a'.repeat(30);

      const ratio = calculateCompressionRatio(original, compressed);

      expect(ratio).toBe(70); // 70% reduction
    });

    it('should handle zero-length original', () => {
      const ratio = calculateCompressionRatio('', 'test');
      expect(ratio).toBe(0);
    });

    it('should handle identical strings', () => {
      const ratio = calculateCompressionRatio('test', 'test');
      expect(ratio).toBe(0);
    });
  });
});
