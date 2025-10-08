import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ActionMap } from '../ActionMap';
import { InputManager } from '../InputManager';
import type { IActionMapConfig } from '../types';

describe('ActionMap', () => {
  let inputManager: InputManager;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    InputManager.resetInstance();

    canvas = document.createElement('canvas');
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

  describe('Keyboard bindings', () => {
    it('should bind single key to action', () => {
      const config: IActionMapConfig = {
        actions: {
          jump: { keys: ['space'] },
        },
      };

      const actionMap = new ActionMap(config, inputManager);

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'space' }));

      expect(actionMap.isActionActive('jump')).toBe(true);
    });

    it('should bind multiple keys to action', () => {
      const config: IActionMapConfig = {
        actions: {
          'move-forward': { keys: ['w', 'up'] },
        },
      };

      const actionMap = new ActionMap(config, inputManager);

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
      expect(actionMap.isActionActive('move-forward')).toBe(true);

      inputManager.clearFrameState();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      expect(actionMap.isActionActive('move-forward')).toBe(true);
    });

    it('should return action value 1.0 when active', () => {
      const config: IActionMapConfig = {
        actions: {
          shoot: { keys: ['f'] },
        },
      };

      const actionMap = new ActionMap(config, inputManager);

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));

      expect(actionMap.getActionValue('shoot')).toBe(1.0);
    });

    it('should return action value 0.0 when inactive', () => {
      const config: IActionMapConfig = {
        actions: {
          shoot: { keys: ['f'] },
        },
      };

      const actionMap = new ActionMap(config, inputManager);

      expect(actionMap.getActionValue('shoot')).toBe(0.0);
    });
  });

  describe('Mouse button bindings', () => {
    it('should bind mouse button to action', () => {
      const config: IActionMapConfig = {
        actions: {
          shoot: { mouseButtons: [0] },
        },
      };

      const actionMap = new ActionMap(config, inputManager);

      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));

      expect(actionMap.isActionActive('shoot')).toBe(true);
    });

    it('should bind multiple mouse buttons to action', () => {
      const config: IActionMapConfig = {
        actions: {
          interact: { mouseButtons: [0, 2] },
        },
      };

      const actionMap = new ActionMap(config, inputManager);

      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
      expect(actionMap.isActionActive('interact')).toBe(true);

      inputManager.clearFrameState();
      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 2 }));
      expect(actionMap.isActionActive('interact')).toBe(true);
    });
  });

  describe('Mixed bindings', () => {
    it('should bind both keys and mouse buttons to action', () => {
      const config: IActionMapConfig = {
        actions: {
          jump: { keys: ['space'], mouseButtons: [1] },
        },
      };

      const actionMap = new ActionMap(config, inputManager);

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'space' }));
      expect(actionMap.isActionActive('jump')).toBe(true);

      inputManager.clearFrameState();
      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 1 }));
      expect(actionMap.isActionActive('jump')).toBe(true);
    });
  });

  describe('Axis bindings', () => {
    it('should return mouse-x axis value', () => {
      const config: IActionMapConfig = {
        actions: {
          'camera-x': { axis: 'mouse-x' },
        },
      };

      const actionMap = new ActionMap(config, inputManager);

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

      expect(actionMap.getActionValue('camera-x')).toBe(50);
    });

    it('should return mouse-y axis value', () => {
      const config: IActionMapConfig = {
        actions: {
          'camera-y': { axis: 'mouse-y' },
        },
      };

      const actionMap = new ActionMap(config, inputManager);

      canvas.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: 100,
          clientY: 100,
        }),
      );

      inputManager.update();

      canvas.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: 100,
          clientY: 150,
        }),
      );

      expect(actionMap.getActionValue('camera-y')).toBe(50);
    });

    it('should return wheel axis value', () => {
      const config: IActionMapConfig = {
        actions: {
          zoom: { axis: 'wheel' },
        },
      };

      const actionMap = new ActionMap(config, inputManager);

      canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }));

      expect(actionMap.getActionValue('zoom')).toBe(100);
    });
  });

  describe('Action queries', () => {
    it('should return all action names', () => {
      const config: IActionMapConfig = {
        actions: {
          jump: { keys: ['space'] },
          shoot: { keys: ['f'] },
          'move-forward': { keys: ['w'] },
        },
      };

      const actionMap = new ActionMap(config, inputManager);

      const names = actionMap.getActionNames();
      expect(names).toContain('jump');
      expect(names).toContain('shoot');
      expect(names).toContain('move-forward');
      expect(names.length).toBe(3);
    });
  });

  describe('Inactive actions', () => {
    it('should return false for unbound action', () => {
      const config: IActionMapConfig = {
        actions: {
          jump: { keys: ['space'] },
        },
      };

      const actionMap = new ActionMap(config, inputManager);

      expect(actionMap.isActionActive('nonexistent')).toBe(false);
    });

    it('should return 0 for unbound action value', () => {
      const config: IActionMapConfig = {
        actions: {
          jump: { keys: ['space'] },
        },
      };

      const actionMap = new ActionMap(config, inputManager);

      expect(actionMap.getActionValue('nonexistent')).toBe(0);
    });
  });
});
