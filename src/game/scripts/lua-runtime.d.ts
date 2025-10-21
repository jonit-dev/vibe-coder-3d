/**
 * Lua Runtime Type Definitions
 *
 * Global APIs available in Lua scripts transpiled from TypeScript.
 * These correspond to the Rust Lua API implementations.
 */

/** Entity Transform API */
interface EntityTransform {
  /** Get current position as [x, y, z] */
  position(): [number, number, number];

  /** Get current rotation as Euler angles in degrees [x, y, z] */
  rotation(): [number, number, number];

  /** Get current scale as [x, y, z] */
  scale(): [number, number, number];

  /** Set position */
  setPosition(x: number, y: number, z: number): void;

  /** Set rotation using Euler angles in degrees */
  setRotation(x: number, y: number, z: number): void;

  /** Set scale */
  setScale(x: number, y: number, z: number): void;

  /** Rotate by delta Euler angles in degrees */
  rotate(x: number, y: number, z: number): void;
}

/** Entity API - available as global 'entity' in scripts */
interface Entity {
  /** Entity ID */
  readonly id: number;

  /** Entity name */
  readonly name: string;

  /** Transform component API */
  readonly transform: EntityTransform;
}

/** Script parameters - available as global 'parameters' */
declare const parameters: Record<string, any>;

/** Global entity reference */
declare const entity: Entity;

/** Console API for logging */
declare const console: {
  log(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
};
