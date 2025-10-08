import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createInputAPI } from '../InputAPI';
import { InputManager } from '@/core/lib/input/InputManager';

// Mock InputManager
vi.mock('@/core/lib/input/InputManager', () => {
  return {
    InputManager: {
      getInstance: vi.fn(),
    },
  };
});

describe('InputAPI', () => {
  let mockInputManager: any;
  let inputAPI: ReturnType<typeof createInputAPI>;

  beforeEach(() => {
    // Create mock InputManager instance with all methods
    mockInputManager = {
      // Keyboard
      isKeyDown: vi.fn(),
      isKeyPressed: vi.fn(),
      isKeyReleased: vi.fn(),

      // Mouse
      isMouseButtonDown: vi.fn(),
      isMouseButtonPressed: vi.fn(),
      isMouseButtonReleased: vi.fn(),
      mousePosition: vi.fn(),
      mouseDelta: vi.fn(),
      mouseWheel: vi.fn(),

      // Pointer Lock
      lockPointer: vi.fn(),
      unlockPointer: vi.fn(),
      isPointerLocked: vi.fn(),

      // Actions
      getActionValue: vi.fn(),
      isActionActiveNew: vi.fn(),
      onAction: vi.fn(),
      offAction: vi.fn(),
      enableActionMap: vi.fn(),
      disableActionMap: vi.fn(),
    };

    // Mock getInstance to return our mock
    vi.mocked(InputManager.getInstance).mockReturnValue(mockInputManager);

    // Create InputAPI instance
    inputAPI = createInputAPI();
  });

  describe('Keyboard Input', () => {
    it('should delegate isKeyDown to InputManager', () => {
      mockInputManager.isKeyDown.mockReturnValue(true);

      const result = inputAPI.isKeyDown('w');

      expect(mockInputManager.isKeyDown).toHaveBeenCalledWith('w');
      expect(result).toBe(true);
    });

    it('should delegate isKeyPressed to InputManager', () => {
      mockInputManager.isKeyPressed.mockReturnValue(true);

      const result = inputAPI.isKeyPressed('space');

      expect(mockInputManager.isKeyPressed).toHaveBeenCalledWith('space');
      expect(result).toBe(true);
    });

    it('should delegate isKeyReleased to InputManager', () => {
      mockInputManager.isKeyReleased.mockReturnValue(true);

      const result = inputAPI.isKeyReleased('escape');

      expect(mockInputManager.isKeyReleased).toHaveBeenCalledWith('escape');
      expect(result).toBe(true);
    });

    it('should return false when key is not pressed', () => {
      mockInputManager.isKeyDown.mockReturnValue(false);

      const result = inputAPI.isKeyDown('a');

      expect(result).toBe(false);
    });
  });

  describe('Mouse Input', () => {
    it('should delegate isMouseButtonDown to InputManager', () => {
      mockInputManager.isMouseButtonDown.mockReturnValue(true);

      const result = inputAPI.isMouseButtonDown(0);

      expect(mockInputManager.isMouseButtonDown).toHaveBeenCalledWith(0);
      expect(result).toBe(true);
    });

    it('should delegate isMouseButtonPressed to InputManager', () => {
      mockInputManager.isMouseButtonPressed.mockReturnValue(true);

      const result = inputAPI.isMouseButtonPressed(1);

      expect(mockInputManager.isMouseButtonPressed).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it('should delegate isMouseButtonReleased to InputManager', () => {
      mockInputManager.isMouseButtonReleased.mockReturnValue(true);

      const result = inputAPI.isMouseButtonReleased(2);

      expect(mockInputManager.isMouseButtonReleased).toHaveBeenCalledWith(2);
      expect(result).toBe(true);
    });

    it('should delegate mousePosition to InputManager', () => {
      mockInputManager.mousePosition.mockReturnValue([100, 200]);

      const result = inputAPI.mousePosition();

      expect(mockInputManager.mousePosition).toHaveBeenCalled();
      expect(result).toEqual([100, 200]);
    });

    it('should delegate mouseDelta to InputManager', () => {
      mockInputManager.mouseDelta.mockReturnValue([5, -3]);

      const result = inputAPI.mouseDelta();

      expect(mockInputManager.mouseDelta).toHaveBeenCalled();
      expect(result).toEqual([5, -3]);
    });

    it('should delegate mouseWheel to InputManager', () => {
      mockInputManager.mouseWheel.mockReturnValue(1.5);

      const result = inputAPI.mouseWheel();

      expect(mockInputManager.mouseWheel).toHaveBeenCalled();
      expect(result).toBe(1.5);
    });
  });

  describe('Pointer Lock', () => {
    it('should delegate lockPointer to InputManager', () => {
      inputAPI.lockPointer();

      expect(mockInputManager.lockPointer).toHaveBeenCalled();
    });

    it('should delegate unlockPointer to InputManager', () => {
      inputAPI.unlockPointer();

      expect(mockInputManager.unlockPointer).toHaveBeenCalled();
    });

    it('should delegate isPointerLocked to InputManager', () => {
      mockInputManager.isPointerLocked.mockReturnValue(true);

      const result = inputAPI.isPointerLocked();

      expect(mockInputManager.isPointerLocked).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when pointer is not locked', () => {
      mockInputManager.isPointerLocked.mockReturnValue(false);

      const result = inputAPI.isPointerLocked();

      expect(result).toBe(false);
    });
  });

  describe('Input Actions System', () => {
    it('should delegate getActionValue to InputManager', () => {
      mockInputManager.getActionValue.mockReturnValue([0.5, -0.3]);

      const result = inputAPI.getActionValue('Gameplay', 'Move');

      expect(mockInputManager.getActionValue).toHaveBeenCalledWith('Gameplay', 'Move');
      expect(result).toEqual([0.5, -0.3]);
    });

    it('should delegate isActionActive to InputManager.isActionActiveNew', () => {
      mockInputManager.isActionActiveNew.mockReturnValue(true);

      const result = inputAPI.isActionActive('Gameplay', 'Jump');

      expect(mockInputManager.isActionActiveNew).toHaveBeenCalledWith('Gameplay', 'Jump');
      expect(result).toBe(true);
    });

    it('should delegate onAction to InputManager', () => {
      const callback = vi.fn();

      inputAPI.onAction('Gameplay', 'Fire', callback);

      expect(mockInputManager.onAction).toHaveBeenCalled();
      const callArgs = mockInputManager.onAction.mock.calls[0];
      expect(callArgs[0]).toBe('Gameplay');
      expect(callArgs[1]).toBe('Fire');
      expect(typeof callArgs[2]).toBe('function');
    });

    it('should transform onAction callback context to simplified format', () => {
      const userCallback = vi.fn();
      let capturedCallback: any;

      mockInputManager.onAction.mockImplementation(
        (_mapName: string, _actionName: string, callback: any) => {
          capturedCallback = callback;
        },
      );

      inputAPI.onAction('Gameplay', 'Move', userCallback);

      // Simulate InputManager calling the wrapped callback
      capturedCallback({ phase: 'started', value: [1, 0] });

      expect(userCallback).toHaveBeenCalledWith('started', [1, 0]);
    });

    it('should delegate offAction to InputManager', () => {
      const callback = vi.fn();

      inputAPI.offAction('Gameplay', 'Fire', callback);

      expect(mockInputManager.offAction).toHaveBeenCalled();
      const callArgs = mockInputManager.offAction.mock.calls[0];
      expect(callArgs[0]).toBe('Gameplay');
      expect(callArgs[1]).toBe('Fire');
      expect(typeof callArgs[2]).toBe('function');
    });

    it('should delegate enableActionMap to InputManager', () => {
      inputAPI.enableActionMap('UI');

      expect(mockInputManager.enableActionMap).toHaveBeenCalledWith('UI');
    });

    it('should delegate disableActionMap to InputManager', () => {
      inputAPI.disableActionMap('UI');

      expect(mockInputManager.disableActionMap).toHaveBeenCalledWith('UI');
    });
  });

  describe('Action Value Types', () => {
    it('should handle scalar action values', () => {
      mockInputManager.getActionValue.mockReturnValue(0.75);

      const result = inputAPI.getActionValue('Gameplay', 'Accelerate');

      expect(result).toBe(0.75);
    });

    it('should handle Vector2 action values', () => {
      mockInputManager.getActionValue.mockReturnValue([0.5, -0.8]);

      const result = inputAPI.getActionValue('Gameplay', 'Move');

      expect(result).toEqual([0.5, -0.8]);
    });

    it('should handle Vector3 action values', () => {
      mockInputManager.getActionValue.mockReturnValue([0.1, 0.2, 0.3]);

      const result = inputAPI.getActionValue('Gameplay', 'Look3D');

      expect(result).toEqual([0.1, 0.2, 0.3]);
    });

    it('should handle zero values', () => {
      mockInputManager.getActionValue.mockReturnValue(0);

      const result = inputAPI.getActionValue('Gameplay', 'Trigger');

      expect(result).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string key names', () => {
      mockInputManager.isKeyDown.mockReturnValue(false);

      const result = inputAPI.isKeyDown('');

      expect(mockInputManager.isKeyDown).toHaveBeenCalledWith('');
      expect(result).toBe(false);
    });

    it('should handle negative mouse button indices', () => {
      mockInputManager.isMouseButtonDown.mockReturnValue(false);

      const result = inputAPI.isMouseButtonDown(-1);

      expect(mockInputManager.isMouseButtonDown).toHaveBeenCalledWith(-1);
      expect(result).toBe(false);
    });

    it('should handle non-existent action maps', () => {
      mockInputManager.getActionValue.mockReturnValue(0);

      const result = inputAPI.getActionValue('NonExistent', 'Action');

      expect(mockInputManager.getActionValue).toHaveBeenCalledWith('NonExistent', 'Action');
      expect(result).toBe(0);
    });

    it('should handle special characters in action names', () => {
      mockInputManager.isActionActiveNew.mockReturnValue(false);

      const result = inputAPI.isActionActive('Map-1', 'Action_2@#');

      expect(mockInputManager.isActionActiveNew).toHaveBeenCalledWith('Map-1', 'Action_2@#');
      expect(result).toBe(false);
    });
  });

  describe('Multiple Calls', () => {
    it('should handle multiple keyboard queries in same frame', () => {
      mockInputManager.isKeyDown.mockReturnValueOnce(true).mockReturnValueOnce(false);

      const result1 = inputAPI.isKeyDown('w');
      const result2 = inputAPI.isKeyDown('s');

      expect(result1).toBe(true);
      expect(result2).toBe(false);
      expect(mockInputManager.isKeyDown).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple action value queries', () => {
      mockInputManager.getActionValue
        .mockReturnValueOnce([1, 0])
        .mockReturnValueOnce([0, -1])
        .mockReturnValueOnce(0.5);

      const move = inputAPI.getActionValue('Gameplay', 'Move');
      const look = inputAPI.getActionValue('Gameplay', 'Look');
      const trigger = inputAPI.getActionValue('Gameplay', 'Trigger');

      expect(move).toEqual([1, 0]);
      expect(look).toEqual([0, -1]);
      expect(trigger).toBe(0.5);
    });

    it('should handle multiple action callbacks', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      inputAPI.onAction('Gameplay', 'Jump', callback1);
      inputAPI.onAction('Gameplay', 'Fire', callback2);
      inputAPI.onAction('UI', 'Submit', callback3);

      expect(mockInputManager.onAction).toHaveBeenCalledTimes(3);
    });
  });

  describe('Callback Transformations', () => {
    it('should preserve callback phase information', () => {
      const userCallback = vi.fn();
      let capturedCallback: any;

      mockInputManager.onAction.mockImplementation(
        (_mapName: string, _actionName: string, callback: any) => {
          capturedCallback = callback;
        },
      );

      inputAPI.onAction('Gameplay', 'Jump', userCallback);

      // Test all three phases
      capturedCallback({ phase: 'started', value: 1 });
      capturedCallback({ phase: 'performed', value: 1 });
      capturedCallback({ phase: 'canceled', value: 0 });

      expect(userCallback).toHaveBeenCalledTimes(3);
      expect(userCallback).toHaveBeenNthCalledWith(1, 'started', 1);
      expect(userCallback).toHaveBeenNthCalledWith(2, 'performed', 1);
      expect(userCallback).toHaveBeenNthCalledWith(3, 'canceled', 0);
    });

    it('should preserve callback value types', () => {
      const userCallback = vi.fn();
      let capturedCallback: any;

      mockInputManager.onAction.mockImplementation(
        (_mapName: string, _actionName: string, callback: any) => {
          capturedCallback = callback;
        },
      );

      inputAPI.onAction('Gameplay', 'Move', userCallback);

      // Test different value types
      capturedCallback({ phase: 'started', value: 0.5 }); // scalar
      capturedCallback({ phase: 'performed', value: [1, 0] }); // Vector2
      capturedCallback({ phase: 'canceled', value: [0, 1, 0] }); // Vector3

      expect(userCallback).toHaveBeenNthCalledWith(1, 'started', 0.5);
      expect(userCallback).toHaveBeenNthCalledWith(2, 'performed', [1, 0]);
      expect(userCallback).toHaveBeenNthCalledWith(3, 'canceled', [0, 1, 0]);
    });
  });

  describe('API Consistency', () => {
    it('should use same InputManager instance across calls', () => {
      // Clear previous calls from beforeEach
      vi.mocked(InputManager.getInstance).mockClear();

      // Create a fresh InputAPI instance
      const freshAPI = createInputAPI();

      // Make multiple calls
      freshAPI.isKeyDown('w');
      freshAPI.mousePosition();
      freshAPI.getActionValue('Gameplay', 'Move');

      // getInstance should only be called once during createInputAPI
      expect(InputManager.getInstance).toHaveBeenCalledTimes(1);
    });

    it('should provide consistent return types', () => {
      mockInputManager.isKeyDown.mockReturnValue(true);
      mockInputManager.mousePosition.mockReturnValue([100, 200]);
      mockInputManager.getActionValue.mockReturnValue([0.5, -0.3]);

      const keyResult = inputAPI.isKeyDown('w');
      const posResult = inputAPI.mousePosition();
      const actionResult = inputAPI.getActionValue('Gameplay', 'Move');

      expect(typeof keyResult).toBe('boolean');
      expect(Array.isArray(posResult)).toBe(true);
      expect(posResult.length).toBe(2);
      expect(Array.isArray(actionResult)).toBe(true);
    });
  });
});
