import { describe, it, expect } from 'vitest';
import { PersistentIdSchema, idConfig, type IdKind } from '../idSchema';

describe('PersistentIdSchema', () => {
  describe('valid UUID v4 formats', () => {
    const validUUIDs = [
      '550e8400-e29b-41d4-a716-446655440000',
      'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      '6ba7b810-9dad-41d1-80b4-00c04fd430c8',
      '6ba7b811-9dad-41d1-80b4-00c04fd430c8',
    ];

    it.each(validUUIDs)('should accept valid UUID: %s', (uuid) => {
      expect(() => PersistentIdSchema.parse({ id: uuid })).not.toThrow();
    });
  });

  describe('invalid formats', () => {
    const invalidIds = [
      '',
      'not-a-uuid',
      '550e8400-e29b-41d4-a716',
      '550e8400-e29b-41d4-a716-446655440000-extra',
      '550e8400_e29b_41d4_a716_446655440000',
      'gggggggg-gggg-gggg-gggg-gggggggggggg',
      '550e8400-e29b-31d4-a716-446655440000', // version 3, not 4
      '550e8400-e29b-51d4-a716-446655440000', // version 5, not 4
      '550e8400-e29b-41d4-c716-446655440000', // invalid variant
    ];

    it.each(invalidIds)('should reject invalid ID: %s', (invalidId) => {
      expect(() => PersistentIdSchema.parse({ id: invalidId })).toThrow();
    });
  });

  describe('case insensitivity', () => {
    it('should accept uppercase UUIDs', () => {
      const upperUuid = '550E8400-E29B-41D4-A716-446655440000';
      expect(() => PersistentIdSchema.parse({ id: upperUuid })).not.toThrow();
    });

    it('should accept mixed case UUIDs', () => {
      const mixedUuid = '550e8400-E29B-41d4-A716-446655440000';
      expect(() => PersistentIdSchema.parse({ id: mixedUuid })).not.toThrow();
    });
  });
});

describe('idConfig', () => {
  describe('validate', () => {
    it('should validate correct UUID v4', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(idConfig.validate(validUuid)).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const invalidUuid = 'not-a-uuid';
      expect(idConfig.validate(invalidUuid)).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse valid UUID and return it', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(idConfig.parse(validUuid)).toBe(validUuid);
    });

    it('should throw error for invalid UUID', () => {
      const invalidUuid = 'not-a-uuid';
      expect(() => idConfig.parse(invalidUuid)).toThrow('Invalid persistent ID');
    });
  });

  describe('kind', () => {
    it('should be set to uuid', () => {
      expect(idConfig.kind).toBe('uuid' satisfies IdKind);
    });
  });
});