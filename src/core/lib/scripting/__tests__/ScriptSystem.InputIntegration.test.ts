import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InputManager } from '@/core/lib/input/InputManager';
import { DirectScriptExecutor } from '../DirectScriptExecutor';
import { createInputAPI } from '../apis/InputAPI';
import type { IInputActionsAsset } from '@/core/lib/input/inputTypes';

describe('Script System - Input System Integration', () => {
  let inputManager: InputManager;
  let scriptExecutor: DirectScriptExecutor;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    // Reset singletons
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

    // Create DirectScriptExecutor instance - not a singleton
    scriptExecutor = new DirectScriptExecutor();
  });

  afterEach(() => {
    inputManager.shutdown();
    document.body.removeChild(canvas);
    vi.restoreAllMocks();
  });

  describe('Basic Input Access in Scripts', () => {
    it('should allow script to detect keyboard input', () => {
      const scriptCode = `
        let keyWasPressed = false;

        function onUpdate() {
          if (input.isKeyDown('w')) {
            keyWasPressed = true;
          }
        }
      `;

      const result = scriptExecutor.compileScript(scriptCode, 'test-keyboard');
      expect(result.success).toBe(true);

      // Press W key
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));

      // Execute script with input context
      const execResult = scriptExecutor.executeScript(
        'test-keyboard',
        {
          entityId: 1,
          maxExecutionTime: 1000,
          parameters: {},
          timeInfo: { time: 0, deltaTime: 0.016, frameCount: 0 },
          inputInfo: createInputAPI(),
        },
        'onUpdate',
      );

      expect(execResult.success).toBe(true);
    });

    it('should allow script to detect mouse input', () => {
      const scriptCode = `
        let mouseClicked = false;

        function onUpdate() {
          if (input.isMouseButtonPressed(0)) {
            mouseClicked = true;
            console.log('Left mouse button clicked!');
          }
        }
      `;

      const result = scriptExecutor.compileScript(scriptCode, 'test-mouse');
      expect(result.success).toBe(true);

      // Click left mouse button
      canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));

      const execResult = scriptExecutor.executeScript(
        'test-mouse',
        {
          entityId: 1,
          maxExecutionTime: 1000,
          parameters: {},
          timeInfo: { time: 0, deltaTime: 0.016, frameCount: 0 },
          inputInfo: createInputAPI(),
        },
        'onUpdate',
      );

      expect(execResult.success).toBe(true);
    });

    it('should allow script to get mouse position', () => {
      const scriptCode = `
        let mouseX = 0;
        let mouseY = 0;

        function onUpdate() {
          const [x, y] = input.mousePosition();
          mouseX = x;
          mouseY = y;
        }
      `;

      const result = scriptExecutor.compileScript(scriptCode, 'test-mouse-pos');
      expect(result.success).toBe(true);

      // Move mouse
      canvas.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: 250,
          clientY: 150,
        }),
      );

      const execResult = scriptExecutor.executeScript(
        'test-mouse-pos',
        {
          entityId: 1,
          maxExecutionTime: 1000,
          parameters: {},
          timeInfo: { time: 0, deltaTime: 0.016, frameCount: 0 },
          inputInfo: createInputAPI(),
        },
        'onUpdate',
      );

      expect(execResult.success).toBe(true);
    });

    it('should allow script to get mouse delta for camera rotation', () => {
      const scriptCode = `
        let totalRotationX = 0;
        let totalRotationY = 0;

        function onUpdate() {
          const [dx, dy] = input.mouseDelta();
          totalRotationX += dx * 0.002;
          totalRotationY += dy * 0.002;
        }
      `;

      const result = scriptExecutor.compileScript(scriptCode, 'test-mouse-delta');
      expect(result.success).toBe(true);

      // Initial mouse position
      canvas.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: 100,
          clientY: 100,
        }),
      );

      inputManager.update();

      // Move mouse
      canvas.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: 150,
          clientY: 130,
        }),
      );

      const execResult = scriptExecutor.executeScript(
        'test-mouse-delta',
        {
          entityId: 1,
          maxExecutionTime: 1000,
          parameters: {},
          timeInfo: { time: 0, deltaTime: 0.016, frameCount: 0 },
          inputInfo: createInputAPI(),
        },
        'onUpdate',
      );

      expect(execResult.success).toBe(true);
    });
  });

  describe('Player Controller Script', () => {
    it('should execute full player controller logic', () => {
      const scriptCode = `
        const moveSpeed = 5.0;
        const rotationSpeed = 0.002;

        function onUpdate(deltaTime) {
          // Get current position
          const [x, y, z] = entity.transform.position;

          let speed = moveSpeed * deltaTime;

          // Sprint when holding Shift
          if (input.isKeyDown('shift')) {
            speed *= 2;
          }

          // Movement with WASD
          if (input.isKeyDown('w')) {
            entity.transform.translate(0, 0, -speed);
          }
          if (input.isKeyDown('s')) {
            entity.transform.translate(0, 0, speed);
          }
          if (input.isKeyDown('a')) {
            entity.transform.translate(-speed, 0, 0);
          }
          if (input.isKeyDown('d')) {
            entity.transform.translate(speed, 0, 0);
          }

          // Jump on Space press
          if (input.isKeyPressed('space')) {
            entity.transform.translate(0, 2, 0);
            console.log('Jump!');
          }

          // Mouse look
          const [dx, dy] = input.mouseDelta();
          if (input.isMouseButtonDown(0)) {
            const [rx, ry, rz] = entity.transform.rotation;
            entity.transform.setRotation(
              rx - dy * rotationSpeed,
              ry - dx * rotationSpeed,
              rz
            );
          }
        }
      `;

      const result = scriptExecutor.compileScript(scriptCode, 'player-controller');
      expect(result.success).toBe(true);

      // Simulate player input: W + Shift + Space
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'shift' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));

      const execResult = scriptExecutor.executeScript(
        'player-controller',
        {
          entityId: 1,
          maxExecutionTime: 1000,
          parameters: {},
          timeInfo: { time: 0, deltaTime: 0.016, frameCount: 0 },
          inputInfo: createInputAPI(),
        },
        'onUpdate',
      );

      expect(execResult.success).toBe(true);
    });
  });

  describe('Input Actions in Scripts', () => {
    beforeEach(() => {
      // Load test input actions
      const testAsset: IInputActionsAsset = {
        actionMaps: [
          {
            id: 'gameplay',
            name: 'Gameplay',
            enabled: true,
            actions: [
              {
                id: 'move',
                name: 'Move',
                type: 'Value',
                expectedControlType: 'Vector2',
                bindings: [
                  {
                    id: 'wasd',
                    path: 'Keyboard/WASD',
                    interactions: '',
                    processors: '',
                    groups: 'Keyboard',
                    action: 'move',
                    isComposite: true,
                    compositeType: 'Vector2',
                    compositeBindings: [
                      {
                        id: 'wasd-up',
                        path: 'Keyboard/W',
                        name: 'up',
                      },
                      {
                        id: 'wasd-down',
                        path: 'Keyboard/S',
                        name: 'down',
                      },
                      {
                        id: 'wasd-left',
                        path: 'Keyboard/A',
                        name: 'left',
                      },
                      {
                        id: 'wasd-right',
                        path: 'Keyboard/D',
                        name: 'right',
                      },
                    ],
                  },
                ],
              },
              {
                id: 'jump',
                name: 'Jump',
                type: 'Button',
                expectedControlType: 'Button',
                bindings: [
                  {
                    id: 'space',
                    path: 'Keyboard/Space',
                    interactions: '',
                    processors: '',
                    groups: 'Keyboard',
                    action: 'jump',
                  },
                ],
              },
            ],
          },
        ],
      };

      inputManager.loadInputActionsAsset(testAsset);
      inputManager.enableActionMap('gameplay');
    });

    it('should allow script to use input actions for movement', () => {
      const scriptCode = `
        const moveSpeed = 5.0;

        function onUpdate(deltaTime) {
          // Get movement input from action
          const moveInput = input.getActionValue('gameplay', 'move');

          if (Array.isArray(moveInput)) {
            const [x, y] = moveInput;

            if (Math.abs(x) > 0.1 || Math.abs(y) > 0.1) {
              const speed = moveSpeed * deltaTime;
              entity.transform.translate(x * speed, 0, -y * speed);
            }
          }
        }
      `;

      const result = scriptExecutor.compileScript(scriptCode, 'action-movement');
      expect(result.success).toBe(true);

      // Press W key
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
      inputManager.update();

      const execResult = scriptExecutor.executeScript(
        'action-movement',
        {
          entityId: 1,
          maxExecutionTime: 1000,
          parameters: {},
          timeInfo: { time: 0, deltaTime: 0.016, frameCount: 0 },
          inputInfo: createInputAPI(),
        },
        'onUpdate',
      );

      expect(execResult.success).toBe(true);
    });

    it('should allow script to check if action is active', () => {
      const scriptCode = `
        function onUpdate() {
          if (input.isActionActive('gameplay', 'jump')) {
            console.log('Jump action is active!');
            entity.transform.translate(0, 2, 0);
          }
        }
      `;

      const result = scriptExecutor.compileScript(scriptCode, 'action-jump');
      expect(result.success).toBe(true);

      // Press Space
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      inputManager.update();

      const execResult = scriptExecutor.executeScript(
        'action-jump',
        {
          entityId: 1,
          maxExecutionTime: 1000,
          parameters: {},
          timeInfo: { time: 0, deltaTime: 0.016, frameCount: 0 },
          inputInfo: createInputAPI(),
        },
        'onUpdate',
      );

      expect(execResult.success).toBe(true);
    });

    it('should allow script to subscribe to action events', () => {
      const scriptCode = `
        let jumpCount = 0;

        function onStart() {
          input.onAction('gameplay', 'jump', (phase, value) => {
            if (phase === 'started') {
              jumpCount++;
              console.log('Jump triggered! Count: ' + jumpCount);
            }
          });
        }

        function onUpdate() {
          // Event handler will be called automatically by InputManager
        }
      `;

      const result = scriptExecutor.compileScript(scriptCode, 'action-events');
      expect(result.success).toBe(true);

      // Execute onStart to register callback
      let execResult = scriptExecutor.executeScript(
        'action-events',
        {
          entityId: 1,
          maxExecutionTime: 1000,
          parameters: {},
          timeInfo: { time: 0, deltaTime: 0.016, frameCount: 0 },
          inputInfo: createInputAPI(),
        },
        'onStart',
      );

      expect(execResult.success).toBe(true);

      // Press Space to trigger action
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      inputManager.update();

      // Execute onUpdate
      execResult = scriptExecutor.executeScript(
        'action-events',
        {
          entityId: 1,
          maxExecutionTime: 1000,
          parameters: {},
          timeInfo: { time: 0, deltaTime: 0.016, frameCount: 0 },
          inputInfo: createInputAPI(),
        },
        'onUpdate',
      );

      expect(execResult.success).toBe(true);
    });
  });

  describe('Pointer Lock in Scripts', () => {
    it('should allow script to access pointer lock methods', () => {
      const scriptCode = `
        function onUpdate() {
          // Test that scripts can call pointer lock methods
          const isLocked = input.isPointerLocked();
          console.log('Pointer lock state:', isLocked);

          // Call lock/unlock methods to verify they're accessible
          if (!isLocked) {
            input.lockPointer();
          } else {
            input.unlockPointer();
          }
        }
      `;

      const result = scriptExecutor.compileScript(scriptCode, 'pointer-lock');
      expect(result.success).toBe(true);

      canvas.requestPointerLock = vi.fn();
      document.exitPointerLock = vi.fn();

      const execResult = scriptExecutor.executeScript(
        'pointer-lock',
        {
          entityId: 1,
          maxExecutionTime: 1000,
          parameters: {},
          timeInfo: { time: 0, deltaTime: 0.016, frameCount: 0 },
          inputInfo: createInputAPI(),
        },
        'onUpdate',
      );

      // Verify script executed successfully (pointer lock methods are accessible)
      expect(execResult.success).toBe(true);
      // Note: Actual pointer lock behavior is tested in InputAPI integration tests
    });
  });

  describe('Multiple Scripts Accessing Input Simultaneously', () => {
    it('should allow multiple scripts to access input without interference', () => {
      const script1 = `
        function onUpdate() {
          if (input.isKeyDown('w')) {
            console.log('Script 1: W is down');
          }
        }
      `;

      const script2 = `
        function onUpdate() {
          if (input.isKeyDown('w')) {
            console.log('Script 2: W is down');
          }
        }
      `;

      // Compile both scripts
      const result1 = scriptExecutor.compileScript(script1, 'multi-script-1');
      const result2 = scriptExecutor.compileScript(script2, 'multi-script-2');

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      // Press W
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));

      // Execute both scripts
      const execResult1 = scriptExecutor.executeScript(
        'multi-script-1',
        {
          entityId: 1,
          maxExecutionTime: 1000,
          parameters: {},
          timeInfo: { time: 0, deltaTime: 0.016, frameCount: 0 },
          inputInfo: createInputAPI(),
        },
        'onUpdate',
      );

      const execResult2 = scriptExecutor.executeScript(
        'multi-script-2',
        {
          entityId: 2,
          maxExecutionTime: 1000,
          parameters: {},
          timeInfo: { time: 0, deltaTime: 0.016, frameCount: 0 },
          inputInfo: createInputAPI(),
        },
        'onUpdate',
      );

      expect(execResult1.success).toBe(true);
      expect(execResult2.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid input method calls gracefully', () => {
      const scriptCode = `
        function onUpdate() {
          try {
            const result = input.isKeyDown(undefined);
            console.log('Result:', result);
          } catch (error) {
            console.error('Error:', error);
          }
        }
      `;

      const result = scriptExecutor.compileScript(scriptCode, 'error-test');
      expect(result.success).toBe(true);

      const execResult = scriptExecutor.executeScript(
        'error-test',
        {
          entityId: 1,
          maxExecutionTime: 1000,
          parameters: {},
          timeInfo: { time: 0, deltaTime: 0.016, frameCount: 0 },
          inputInfo: createInputAPI(),
        },
        'onUpdate',
      );

      expect(execResult.success).toBe(true);
    });

    it('should handle missing InputManager gracefully', () => {
      // Shutdown InputManager to simulate missing instance
      inputManager.shutdown();

      const scriptCode = `
        function onUpdate() {
          const isDown = input.isKeyDown('w');
          console.log('Is W down:', isDown);
        }
      `;

      const result = scriptExecutor.compileScript(scriptCode, 'missing-input');
      expect(result.success).toBe(true);

      const execResult = scriptExecutor.executeScript(
        'missing-input',
        {
          entityId: 1,
          maxExecutionTime: 1000,
          parameters: {},
          timeInfo: { time: 0, deltaTime: 0.016, frameCount: 0 },
          inputInfo: createInputAPI(),
        },
        'onUpdate',
      );

      // Should execute successfully even though InputManager is shutdown
      // (will return default values)
      expect(execResult.success).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should execute input checks efficiently in tight loop', () => {
      const scriptCode = `
        function onUpdate() {
          let count = 0;

          for (let i = 0; i < 1000; i++) {
            if (input.isKeyDown('w')) {
              count++;
            }
          }

          console.log('Checked input 1000 times, count:', count);
        }
      `;

      const result = scriptExecutor.compileScript(scriptCode, 'perf-test');
      expect(result.success).toBe(true);

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));

      const startTime = performance.now();

      const execResult = scriptExecutor.executeScript(
        'perf-test',
        {
          entityId: 1,
          maxExecutionTime: 1000,
          parameters: {},
          timeInfo: { time: 0, deltaTime: 0.016, frameCount: 0 },
          inputInfo: createInputAPI(),
        },
        'onUpdate',
      );

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(execResult.success).toBe(true);
      expect(executionTime).toBeLessThan(100); // Should be reasonably fast (1000 checks)
    });
  });
});
