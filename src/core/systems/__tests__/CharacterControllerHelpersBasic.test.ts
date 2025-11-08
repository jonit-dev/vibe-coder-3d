/**
 * Character Controller Helpers Basic Unit Tests
 * Tests pure functions without complex external dependencies
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  normalizeInputKey,
  getNormalizedInputMapping,
  readInputState,
  calculateMovementDirection,
  enqueueIntent,
  consumeIntents,
  clearAllIntents,
  type IInputState,
  type ICharacterIntent,
} from '../CharacterControllerHelpers';
import type {
  ICharacterControllerData,
  IInputMapping,
} from '../../lib/ecs/components/accessors/types';

// Mock just the InputManager since it's used directly
const mockInputManager = {
  isKeyDown: vi.fn(),
};

vi.mock('../../lib/input/InputManager', () => ({
  InputManager: {
    isKeyDown: vi.fn(),
  },
}));

// Mock logger
vi.mock('../../lib/logger', () => ({
  Logger: {
    create: vi.fn(() => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
  },
}));

describe('CharacterControllerHelpers - Pure Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAllIntents();
  });

  afterEach(() => {
    clearAllIntents();
  });

  describe('normalizeInputKey', () => {
    it('should convert space key to "space"', () => {
      expect(normalizeInputKey(' ')).toBe('space');
      expect(normalizeInputKey('SPACE')).toBe('space');
    });

    it('should convert to lowercase', () => {
      expect(normalizeInputKey('W')).toBe('w');
      expect(normalizeInputKey('SHIFT')).toBe('shift');
    });

    it('should handle already lowercase keys', () => {
      expect(normalizeInputKey('a')).toBe('a');
      expect(normalizeInputKey('space')).toBe('space');
    });

    it('should handle special characters', () => {
      expect(normalizeInputKey('Tab')).toBe('tab');
      expect(normalizeInputKey('Escape')).toBe('escape');
    });
  });

  describe('getNormalizedInputMapping', () => {
    it('should return default mapping when none provided', () => {
      const controllerData: ICharacterControllerData = {
        enabled: true,
        controlMode: 'auto',
        maxSpeed: 6.0,
        jumpStrength: 6.5,
        gravityScale: 1.0,
        slopeLimit: 45.0,
        stepOffset: 0.3,
        skinWidth: 0.08,
      };

      const mapping = getNormalizedInputMapping(controllerData);

      expect(mapping).toEqual({
        forward: 'w',
        backward: 's',
        left: 'a',
        right: 'd',
        jump: 'space',
      });
    });

    it('should fix legacy space key', () => {
      const controllerData: ICharacterControllerData = {
        enabled: true,
        controlMode: 'auto',
        maxSpeed: 6.0,
        jumpStrength: 6.5,
        gravityScale: 1.0,
        slopeLimit: 45.0,
        stepOffset: 0.3,
        skinWidth: 0.08,
        inputMapping: {
          forward: 'W',
          backward: 'S',
          left: 'A',
          right: 'D',
          jump: ' ', // Legacy space key
        },
      };

      const mapping = getNormalizedInputMapping(controllerData);

      expect(mapping.jump).toBe('space');
      expect(mapping.forward).toBe('W'); // Should preserve other keys
    });

    it('should return normalized mapping when provided', () => {
      const customMapping: IInputMapping = {
        forward: 'ArrowUp',
        backward: 'ArrowDown',
        left: 'ArrowLeft',
        right: 'ArrowRight',
        jump: 'Enter',
      };

      const controllerData: ICharacterControllerData = {
        enabled: true,
        controlMode: 'auto',
        maxSpeed: 6.0,
        jumpStrength: 6.5,
        gravityScale: 1.0,
        slopeLimit: 45.0,
        stepOffset: 0.3,
        skinWidth: 0.08,
        inputMapping: customMapping,
      };

      const mapping = getNormalizedInputMapping(controllerData);

      expect(mapping).toEqual(customMapping);
    });
  });

  describe('readInputState', () => {
    // Mock InputManager locally for this test
    let localMockInputManager: any;

    beforeEach(() => {
      localMockInputManager = {
        isKeyDown: vi.fn(),
      };
    });

    it('should read input state using normalized keys', () => {
      const mapping: IInputMapping = {
        forward: 'W',
        backward: 'S',
        left: 'A',
        right: 'D',
        jump: ' ',
      };

      localMockInputManager.isKeyDown.mockReturnValue(true);

      const inputState = readInputState(localMockInputManager, mapping);

      expect(localMockInputManager.isKeyDown).toHaveBeenCalledWith('w'); // Normalized
      expect(localMockInputManager.isKeyDown).toHaveBeenCalledWith('s');
      expect(localMockInputManager.isKeyDown).toHaveBeenCalledWith('a');
      expect(localMockInputManager.isKeyDown).toHaveBeenCalledWith('d');
      expect(localMockInputManager.isKeyDown).toHaveBeenCalledWith('space'); // Normalized
      expect(inputState).toEqual({
        forward: true,
        backward: true,
        left: true,
        right: true,
        jump: true,
      });
    });

    it('should handle mixed key states', () => {
      const mapping: IInputMapping = {
        forward: 'w',
        backward: 's',
        left: 'a',
        right: 'd',
        jump: 'space',
      };

      localMockInputManager.isKeyDown.mockImplementation((key: string) => {
        return key === 'w' || key === 'space';
      });

      const inputState = readInputState(localMockInputManager, mapping);

      expect(inputState).toEqual({
        forward: true,
        backward: false,
        left: false,
        right: false,
        jump: true,
      });
    });
  });

  describe('calculateMovementDirection', () => {
    it('should return zero direction when no input', () => {
      const inputState: IInputState = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        jump: false,
      };

      const direction = calculateMovementDirection(inputState);

      expect(direction).toEqual([0, 0]);
    });

    it('should calculate forward direction', () => {
      const inputState: IInputState = {
        forward: true,
        backward: false,
        left: false,
        right: false,
        jump: false,
      };

      const direction = calculateMovementDirection(inputState);

      expect(direction).toEqual([0, 1]);
    });

    it('should calculate backward direction', () => {
      const inputState: IInputState = {
        forward: false,
        backward: true,
        left: false,
        right: false,
        jump: false,
      };

      const direction = calculateMovementDirection(inputState);

      expect(direction).toEqual([0, -1]);
    });

    it('should calculate left direction', () => {
      const inputState: IInputState = {
        forward: false,
        backward: false,
        left: true,
        right: false,
        jump: false,
      };

      const direction = calculateMovementDirection(inputState);

      expect(direction).toEqual([1, 0]);
    });

    it('should calculate right direction', () => {
      const inputState: IInputState = {
        forward: false,
        backward: false,
        left: false,
        right: true,
        jump: false,
      };

      const direction = calculateMovementDirection(inputState);

      expect(direction).toEqual([-1, 0]);
    });

    it('should normalize diagonal movement', () => {
      const inputState: IInputState = {
        forward: true,
        backward: false,
        left: true,
        right: false,
        jump: false,
      };

      const direction = calculateMovementDirection(inputState);

      // Should be normalized to length 1
      const magnitude = Math.sqrt(direction[0] * direction[0] + direction[1] * direction[1]);
      expect(magnitude).toBeCloseTo(1.0, 5);
      expect(direction[0]).toBeCloseTo(0.7071, 4); // 1/sqrt(2)
      expect(direction[1]).toBeCloseTo(0.7071, 4); // 1/sqrt(2)
    });

    it('should handle opposite direction cancellation', () => {
      const inputState: IInputState = {
        forward: true,
        backward: true, // Opposite directions
        left: false,
        right: false,
        jump: false,
      };

      const direction = calculateMovementDirection(inputState);

      expect(direction).toEqual([0, 0]);
    });

    it('should handle all directions pressed', () => {
      const inputState: IInputState = {
        forward: true,
        backward: true,
        left: true,
        right: true,
        jump: false,
      };

      const direction = calculateMovementDirection(inputState);

      expect(direction).toEqual([0, 0]);
    });

    it('should handle complex diagonal combinations', () => {
      const inputState: IInputState = {
        forward: true,
        backward: false,
        left: true,
        right: true, // Left + Right = 0, only forward
        jump: false,
      };

      const direction = calculateMovementDirection(inputState);

      expect(direction).toEqual([0, 1]);
    });
  });

  describe('Intent Queue', () => {
    it('should enqueue intents with timestamp', () => {
      const mockDateNow = vi.spyOn(Date, 'now').mockReturnValue(123456);

      const intent: Omit<ICharacterIntent, 'timestamp'> = {
        entityId: 1,
        type: 'move',
        data: { inputXZ: [1, 0], speed: 5 },
      };

      enqueueIntent(intent);

      mockDateNow.mockRestore();

      // Since we can't access the private intentQueue directly,
      // we test by consuming the intent
      const consumedIntents = consumeIntents(1);

      expect(consumedIntents).toHaveLength(1);
      expect(consumedIntents[0]).toEqual({
        ...intent,
        timestamp: 123456,
      });
    });

    it('should enqueue multiple intents for same entity', () => {
      const intent1: Omit<ICharacterIntent, 'timestamp'> = {
        entityId: 1,
        type: 'move',
        data: { inputXZ: [1, 0] },
      };

      const intent2: Omit<ICharacterIntent, 'timestamp'> = {
        entityId: 1,
        type: 'jump',
        data: { strength: 6 },
      };

      enqueueIntent(intent1);
      enqueueIntent(intent2);

      const consumedIntents = consumeIntents(1);

      expect(consumedIntents).toHaveLength(2);
      expect(consumedIntents[0].type).toBe('move');
      expect(consumedIntents[1].type).toBe('jump');
    });

    it('should enqueue intents for different entities', () => {
      const intent1: Omit<ICharacterIntent, 'timestamp'> = {
        entityId: 1,
        type: 'move',
      };

      const intent2: Omit<ICharacterIntent, 'timestamp'> = {
        entityId: 2,
        type: 'jump',
      };

      enqueueIntent(intent1);
      enqueueIntent(intent2);

      const consumedIntents1 = consumeIntents(1);
      const consumedIntents2 = consumeIntents(2);

      expect(consumedIntents1).toHaveLength(1);
      expect(consumedIntents2).toHaveLength(1);
      expect(consumedIntents1[0].entityId).toBe(1);
      expect(consumedIntents2[0].entityId).toBe(2);
    });

    it('should consume intents and remove them from queue', () => {
      const intent: Omit<ICharacterIntent, 'timestamp'> = {
        entityId: 1,
        type: 'move',
      };

      enqueueIntent(intent);

      // First consumption should return the intent
      const firstConsumption = consumeIntents(1);
      expect(firstConsumption).toHaveLength(1);

      // Second consumption should return empty array
      const secondConsumption = consumeIntents(1);
      expect(secondConsumption).toHaveLength(0);
    });

    it('should return empty array when no intents for entity', () => {
      const intent: Omit<ICharacterIntent, 'timestamp'> = {
        entityId: 1,
        type: 'move',
      };

      enqueueIntent(intent);

      const consumedIntents = consumeIntents(2); // Different entity
      expect(consumedIntents).toHaveLength(0);
    });

    it('should clear all intents', () => {
      const intent1: Omit<ICharacterIntent, 'timestamp'> = {
        entityId: 1,
        type: 'move',
      };

      const intent2: Omit<ICharacterIntent, 'timestamp'> = {
        entityId: 2,
        type: 'jump',
      };

      enqueueIntent(intent1);
      enqueueIntent(intent2);

      clearAllIntents();

      const consumedIntents1 = consumeIntents(1);
      const consumedIntents2 = consumeIntents(2);

      expect(consumedIntents1).toHaveLength(0);
      expect(consumedIntents2).toHaveLength(0);
    });

    it('should handle intents without optional data', () => {
      const intent: Omit<ICharacterIntent, 'timestamp'> = {
        entityId: 1,
        type: 'move',
      };

      enqueueIntent(intent);

      const consumedIntents = consumeIntents(1);
      expect(consumedIntents[0].data).toBeUndefined();
    });

    it('should preserve intent order', () => {
      const intents = [
        { entityId: 1, type: 'move' as const, data: { inputXZ: [1, 0] } },
        { entityId: 1, type: 'jump' as const, data: { strength: 5 } },
        { entityId: 1, type: 'move' as const, data: { inputXZ: [0, 1] } },
      ];

      intents.forEach(enqueueIntent);

      const consumedIntents = consumeIntents(1);

      expect(consumedIntents).toHaveLength(3);
      expect(consumedIntents[0].type).toBe('move');
      expect(consumedIntents[1].type).toBe('jump');
      expect(consumedIntents[2].type).toBe('move');
    });
  });
});
