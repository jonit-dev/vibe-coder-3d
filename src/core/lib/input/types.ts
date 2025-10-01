/**
 * Input system types
 */

export interface IInputState {
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
  gamepads: Map<number, IGamepadState>;
}

export interface IGamepadState {
  buttons: boolean[];
  axes: number[];
}

export interface IActionBinding {
  keys?: string[];
  mouseButtons?: number[];
  gamepadButtons?: number[];
  axis?: 'mouse-x' | 'mouse-y' | 'wheel' | 'gamepad-left-x' | 'gamepad-left-y';
}

export interface IActionMapConfig {
  actions: Record<string, IActionBinding>;
}

export enum MouseButton {
  Left = 0,
  Middle = 1,
  Right = 2,
}
