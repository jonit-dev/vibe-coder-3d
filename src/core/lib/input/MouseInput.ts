import { Logger } from '@core/lib/logger';

const logger = Logger.create('MouseInput');

/**
 * Handles mouse input tracking with button states, position, and wheel
 */
export class MouseInput {
  private buttonsDown: Set<number> = new Set();
  private buttonsPressedThisFrame: Set<number> = new Set();
  private buttonsReleasedThisFrame: Set<number> = new Set();
  private position: [number, number] = [0, 0];
  private previousPosition: [number, number] = [0, 0];
  private wheelDelta: number = 0;
  private canvas: HTMLCanvasElement | null = null;
  private isPointerLocked: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    canvas.addEventListener('mousedown', this.handleMouseDown);
    canvas.addEventListener('mouseup', this.handleMouseUp);
    canvas.addEventListener('mousemove', this.handleMouseMove);
    canvas.addEventListener('wheel', this.handleWheel);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);

    logger.debug('MouseInput initialized');
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

    if (this.isPointerLocked) {
      // In pointer lock mode, use movement delta
      this.position = [this.position[0] + event.movementX, this.position[1] + event.movementY];
    } else {
      // Normal mode - calculate position relative to canvas
      const rect = this.canvas.getBoundingClientRect();
      this.position = [event.clientX - rect.left, event.clientY - rect.top];
    }
  };

  private handleWheel = (event: WheelEvent): void => {
    this.wheelDelta += event.deltaY;
    event.preventDefault();
  };

  private handlePointerLockChange = (): void => {
    this.isPointerLocked = document.pointerLockElement === this.canvas;
    logger.debug('Pointer lock changed:', this.isPointerLocked);
  };

  public update(): void {
    this.previousPosition = [...this.position];
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

  public lockPointer(): void {
    if (this.canvas) {
      this.canvas.requestPointerLock();
    }
  }

  public unlockPointer(): void {
    if (document.pointerLockElement === this.canvas) {
      document.exitPointerLock();
    }
  }

  public isPointerLockedState(): boolean {
    return this.isPointerLocked;
  }

  public destroy(): void {
    if (!this.canvas) return;

    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('wheel', this.handleWheel);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);

    this.buttonsDown.clear();
    this.buttonsPressedThisFrame.clear();
    this.buttonsReleasedThisFrame.clear();

    logger.debug('MouseInput destroyed');
  }
}
