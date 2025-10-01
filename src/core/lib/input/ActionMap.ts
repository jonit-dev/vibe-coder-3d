import type { IActionBinding, IActionMapConfig } from './types';
import type { InputManager } from './InputManager';

/**
 * Maps logical actions to physical inputs (keys, mouse buttons, etc.)
 */
export class ActionMap {
  private actions: Map<string, IActionBinding>;
  private inputManager: InputManager;

  constructor(config: IActionMapConfig, inputManager: InputManager) {
    this.actions = new Map(Object.entries(config.actions));
    this.inputManager = inputManager;
  }

  /**
   * Check if any input bound to this action is currently active
   */
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

  /**
   * Get numeric value for this action (for axes and analog inputs)
   */
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

  /**
   * Get all registered action names
   */
  public getActionNames(): string[] {
    return Array.from(this.actions.keys());
  }
}
