import { describe, it, expect } from 'vitest';
import { validateSceneData, SceneDataSchema } from '../SceneValidation';

describe('SceneValidation', () => {
  const validSceneData = {
    metadata: {
      name: 'Test Scene',
      version: 1,
      timestamp: '2025-10-08T00:00:00.000Z',
      author: 'Test Author',
      description: 'Test Description',
    },
    entities: [
      {
        id: 1,
        name: 'Test Entity',
        components: {
          Transform: { position: [0, 0, 0] },
        },
      },
    ],
    materials: [],
    prefabs: [],
    inputAssets: [],
  };

  describe('validateSceneData', () => {
    it('should validate valid scene data', () => {
      const result = validateSceneData(validSceneData);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept scene data without optional fields', () => {
      const minimalData = {
        metadata: {
          name: 'Test',
          version: 1,
          timestamp: '2025-10-08T00:00:00.000Z',
        },
        entities: [],
        materials: [],
        prefabs: [],
      };

      const result = validateSceneData(minimalData);

      expect(result.isValid).toBe(true);
    });

    it('should reject missing metadata', () => {
      const invalid = {
        entities: [],
        materials: [],
        prefabs: [],
      };

      const result = validateSceneData(invalid);

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('metadata');
    });

    it('should reject missing metadata.name', () => {
      const invalid = {
        metadata: {
          version: 1,
          timestamp: '2025-10-08T00:00:00.000Z',
        },
        entities: [],
        materials: [],
        prefabs: [],
      };

      const result = validateSceneData(invalid);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('name');
    });

    it('should reject missing metadata.version', () => {
      const invalid = {
        metadata: {
          name: 'Test',
          timestamp: '2025-10-08T00:00:00.000Z',
        },
        entities: [],
        materials: [],
        prefabs: [],
      };

      const result = validateSceneData(invalid);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('version');
    });

    it('should reject missing entities array', () => {
      const invalid = {
        metadata: {
          name: 'Test',
          version: 1,
          timestamp: '2025-10-08T00:00:00.000Z',
        },
        materials: [],
        prefabs: [],
      };

      const result = validateSceneData(invalid);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('entities');
    });

    it('should reject missing materials array', () => {
      const invalid = {
        metadata: {
          name: 'Test',
          version: 1,
          timestamp: '2025-10-08T00:00:00.000Z',
        },
        entities: [],
        prefabs: [],
      };

      const result = validateSceneData(invalid);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('materials');
    });

    it('should reject missing prefabs array', () => {
      const invalid = {
        metadata: {
          name: 'Test',
          version: 1,
          timestamp: '2025-10-08T00:00:00.000Z',
        },
        entities: [],
        materials: [],
      };

      const result = validateSceneData(invalid);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('prefabs');
    });

    it('should reject non-object data', () => {
      const result = validateSceneData('invalid');

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject null data', () => {
      const result = validateSceneData(null);

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject undefined data', () => {
      const result = validateSceneData(undefined);

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('SceneDataSchema', () => {
    it('should parse valid scene data', () => {
      const result = SceneDataSchema.safeParse(validSceneData);

      expect(result.success).toBe(true);
    });

    it('should validate entities as array', () => {
      const invalid = {
        ...validSceneData,
        entities: 'not-an-array',
      };

      const result = SceneDataSchema.safeParse(invalid);

      expect(result.success).toBe(false);
    });

    it('should validate materials as array', () => {
      const invalid = {
        ...validSceneData,
        materials: 'not-an-array',
      };

      const result = SceneDataSchema.safeParse(invalid);

      expect(result.success).toBe(false);
    });

    it('should validate prefabs as array', () => {
      const invalid = {
        ...validSceneData,
        prefabs: 'not-an-array',
      };

      const result = SceneDataSchema.safeParse(invalid);

      expect(result.success).toBe(false);
    });

    it('should allow optional inputAssets', () => {
      const withoutInputAssets = {
        ...validSceneData,
      };
      delete (withoutInputAssets as { inputAssets?: unknown }).inputAssets;

      const result = SceneDataSchema.safeParse(withoutInputAssets);

      expect(result.success).toBe(true);
    });

    it('should validate inputAssets as array when present', () => {
      const invalid = {
        ...validSceneData,
        inputAssets: 'not-an-array',
      };

      const result = SceneDataSchema.safeParse(invalid);

      expect(result.success).toBe(false);
    });
  });
});
