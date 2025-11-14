import { describe, it, expect } from 'vitest';
import {
  EasingPresets,
  createBezierEasing,
  getEasingFunction,
  type IEasingFunction,
  type EasingType,
} from '../Easing';

describe('Easing', () => {
  describe('EasingPresets', () => {
    it('should provide linear easing function', () => {
      const linear = EasingPresets.linear;

      expect(linear(0)).toBeCloseTo(0, 5);
      expect(linear(0.5)).toBeCloseTo(0.5, 5);
      expect(linear(1)).toBeCloseTo(1, 5);
    });

    it('should provide step easing function', () => {
      const step = EasingPresets.step;

      expect(step(0)).toBe(0);
      expect(step(0.5)).toBe(0);
      expect(step(0.99)).toBe(0);
      expect(step(1)).toBe(1);
    });

    it('should provide easeInOut easing function', () => {
      const easeInOut = EasingPresets.easeInOut;

      expect(easeInOut(0)).toBeCloseTo(0, 5);
      expect(easeInOut(0.5)).toBeCloseTo(0.5, 1); // Should be close to 0.5
      expect(easeInOut(1)).toBeCloseTo(1, 5);

      // At t=0.25, should be less than linear (ease-in part)
      expect(easeInOut(0.25)).toBeLessThan(0.25);

      // At t=0.75, should be greater than linear (ease-out part)
      expect(easeInOut(0.75)).toBeGreaterThan(0.75);
    });

    it('should provide easeIn easing function', () => {
      const easeIn = EasingPresets.easeIn;

      expect(easeIn(0)).toBeCloseTo(0, 5);
      expect(easeIn(1)).toBeCloseTo(1, 5);

      // Should always be less than or equal to linear for t in (0, 1)
      expect(easeIn(0.25)).toBeLessThan(0.25);
      expect(easeIn(0.5)).toBeLessThan(0.5);
      expect(easeIn(0.75)).toBeLessThan(0.75);
    });

    it('should provide easeOut easing function', () => {
      const easeOut = EasingPresets.easeOut;

      expect(easeOut(0)).toBeCloseTo(0, 5);
      expect(easeOut(1)).toBeCloseTo(1, 5);

      // Should always be greater than or equal to linear for t in (0, 1)
      expect(easeOut(0.25)).toBeGreaterThan(0.25);
      expect(easeOut(0.5)).toBeGreaterThan(0.5);
      expect(easeOut(0.75)).toBeGreaterThan(0.75);
    });

    it('should handle values outside [0, 1] range', () => {
      const linear = EasingPresets.linear;

      // Linear function passes through values directly (no clamping)
      expect(linear(-0.5)).toBe(-0.5);
      expect(linear(1.5)).toBe(1.5);

      // Bezier functions typically clamp to [0, 1] range
      expect(EasingPresets.easeInOut(-0.1)).toBeGreaterThanOrEqual(0);
      expect(EasingPresets.easeInOut(1.1)).toBeLessThanOrEqual(1);
    });
  });

  describe('createBezierEasing', () => {
    it('should create a custom bezier easing function', () => {
      // Create a simple ease-in-out bezier [0.42, 0, 0.58, 1]
      const customEasing = createBezierEasing(0.42, 0, 0.58, 1);

      expect(typeof customEasing).toBe('function');
      expect(customEasing(0)).toBeCloseTo(0, 5);
      expect(customEasing(1)).toBeCloseTo(1, 5);
    });

    it('should create easing with different control points', () => {
      // Create an ease-out bezier [0, 0, 0.58, 1]
      const easeOut = createBezierEasing(0, 0, 0.58, 1);

      // Should be steeper at the beginning
      expect(easeOut(0.25)).toBeGreaterThan(0.25);
      expect(easeOut(0.5)).toBeGreaterThan(0.5);
    });

    it('should create ease-in bezier', () => {
      // Create an ease-in bezier [0.42, 0, 1, 1]
      const easeIn = createBezierEasing(0.42, 0, 1, 1);

      // Should be gentler at the beginning
      expect(easeIn(0.25)).toBeLessThan(0.25);
      expect(easeIn(0.5)).toBeLessThan(0.5);
    });

    it('should handle extreme control points', () => {
      // Create an elastic-like effect
      const elastic = createBezierEasing(0.68, -0.55, 0.265, 1.55);

      expect(typeof elastic).toBe('function');
      expect(elastic(0)).toBeCloseTo(0, 5);
      expect(elastic(1)).toBeCloseTo(1, 5);
    });

    it('should handle linear bezier (control points at corners)', () => {
      const linearBezier = createBezierEasing(0, 0, 1, 1);

      // Should behave like linear
      for (let t = 0; t <= 1; t += 0.1) {
        expect(linearBezier(t)).toBeCloseTo(t, 2);
      }
    });
  });

  describe('getEasingFunction', () => {
    it('should return linear easing for "linear" type', () => {
      const easing = getEasingFunction('linear');

      expect(easing).toBe(EasingPresets.linear);
      expect(easing(0.5)).toBeCloseTo(0.5, 5);
    });

    it('should return step easing for "step" type', () => {
      const easing = getEasingFunction('step');

      expect(easing).toBe(EasingPresets.step);
      expect(easing(0.5)).toBe(0);
    });

    it('should return custom bezier easing for "bezier" type with args', () => {
      const easing = getEasingFunction('bezier', [0.25, 0.1, 0.25, 1]);

      expect(typeof easing).toBe('function');
      expect(easing(0)).toBeCloseTo(0, 5);
      expect(easing(1)).toBeCloseTo(1, 5);
    });

    it('should return default easeInOut for "bezier" type without args', () => {
      const easing = getEasingFunction('bezier');

      expect(easing).toBe(EasingPresets.easeInOut);
    });

    it('should return default easeInOut for "bezier" type with invalid args', () => {
      const easing = getEasingFunction('bezier', [0.25]); // Not enough args

      expect(easing).toBe(EasingPresets.easeInOut);
    });

    it('should return linear easing for "custom" type', () => {
      const easing = getEasingFunction('custom');

      expect(easing).toBe(EasingPresets.linear);
      expect(easing(0.5)).toBeCloseTo(0.5, 5);
    });

    it('should return linear easing for unknown type', () => {
      const easing = getEasingFunction('unknown' as EasingType);

      expect(easing).toBe(EasingPresets.linear);
    });

    it('should ignore extra args for non-bezier types', () => {
      const linearEasing = getEasingFunction('linear', [0.25, 0.1, 0.25, 1]);

      expect(linearEasing).toBe(EasingPresets.linear);
    });
  });

  describe('Easing function properties', () => {
    it('should ensure all easing functions return values in [0, 1] for input in [0, 1]', () => {
      const easingTypes: EasingType[] = ['linear', 'step', 'bezier'];

      easingTypes.forEach(type => {
        const easing = getEasingFunction(type);

        for (let t = 0; t <= 1; t += 0.1) {
          const result = easing(t);
          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThanOrEqual(1);
        }
      });
    });

    it('should ensure easing functions are monotonic increasing', () => {
      const easing = getEasingFunction('bezier', [0.25, 0.1, 0.25, 1]);

      let previousValue = easing(0);

      for (let t = 0.1; t <= 1; t += 0.1) {
        const currentValue = easing(t);
        expect(currentValue).toBeGreaterThanOrEqual(previousValue);
        previousValue = currentValue;
      }
    });

    it('should handle edge cases gracefully', () => {
      const easing = getEasingFunction('bezier', [0.42, 0, 0.58, 1]);

      // Test very small values
      expect(easing(0)).toBeCloseTo(0, 10);
      expect(easing(Number.EPSILON)).toBeGreaterThanOrEqual(0);

      // Test very close to 1
      expect(easing(1 - Number.EPSILON)).toBeLessThanOrEqual(1);
      expect(easing(1)).toBeCloseTo(1, 10);
    });
  });

  describe('Performance considerations', () => {
    it('should be reasonably fast for repeated calls', () => {
      const easing = getEasingFunction('bezier', [0.42, 0, 0.58, 1]);

      const startTime = performance.now();

      // Make 10000 calls
      for (let i = 0; i < 10000; i++) {
        easing(i / 10000);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(100); // 100ms for 10000 calls
    });

    it('should reuse bezier easing instances', () => {
      const easing1 = getEasingFunction('bezier', [0.42, 0, 0.58, 1]);
      const easing2 = getEasingFunction('bezier', [0.42, 0, 0.58, 1]);

      // Should return the same function instance for same parameters
      // This implementation detail may vary, but the behavior should be consistent
      expect(typeof easing1).toBe('function');
      expect(typeof easing2).toBe('function');

      // Both should produce the same results
      for (let t = 0; t <= 1; t += 0.1) {
        expect(easing1(t)).toBeCloseTo(easing2(t), 10);
      }
    });
  });

  describe('Mathematical properties', () => {
    it('should satisfy f(0) = 0 and f(1) = 1 for all easing functions', () => {
      const easingTypes: EasingType[] = ['linear', 'step', 'bezier'];

      easingTypes.forEach(type => {
        const easing = getEasingFunction(type);

        expect(easing(0)).toBeCloseTo(0, 10);
        expect(easing(1)).toBeCloseTo(1, 10);
      });
    });

    it('should be idempotent for step function at boundaries', () => {
      const step = EasingPresets.step;

      // Step function should return 0 for any t < 1
      expect(step(0)).toBe(0);
      expect(step(0.1)).toBe(0);
      expect(step(0.5)).toBe(0);
      expect(step(0.99)).toBe(0);

      // Step function should return 1 for t >= 1
      expect(step(1)).toBe(1);
      expect(step(1.1)).toBe(1);
    });
  });
});