import { describe, it, expect } from 'vitest';
import { isValidNumber, isValidArray, validateRequiredFields } from '../validation';

describe('validation utilities', () => {
  describe('isValidNumber', () => {
    it('should return true for valid numbers', () => {
      expect(isValidNumber(42)).toBe(true);
      expect(isValidNumber(0)).toBe(true);
      expect(isValidNumber(-10)).toBe(true);
      expect(isValidNumber(3.14)).toBe(true);
    });

    it('should return false for invalid numbers', () => {
      expect(isValidNumber(NaN)).toBe(false);
      expect(isValidNumber(Infinity)).toBe(false);
      expect(isValidNumber(-Infinity)).toBe(false);
      expect(isValidNumber('42' as any)).toBe(false);
      expect(isValidNumber(null as any)).toBe(false);
      expect(isValidNumber(undefined as any)).toBe(false);
    });
  });

  describe('isValidArray', () => {
    it('should return true for valid arrays', () => {
      expect(isValidArray([1, 2, 3])).toBe(true);
      expect(isValidArray([])).toBe(true);
      expect(isValidArray(['a', 'b'])).toBe(true);
    });

    it('should return false for non-arrays', () => {
      expect(isValidArray('not array' as any)).toBe(false);
      expect(isValidArray(42 as any)).toBe(false);
      expect(isValidArray(null as any)).toBe(false);
      expect(isValidArray(undefined as any)).toBe(false);
      expect(isValidArray({} as any)).toBe(false);
    });

    it('should validate array length when specified', () => {
      expect(isValidArray([1, 2, 3], 3)).toBe(true);
      expect(isValidArray([1, 2], 3)).toBe(false);
      expect(isValidArray([1, 2, 3, 4], 3)).toBe(false);
    });
  });

  describe('validateRequiredFields', () => {
    it('should pass validation for complete objects', () => {
      const obj = { name: 'test', value: 42, flag: true };
      expect(() => validateRequiredFields(obj, ['name', 'value', 'flag'])).not.toThrow();
    });

    it('should throw for missing required fields', () => {
      const obj = { name: 'test' };
      expect(() => validateRequiredFields(obj, ['name', 'value'])).toThrow(
        'Missing required field: value',
      );
    });

    it('should throw for null/undefined values', () => {
      const obj = { name: 'test', value: null };
      expect(() => validateRequiredFields(obj, ['name', 'value'])).toThrow(
        'Field value cannot be null or undefined',
      );
    });

    it('should handle empty required fields array', () => {
      const obj = { name: 'test' };
      expect(() => validateRequiredFields(obj, [])).not.toThrow();
    });
  });
});
