import { describe, it, expect } from 'vitest';
import { PersistentIdSchema, idConfig } from '../idSchema';

describe('ID Schema', () => {
  describe('PersistentIdSchema', () => {
    it('should validate valid UUID', () => {
      const validId = {
        id: '550e8400-e29b-41d4-a716-446655440000',
      };

      expect(() => PersistentIdSchema.parse(validId)).not.toThrow();
    });

    it('should reject invalid UUID', () => {
      const invalidIds = [
        { id: 'not-a-uuid' },
        { id: '123' },
        { id: '' },
        { id: 'x50e8400-e29b-41d4-a716-446655440000' }, // Invalid first character
      ];

      invalidIds.forEach((invalidId) => {
        expect(() => PersistentIdSchema.parse(invalidId)).toThrow();
      });
    });

    it('should accept lowercase UUID', () => {
      const validId = {
        id: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = PersistentIdSchema.parse(validId);
      expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should accept uppercase UUID', () => {
      const validId = {
        id: '550E8400-E29B-41D4-A716-446655440000',
      };

      const result = PersistentIdSchema.parse(validId);
      expect(result.id).toBe('550E8400-E29B-41D4-A716-446655440000');
    });

    it('should reject UUID with missing hyphens', () => {
      const invalidId = {
        id: '550e8400e29b41d4a716446655440000',
      };

      expect(() => PersistentIdSchema.parse(invalidId)).toThrow();
    });

    it('should reject UUID with wrong length', () => {
      const invalidIds = [
        { id: '550e8400-e29b-41d4-a716-44665544000' }, // Too short
        { id: '550e8400-e29b-41d4-a716-4466554400000' }, // Too long
      ];

      invalidIds.forEach((invalidId) => {
        expect(() => PersistentIdSchema.parse(invalidId)).toThrow();
      });
    });
  });

  describe('idConfig', () => {
    describe('kind', () => {
      it('should be uuid', () => {
        expect(idConfig.kind).toBe('uuid');
      });
    });

    describe('validate', () => {
      it('should return true for valid UUID', () => {
        expect(idConfig.validate('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
        expect(idConfig.validate('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      });

      it('should return false for invalid UUID', () => {
        expect(idConfig.validate('not-a-uuid')).toBe(false);
        expect(idConfig.validate('123')).toBe(false);
        expect(idConfig.validate('')).toBe(false);
        expect(idConfig.validate('550e8400e29b41d4a716446655440000')).toBe(false);
      });

      it('should handle edge cases', () => {
        expect(idConfig.validate('00000000-0000-0000-0000-000000000000')).toBe(true); // Nil UUID
        expect(idConfig.validate('FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF')).toBe(true); // Max UUID
      });

      it('should return false for non-string types', () => {
        expect(idConfig.validate(123 as any)).toBe(false);
        expect(idConfig.validate(null as any)).toBe(false);
        expect(idConfig.validate(undefined as any)).toBe(false);
        expect(idConfig.validate({} as any)).toBe(false);
      });
    });

    describe('parse', () => {
      it('should return valid UUID unchanged', () => {
        const uuid = '550e8400-e29b-41d4-a716-446655440000';
        expect(idConfig.parse(uuid)).toBe(uuid);
      });

      it('should throw error for invalid UUID', () => {
        expect(() => idConfig.parse('not-a-uuid')).toThrow('Invalid persistent ID');
        expect(() => idConfig.parse('123')).toThrow('Invalid persistent ID');
        expect(() => idConfig.parse('')).toThrow('Invalid persistent ID');
      });

      it('should preserve UUID case', () => {
        const uppercaseUuid = '550E8400-E29B-41D4-A716-446655440000';
        const lowercaseUuid = '550e8400-e29b-41d4-a716-446655440000';

        expect(idConfig.parse(uppercaseUuid)).toBe(uppercaseUuid);
        expect(idConfig.parse(lowercaseUuid)).toBe(lowercaseUuid);
      });

      it('should handle nil UUID', () => {
        const nilUuid = '00000000-0000-0000-0000-000000000000';
        expect(idConfig.parse(nilUuid)).toBe(nilUuid);
      });
    });
  });

  describe('Integration', () => {
    it('should work consistently between validate and parse', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const invalidUuid = 'not-a-uuid';

      // Valid UUID
      expect(idConfig.validate(validUuid)).toBe(true);
      expect(() => idConfig.parse(validUuid)).not.toThrow();

      // Invalid UUID
      expect(idConfig.validate(invalidUuid)).toBe(false);
      expect(() => idConfig.parse(invalidUuid)).toThrow();
    });

    it('should validate all UUID versions', () => {
      const uuids = [
        '550e8400-e29b-41d4-a716-446655440000', // v1
        '123e4567-e89b-12d3-a456-426614174000', // v1
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8', // v1
        '6ba7b811-9dad-11d1-80b4-00c04fd430c8', // v1
      ];

      uuids.forEach((uuid) => {
        expect(idConfig.validate(uuid)).toBe(true);
        expect(() => idConfig.parse(uuid)).not.toThrow();
      });
    });
  });
});
