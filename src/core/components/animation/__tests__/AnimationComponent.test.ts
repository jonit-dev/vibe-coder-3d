import { describe, it, expect, beforeEach } from 'vitest';
import {
  AnimationComponentSchema,
  ClipSchema,
  DEFAULT_ANIMATION_COMPONENT,
  type IAnimationComponent,
  type IClip
} from '../AnimationComponent';

describe('AnimationComponent', () => {
  describe('ClipSchema', () => {
    it('should validate a valid clip', () => {
      const validClip = {
        id: 'test-clip-1',
        name: 'Test Clip',
        duration: 2.5,
        loop: true,
        timeScale: 1,
        tracks: [],
      };

      const result = ClipSchema.safeParse(validClip);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validClip);
      }
    });

    it('should reject clip with negative duration', () => {
      const invalidClip = {
        id: 'test-clip-1',
        name: 'Test Clip',
        duration: -1,
        tracks: [],
      };

      const result = ClipSchema.safeParse(invalidClip);
      expect(result.success).toBe(false);
    });

    it('should reject clip with zero duration', () => {
      const invalidClip = {
        id: 'test-clip-1',
        name: 'Test Clip',
        duration: 0,
        tracks: [],
      };

      const result = ClipSchema.safeParse(invalidClip);
      expect(result.success).toBe(false);
    });

    it('should reject clip with negative timeScale', () => {
      const invalidClip = {
        id: 'test-clip-1',
        name: 'Test Clip',
        duration: 1,
        timeScale: -0.5,
        tracks: [],
      };

      const result = ClipSchema.safeParse(invalidClip);
      expect(result.success).toBe(false);
    });

    it('should accept clip with default values', () => {
      const clipWithDefaults = {
        id: 'test-clip-2',
        name: 'Test Clip 2',
        duration: 1.5,
        tracks: [],
      };

      const result = ClipSchema.safeParse(clipWithDefaults);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.loop).toBe(true);
        expect(result.data.timeScale).toBe(1);
      }
    });

    it('should require id, name, and duration', () => {
      const incompleteClip = {
        duration: 1,
        tracks: [],
      };

      const result = ClipSchema.safeParse(incompleteClip);
      expect(result.success).toBe(false);
    });
  });

  describe('AnimationComponentSchema', () => {
    it('should validate a valid animation component', () => {
      const validComponent: IAnimationComponent = {
        activeBindingId: 'walk-animation',
        playing: true,
        time: 1.5,
        clipBindings: [{
          bindingId: 'walk-animation',
          clipId: 'walk-animation',
          assetRef: './walk-animation',
        }],
      };

      const result = AnimationComponentSchema.safeParse(validComponent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validComponent);
      }
    });

    it('should reject component with negative time', () => {
      const invalidComponent = {
        playing: false,
        time: -1,
        clipBindings: [],
      };

      const result = AnimationComponentSchema.safeParse(invalidComponent);
      expect(result.success).toBe(false);
    });

    it('should accept component with required values', () => {
      const minimalComponent = {
        playing: false,
        time: 0,
        clipBindings: [],
      };

      const result = AnimationComponentSchema.safeParse(minimalComponent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.playing).toBe(false);
        expect(result.data.time).toBe(0);
        expect(result.data.activeBindingId).toBeUndefined();
        expect(result.data.clipBindings).toEqual([]);
      }
    });
  });

  describe('DEFAULT_ANIMATION_COMPONENT', () => {
    it('should match the schema', () => {
      const result = AnimationComponentSchema.safeParse(DEFAULT_ANIMATION_COMPONENT);
      expect(result.success).toBe(true);
    });

    it('should have all required default values', () => {
      expect(DEFAULT_ANIMATION_COMPONENT.playing).toBe(false);
      expect(DEFAULT_ANIMATION_COMPONENT.time).toBe(0);
      expect(DEFAULT_ANIMATION_COMPONENT.clipBindings).toEqual([]);
      expect(DEFAULT_ANIMATION_COMPONENT.activeBindingId).toBeUndefined();
    });
  });

  describe('Type inference', () => {
    it('should correctly infer types from schemas', () => {
      // These tests are primarily for TypeScript type checking
      // They ensure our type definitions match the schemas

      const clip: IClip = {
        id: 'test',
        name: 'Test',
        duration: 1,
        tracks: [],
      };

      const component: IAnimationComponent = {
        clipBindings: [{
          bindingId: clip.id,
          clipId: clip.id,
          assetRef: './test',
        }],
        activeBindingId: clip.id,
        playing: true,
        time: 0,
      };

      expect(clip.id).toBe('test');
      expect(component.clipBindings).toHaveLength(1);
    });
  });
});