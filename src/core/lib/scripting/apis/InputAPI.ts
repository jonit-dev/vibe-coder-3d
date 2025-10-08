import { InputManager } from '@/core/lib/input/InputManager';
import type { IInputAPI } from '../ScriptAPI';
import { Logger } from '@core/lib/logger';

const logger = Logger.create('InputAPI');

/**
 * Creates InputAPI implementation using real InputManager
 */
export const createInputAPI = (): IInputAPI => {
  const inputManager = InputManager.getInstance();

  return {
    // Basic Keyboard Input
    isKeyDown: (key: string): boolean => inputManager.isKeyDown(key),
    isKeyPressed: (key: string): boolean => inputManager.isKeyPressed(key),
    isKeyReleased: (key: string): boolean => inputManager.isKeyReleased(key),

    // Basic Mouse Input
    isMouseButtonDown: (button: number): boolean => inputManager.isMouseButtonDown(button),
    isMouseButtonPressed: (button: number): boolean => inputManager.isMouseButtonPressed(button),
    isMouseButtonReleased: (button: number): boolean => inputManager.isMouseButtonReleased(button),
    mousePosition: (): [number, number] => inputManager.mousePosition(),
    mouseDelta: (): [number, number] => inputManager.mouseDelta(),
    mouseWheel: (): number => inputManager.mouseWheel(),

    // Pointer Lock
    lockPointer: (): void => inputManager.lockPointer(),
    unlockPointer: (): void => inputManager.unlockPointer(),
    isPointerLocked: (): boolean => inputManager.isPointerLocked(),

    // Input Actions System
    getActionValue: (actionMapName: string, actionName: string) => {
      return inputManager.getActionValue(actionMapName, actionName);
    },

    isActionActive: (actionMapName: string, actionName: string): boolean => {
      return inputManager.isActionActiveNew(actionMapName, actionName);
    },

    onAction: (
      actionMapName: string,
      actionName: string,
      callback: (
        phase: 'started' | 'performed' | 'canceled',
        value: number | [number, number] | [number, number, number],
      ) => void,
    ) => {
      inputManager.onAction(actionMapName, actionName, (context) => {
        callback(context.phase, context.value);
      });
    },

    offAction: (
      actionMapName: string,
      actionName: string,
      callback: (
        phase: 'started' | 'performed' | 'canceled',
        value: number | [number, number] | [number, number, number],
      ) => void,
    ) => {
      // Note: This is a simplified version - full cleanup would require tracking the wrapped callbacks
      logger.warn('offAction not fully implemented - callbacks must match exactly');
      inputManager.offAction(actionMapName, actionName, (context) => {
        callback(context.phase, context.value);
      });
    },

    enableActionMap: (mapName: string) => {
      inputManager.enableActionMap(mapName);
    },

    disableActionMap: (mapName: string) => {
      inputManager.disableActionMap(mapName);
    },
  };
};
