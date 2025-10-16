# Input System Integration PRD

**Status**: Not Started
**Priority**: High
**Estimated Effort**: 2 days
**Dependencies**: Script API Expansion (Complete)

## Overview

Replace the mock input provider in the Script API with a real InputManager that handles keyboard, mouse, and gamepad input with proper state tracking, action mapping, and event handling.

## Current State

The InputAPI currently uses a mock provider in `src/core/systems/ScriptSystem.ts`:

```typescript
// Mock input provider
const inputInfo: IInputAPI = {
  isKeyDown: (_key: string) => false,
  isKeyPressed: (_key: string) => false,
  isKeyReleased: (_key: string) => false,
  isMouseButtonDown: (_button: number) => false,
  isMouseButtonPressed: (_button: number) => false,
  isMouseButtonReleased: (_button: number) => false,
  mousePosition: () => [0, 0],
  mouseDelta: () => [0, 0],
  mouseWheel: () => 0,
};
```

This provides no real input functionality - all methods return default values.

## Goals

1. Implement real keyboard input tracking (down, pressed, released states)
2. Implement real mouse input tracking (buttons, position, delta, wheel)
3. Support action mapping (logical actions → physical keys)
4. Add gamepad support (optional, future enhancement)
5. Provide input buffering for frame-perfect input detection
6. Integrate with existing Script API without breaking changes

## Proposed Solution

### Architecture

```
src/core/lib/input/
├── InputManager.ts          # Singleton input manager
├── KeyboardInput.ts         # Keyboard state tracking
├── MouseInput.ts            # Mouse state tracking
├── ActionMap.ts             # Action mapping system
├── types.ts                 # Input-related types
└── __tests__/
    ├── InputManager.test.ts
    ├── KeyboardInput.test.ts
    └── MouseInput.test.ts

src/core/lib/scripting/apis/
└── InputAPI.ts              # NEW: Real InputAPI implementation
```

### InputManager Interface

```typescript
interface IInputState {
  // Keyboard
  keysDown: Set<string>;
  keysPressedThisFrame: Set<string>;
  keysReleasedThisFrame: Set<string>;

  // Mouse
  mouseButtonsDown: Set<number>;
  mouseButtonsPressedThisFrame: Set<number>;
  mouseButtonsReleasedThisFrame: Set<number>;
  mousePosition: [number, number];
  mousePositionPrevious: [number, number];
  mouseWheelDelta: number;

  // Gamepad (future)
  gamepads: Map<number, GamepadState>;
}

class InputManager {
  private state: IInputState;
  private actionMaps: Map<string, ActionMap>;
  private canvas: HTMLCanvasElement | null;

  // Initialization
  initialize(canvas: HTMLCanvasElement): void;
  shutdown(): void;

  // Update (called each frame before script execution)
  update(): void;
  clearFrameState(): void;

  // Keyboard
  isKeyDown(key: string): boolean;
  isKeyPressed(key: string): boolean;
  isKeyReleased(key: string): boolean;

  // Mouse
  isMouseButtonDown(button: number): boolean;
  isMouseButtonPressed(button: number): boolean;
  isMouseButtonReleased(button: number): boolean;
  mousePosition(): [number, number];
  mouseDelta(): [number, number];
  mouseWheel(): number;

  // Action mapping
  registerActionMap(name: string, map: ActionMap): void;
  isActionActive(action: string, mapName?: string): boolean;
  getActionValue(action: string, mapName?: string): number;

  // Utility
  lockPointer(): void;
  unlockPointer(): void;
  isPointerLocked(): boolean;
}
```

### KeyboardInput Implementation

```typescript
class KeyboardInput {
  private keysDown: Set<string> = new Set();
  private keysPressedThisFrame: Set<string> = new Set();
  private keysReleasedThisFrame: Set<string> = new Set();

  constructor() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    const key = this.normalizeKey(event.key);

    if (!this.keysDown.has(key)) {
      this.keysPressedThisFrame.add(key);
      this.keysDown.add(key);
    }

    // Prevent default for game keys
    if (this.shouldPreventDefault(key)) {
      event.preventDefault();
    }
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    const key = this.normalizeKey(event.key);

    this.keysDown.delete(key);
    this.keysReleasedThisFrame.add(key);
  };

  private normalizeKey(key: string): string {
    // Normalize key names: "ArrowUp" → "up", " " → "space", etc.
    const keyMap: Record<string, string> = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ' ': 'space',
      Control: 'ctrl',
      Shift: 'shift',
      Alt: 'alt',
    };

    return keyMap[key] || key.toLowerCase();
  }

  public clearFrameState(): void {
    this.keysPressedThisFrame.clear();
    this.keysReleasedThisFrame.clear();
  }

  public isKeyDown(key: string): boolean {
    return this.keysDown.has(key);
  }

  public isKeyPressed(key: string): boolean {
    return this.keysPressedThisFrame.has(key);
  }

  public isKeyReleased(key: string): boolean {
    return this.keysReleasedThisFrame.has(key);
  }

  public destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}
```

### MouseInput Implementation

```typescript
class MouseInput {
  private buttonsDown: Set<number> = new Set();
  private buttonsPressedThisFrame: Set<number> = new Set();
  private buttonsReleasedThisFrame: Set<number> = new Set();
  private position: [number, number] = [0, 0];
  private previousPosition: [number, number] = [0, 0];
  private wheelDelta: number = 0;
  private canvas: HTMLCanvasElement | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    canvas.addEventListener('mousedown', this.handleMouseDown);
    canvas.addEventListener('mouseup', this.handleMouseUp);
    canvas.addEventListener('mousemove', this.handleMouseMove);
    canvas.addEventListener('wheel', this.handleWheel);
  }

  private handleMouseDown = (event: MouseEvent): void => {
    const button = event.button;

    if (!this.buttonsDown.has(button)) {
      this.buttonsPressedThisFrame.add(button);
      this.buttonsDown.add(button);
    }

    event.preventDefault();
  };

  private handleMouseUp = (event: MouseEvent): void => {
    const button = event.button;

    this.buttonsDown.delete(button);
    this.buttonsReleasedThisFrame.add(button);

    event.preventDefault();
  };

  private handleMouseMove = (event: MouseEvent): void => {
    if (!this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    this.position = [event.clientX - rect.left, event.clientY - rect.top];
  };

  private handleWheel = (event: WheelEvent): void => {
    this.wheelDelta += event.deltaY;
    event.preventDefault();
  };

  public update(): void {
    this.previousPosition = [...this.position];
    this.wheelDelta = 0;
  }

  public clearFrameState(): void {
    this.buttonsPressedThisFrame.clear();
    this.buttonsReleasedThisFrame.clear();
    this.wheelDelta = 0;
  }

  public isButtonDown(button: number): boolean {
    return this.buttonsDown.has(button);
  }

  public isButtonPressed(button: number): boolean {
    return this.buttonsPressedThisFrame.has(button);
  }

  public isButtonReleased(button: number): boolean {
    return this.buttonsReleasedThisFrame.has(button);
  }

  public getPosition(): [number, number] {
    return [...this.position];
  }

  public getDelta(): [number, number] {
    return [
      this.position[0] - this.previousPosition[0],
      this.position[1] - this.previousPosition[1],
    ];
  }

  public getWheelDelta(): number {
    return this.wheelDelta;
  }

  public destroy(): void {
    if (!this.canvas) return;

    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('wheel', this.handleWheel);
  }
}
```

### Action Mapping System

```typescript
interface IActionBinding {
  keys?: string[];
  mouseButtons?: number[];
  gamepadButtons?: number[];
  axis?: 'mouse-x' | 'mouse-y' | 'wheel' | 'gamepad-left-x' | 'gamepad-left-y';
}

interface IActionMapConfig {
  actions: Record<string, IActionBinding>;
}

class ActionMap {
  private actions: Map<string, IActionBinding>;
  private inputManager: InputManager;

  constructor(config: IActionMapConfig, inputManager: InputManager) {
    this.actions = new Map(Object.entries(config.actions));
    this.inputManager = inputManager;
  }

  public isActionActive(action: string): boolean {
    const binding = this.actions.get(action);
    if (!binding) return false;

    // Check keyboard
    if (binding.keys) {
      for (const key of binding.keys) {
        if (this.inputManager.isKeyDown(key)) return true;
      }
    }

    // Check mouse buttons
    if (binding.mouseButtons) {
      for (const button of binding.mouseButtons) {
        if (this.inputManager.isMouseButtonDown(button)) return true;
      }
    }

    return false;
  }

  public getActionValue(action: string): number {
    const binding = this.actions.get(action);
    if (!binding) return 0;

    // Handle axis bindings
    if (binding.axis) {
      switch (binding.axis) {
        case 'mouse-x':
          return this.inputManager.mouseDelta()[0];
        case 'mouse-y':
          return this.inputManager.mouseDelta()[1];
        case 'wheel':
          return this.inputManager.mouseWheel();
        default:
          return 0;
      }
    }

    // Binary actions return 1.0 if active, 0.0 otherwise
    return this.isActionActive(action) ? 1.0 : 0.0;
  }
}
```

### Updated InputAPI Implementation

```typescript
import { InputManager } from '@/core/lib/input/InputManager';
import { IInputAPI } from '../ScriptAPI';

export const createInputAPI = (): IInputAPI => {
  const inputManager = InputManager.getInstance();

  return {
    isKeyDown: (key: string): boolean => inputManager.isKeyDown(key),
    isKeyPressed: (key: string): boolean => inputManager.isKeyPressed(key),
    isKeyReleased: (key: string): boolean => inputManager.isKeyReleased(key),

    isMouseButtonDown: (button: number): boolean => inputManager.isMouseButtonDown(button),
    isMouseButtonPressed: (button: number): boolean => inputManager.isMouseButtonPressed(button),
    isMouseButtonReleased: (button: number): boolean => inputManager.isMouseButtonReleased(button),

    mousePosition: (): [number, number] => inputManager.mousePosition(),
    mouseDelta: (): [number, number] => inputManager.mouseDelta(),
    mouseWheel: (): number => inputManager.mouseWheel(),
  };
};
```

### Integration with ScriptSystem

```typescript
// src/core/systems/ScriptSystem.ts

import { InputManager } from '@/core/lib/input/InputManager';
import { createInputAPI } from '@/core/lib/scripting/apis/InputAPI';

export function initializeScriptSystem(canvas: HTMLCanvasElement): void {
  const inputManager = InputManager.getInstance();
  inputManager.initialize(canvas);
}

export async function updateScriptSystem(
  deltaTime: number,
  isPlaying: boolean = false,
): Promise<void> {
  const inputManager = InputManager.getInstance();

  // Update input state BEFORE executing scripts
  inputManager.update();

  scheduler.update();

  if (isPlaying) {
    ensureAllScriptsCompiled();
  }

  await handleNewScriptEntities();
  await compileScripts();

  // Create input API from real InputManager
  const inputInfo = createInputAPI();

  await executeScripts(deltaTime, inputInfo);

  // Clear frame state AFTER script execution
  inputManager.clearFrameState();
}
```

## Implementation Plan

### Phase 1: Core InputManager (0.5 days)

1. Create InputManager singleton
2. Implement KeyboardInput class
3. Implement MouseInput class
4. Add state tracking for down/pressed/released
5. Unit tests for input state

### Phase 2: Integration with Script System (0.5 days)

1. Create InputAPI.ts (replace mock)
2. Wire InputManager into ScriptSystem
3. Initialize with canvas reference
4. Update/clear frame state in update loop
5. Integration tests

### Phase 3: Action Mapping (0.5 days)

1. Create ActionMap class
2. Implement action binding resolution
3. Add action registration API
4. Support for axis bindings
5. Tests for action mapping

### Phase 4: Pointer Lock & Utilities (0.25 days)

1. Implement pointer lock API
2. Add key name normalization
3. Default key prevention (space, arrows)
4. Canvas focus management
5. Edge case handling

### Phase 5: Documentation & Examples (0.25 days)

1. Update script-api.d.ts with detailed JSDoc
2. Create example scripts using input
3. Document action mapping setup
4. Performance notes (event batching)

## File Structure

```
src/core/lib/input/
├── InputManager.ts
├── KeyboardInput.ts
├── MouseInput.ts
├── ActionMap.ts
├── types.ts
└── __tests__/
    ├── InputManager.test.ts
    ├── KeyboardInput.test.ts
    ├── MouseInput.test.ts
    └── ActionMap.test.ts

src/core/lib/scripting/apis/
└── InputAPI.ts              # NEW: Real implementation

src/core/systems/
└── ScriptSystem.ts          # UPDATED: Use InputManager

docs/architecture/
└── 2-15-input-system.md     # NEW: Documentation
```

## Usage Examples

### Basic Keyboard Input

```typescript
function onUpdate(deltaTime: number): void {
  const speed = 5.0 * deltaTime;

  if (input.isKeyPressed('w')) {
    entity.transform.translate(0, 0, -speed);
  }
  if (input.isKeyPressed('s')) {
    entity.transform.translate(0, 0, speed);
  }
  if (input.isKeyPressed('a')) {
    entity.transform.translate(-speed, 0, 0);
  }
  if (input.isKeyPressed('d')) {
    entity.transform.translate(speed, 0, 0);
  }

  // Jump on space press (once per press)
  if (input.isKeyDown('space')) {
    jump();
  }
}
```

### Mouse Input

```typescript
function onUpdate(deltaTime: number): void {
  // Get mouse delta for camera rotation
  const [dx, dy] = input.mouseDelta();

  if (input.isMouseButtonPressed(0)) {
    // Left mouse held - rotate camera
    const sensitivity = 0.002;
    entity.transform.rotate(-dy * sensitivity, -dx * sensitivity, 0);
  }

  // Shoot on right click
  if (input.isMouseButtonDown(1)) {
    shoot();
  }

  // Zoom with mouse wheel
  const wheel = input.mouseWheel();
  if (wheel !== 0) {
    zoom(wheel * 0.1);
  }
}
```

### Detecting Key Presses vs Holds

```typescript
let isRunning = false;

function onUpdate(deltaTime: number): void {
  // Toggle running on shift PRESS (not hold)
  if (input.isKeyDown('shift')) {
    isRunning = !isRunning;
    console.log('Running:', isRunning);
  }

  // Move forward while W is HELD
  if (input.isKeyPressed('w')) {
    const speed = isRunning ? 10.0 : 5.0;
    entity.transform.translate(0, 0, -speed * deltaTime);
  }

  // Fire weapon when space is RELEASED
  if (input.isKeyReleased('space')) {
    console.log('Charged shot released!');
    fireChargedShot();
  }
}
```

### Action Mapping Example

```typescript
// Setup action map (in game initialization)
const playerActions = new ActionMap({
  actions: {
    'move-forward': { keys: ['w', 'up'] },
    'move-backward': { keys: ['s', 'down'] },
    'move-left': { keys: ['a', 'left'] },
    'move-right': { keys: ['d', 'right'] },
    jump: { keys: ['space'], mouseButtons: [1] },
    shoot: { mouseButtons: [0] },
    'camera-x': { axis: 'mouse-x' },
    'camera-y': { axis: 'mouse-y' },
  },
});

InputManager.getInstance().registerActionMap('player', playerActions);

// In script
function onUpdate(deltaTime: number): void {
  const inputMgr = InputManager.getInstance();

  if (inputMgr.isActionActive('jump', 'player')) {
    jump();
  }

  const cameraX = inputMgr.getActionValue('camera-x', 'player');
  const cameraY = inputMgr.getActionValue('camera-y', 'player');

  entity.transform.rotate(-cameraY * 0.002, -cameraX * 0.002, 0);
}
```

## Testing Strategy

### Unit Tests

- KeyboardInput: key down/press/release states
- MouseInput: button states, position, delta, wheel
- InputManager: state aggregation and updates
- ActionMap: binding resolution and value calculation
- Key normalization (ArrowUp → up, etc.)

### Integration Tests

- InputAPI integration with InputManager
- Script execution with real input
- Frame state clearing between updates
- Multiple simultaneous inputs
- Pointer lock functionality

### Manual Tests

- All keyboard keys work correctly
- Mouse buttons and movement tracked
- Mouse wheel scrolling
- Rapid key press/release detection
- Input during script recompilation

## Edge Cases

| Edge Case                            | Solution                            |
| ------------------------------------ | ----------------------------------- |
| Key held across recompilation        | State preserved in InputManager     |
| Multiple keys pressed simultaneously | Use Set for state tracking          |
| Mouse outside canvas                 | Track last known position, no delta |
| Rapid press/release (same frame)     | Prioritize pressed state            |
| Invalid key names                    | Normalize to lowercase, log warning |
| Canvas not focused                   | Optional: auto-focus on click       |
| Pointer lock exit                    | Detect via event, update state      |
| Key held during window blur          | Clear state on blur event           |

## Performance Considerations

### Event Batching

- Single event listener per input type
- State updated in O(1) Sets
- Frame state cleared in bulk

### Memory Usage

- Reuse Set instances (clear vs new)
- Limit action map count (max 10)
- No event listener leaks

### Optimization

- Debounce mouse move events (60fps max)
- Skip delta calculation if not used
- Lazy action map evaluation

## Acceptance Criteria

- ✅ Real keyboard input works in scripts
- ✅ Real mouse input works in scripts
- ✅ isKeyDown/Pressed/Released work correctly
- ✅ isMouseButtonDown/Pressed/Released work correctly
- ✅ mousePosition/Delta/Wheel work correctly
- ✅ Action mapping system functional
- ✅ Pointer lock API works
- ✅ All unit tests pass (20+ tests)
- ✅ Integration tests pass (5+ tests)
- ✅ No input lag or missed events
- ✅ Documentation complete
- ✅ Example scripts created

## Future Enhancements

- Gamepad support (Xbox, PlayStation controllers)
- Touch input for mobile
- Input recording/playback
- Rebindable controls UI
- Input buffering (fighting game style)
- Macro recording
- Input history/debugging
- Haptic feedback API

## References

- [Web Input APIs](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)
- [Pointer Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API)
- [Gamepad API](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API)
- Current mock implementation: `src/core/systems/ScriptSystem.ts:80-92`
