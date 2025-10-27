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

    it('should accept human-readable IDs', () => {
      const validIds = [
        { id: 'forest-rock-004' },
        { id: 'player-spawn-001' },
        { id: 'main-camera' },
        { id: '123' },
        { id: 'entity_123' },
      ];

      validIds.forEach((validId) => {
        expect(() => PersistentIdSchema.parse(validId)).not.toThrow();
      });
    });

    it('should reject empty strings', () => {
      const invalidId = { id: '' };
      expect(() => PersistentIdSchema.parse(invalidId)).toThrow();
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

    it('should accept any non-empty string format', () => {
      const validIds = [
        { id: '550e8400e29b41d4a716446655440000' }, // UUID without hyphens
        { id: 'short' },
        { id: 'very-long-id-with-many-dashes-and-numbers-123456789' },
      ];

      validIds.forEach((validId) => {
        expect(() => PersistentIdSchema.parse(validId)).not.toThrow();
      });
    });
  });

  describe('idConfig', () => {
    describe('kind', () => {
      it('should be string', () => {
        expect(idConfig.kind).toBe('string');
      });
    });

    describe('validate', () => {
      it('should return true for valid UUID', () => {
        expect(idConfig.validate('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
        expect(idConfig.validate('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      });

      it('should return true for human-readable IDs', () => {
        expect(idConfig.validate('forest-rock-004')).toBe(true);
        expect(idConfig.validate('player-spawn-001')).toBe(true);
        expect(idConfig.validate('main-camera')).toBe(true);
        expect(idConfig.validate('123')).toBe(true);
      });

      it('should return false for empty strings', () => {
        expect(idConfig.validate('')).toBe(false);
      });

      it('should handle edge cases', () => {
        expect(idConfig.validate('00000000-0000-0000-0000-000000000000')).toBe(true); // Nil UUID
        expect(idConfig.validate('FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF')).toBe(true); // Max UUID
        expect(idConfig.validate('550e8400e29b41d4a716446655440000')).toBe(true); // UUID without hyphens
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

      it('should return human-readable IDs unchanged', () => {
        expect(idConfig.parse('forest-rock-004')).toBe('forest-rock-004');
        expect(idConfig.parse('player-spawn-001')).toBe('player-spawn-001');
        expect(idConfig.parse('main-camera')).toBe('main-camera');
      });

      it('should throw error for empty string', () => {
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
      const validHumanReadable = 'forest-rock-004';
      const invalidId = '';

      // Valid UUID
      expect(idConfig.validate(validUuid)).toBe(true);
      expect(() => idConfig.parse(validUuid)).not.toThrow();

      // Valid human-readable ID
      expect(idConfig.validate(validHumanReadable)).toBe(true);
      expect(() => idConfig.parse(validHumanReadable)).not.toThrow();

      // Invalid ID (empty string)
      expect(idConfig.validate(invalidId)).toBe(false);
      expect(() => idConfig.parse(invalidId)).toThrow();
    });

    it('should validate all UUID versions and human-readable IDs', () => {
      const ids = [
        '550e8400-e29b-41d4-a716-446655440000', // UUID v1
        '123e4567-e89b-12d3-a456-426614174000', // UUID v1
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8', // UUID v1
        '6ba7b811-9dad-11d1-80b4-00c04fd430c8', // UUID v1
        'forest-rock-004', // Human-readable
        'player-spawn-001', // Human-readable
        'main-camera', // Human-readable
        'entity_123', // Human-readable with underscore
      ];

      ids.forEach((id) => {
        expect(idConfig.validate(id)).toBe(true);
        expect(() => idConfig.parse(id)).not.toThrow();
      });
    });
  });
});
