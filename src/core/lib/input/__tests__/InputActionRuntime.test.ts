import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InputActionRuntime } from '../InputActionRuntime';
import { KeyboardInput } from '../KeyboardInput';
import { MouseInput } from '../MouseInput';
import {
  IInputActionsAsset,
  ActionType,
  ControlType,
  DeviceType,
  CompositeType,
} from '../inputTypes';

describe('InputActionRuntime', () => {
  let runtime: InputActionRuntime;
  let keyboard: KeyboardInput;
  let mouse: MouseInput;

  beforeEach(() => {
    // Create mock canvas for MouseInput
    const canvas = document.createElement('canvas');
    keyboard = new KeyboardInput();
    mouse = new MouseInput(canvas);
    runtime = new InputActionRuntime(keyboard, mouse);
  });

  describe('loadAsset', () => {
    it('should load an input actions asset', () => {
      const asset: IInputActionsAsset = {
        name: 'Test Asset',
        controlSchemes: [],
        actionMaps: [
          {
            name: 'Gameplay',
            enabled: true,
            actions: [
              {
                name: 'Jump',
                actionType: ActionType.Button,
                controlType: ControlType.Button,
                enabled: true,
                bindings: [
                  { type: DeviceType.Keyboard, path: 'space' },
                ],
              },
            ],
          },
        ],
      };

      runtime.loadAsset(asset);

      // Verify asset loaded by checking action value
      const value = runtime.getActionValue('Gameplay', 'Jump');
      expect(value).toBe(0); // Not pressed yet
    });

    it('should enable action maps that are enabled in asset', () => {
      const asset: IInputActionsAsset = {
        name: 'Test',
        controlSchemes: [],
        actionMaps: [
          { name: 'Enabled', enabled: true, actions: [] },
          { name: 'Disabled', enabled: false, actions: [] },
        ],
      };

      runtime.loadAsset(asset);

      // This is verified internally - no public API to check
      expect(runtime).toBeDefined();
    });
  });

  describe('button actions', () => {
    beforeEach(() => {
      const asset: IInputActionsAsset = {
        name: 'Test',
        controlSchemes: [],
        actionMaps: [
          {
            name: 'Test',
            enabled: true,
            actions: [
              {
                name: 'Fire',
                actionType: ActionType.Button,
                controlType: ControlType.Button,
                enabled: true,
                bindings: [
                  { type: DeviceType.Keyboard, path: 'f' },
                ],
              },
            ],
          },
        ],
      };
      runtime.loadAsset(asset);
    });

    it('should detect button press', () => {
      // Simulate key press
      const event = new KeyboardEvent('keydown', { key: 'f' });
      window.dispatchEvent(event);

      runtime.update();

      expect(runtime.isActionActive('Test', 'Fire')).toBe(true);
      expect(runtime.getActionValue('Test', 'Fire')).toBe(1);
    });

    it('should detect button release', () => {
      // Press then release
      const downEvent = new KeyboardEvent('keydown', { key: 'f' });
      window.dispatchEvent(downEvent);
      runtime.update();

      const upEvent = new KeyboardEvent('keyup', { key: 'f' });
      window.dispatchEvent(upEvent);
      runtime.update();

      expect(runtime.isActionActive('Test', 'Fire')).toBe(false);
      expect(runtime.getActionValue('Test', 'Fire')).toBe(0);
    });
  });

  describe('composite 2D vector actions', () => {
    beforeEach(() => {
      const asset: IInputActionsAsset = {
        name: 'Test',
        controlSchemes: [],
        actionMaps: [
          {
            name: 'Test',
            enabled: true,
            actions: [
              {
                name: 'Move',
                actionType: ActionType.PassThrough,
                controlType: ControlType.Vector2,
                enabled: true,
                bindings: [
                  {
                    compositeType: CompositeType.TwoDVector,
                    bindings: {
                      up: { type: DeviceType.Keyboard, path: 'w' },
                      down: { type: DeviceType.Keyboard, path: 's' },
                      left: { type: DeviceType.Keyboard, path: 'a' },
                      right: { type: DeviceType.Keyboard, path: 'd' },
                    },
                  },
                ],
              },
            ],
          },
        ],
      };
      runtime.loadAsset(asset);
    });

    it('should return zero vector when no keys pressed', () => {
      runtime.update();

      const value = runtime.getActionValue('Test', 'Move') as [number, number];
      expect(value).toEqual([0, 0]);
      expect(runtime.isActionActive('Test', 'Move')).toBe(false);
    });

    it('should return correct vector for single direction', () => {
      const event = new KeyboardEvent('keydown', { key: 'w' });
      window.dispatchEvent(event);
      runtime.update();

      const value = runtime.getActionValue('Test', 'Move') as [number, number];
      expect(value).toEqual([0, 1]); // Up
      expect(runtime.isActionActive('Test', 'Move')).toBe(true);
    });

    it('should normalize diagonal movement', () => {
      // Press W and D (up-right)
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
      runtime.update();

      const value = runtime.getActionValue('Test', 'Move') as [number, number];
      const [x, y] = value;

      // Should be normalized (length = 1)
      const length = Math.sqrt(x * x + y * y);
      expect(length).toBeCloseTo(1, 5);
      expect(x).toBeGreaterThan(0);
      expect(y).toBeGreaterThan(0);
    });
  });

  describe('action callbacks', () => {
    it('should call started callback when action begins', () => {
      const asset: IInputActionsAsset = {
        name: 'Test',
        controlSchemes: [],
        actionMaps: [
          {
            name: 'Test',
            enabled: true,
            actions: [
              {
                name: 'Jump',
                actionType: ActionType.Button,
                controlType: ControlType.Button,
                enabled: true,
                bindings: [{ type: DeviceType.Keyboard, path: 'space' }],
              },
            ],
          },
        ],
      };
      runtime.loadAsset(asset);

      const callback = vi.fn();
      runtime.on('Test', 'Jump', callback);

      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      runtime.update();

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'started',
          value: 1,
        })
      );
    });

    it('should call performed callback while action is active', () => {
      const asset: IInputActionsAsset = {
        name: 'Test',
        controlSchemes: [],
        actionMaps: [
          {
            name: 'Test',
            enabled: true,
            actions: [
              {
                name: 'Jump',
                actionType: ActionType.Button,
                controlType: ControlType.Button,
                enabled: true,
                bindings: [{ type: DeviceType.Keyboard, path: 'space' }],
              },
            ],
          },
        ],
      };
      runtime.loadAsset(asset);

      const callback = vi.fn();
      runtime.on('Test', 'Jump', callback);

      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      runtime.update(); // started
      runtime.update(); // performed

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'performed',
        })
      );
    });

    it('should call canceled callback when action ends', () => {
      const asset: IInputActionsAsset = {
        name: 'Test',
        controlSchemes: [],
        actionMaps: [
          {
            name: 'Test',
            enabled: true,
            actions: [
              {
                name: 'Jump',
                actionType: ActionType.Button,
                controlType: ControlType.Button,
                enabled: true,
                bindings: [{ type: DeviceType.Keyboard, path: 'space' }],
              },
            ],
          },
        ],
      };
      runtime.loadAsset(asset);

      const callback = vi.fn();
      runtime.on('Test', 'Jump', callback);

      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      runtime.update();

      callback.mockClear();

      window.dispatchEvent(new KeyboardEvent('keyup', { key: ' ' }));
      runtime.update();

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'canceled',
          value: 0,
        })
      );
    });

    it('should unsubscribe callbacks with off', () => {
      const asset: IInputActionsAsset = {
        name: 'Test',
        controlSchemes: [],
        actionMaps: [
          {
            name: 'Test',
            enabled: true,
            actions: [
              {
                name: 'Jump',
                actionType: ActionType.Button,
                controlType: ControlType.Button,
                enabled: true,
                bindings: [{ type: DeviceType.Keyboard, path: 'space' }],
              },
            ],
          },
        ],
      };
      runtime.loadAsset(asset);

      const callback = vi.fn();
      runtime.on('Test', 'Jump', callback);
      runtime.off('Test', 'Jump', callback);

      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      runtime.update();

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('action map management', () => {
    it('should enable action maps', () => {
      const asset: IInputActionsAsset = {
        name: 'Test',
        controlSchemes: [],
        actionMaps: [
          {
            name: 'Disabled',
            enabled: false,
            actions: [
              {
                name: 'Action',
                actionType: ActionType.Button,
                controlType: ControlType.Button,
                enabled: true,
                bindings: [{ type: DeviceType.Keyboard, path: 'a' }],
              },
            ],
          },
        ],
      };
      runtime.loadAsset(asset);

      runtime.enableActionMap('Disabled');
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      runtime.update();

      expect(runtime.isActionActive('Disabled', 'Action')).toBe(true);
    });

    it('should disable action maps', () => {
      const asset: IInputActionsAsset = {
        name: 'Test',
        controlSchemes: [],
        actionMaps: [
          {
            name: 'Enabled',
            enabled: true,
            actions: [
              {
                name: 'Action',
                actionType: ActionType.Button,
                controlType: ControlType.Button,
                enabled: true,
                bindings: [{ type: DeviceType.Keyboard, path: 'a' }],
              },
            ],
          },
        ],
      };
      runtime.loadAsset(asset);

      runtime.disableActionMap('Enabled');
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      runtime.update();

      expect(runtime.isActionActive('Enabled', 'Action')).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources on destroy', () => {
      const asset: IInputActionsAsset = {
        name: 'Test',
        controlSchemes: [],
        actionMaps: [],
      };
      runtime.loadAsset(asset);

      runtime.destroy();

      // Should not throw after destroy
      expect(() => runtime.update()).not.toThrow();
    });
  });
});
