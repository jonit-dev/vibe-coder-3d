import { Logger } from '@core/lib/logger';
import {
  IInputActionsAsset,
  IActionMap,
  IInputAction,
  IBinding,
  ISimpleBinding,
  ICompositeBinding,
  IInputActionCallbackContext,
  DeviceType,
  CompositeType,
} from './inputTypes';
import { KeyboardInput } from './KeyboardInput';
import { MouseInput } from './MouseInput';

const logger = Logger.create('InputActionRuntime');

/**
 * Runtime engine for Unity-like Input Actions system.
 * Processes bindings and generates action values based on current input state.
 */
export class InputActionRuntime {
  private asset: IInputActionsAsset | null = null;
  private keyboard: KeyboardInput | null = null;
  private mouse: MouseInput | null = null;
  private activeActionMaps: Set<string> = new Set();

  // Action callbacks
  private actionCallbacks: Map<
    string,
    Map<string, Array<(context: IInputActionCallbackContext) => void>>
  > = new Map();

  // Action state tracking
  private actionStates: Map<
    string,
    Map<
      string,
      {
        isActive: boolean;
        value: number | [number, number] | [number, number, number];
        startTime: number;
      }
    >
  > = new Map();

  constructor(keyboard: KeyboardInput, mouse: MouseInput) {
    this.keyboard = keyboard;
    this.mouse = mouse;
  }

  /**
   * Load an input actions asset
   */
  public loadAsset(asset: IInputActionsAsset): void {
    this.asset = asset;

    // Enable all action maps by default
    this.activeActionMaps.clear();
    asset.actionMaps.forEach((map) => {
      if (map.enabled) {
        this.activeActionMaps.add(map.name);
      }
    });

    logger.info('Input actions asset loaded', {
      name: asset.name,
      actionMaps: asset.actionMaps.length,
    });
  }

  /**
   * Enable an action map
   */
  public enableActionMap(mapName: string): void {
    if (!this.asset) {
      logger.warn('Cannot enable action map: no asset loaded');
      return;
    }

    const map = this.asset.actionMaps.find((m) => m.name === mapName);
    if (!map) {
      logger.warn('Action map not found', { mapName });
      return;
    }

    this.activeActionMaps.add(mapName);
    logger.debug('Action map enabled', { mapName });
  }

  /**
   * Disable an action map
   */
  public disableActionMap(mapName: string): void {
    this.activeActionMaps.delete(mapName);
    logger.debug('Action map disabled', { mapName });
  }

  /**
   * Subscribe to action events
   */
  public on(
    actionMapName: string,
    actionName: string,
    callback: (context: IInputActionCallbackContext) => void,
  ): void {
    if (!this.actionCallbacks.has(actionMapName)) {
      this.actionCallbacks.set(actionMapName, new Map());
    }

    const mapCallbacks = this.actionCallbacks.get(actionMapName)!;
    if (!mapCallbacks.has(actionName)) {
      mapCallbacks.set(actionName, []);
    }

    mapCallbacks.get(actionName)!.push(callback);
  }

  /**
   * Unsubscribe from action events
   */
  public off(
    actionMapName: string,
    actionName: string,
    callback: (context: IInputActionCallbackContext) => void,
  ): void {
    const mapCallbacks = this.actionCallbacks.get(actionMapName);
    if (!mapCallbacks) return;

    const callbacks = mapCallbacks.get(actionName);
    if (!callbacks) return;

    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Update all active actions (called each frame)
   */
  public update(): void {
    if (!this.asset) return;

    const currentTime = performance.now();

    for (const map of this.asset.actionMaps) {
      if (!this.activeActionMaps.has(map.name)) continue;

      for (const action of map.actions) {
        if (!action.enabled) continue;

        this.updateAction(map, action, currentTime);
      }
    }
  }

  /**
   * Update a single action
   */
  private updateAction(map: IActionMap, action: IInputAction, currentTime: number): void {
    const newValue = this.evaluateAction(action);
    const isActive = this.isValueActive(newValue);

    // Get previous state
    if (!this.actionStates.has(map.name)) {
      this.actionStates.set(map.name, new Map());
    }
    const mapStates = this.actionStates.get(map.name)!;
    const prevState = mapStates.get(action.name);

    const wasActive = prevState?.isActive ?? false;

    // Detect state changes
    if (!wasActive && isActive) {
      // Started
      mapStates.set(action.name, {
        isActive: true,
        value: newValue,
        startTime: currentTime,
      });

      this.emitActionEvent(map.name, action, 'started', newValue, currentTime, 0);
    } else if (wasActive && isActive) {
      // Performed (ongoing)
      const duration = currentTime - (prevState?.startTime ?? currentTime);
      mapStates.set(action.name, {
        isActive: true,
        value: newValue,
        startTime: prevState?.startTime ?? currentTime,
      });

      this.emitActionEvent(map.name, action, 'performed', newValue, currentTime, duration);
    } else if (wasActive && !isActive) {
      // Canceled
      const duration = currentTime - (prevState?.startTime ?? currentTime);
      mapStates.set(action.name, {
        isActive: false,
        value: newValue,
        startTime: 0,
      });

      this.emitActionEvent(map.name, action, 'canceled', newValue, currentTime, duration);
    }
  }

  /**
   * Emit action event to callbacks
   */
  private emitActionEvent(
    mapName: string,
    action: IInputAction,
    phase: 'started' | 'performed' | 'canceled',
    value: number | [number, number] | [number, number, number],
    time: number,
    duration: number,
  ): void {
    const mapCallbacks = this.actionCallbacks.get(mapName);
    if (!mapCallbacks) return;

    const callbacks = mapCallbacks.get(action.name);
    if (!callbacks) return;

    const context: IInputActionCallbackContext = {
      action,
      phase,
      value,
      time,
      duration,
    };

    for (const callback of callbacks) {
      try {
        callback(context);
      } catch (error) {
        logger.error('Error in action callback', {
          mapName,
          actionName: action.name,
          error,
        });
      }
    }
  }

  /**
   * Check if value is considered "active"
   */
  private isValueActive(value: number | [number, number] | [number, number, number]): boolean {
    if (typeof value === 'number') {
      return Math.abs(value) > 0.01;
    }

    if (Array.isArray(value)) {
      return value.some((v) => Math.abs(v) > 0.01);
    }

    return false;
  }

  /**
   * Evaluate an action's current value based on its bindings
   */
  private evaluateAction(
    action: IInputAction,
  ): number | [number, number] | [number, number, number] {
    for (const binding of action.bindings) {
      const value = this.evaluateBinding(binding, action.controlType);

      // Return first active binding
      if (this.isValueActive(value)) {
        return value;
      }
    }

    // Return zero value based on control type
    switch (action.controlType) {
      case 'button':
      case 'axis':
        return 0;
      case 'vector2':
        return [0, 0];
      case 'vector3':
        return [0, 0, 0];
      default:
        return 0;
    }
  }

  /**
   * Evaluate a binding's current value
   */
  private evaluateBinding(
    binding: IBinding,
    controlType: string,
  ): number | [number, number] | [number, number, number] {
    if ('compositeType' in binding) {
      return this.evaluateCompositeBinding(binding as ICompositeBinding);
    }

    return this.evaluateSimpleBinding(binding as ISimpleBinding, controlType);
  }

  /**
   * Evaluate a simple binding
   */
  private evaluateSimpleBinding(
    binding: ISimpleBinding,
    controlType: string,
  ): number | [number, number] | [number, number, number] {
    if (!this.keyboard || !this.mouse) {
      return controlType === 'vector2' ? [0, 0] : 0;
    }

    // Check modifiers
    if (binding.modifiers && binding.modifiers.length > 0) {
      const allModifiersPressed = binding.modifiers.every((mod) => this.keyboard!.isKeyDown(mod));
      if (!allModifiersPressed) {
        return controlType === 'vector2' ? [0, 0] : 0;
      }
    }

    switch (binding.type) {
      case DeviceType.Keyboard:
        return this.keyboard.isKeyDown(binding.path) ? 1 : 0;

      case DeviceType.Mouse:
        if (binding.path === 'leftButton') {
          return this.mouse.isButtonDown(0) ? 1 : 0;
        }
        if (binding.path === 'rightButton') {
          return this.mouse.isButtonDown(2) ? 1 : 0;
        }
        if (binding.path === 'middleButton') {
          return this.mouse.isButtonDown(1) ? 1 : 0;
        }
        if (binding.path === 'delta') {
          const delta = this.mouse.getDelta();
          return [delta[0], delta[1]] as [number, number];
        }
        if (binding.path === 'scroll') {
          return this.mouse.getWheelDelta();
        }
        return 0;

      default:
        return controlType === 'vector2' ? [0, 0] : 0;
    }
  }

  /**
   * Evaluate a composite binding (e.g., 2D Vector from WASD)
   */
  private evaluateCompositeBinding(
    binding: ICompositeBinding,
  ): number | [number, number] | [number, number, number] {
    if (!this.keyboard || !this.mouse) {
      return [0, 0];
    }

    switch (binding.compositeType) {
      case CompositeType.TwoDVector: {
        const up = this.evaluateSimpleBinding(
          binding.bindings.up as ISimpleBinding,
          'axis',
        ) as number;
        const down = this.evaluateSimpleBinding(
          binding.bindings.down as ISimpleBinding,
          'axis',
        ) as number;
        const left = this.evaluateSimpleBinding(
          binding.bindings.left as ISimpleBinding,
          'axis',
        ) as number;
        const right = this.evaluateSimpleBinding(
          binding.bindings.right as ISimpleBinding,
          'axis',
        ) as number;

        const x = right - left;
        const y = up - down;

        // Normalize diagonal movement
        const length = Math.sqrt(x * x + y * y);
        if (length > 1) {
          return [x / length, y / length] as [number, number];
        }

        return [x, y] as [number, number];
      }

      case CompositeType.OneModifier: {
        // For 1D axis (e.g., positive/negative buttons)
        const positive = this.evaluateSimpleBinding(
          binding.bindings.positive as ISimpleBinding,
          'axis',
        ) as number;
        const negative = this.evaluateSimpleBinding(
          binding.bindings.negative as ISimpleBinding,
          'axis',
        ) as number;
        return positive - negative;
      }

      default:
        return [0, 0];
    }
  }

  /**
   * Get current value of an action (polling)
   */
  public getActionValue(
    mapName: string,
    actionName: string,
  ): number | [number, number] | [number, number, number] {
    if (!this.asset) return 0;

    // Check if the action map is enabled
    if (!this.activeActionMaps.has(mapName)) return 0;

    const map = this.asset.actionMaps.find((m) => m.name === mapName);
    if (!map) return 0;

    const action = map.actions.find((a) => a.name === actionName);
    if (!action) return 0;

    return this.evaluateAction(action);
  }

  /**
   * Check if action is currently active (boolean check)
   */
  public isActionActive(mapName: string, actionName: string): boolean {
    const value = this.getActionValue(mapName, actionName);
    return this.isValueActive(value);
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.actionCallbacks.clear();
    this.actionStates.clear();
    this.activeActionMaps.clear();
    this.asset = null;
  }
}
