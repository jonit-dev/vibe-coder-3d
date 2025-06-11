import { describe, it, expect } from 'vitest';
import { add, multiply, isEven, clamp, lerp, degToRad, radToDeg, roundToDecimals } from '../math';

describe('Math utilities', () => {
  describe('basic arithmetic', () => {
    it('should add two numbers correctly', () => {
      expect(add(2, 3)).toBe(5);
      expect(add(-1, 1)).toBe(0);
      expect(add(0, 0)).toBe(0);
      expect(add(1.5, 2.5)).toBe(4);
    });

    it('should multiply two numbers correctly', () => {
      expect(multiply(2, 3)).toBe(6);
      expect(multiply(-2, 3)).toBe(-6);
      expect(multiply(0, 5)).toBe(0);
      expect(multiply(1.5, 2)).toBe(3);
    });

    it('should handle edge cases for arithmetic operations', () => {
      expect(add(Number.MAX_VALUE, 1)).toBe(Number.MAX_VALUE + 1);
      expect(multiply(Number.MAX_VALUE, 0)).toBe(0);
      expect(add(Infinity, 1)).toBe(Infinity);
      expect(multiply(Infinity, 0)).toBeNaN();
    });
  });

  describe('number properties', () => {
    it('should correctly identify even numbers', () => {
      expect(isEven(2)).toBe(true);
      expect(isEven(4)).toBe(true);
      expect(isEven(0)).toBe(true);
      expect(isEven(-2)).toBe(true);
      expect(isEven(-4)).toBe(true);
    });

    it('should correctly identify odd numbers', () => {
      expect(isEven(1)).toBe(false);
      expect(isEven(3)).toBe(false);
      expect(isEven(-1)).toBe(false);
      expect(isEven(-3)).toBe(false);
    });

    it('should handle decimal numbers for even check', () => {
      expect(isEven(2.0)).toBe(true);
      expect(isEven(2.5)).toBe(false); // 2.5 % 2 = 0.5, which is not 0
      expect(isEven(3.0)).toBe(false);
    });
  });

  describe('clamp function', () => {
    it('should clamp values within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should handle edge cases for clamp', () => {
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
      expect(clamp(5, 5, 5)).toBe(5); // min === max === value
    });

    it('should work with negative ranges', () => {
      expect(clamp(-5, -10, -1)).toBe(-5);
      expect(clamp(-15, -10, -1)).toBe(-10);
      expect(clamp(0, -10, -1)).toBe(-1);
    });

    it('should work with decimal values', () => {
      expect(clamp(2.5, 0, 5)).toBe(2.5);
      expect(clamp(-1.5, 0, 5)).toBe(0);
      expect(clamp(7.8, 0, 5)).toBe(5);
    });
  });

  describe('lerp function', () => {
    it('should interpolate between two values', () => {
      expect(lerp(0, 10, 0.5)).toBe(5);
      expect(lerp(0, 10, 0)).toBe(0);
      expect(lerp(0, 10, 1)).toBe(10);
    });

    it('should handle negative values', () => {
      expect(lerp(-10, 10, 0.5)).toBe(0);
      expect(lerp(-5, -1, 0.5)).toBe(-3);
    });

    it('should clamp t value to [0, 1]', () => {
      expect(lerp(0, 10, -0.5)).toBe(0); // t clamped to 0
      expect(lerp(0, 10, 1.5)).toBe(10); // t clamped to 1
    });

    it('should work with decimal interpolation factors', () => {
      expect(lerp(0, 100, 0.25)).toBe(25);
      expect(lerp(0, 100, 0.75)).toBe(75);
    });

    it('should handle reverse interpolation', () => {
      expect(lerp(10, 0, 0.5)).toBe(5);
      expect(lerp(10, 0, 0.25)).toBe(7.5);
    });
  });

  describe('angle conversion', () => {
    it('should convert degrees to radians', () => {
      expect(degToRad(0)).toBe(0);
      expect(degToRad(90)).toBeCloseTo(Math.PI / 2, 5);
      expect(degToRad(180)).toBeCloseTo(Math.PI, 5);
      expect(degToRad(360)).toBeCloseTo(2 * Math.PI, 5);
    });

    it('should convert radians to degrees', () => {
      expect(radToDeg(0)).toBe(0);
      expect(radToDeg(Math.PI / 2)).toBeCloseTo(90, 5);
      expect(radToDeg(Math.PI)).toBeCloseTo(180, 5);
      expect(radToDeg(2 * Math.PI)).toBeCloseTo(360, 5);
    });

    it('should handle negative angles', () => {
      expect(degToRad(-90)).toBeCloseTo(-Math.PI / 2, 5);
      expect(radToDeg(-Math.PI)).toBeCloseTo(-180, 5);
    });

    it('should be reversible (degrees <-> radians)', () => {
      const degrees = 45;
      const radians = degToRad(degrees);
      const backToDegrees = radToDeg(radians);
      expect(backToDegrees).toBeCloseTo(degrees, 5);

      const radians2 = Math.PI / 3;
      const degrees2 = radToDeg(radians2);
      const backToRadians = degToRad(degrees2);
      expect(backToRadians).toBeCloseTo(radians2, 5);
    });
  });

  describe('roundToDecimals function', () => {
    it('should round to specified decimal places', () => {
      expect(roundToDecimals(3.14159, 2)).toBe(3.14);
      expect(roundToDecimals(3.14159, 4)).toBe(3.1416);
      expect(roundToDecimals(3.14159, 0)).toBe(3);
    });

    it('should handle whole numbers', () => {
      expect(roundToDecimals(5, 2)).toBe(5);
      expect(roundToDecimals(10, 3)).toBe(10);
    });

    it('should handle negative numbers', () => {
      expect(roundToDecimals(-3.14159, 2)).toBe(-3.14);
      expect(roundToDecimals(-2.678, 1)).toBe(-2.7);
    });

    it('should handle edge cases', () => {
      expect(roundToDecimals(0, 5)).toBe(0);
      expect(roundToDecimals(0.999, 2)).toBe(1);
      expect(roundToDecimals(0.994, 2)).toBe(0.99);
    });

    it('should handle very small numbers', () => {
      expect(roundToDecimals(0.00001, 4)).toBe(0);
      expect(roundToDecimals(0.00001, 5)).toBe(0.00001);
    });

    it('should handle large decimal places', () => {
      expect(roundToDecimals(1.23456789, 8)).toBe(1.23456789);
      expect(roundToDecimals(1.23456789, 10)).toBe(1.23456789);
    });
  });

  describe('mathematical edge cases', () => {
    it('should handle special float values', () => {
      expect(clamp(NaN, 0, 10)).toBeNaN();
      expect(clamp(Infinity, 0, 10)).toBe(10);
      expect(clamp(-Infinity, 0, 10)).toBe(0);
    });

    it('should handle special values in lerp', () => {
      expect(lerp(0, Infinity, 0.5)).toBe(Infinity);
      expect(lerp(-Infinity, Infinity, 0.5)).toBeNaN();
    });

    it('should handle special values in angle conversion', () => {
      expect(degToRad(Infinity)).toBe(Infinity);
      expect(radToDeg(Infinity)).toBe(Infinity);
      expect(degToRad(NaN)).toBeNaN();
      expect(radToDeg(NaN)).toBeNaN();
    });

    it('should handle special values in rounding', () => {
      expect(roundToDecimals(Infinity, 2)).toBe(Infinity);
      expect(roundToDecimals(-Infinity, 2)).toBe(-Infinity);
      expect(roundToDecimals(NaN, 2)).toBeNaN();
    });
  });

  describe('performance and precision', () => {
    it('should handle very large numbers', () => {
      const large1 = 1e15;
      const large2 = 2e15;
      expect(add(large1, large2)).toBe(3e15);
      expect(multiply(large1, 2)).toBe(2e15);
    });

    it('should handle very small numbers', () => {
      const small1 = 1e-15;
      const small2 = 2e-15;
      expect(add(small1, small2)).toBeCloseTo(3e-15, 20);
    });

    it('should maintain precision in calculations', () => {
      // Test for common floating point precision issues
      expect(add(0.1, 0.2)).toBeCloseTo(0.3, 10);
      expect(multiply(0.1, 3)).toBeCloseTo(0.3, 10);
    });

    it('should handle repeated operations efficiently', () => {
      let result = 0;
      const startTime = performance.now();

      for (let i = 0; i < 10000; i++) {
        result = add(result, 1);
        result = multiply(result, 1.001);
        result = clamp(result, 0, 100000);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100); // Should complete quickly
    });
  });
});
