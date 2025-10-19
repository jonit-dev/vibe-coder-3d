import { Logger } from '@core/lib/logger';

const logger = Logger.create('KeyboardInput');

/**
 * Handles keyboard input tracking with down/pressed/released states
 */
export class KeyboardInput {
  private keysDown: Set<string> = new Set();
  private keysPressedThisFrame: Set<string> = new Set();
  private keysReleasedThisFrame: Set<string> = new Set();
  private preventDefaultKeys: Set<string> = new Set([
    'space',
    'up',
    'down',
    'left',
    'right',
    'tab',
  ]);

  constructor() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
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

  private handleBlur = (): void => {
    // Clear all keys when window loses focus
    this.keysDown.clear();
    this.keysPressedThisFrame.clear();
    this.keysReleasedThisFrame.clear();
    logger.debug('Window blur - cleared all key states');
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
      Enter: 'enter',
      Escape: 'escape',
      Tab: 'tab',
    };

    return keyMap[key] || key.toLowerCase();
  }

  private shouldPreventDefault(key: string): boolean {
    return this.preventDefaultKeys.has(key);
  }

  public clearFrameState(): void {
    this.keysPressedThisFrame.clear();
    this.keysReleasedThisFrame.clear();
  }

  public isKeyDown(key: string): boolean {
    return this.keysDown.has(key.toLowerCase());
  }

  public isKeyPressed(key: string): boolean {
    return this.keysPressedThisFrame.has(key.toLowerCase());
  }

  public isKeyReleased(key: string): boolean {
    return this.keysReleasedThisFrame.has(key.toLowerCase());
  }

  public destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    this.keysDown.clear();
    this.keysPressedThisFrame.clear();
    this.keysReleasedThisFrame.clear();
    logger.debug('KeyboardInput destroyed');
  }
}
