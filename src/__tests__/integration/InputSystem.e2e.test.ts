import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InputManager } from '@core/lib/input/InputManager';
import { useInputStore } from '@editor/store/inputStore';
import { createInputAPI } from '@core/lib/scripting/apis/InputAPI';
import { ActionType, ControlType, DeviceType } from '@core/lib/input/inputTypes';
import type {
  IInputActionsAsset,
  IActionMap,
  IAction,
  ISimpleBinding,
} from '@core/lib/input/inputTypes';

/**
 * End-to-End Input System Test
 *
 * Tests the complete workflow:
 * 1. Editor creates input actions via inputStore
 * 2. Actions sync to InputManager
 * 3. Scripts can access actions via InputAPI
 */
describe('Input System - End-to-End Workflow', () => {
  let inputManager: InputManager;
  let inputAPI: ReturnType<typeof createInputAPI>;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    // Reset localStorage
    localStorage.clear();

    // Reset InputManager singleton
    InputManager.resetInstance();

    // Create canvas element
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    document.body.appendChild(canvas);

    // Mock getBoundingClientRect for mouse position calculations
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

    // Create and initialize InputManager
    inputManager = InputManager.getInstance();
    inputManager.initialize(canvas);

    // Create InputAPI
    inputAPI = createInputAPI();

    // Reset input store to clean state
    useInputStore.setState({
      assets: [],
      currentAsset: null as any,
    });
  });

  afterEach(() => {
    // Cleanup
    inputManager.shutdown();
    if (canvas && canvas.parentNode) {
      document.body.removeChild(canvas);
    }
  });

  describe('Editor to Script Workflow', () => {
    it('should create action in editor and make it available to scripts', () => {
      // Step 1: Editor creates asset with action map, action, and binding
      const newAsset: IInputActionsAsset = {
        name: 'Game Controls',
        actionMaps: [
          {
            name: 'Player',
            enabled: true,
            actions: [
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
            ],
          },
        ],
      };

      // Step 2: Add to editor store
      useInputStore.getState().addAsset(newAsset);
      useInputStore.getState().setCurrentAsset('Game Controls');

      // Step 3: Load into InputManager (simulating useInputAssetSync)
      const currentAsset = useInputStore.getState().assets.find((a) => a.name === 'Game Controls');

      expect(currentAsset).toBeDefined();

      inputManager.loadInputActionsAsset(currentAsset!);
      inputManager.enableActionMap('Player');

      // Step 4: Simulate key press using DOM events
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' })); // Space key

      // Update to process the key event
      inputManager.update(0.016);

      // Step 5: Script accesses the action
      const isJumpActive = inputAPI.isActionActive('Player', 'Jump');
      expect(isJumpActive).toBe(true);
    });

    it('should handle WASD movement with composite bindings', () => {
      // Create asset with 2D vector movement
      const asset: IInputActionsAsset = {
        name: 'FPS Controls',
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
            ],
          },
        ],
      };

      // Add to store and load into InputManager
      useInputStore.getState().addAsset(asset);
      useInputStore.getState().setCurrentAsset('FPS Controls');

      inputManager.loadInputActionsAsset(asset);
      inputManager.enableActionMap('Gameplay');

      // Simulate pressing W key
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
      inputManager.update(0.016);

      // Script reads movement value
      const moveValue = inputAPI.getActionValue('Gameplay', 'Move');
      expect(Array.isArray(moveValue)).toBe(true);
      expect((moveValue as number[])[0]).toBe(0); // X
      expect((moveValue as number[])[1]).toBe(1); // Y (forward)
    });

    it('should handle mouse button actions', () => {
      const asset: IInputActionsAsset = {
        name: 'Combat',
        actionMaps: [
          {
            name: 'Combat',
            enabled: true,
            actions: [
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

      inputManager.loadInputActionsAsset(asset);
      inputManager.enableActionMap('Combat');

      // Simulate mouse button press
      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
      inputManager.update(0.016);

      // Script checks if fire action is active
      expect(inputAPI.isActionActive('Combat', 'Fire')).toBe(true);
    });

    it('should support enabling/disabling action maps', () => {
      const asset: IInputActionsAsset = {
        name: 'Multi-Context',
        actionMaps: [
          {
            name: 'Gameplay',
            enabled: true,
            actions: [
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
            ],
          },
          {
            name: 'UI',
            enabled: false,
            actions: [
              {
                name: 'Submit',
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
            ],
          },
        ],
      };

      inputManager.loadInputActionsAsset(asset);
      inputManager.enableActionMap('Gameplay');
      // UI map is disabled

      // Press space key
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      inputManager.update(0.016);

      // Gameplay/Jump should be active
      expect(inputAPI.isActionActive('Gameplay', 'Jump')).toBe(true);

      // UI/Submit should NOT be active (map disabled)
      expect(inputAPI.isActionActive('UI', 'Submit')).toBe(false);

      // Now switch: disable Gameplay, enable UI
      inputManager.disableActionMap('Gameplay');
      inputManager.enableActionMap('UI');
      inputManager.update(0.016);

      // Now UI/Submit should be active
      expect(inputAPI.isActionActive('UI', 'Submit')).toBe(true);

      // Gameplay/Jump should NOT be active (map disabled)
      expect(inputAPI.isActionActive('Gameplay', 'Jump')).toBe(false);
    });

    it('should support action callbacks', () => {
      const callbackResults: Array<{ phase: string; value: any }> = [];

      const asset: IInputActionsAsset = {
        name: 'Callback Test',
        actionMaps: [
          {
            name: 'Test',
            enabled: true,
            actions: [
              {
                name: 'TestAction',
                actionType: 'button' as any,
                controlType: 'button' as any,
                enabled: true,
                bindings: [
                  {
                    type: 'keyboard' as any,
                    path: 'enter',
                  },
                ],
              },
            ],
          },
        ],
      };

      inputManager.loadInputActionsAsset(asset);
      inputManager.enableActionMap('Test');

      // Register callback via script API
      inputAPI.onAction('Test', 'TestAction', (phase, value) => {
        callbackResults.push({ phase, value });
      });

      // Simulate key press
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      inputManager.update(0.016);

      // Should have received callbacks
      expect(callbackResults.length).toBeGreaterThan(0);
      expect(callbackResults.some((r) => r.phase === 'started')).toBe(true);
    });
  });

  describe('Editor Store Integration', () => {
    it('should allow runtime reconfiguration via store updates', () => {
      // Start with initial asset
      const initialAsset: IInputActionsAsset = {
        name: 'Initial',
        actionMaps: [
          {
            name: 'Test',
            enabled: true,
            actions: [
              {
                name: 'Action1',
                actionType: 'button' as any,
                controlType: 'button' as any,
                enabled: true,
                bindings: [
                  {
                    type: 'keyboard' as any,
                    path: 'a',
                  },
                ],
              },
            ],
          },
        ],
      };

      inputManager.loadInputActionsAsset(initialAsset);
      inputManager.enableActionMap('Test');

      // Test initial binding
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      inputManager.update(0.016);
      expect(inputAPI.isActionActive('Test', 'Action1')).toBe(true);

      // Clear input
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
      inputManager.clearFrameState();
      inputManager.update(0.016);

      // Change binding to 'b' key
      const updatedAsset: IInputActionsAsset = {
        name: 'Initial',
        actionMaps: [
          {
            name: 'Test',
            enabled: true,
            actions: [
              {
                name: 'Action1',
                actionType: 'button' as any,
                controlType: 'button' as any,
                enabled: true,
                bindings: [
                  {
                    type: 'keyboard' as any,
                    path: 'b',
                  },
                ],
              },
            ],
          },
        ],
      };

      // Reload asset
      inputManager.loadInputActionsAsset(updatedAsset);
      inputManager.enableActionMap('Test');

      // Test new binding
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }));
      inputManager.update(0.016);
      expect(inputAPI.isActionActive('Test', 'Action1')).toBe(true);

      // Old binding should not work
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'b' }));
      inputManager.clearFrameState();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      inputManager.update(0.016);
      expect(inputAPI.isActionActive('Test', 'Action1')).toBe(false);
    });
  });
});
