import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InputManager } from '@/core/lib/input/InputManager';
import { createInputAPI } from '../InputAPI';
import type { IInputActionsAsset } from '@/core/lib/input/inputTypes';

describe('InputAPI Integration Tests', () => {
  let inputManager: InputManager;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    // Reset singleton
    InputManager.resetInstance();

    // Create canvas
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    document.body.appendChild(canvas);

    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    // Initialize InputManager
    inputManager = InputManager.getInstance();
    inputManager.initialize(canvas);
  });

  afterEach(() => {
    inputManager.shutdown();
    document.body.removeChild(canvas);
    vi.restoreAllMocks();
  });

  describe('Basic Keyboard Input', () => {
    it('should detect key down', () => {
      const inputAPI = createInputAPI();

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));

      expect(inputAPI.isKeyDown('w')).toBe(true);
      expect(inputAPI.isKeyDown('s')).toBe(false);
    });

    it('should detect key pressed (single frame)', () => {
      const inputAPI = createInputAPI();

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'space' }));

      expect(inputAPI.isKeyPressed('space')).toBe(true);

      // After clearFrameState, it should be false
      inputManager.clearFrameState();

      expect(inputAPI.isKeyPressed('space')).toBe(false);
      expect(inputAPI.isKeyDown('space')).toBe(true); // Still held
    });

    it('should detect key released', () => {
      const inputAPI = createInputAPI();

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      inputManager.clearFrameState();

      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));

      expect(inputAPI.isKeyReleased('a')).toBe(true);
      expect(inputAPI.isKeyDown('a')).toBe(false);
    });

    it('should handle multiple keys simultaneously', () => {
      const inputAPI = createInputAPI();

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'shift' }));

      expect(inputAPI.isKeyDown('w')).toBe(true);
      expect(inputAPI.isKeyDown('a')).toBe(true);
      expect(inputAPI.isKeyDown('shift')).toBe(true);
    });
  });

  describe('Basic Mouse Input', () => {
    it('should detect mouse button down', () => {
      const inputAPI = createInputAPI();

      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));

      expect(inputAPI.isMouseButtonDown(0)).toBe(true);
      expect(inputAPI.isMouseButtonDown(1)).toBe(false);
      expect(inputAPI.isMouseButtonDown(2)).toBe(false);
    });

    it('should detect mouse button pressed (single frame)', () => {
      const inputAPI = createInputAPI();

      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));

      expect(inputAPI.isMouseButtonPressed(0)).toBe(true);

      inputManager.clearFrameState();

      expect(inputAPI.isMouseButtonPressed(0)).toBe(false);
      expect(inputAPI.isMouseButtonDown(0)).toBe(true); // Still held
    });

    it('should detect mouse button released', () => {
      const inputAPI = createInputAPI();

      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
      inputManager.clearFrameState();

      canvas.dispatchEvent(new MouseEvent('mouseup', { button: 0 }));

      expect(inputAPI.isMouseButtonReleased(0)).toBe(true);
      expect(inputAPI.isMouseButtonDown(0)).toBe(false);
    });

    it('should get mouse position', () => {
      const inputAPI = createInputAPI();

      canvas.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: 250,
          clientY: 150,
        }),
      );

      const [x, y] = inputAPI.mousePosition();
      expect(x).toBe(250);
      expect(y).toBe(150);
    });

    it('should get mouse delta', () => {
      const inputAPI = createInputAPI();

      canvas.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: 100,
          clientY: 100,
        }),
      );

      inputManager.update();

      canvas.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: 150,
          clientY: 130,
        }),
      );

      const [dx, dy] = inputAPI.mouseDelta();
      expect(dx).toBe(50);
      expect(dy).toBe(30);
    });

    it('should get mouse wheel delta', () => {
      const inputAPI = createInputAPI();

      canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }));

      expect(inputAPI.mouseWheel()).toBe(100);

      inputManager.clearFrameState();

      expect(inputAPI.mouseWheel()).toBe(0);
    });

    it('should handle all three mouse buttons', () => {
      const inputAPI = createInputAPI();

      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0 })); // Left
      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 1 })); // Middle
      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 2 })); // Right

      expect(inputAPI.isMouseButtonDown(0)).toBe(true);
      expect(inputAPI.isMouseButtonDown(1)).toBe(true);
      expect(inputAPI.isMouseButtonDown(2)).toBe(true);
    });
  });

  describe('Pointer Lock', () => {
    it('should lock pointer', () => {
      const inputAPI = createInputAPI();

      canvas.requestPointerLock = vi.fn();

      inputAPI.lockPointer();

      expect(canvas.requestPointerLock).toHaveBeenCalled();
    });

    it('should unlock pointer', () => {
      const inputAPI = createInputAPI();

      document.exitPointerLock = vi.fn();

      Object.defineProperty(document, 'pointerLockElement', {
        writable: true,
        configurable: true,
        value: canvas,
      });

      inputAPI.unlockPointer();

      expect(document.exitPointerLock).toHaveBeenCalled();
    });

    it('should report pointer lock state', () => {
      const inputAPI = createInputAPI();

      expect(inputAPI.isPointerLocked()).toBe(false);

      Object.defineProperty(document, 'pointerLockElement', {
        writable: true,
        configurable: true,
        value: canvas,
      });
      document.dispatchEvent(new Event('pointerlockchange'));

      expect(inputAPI.isPointerLocked()).toBe(true);
    });
  });

  describe('Input Actions System', () => {
    beforeEach(() => {
      // Load a test input actions asset with correct schema
      const testAsset: IInputActionsAsset = {
        name: 'TestInputAsset',
        controlSchemes: [],
        actionMaps: [
          {
            name: 'Gameplay',
            enabled: true,
            actions: [
              {
                name: 'Move',
                actionType: 'value' as any,
                controlType: 'vector2' as any,
                enabled: true,
                bindings: [
                  {
                    compositeType: '2DVector' as any,
                    bindings: {
                      up: { type: 'keyboard' as any, path: 'w' },
                      down: { type: 'keyboard' as any, path: 's' },
                      left: { type: 'keyboard' as any, path: 'a' },
                      right: { type: 'keyboard' as any, path: 'd' },
                    },
                  },
                ],
              },
              {
                name: 'Jump',
                actionType: 'button' as any,
                controlType: 'button' as any,
                enabled: true,
                bindings: [
                  {
                    type: 'keyboard' as any,
                    path: 'space',
                  },
                ],
              },
              {
                name: 'Fire',
                actionType: 'button' as any,
                controlType: 'button' as any,
                enabled: true,
                bindings: [
                  {
                    type: 'mouse' as any,
                    path: 'leftButton',
                  },
                ],
              },
            ],
          },
        ],
      };

      inputManager.loadInputActionsAsset(testAsset);
      inputManager.enableActionMap('Gameplay');
    });

    it('should get action value for 2D vector (WASD)', () => {
      const inputAPI = createInputAPI();

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));

      inputManager.update();

      const value = inputAPI.getActionValue('Gameplay', 'Move');
      expect(value).toBeInstanceOf(Array);
      expect((value as number[]).length).toBe(2);

      const [x, y] = value as [number, number];
      expect(y).toBeGreaterThan(0); // W = forward = positive Y
    });

    it('should detect action active for button', () => {
      const inputAPI = createInputAPI();

      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' })); // Space

      inputManager.update();

      expect(inputAPI.isActionActive('Gameplay', 'Jump')).toBe(true);
    });

    it('should detect mouse button as action', () => {
      const inputAPI = createInputAPI();

      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));

      inputManager.update();

      expect(inputAPI.isActionActive('Gameplay', 'Fire')).toBe(true);
    });

    it('should handle action events with onAction', () => {
      const inputAPI = createInputAPI();

      const callback = vi.fn();
      inputAPI.onAction('Gameplay', 'Jump', callback);

      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));

      inputManager.update();

      expect(callback).toHaveBeenCalledWith('started', expect.any(Number));
    });

    it('should enable and disable action maps', () => {
      const inputAPI = createInputAPI();

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'space' }));
      inputManager.update();

      expect(inputAPI.isActionActive('Gameplay', 'Jump')).toBe(true);

      // Release key and disable map
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'space' }));
      inputAPI.disableActionMap('Gameplay');
      inputManager.clearFrameState();
      inputManager.update();

      expect(inputAPI.isActionActive('Gameplay', 'Jump')).toBe(false);

      // Re-enable and press key again
      inputAPI.enableActionMap('Gameplay');
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'space' }));
      inputManager.update();

      expect(inputAPI.isActionActive('Gameplay', 'Jump')).toBe(true);
    });

    it('should handle composite bindings (WASD movement)', () => {
      const inputAPI = createInputAPI();

      // Press W and D simultaneously (forward + right)
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));

      inputManager.update();

      const value = inputAPI.getActionValue('Gameplay', 'Move');
      const [x, y] = value as [number, number];

      expect(x).toBeGreaterThan(0); // D = right = positive X
      expect(y).toBeGreaterThan(0); // W = forward = positive Y
    });
  });

  describe('Frame Lifecycle Integration', () => {
    it('should properly manage frame state across update cycle', () => {
      const inputAPI = createInputAPI();

      // Frame 1: Press key
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));

      expect(inputAPI.isKeyPressed('w')).toBe(true);
      expect(inputAPI.isKeyDown('w')).toBe(true);

      // Frame 2: Key still held
      inputManager.clearFrameState();

      expect(inputAPI.isKeyPressed('w')).toBe(false); // Not pressed THIS frame
      expect(inputAPI.isKeyDown('w')).toBe(true); // Still held

      // Frame 3: Release key
      inputManager.update();
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));

      expect(inputAPI.isKeyReleased('w')).toBe(true);
      expect(inputAPI.isKeyDown('w')).toBe(false);
    });

    it('should reset mouse delta after update', () => {
      const inputAPI = createInputAPI();

      canvas.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: 100,
          clientY: 100,
        }),
      );

      inputManager.update();

      canvas.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: 150,
          clientY: 130,
        }),
      );

      let [dx, dy] = inputAPI.mouseDelta();
      expect(dx).toBe(50);
      expect(dy).toBe(30);

      inputManager.update();

      [dx, dy] = inputAPI.mouseDelta();
      expect(dx).toBe(0);
      expect(dy).toBe(0);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle player movement (WASD + Shift sprint)', () => {
      const inputAPI = createInputAPI();

      // Walking forward
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));

      expect(inputAPI.isKeyDown('w')).toBe(true);
      expect(inputAPI.isKeyDown('shift')).toBe(false);

      // Start sprinting
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'shift' }));

      expect(inputAPI.isKeyDown('w')).toBe(true);
      expect(inputAPI.isKeyDown('shift')).toBe(true);
    });

    it('should handle FPS camera controls (mouse + pointer lock)', () => {
      const inputAPI = createInputAPI();

      canvas.requestPointerLock = vi.fn();

      // Lock pointer on mouse click
      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
      inputAPI.lockPointer();

      expect(canvas.requestPointerLock).toHaveBeenCalled();
      expect(inputAPI.isMouseButtonDown(0)).toBe(true);

      // Simulate mouse movement for camera rotation
      Object.defineProperty(document, 'pointerLockElement', {
        writable: true,
        configurable: true,
        value: canvas,
      });

      canvas.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: 100,
          clientY: 100,
        }),
      );

      inputManager.update();

      canvas.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: 110,
          clientY: 95,
        }),
      );

      const [dx, dy] = inputAPI.mouseDelta();
      expect(Math.abs(dx)).toBeGreaterThan(0);
    });

    it('should handle jump + shoot combo', () => {
      const inputAPI = createInputAPI();

      // Jump
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'space' }));

      expect(inputAPI.isKeyPressed('space')).toBe(true);

      // Shoot while jumping
      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));

      expect(inputAPI.isKeyDown('space')).toBe(true);
      expect(inputAPI.isMouseButtonPressed(0)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle non-existent keys gracefully', () => {
      const inputAPI = createInputAPI();

      expect(inputAPI.isKeyDown('nonexistent')).toBe(false);
      expect(inputAPI.isKeyPressed('nonexistent')).toBe(false);
      expect(inputAPI.isKeyReleased('nonexistent')).toBe(false);
    });

    it('should handle invalid mouse buttons gracefully', () => {
      const inputAPI = createInputAPI();

      expect(inputAPI.isMouseButtonDown(99)).toBe(false);
      expect(inputAPI.isMouseButtonPressed(-1)).toBe(false);
    });

    it('should handle multiple rapid key presses', () => {
      const inputAPI = createInputAPI();

      // Rapid fire space presses
      for (let i = 0; i < 5; i++) {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'space' }));
        expect(inputAPI.isKeyPressed('space')).toBe(true);

        inputManager.clearFrameState();

        window.dispatchEvent(new KeyboardEvent('keyup', { key: 'space' }));
        expect(inputAPI.isKeyReleased('space')).toBe(true);

        inputManager.clearFrameState();
      }
    });

    it('should handle action map not loaded', () => {
      const inputAPI = createInputAPI();

      const value = inputAPI.getActionValue('nonexistent', 'action');
      expect(value).toBe(0);

      expect(inputAPI.isActionActive('nonexistent', 'action')).toBe(false);
    });
  });
});
