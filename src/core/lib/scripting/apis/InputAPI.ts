import { InputManager } from '@/core/lib/input/InputManager';
import type { IInputAPI } from '../ScriptAPI';

/**
 * Creates InputAPI implementation using real InputManager
 */
export const createInputAPI = (): IInputAPI => {
  const inputManager = InputManager.getInstance();

  return {
    isKeyPressed: (key: string): boolean => inputManager.isKeyPressed(key),
    isKeyDown: (key: string): boolean => inputManager.isKeyDown(key),
    isKeyUp: (key: string): boolean => inputManager.isKeyReleased(key),

    mousePosition: (): [number, number] => inputManager.mousePosition(),
    isMouseButtonPressed: (button: number): boolean => inputManager.isMouseButtonPressed(button),
    isMouseButtonDown: (button: number): boolean => inputManager.isMouseButtonDown(button),
    isMouseButtonUp: (button: number): boolean => inputManager.isMouseButtonReleased(button),

    // Gamepad stubs
    getGamepadAxis: (__gamepadIndex: number, __axisIndex: number): number => 0,
    isGamepadButtonPressed: (__gamepadIndex: number, __buttonIndex: number): boolean => false,
  };
};
