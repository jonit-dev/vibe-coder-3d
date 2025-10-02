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
