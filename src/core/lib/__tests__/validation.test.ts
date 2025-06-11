import { describe, it, expect } from 'vitest';
import {
  isValidPosition,
  isValidRotation,
  isValidScale,
  isValidGameEvent,
  validatePosition,
  validateRotation,
  validateScale,
  validateGameEvent,
  createValidationError,
  getDefaultPosition,
  getDefaultRotation,
  getDefaultScale,
} from '../validation';

describe('validation utilities', () => {
  describe('isValidPosition', () => {
    it('should return true for valid positions', () => {
      expect(isValidPosition([0, 0, 0])).toBe(true);
      expect(isValidPosition([1, 2, 3])).toBe(true);
      expect(isValidPosition([-1, -2, -3])).toBe(true);
      expect(isValidPosition([3.14, 0, -1.5])).toBe(true);
    });

    it('should return false for invalid positions', () => {
      expect(isValidPosition([1, 2])).toBe(false); // only 2 elements
      expect(isValidPosition([1, 2, 3, 4])).toBe(false); // 4 elements
      expect(isValidPosition('not array' as any)).toBe(false);
      expect(isValidPosition(null as any)).toBe(false);
      expect(isValidPosition(undefined as any)).toBe(false);
      expect(isValidPosition([1, 'not number', 3] as any)).toBe(false);
    });
  });

  describe('isValidRotation', () => {
    it('should return true for valid rotations', () => {
      expect(isValidRotation([0, 0, 0])).toBe(true);
      expect(isValidRotation([Math.PI, 0, Math.PI / 2])).toBe(true);
      expect(isValidRotation([-Math.PI, Math.PI, 0])).toBe(true);
    });

    it('should return false for invalid rotations', () => {
      expect(isValidRotation([1, 2])).toBe(false); // only 2 elements
      expect(isValidRotation([1, 2, 3, 4])).toBe(false); // 4 elements
      expect(isValidRotation('not array' as any)).toBe(false);
      expect(isValidRotation([1, 'not number', 3] as any)).toBe(false);
    });
  });

  describe('isValidScale', () => {
    it('should return true for valid scales', () => {
      expect(isValidScale([1, 1, 1])).toBe(true);
      expect(isValidScale([2, 3, 0.5])).toBe(true);
      expect(isValidScale([0.1, 10, 1])).toBe(true);
    });

    it('should return false for invalid scales', () => {
      expect(isValidScale([0, 1, 1])).toBe(false); // zero scale
      expect(isValidScale([-1, 1, 1])).toBe(false); // negative scale
      expect(isValidScale([1, 2])).toBe(false); // only 2 elements
      expect(isValidScale('not array' as any)).toBe(false);
    });
  });

  describe('validatePosition', () => {
    it('should validate correct positions', () => {
      expect(() => validatePosition([0, 0, 0])).not.toThrow();
      expect(() => validatePosition([1, 2, 3])).not.toThrow();
      expect(() => validatePosition([-1, -2, -3])).not.toThrow();
    });

    it('should throw for invalid positions', () => {
      expect(() => validatePosition([1, 2])).toThrow();
      expect(() => validatePosition('not array')).toThrow();
      expect(() => validatePosition(null)).toThrow();
    });
  });

  describe('validateGameEvent', () => {
    it('should validate correct game events', () => {
      const validEvent = {
        type: 'test-event',
        timestamp: Date.now(),
        data: { key: 'value' },
      };
      expect(() => validateGameEvent(validEvent)).not.toThrow();
    });

    it('should throw for invalid game events', () => {
      expect(() => validateGameEvent({})).toThrow(); // missing required fields
      expect(() => validateGameEvent({ type: 'test' })).toThrow(); // missing timestamp
      expect(() => validateGameEvent({ timestamp: 'not number' })).toThrow(); // invalid timestamp
    });
  });

  describe('createValidationError', () => {
    it('should create validation error with message', () => {
      const error = createValidationError('Test error');
      expect(error.message).toContain('Validation Error: Test error');
    });

    it('should include path when provided', () => {
      const error = createValidationError('Test error', 'test.path');
      expect(error.message).toContain('at test.path');
    });

    it('should include value when provided', () => {
      const error = createValidationError('Test error', undefined, 'test-value');
      expect(error.message).toContain('received: "test-value"');
    });
  });

  describe('default value helpers', () => {
    it('should return correct default position', () => {
      expect(getDefaultPosition()).toEqual([0, 0, 0]);
    });

    it('should return correct default rotation', () => {
      expect(getDefaultRotation()).toEqual([0, 0, 0]);
    });

    it('should return correct default scale', () => {
      expect(getDefaultScale()).toEqual([1, 1, 1]);
    });
  });
});
