import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InputManager } from '../InputManager';

describe('InputManager', () => {
  let inputManager: InputManager;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    // Reset singleton
    InputManager.resetInstance();

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

    inputManager = InputManager.getInstance();
    inputManager.initialize(canvas);
  });

  afterEach(() => {
    inputManager.shutdown();
    document.body.removeChild(canvas);
  });

  describe('Singleton pattern', () => {
    it('should return same instance', () => {
      const instance1 = InputManager.getInstance();
      const instance2 = InputManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should not double-initialize', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      inputManager.initialize(canvas);

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('Keyboard integration', () => {
    it('should forward keyboard methods', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));

      expect(inputManager.isKeyDown('w')).toBe(true);
    });

    it('should detect key pressed', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'space' }));

      expect(inputManager.isKeyPressed('space')).toBe(true);
    });

    it('should detect key released', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));

      expect(inputManager.isKeyReleased('a')).toBe(true);
    });
  });

  describe('Mouse integration', () => {
    it('should forward mouse button methods', () => {
      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));

      expect(inputManager.isMouseButtonDown(0)).toBe(true);
    });

    it('should forward mouse position', () => {
      canvas.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: 100,
          clientY: 200,
        }),
      );

      const [x, y] = inputManager.mousePosition();
      expect(x).toBe(100);
      expect(y).toBe(200);
    });

    it('should forward mouse delta', () => {
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
          clientY: 120,
        }),
      );

      const [dx, dy] = inputManager.mouseDelta();
      expect(dx).toBe(50);
      expect(dy).toBe(20);
    });

    it('should forward mouse wheel', () => {
      canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }));

      expect(inputManager.mouseWheel()).toBe(100);
    });
  });

  describe('Frame lifecycle', () => {
    it('should update mouse state on update()', () => {
      canvas.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: 100,
          clientY: 100,
        }),
      );

      inputManager.update();

      const [dx, dy] = inputManager.mouseDelta();
      expect(dx).toBe(0);
      expect(dy).toBe(0);
    });

    it('should clear frame state on clearFrameState()', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
      canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }));

      expect(inputManager.isKeyPressed('w')).toBe(true);
      expect(inputManager.mouseWheel()).toBe(100);

      inputManager.clearFrameState();

      expect(inputManager.isKeyPressed('w')).toBe(false);
      expect(inputManager.mouseWheel()).toBe(0);
      expect(inputManager.isKeyDown('w')).toBe(true); // Still held
    });
  });

  describe('Pointer lock', () => {
    it('should lock pointer', () => {
      // Mock requestPointerLock on canvas
      canvas.requestPointerLock = vi.fn();

      inputManager.lockPointer();

      expect(canvas.requestPointerLock).toHaveBeenCalled();
    });

    it('should unlock pointer', () => {
      // Mock exitPointerLock on document
      document.exitPointerLock = vi.fn();

      Object.defineProperty(document, 'pointerLockElement', {
        writable: true,
        value: canvas,
      });

      inputManager.unlockPointer();

      expect(document.exitPointerLock).toHaveBeenCalled();
    });

    it('should report pointer lock state', () => {
      expect(inputManager.isPointerLocked()).toBe(false);

      Object.defineProperty(document, 'pointerLockElement', {
        writable: true,
        value: canvas,
      });
      document.dispatchEvent(new Event('pointerlockchange'));

      expect(inputManager.isPointerLocked()).toBe(true);
    });
  });

  describe('Action maps (legacy)', () => {
    it('should register action map', () => {
      inputManager.registerActionMap('player', {
        actions: {
          jump: { keys: ['space'] },
        },
      });

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'space' }));

      expect(inputManager.isActionActive('jump', 'player')).toBe(true);
    });

    it('should get action value for axis', () => {
      inputManager.registerActionMap('player', {
        actions: {
          'camera-x': { axis: 'mouse-x' },
        },
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
          clientX: 150,
          clientY: 100,
        }),
      );

      const value = inputManager.getActionValueLegacy('camera-x', 'player');
      expect(value).toBe(50);
    });
  });

  describe('Cleanup', () => {
    it('should clean up all resources on shutdown', () => {
      inputManager.shutdown();

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));

      expect(inputManager.isKeyDown('w')).toBe(false);
      expect(inputManager.isMouseButtonDown(0)).toBe(false);
    });
  });
});
