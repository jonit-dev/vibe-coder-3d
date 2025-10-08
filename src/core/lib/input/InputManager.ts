import { Logger } from '@core/lib/logger';
import { KeyboardInput } from './KeyboardInput';
import { MouseInput } from './MouseInput';
import { ActionMap } from './ActionMap';
import { InputActionRuntime } from './InputActionRuntime';
import type { IActionMapConfig } from './types';
import type { IInputActionsAsset, IInputActionCallbackContext } from './inputTypes';

const logger = Logger.create('InputManager');

/**
 * Singleton InputManager that coordinates all input subsystems
 */
export class InputManager {
  private static instance: InputManager | null = null;

  private keyboard: KeyboardInput | null = null;
  private mouse: MouseInput | null = null;
  private actionMaps: Map<string, ActionMap> = new Map();
  private actionRuntime: InputActionRuntime | null = null;
  private initialized: boolean = false;

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): InputManager {
    if (!InputManager.instance) {
      InputManager.instance = new InputManager();
    }
    return InputManager.instance;
  }

  /**
   * Initialize input system with canvas reference
   */
  public initialize(canvas: HTMLCanvasElement): void {
    if (this.initialized) {
      logger.warn('InputManager already initialized');
      return;
    }

    this.keyboard = new KeyboardInput();
    this.mouse = new MouseInput(canvas);
    this.actionRuntime = new InputActionRuntime(this.keyboard, this.mouse);
    this.initialized = true;

    logger.info('InputManager initialized');
  }

  /**
   * Update called each frame BEFORE scripts execute
   */
  public update(): void {
    if (!this.initialized) return;

    this.mouse?.update();
    this.actionRuntime?.update();
  }

  /**
   * Clear frame state called AFTER scripts execute
   */
  public clearFrameState(): void {
    if (!this.initialized) return;

    this.keyboard?.clearFrameState();
    this.mouse?.clearFrameState();
  }

  // Keyboard methods
  public isKeyDown(key: string): boolean {
    return this.keyboard?.isKeyDown(key) ?? false;
  }

  public isKeyPressed(key: string): boolean {
    return this.keyboard?.isKeyPressed(key) ?? false;
  }

  public isKeyReleased(key: string): boolean {
    return this.keyboard?.isKeyReleased(key) ?? false;
  }

  // Mouse methods
  public isMouseButtonDown(button: number): boolean {
    return this.mouse?.isButtonDown(button) ?? false;
  }

  public isMouseButtonPressed(button: number): boolean {
    return this.mouse?.isButtonPressed(button) ?? false;
  }

  public isMouseButtonReleased(button: number): boolean {
    return this.mouse?.isButtonReleased(button) ?? false;
  }

  public mousePosition(): [number, number] {
    return this.mouse?.getPosition() ?? [0, 0];
  }

  public mouseDelta(): [number, number] {
    return this.mouse?.getDelta() ?? [0, 0];
  }

  public mouseWheel(): number {
    return this.mouse?.getWheelDelta() ?? 0;
  }

  // Pointer lock
  public lockPointer(): void {
    this.mouse?.lockPointer();
  }

  public unlockPointer(): void {
    this.mouse?.unlockPointer();
  }

  public isPointerLocked(): boolean {
    return this.mouse?.isPointerLockedState() ?? false;
  }

  // Action mapping
  public registerActionMap(name: string, config: IActionMapConfig): void {
    const actionMap = new ActionMap(config, this);
    this.actionMaps.set(name, actionMap);
    logger.debug(`Registered action map: ${name}`);
  }

  public isActionActive(action: string, mapName: string = 'default'): boolean {
    const map = this.actionMaps.get(mapName);
    return map?.isActionActive(action) ?? false;
  }

  public getActionValueLegacy(action: string, mapName: string = 'default'): number {
    const map = this.actionMaps.get(mapName);
    return map?.getActionValue(action) ?? 0;
  }

  // New Input System methods

  /**
   * Load an input actions asset
   */
  public loadInputActionsAsset(asset: IInputActionsAsset): void {
    this.actionRuntime?.loadAsset(asset);
  }

  /**
   * Enable/disable action maps
   */
  public enableActionMap(mapName: string): void {
    this.actionRuntime?.enableActionMap(mapName);
  }

  public disableActionMap(mapName: string): void {
    this.actionRuntime?.disableActionMap(mapName);
  }

  /**
   * Subscribe to action events
   */
  public onAction(
    actionMapName: string,
    actionName: string,
    callback: (context: IInputActionCallbackContext) => void,
  ): void {
    this.actionRuntime?.on(actionMapName, actionName, callback);
  }

  /**
   * Unsubscribe from action events
   */
  public offAction(
    actionMapName: string,
    actionName: string,
    callback: (context: IInputActionCallbackContext) => void,
  ): void {
    this.actionRuntime?.off(actionMapName, actionName, callback);
  }

  /**
   * Get current action value (polling)
   */
  public getActionValue(
    mapName: string,
    actionName: string,
  ): number | [number, number] | [number, number, number] {
    return this.actionRuntime?.getActionValue(mapName, actionName) ?? 0;
  }

  /**
   * Check if action is active (boolean)
   */
  public isActionActiveNew(mapName: string, actionName: string): boolean {
    return this.actionRuntime?.isActionActive(mapName, actionName) ?? false;
  }

  /**
   * Shutdown and cleanup
   */
  public shutdown(): void {
    if (!this.initialized) return;

    this.keyboard?.destroy();
    this.mouse?.destroy();
    this.actionRuntime?.destroy();

    this.keyboard = null;
    this.mouse = null;
    this.actionRuntime = null;
    this.actionMaps.clear();
    this.initialized = false;

    logger.info('InputManager shutdown');
  }

  /**
   * Reset singleton instance (for testing)
   */
  public static resetInstance(): void {
    if (InputManager.instance) {
      InputManager.instance.shutdown();
      InputManager.instance = null;
    }
  }
}
