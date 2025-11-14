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
        activeClipId: 'walk-animation',
        blendIn: 0.3,
        blendOut: 0.2,
        layer: 1,
        weight: 0.8,
        playing: true,
        time: 1.5,
        clips: [{
          id: 'walk-animation',
          name: 'Walk',
          duration: 2,
          loop: true,
          timeScale: 1,
          tracks: [],
        }],
        version: 1,
      };

      const result = AnimationComponentSchema.safeParse(validComponent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validComponent);
      }
    });

    it('should reject component with negative blendIn', () => {
      const invalidComponent = {
        blendIn: -0.1,
        blendOut: 0.2,
        layer: 0,
        weight: 1,
        playing: false,
        time: 0,
        clips: [],
        version: 1,
      };

      const result = AnimationComponentSchema.safeParse(invalidComponent);
      expect(result.success).toBe(false);
    });

    it('should reject component with negative blendOut', () => {
      const invalidComponent = {
        blendIn: 0.2,
        blendOut: -0.5,
        layer: 0,
        weight: 1,
        playing: false,
        time: 0,
        clips: [],
        version: 1,
      };

      const result = AnimationComponentSchema.safeParse(invalidComponent);
      expect(result.success).toBe(false);
    });

    it('should reject component with negative layer', () => {
      const invalidComponent = {
        blendIn: 0.2,
        blendOut: 0.2,
        layer: -1,
        weight: 1,
        playing: false,
        time: 0,
        clips: [],
        version: 1,
      };

      const result = AnimationComponentSchema.safeParse(invalidComponent);
      expect(result.success).toBe(false);
    });

    it('should reject component with weight less than 0', () => {
      const invalidComponent = {
        blendIn: 0.2,
        blendOut: 0.2,
        layer: 0,
        weight: -0.1,
        playing: false,
        time: 0,
        clips: [],
        version: 1,
      };

      const result = AnimationComponentSchema.safeParse(invalidComponent);
      expect(result.success).toBe(false);
    });

    it('should reject component with weight greater than 1', () => {
      const invalidComponent = {
        blendIn: 0.2,
        blendOut: 0.2,
        layer: 0,
        weight: 1.5,
        playing: false,
        time: 0,
        clips: [],
        version: 1,
      };

      const result = AnimationComponentSchema.safeParse(invalidComponent);
      expect(result.success).toBe(false);
    });

    it('should reject component with negative time', () => {
      const invalidComponent = {
        blendIn: 0.2,
        blendOut: 0.2,
        layer: 0,
        weight: 1,
        playing: false,
        time: -1,
        clips: [],
        version: 1,
      };

      const result = AnimationComponentSchema.safeParse(invalidComponent);
      expect(result.success).toBe(false);
    });

    it('should accept component with default values', () => {
      const minimalComponent = {
        clips: [],
      };

      const result = AnimationComponentSchema.safeParse(minimalComponent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.blendIn).toBe(0.2);
        expect(result.data.blendOut).toBe(0.2);
        expect(result.data.layer).toBe(0);
        expect(result.data.weight).toBe(1);
        expect(result.data.playing).toBe(false);
        expect(result.data.time).toBe(0);
        expect(result.data.version).toBe(1);
        expect(result.data.activeClipId).toBeUndefined();
      }
    });

    it('should accept non-integer layer values', () => {
      const componentWithFloatLayer = {
        blendIn: 0.2,
        blendOut: 0.2,
        layer: 0.5,
        weight: 1,
        playing: false,
        time: 0,
        clips: [],
        version: 1,
      };

      const result = AnimationComponentSchema.safeParse(componentWithFloatLayer);
      expect(result.success).toBe(false); // layer must be integer
    });
  });

  describe('DEFAULT_ANIMATION_COMPONENT', () => {
    it('should match the schema', () => {
      const result = AnimationComponentSchema.safeParse(DEFAULT_ANIMATION_COMPONENT);
      expect(result.success).toBe(true);
    });

    it('should have all required default values', () => {
      expect(DEFAULT_ANIMATION_COMPONENT.blendIn).toBe(0.2);
      expect(DEFAULT_ANIMATION_COMPONENT.blendOut).toBe(0.2);
      expect(DEFAULT_ANIMATION_COMPONENT.layer).toBe(0);
      expect(DEFAULT_ANIMATION_COMPONENT.weight).toBe(1);
      expect(DEFAULT_ANIMATION_COMPONENT.playing).toBe(false);
      expect(DEFAULT_ANIMATION_COMPONENT.time).toBe(0);
      expect(DEFAULT_ANIMATION_COMPONENT.clips).toEqual([]);
      expect(DEFAULT_ANIMATION_COMPONENT.version).toBe(1);
      expect(DEFAULT_ANIMATION_COMPONENT.activeClipId).toBeUndefined();
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
        clips: [clip],
        activeClipId: clip.id,
        playing: true,
        time: 0,
        weight: 1,
        layer: 0,
        blendIn: 0.2,
        blendOut: 0.2,
        version: 1,
      };

      expect(clip.id).toBe('test');
      expect(component.clips).toHaveLength(1);
    });
  });
});