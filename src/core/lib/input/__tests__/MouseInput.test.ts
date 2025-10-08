import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MouseInput } from '../MouseInput';

describe('MouseInput', () => {
  let mouseInput: MouseInput;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    document.body.appendChild(canvas);

    // Mock getBoundingClientRect
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

    mouseInput = new MouseInput(canvas);
  });

  afterEach(() => {
    mouseInput.destroy();
    document.body.removeChild(canvas);
  });

  describe('Mouse button states', () => {
    it('should detect left button down', () => {
      const event = new MouseEvent('mousedown', { button: 0 });
      canvas.dispatchEvent(event);

      expect(mouseInput.isButtonDown(0)).toBe(true);
    });

    it('should detect right button down', () => {
      const event = new MouseEvent('mousedown', { button: 2 });
      canvas.dispatchEvent(event);

      expect(mouseInput.isButtonDown(2)).toBe(true);
    });

    it('should detect middle button down', () => {
      const event = new MouseEvent('mousedown', { button: 1 });
      canvas.dispatchEvent(event);

      expect(mouseInput.isButtonDown(1)).toBe(true);
    });

    it('should detect button pressed this frame', () => {
      const event = new MouseEvent('mousedown', { button: 0 });
      canvas.dispatchEvent(event);

      expect(mouseInput.isButtonPressed(0)).toBe(true);
    });

    it('should not detect pressed if already down', () => {
      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
      mouseInput.clearFrameState();

      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));

      expect(mouseInput.isButtonPressed(0)).toBe(false);
      expect(mouseInput.isButtonDown(0)).toBe(true);
    });

    it('should detect button released', () => {
      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
      canvas.dispatchEvent(new MouseEvent('mouseup', { button: 0 }));

      expect(mouseInput.isButtonReleased(0)).toBe(true);
      expect(mouseInput.isButtonDown(0)).toBe(false);
    });

    it('should clear pressed and released state after frame', () => {
      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
      expect(mouseInput.isButtonPressed(0)).toBe(true);

      mouseInput.clearFrameState();

      expect(mouseInput.isButtonPressed(0)).toBe(false);
      expect(mouseInput.isButtonDown(0)).toBe(true);
    });
  });

  describe('Mouse position', () => {
    it('should track mouse position relative to canvas', () => {
      const event = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 200,
      });
      canvas.dispatchEvent(event);

      const [x, y] = mouseInput.getPosition();
      expect(x).toBe(100);
      expect(y).toBe(200);
    });

    it('should calculate mouse delta', () => {
      canvas.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: 100,
          clientY: 100,
        }),
      );

      mouseInput.update();

      canvas.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: 150,
          clientY: 120,
        }),
      );

      const [dx, dy] = mouseInput.getDelta();
      expect(dx).toBe(50);
      expect(dy).toBe(20);
    });

    it('should reset delta on update', () => {
      canvas.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: 100,
          clientY: 100,
        }),
      );

      mouseInput.update();

      // Same position - delta should be 0
      const [dx, dy] = mouseInput.getDelta();
      expect(dx).toBe(0);
      expect(dy).toBe(0);
    });
  });

  describe('Mouse wheel', () => {
    it('should track wheel delta', () => {
      const event = new WheelEvent('wheel', { deltaY: 100 });
      canvas.dispatchEvent(event);

      expect(mouseInput.getWheelDelta()).toBe(100);
    });

    it('should accumulate wheel delta', () => {
      canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: 50 }));
      canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: 30 }));

      expect(mouseInput.getWheelDelta()).toBe(80);
    });

    it('should clear wheel delta after frame', () => {
      canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }));
      expect(mouseInput.getWheelDelta()).toBe(100);

      mouseInput.clearFrameState();

      expect(mouseInput.getWheelDelta()).toBe(0);
    });
  });

  describe('Pointer lock', () => {
    it('should track pointer lock state', () => {
      expect(mouseInput.isPointerLockedState()).toBe(false);

      // Mock pointer lock
      Object.defineProperty(document, 'pointerLockElement', {
        writable: true,
        value: canvas,
      });

      document.dispatchEvent(new Event('pointerlockchange'));

      expect(mouseInput.isPointerLockedState()).toBe(true);
    });

    it('should use movement delta in pointer lock mode', () => {
      // Enable pointer lock
      Object.defineProperty(document, 'pointerLockElement', {
        writable: true,
        value: canvas,
      });
      document.dispatchEvent(new Event('pointerlockchange'));

      canvas.dispatchEvent(
        new MouseEvent('mousemove', {
          movementX: 10,
          movementY: 20,
        }),
      );

      const [x, y] = mouseInput.getPosition();
      expect(x).toBe(10);
      expect(y).toBe(20);
    });
  });

  describe('Multiple buttons', () => {
    it('should track multiple buttons simultaneously', () => {
      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 1 }));
      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 2 }));

      expect(mouseInput.isButtonDown(0)).toBe(true);
      expect(mouseInput.isButtonDown(1)).toBe(true);
      expect(mouseInput.isButtonDown(2)).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners on destroy', () => {
      mouseInput.destroy();

      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));

      expect(mouseInput.isButtonDown(0)).toBe(false);
    });
  });
});
