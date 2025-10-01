/**
 * Script API Type Declarations
 * These types are available in all external scripts executed by the ScriptExecutor
 *
 * Usage: IDEs will automatically pick up these global types when editing scripts in this directory
 */

// Global declarations for script runtime environment
declare global {
  // ============================================================================
  // Entity API
  // ============================================================================

  /**
   * Entity transform API for position, rotation, and scale operations
   */
  interface IScriptTransformAPI {
    /** Get or set entity position [x, y, z] */
    position: [number, number, number];
    /** Get or set entity rotation (euler angles) [x, y, z] */
    rotation: [number, number, number];
    /** Get or set entity scale [x, y, z] */
    scale: [number, number, number];

    /** Translate entity by offset */
    translate(x: number, y: number, z: number): void;
    /** Rotate entity by delta (euler angles) */
    rotate(x: number, y: number, z: number): void;
    /** Scale entity by factors */
    scaleBy(x: number, y: number, z: number): void;

    /** Set position */
    setPosition(x: number, y: number, z: number): void;
    /** Set rotation */
    setRotation(x: number, y: number, z: number): void;
    /** Set scale */
    setScale(x: number, y: number, z: number): void;
  }

  /**
   * Entity API - access to entity properties and state
   */
  interface IScriptEntityAPI {
    /** Entity ID */
    id: number;
    /** Entity name */
    name: string;
    /** Transform operations */
    transform: IScriptTransformAPI;
    /** Access to Three.js mesh and materials */
    three: IScriptThreeAPI;

    /** Get entity component data */
    getComponent<T = unknown>(componentType: string): T | null;
    /** Check if entity has component */
    hasComponent(componentType: string): boolean;
  }

  // ============================================================================
  // Three.js API
  // ============================================================================

  /**
   * Three.js material API
   */
  interface IScriptMaterialAPI {
    /** Set material color (hex string like "#ff0000") */
    setColor(color: string): void;
    /** Get material color as hex string */
    getColor(): string;
    /** Set opacity (0-1) */
    setOpacity(opacity: number): void;
    /** Get opacity */
    getOpacity(): number;
    /** Get raw Three.js material */
    get(): any; // THREE.Material
  }

  /**
   * Three.js animation API
   */
  interface IScriptAnimateAPI {
    /** Animate position */
    position(target: [number, number, number], duration: number): void;
    /** Animate rotation */
    rotation(target: [number, number, number], duration: number): void;
    /** Animate scale */
    scale(target: [number, number, number], duration: number): void;
  }

  /**
   * Three.js API - access to Three.js objects
   */
  interface IScriptThreeAPI {
    /** Three.js Object3D */
    object3D: any; // THREE.Object3D
    /** Three.js Mesh */
    mesh: any | null; // THREE.Mesh | null
    /** Material operations */
    material: IScriptMaterialAPI;
    /** Three.js scene reference */
    scene: any; // THREE.Scene
    /** Animation helpers */
    animate: IScriptAnimateAPI;
  }

  // ============================================================================
  // Math API
  // ============================================================================

  /**
   * Math utility API
   */
  interface IScriptMathAPI {
    /** Linear interpolation */
    lerp(a: number, b: number, t: number): number;
    /** Clamp value between min and max */
    clamp(value: number, min: number, max: number): number;
    /** Distance between two 3D points */
    distance(
      x1: number, y1: number, z1: number,
      x2: number, y2: number, z2: number
    ): number;
    /** Convert degrees to radians */
    degToRad(degrees: number): number;
    /** Convert radians to degrees */
    radToDeg(radians: number): number;
  }

  // ============================================================================
  // Input API
  // ============================================================================

  /**
   * Input API - keyboard and mouse
   */
  interface IScriptInputAPI {
    /** Check if key is currently pressed */
    isKeyPressed(key: string): boolean;
    /** Check if key was just pressed this frame */
    isKeyDown(key: string): boolean;
    /** Check if key was just released this frame */
    isKeyUp(key: string): boolean;

    /** Get mouse position [x, y] in viewport coordinates */
    mousePosition(): [number, number];
    /** Check if mouse button is pressed (0=left, 1=middle, 2=right) */
    isMouseButtonPressed(button: number): boolean;
    /** Check if mouse button was just pressed */
    isMouseButtonDown(button: number): boolean;
    /** Check if mouse button was just released */
    isMouseButtonUp(button: number): boolean;

    /** Get gamepad axis value (-1 to 1) */
    getGamepadAxis(gamepadIndex: number, axisIndex: number): number;
    /** Check if gamepad button is pressed */
    isGamepadButtonPressed(gamepadIndex: number, buttonIndex: number): boolean;
  }

  // ============================================================================
  // Time API
  // ============================================================================

  /**
   * Time API - time and frame information
   */
  interface IScriptTimeAPI {
    /** Total time elapsed since start (seconds) */
    time: number;
    /** Delta time since last frame (seconds) */
    deltaTime: number;
    /** Frame count */
    frameCount: number;
  }

  // ============================================================================
  // Global Variables
  // ============================================================================

  /** Current entity API */
  const entity: IScriptEntityAPI;

  /** Three.js API for current entity */
  const three: IScriptThreeAPI;

  /** Math utilities */
  const math: IScriptMathAPI;

  /** Input API */
  const input: IScriptInputAPI;

  /** Time API */
  const time: IScriptTimeAPI;

  /** Script parameters configured in the editor */
  const parameters: Record<string, unknown>;

}

// Note: Scripts can implement these optional lifecycle functions:
// - onStart(): void
// - onUpdate(deltaTime: number): void
// - onDestroy(): void
// - onEnable(): void
// - onDisable(): void

export {};
