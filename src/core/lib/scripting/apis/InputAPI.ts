import { InputManager } from '@/core/lib/input/InputManager';
import type { IInputAPI } from '../ScriptAPI';

/**
 * Creates InputAPI implementation using real InputManager
 */
export const createInputAPI = (): IInputAPI => {
  const inputManager = InputManager.getInstance();

  return {
    isKeyDown: (key: string): boolean => inputManager.isKeyPressed(key),
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
