/**
 * AUTO-GENERATED Script API Type Declarations
 * DO NOT EDIT MANUALLY - This file is generated from ScriptAPI.ts
 *
 * These types are available in all external scripts executed by the ScriptExecutor
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
  interface ITransformAPI {
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

    /** Set position */
    setPosition(x: number, y: number, z: number): void;
    /** Set rotation */
    setRotation(x: number, y: number, z: number): void;
    /** Set scale */
    setScale(x: number, y: number, z: number): void;

    /** Look at target position */
    lookAt(targetPos: [number, number, number]): void;
    /** Get forward direction vector */
    forward(): [number, number, number];
    /** Get right direction vector */
    right(): [number, number, number];
    /** Get up direction vector */
    up(): [number, number, number];
  }

  /**
   * Entity API - access to entity properties and state
   */
  interface IEntityScriptAPI {
    /** Entity ID */
    readonly id: number;
    /** Entity name */
    readonly name: string;
    /** Transform operations */
    transform: ITransformAPI;

    /** Get entity component data */
    getComponent<T = unknown>(componentType: string): T | null;
    /** Set or update component data */
    setComponent<T = unknown>(componentType: string, data: Partial<T>): boolean;
    /** Check if entity has component */
    hasComponent(componentType: string): boolean;
    /** Remove component from entity */
    removeComponent(componentType: string): boolean;

    /** Get parent entity */
    getParent(): IEntityScriptAPI | null;
    /** Get child entities */
    getChildren(): IEntityScriptAPI[];
    /** Find child by name */
    findChild(name: string): IEntityScriptAPI | null;

    /** Destroy this entity */
    destroy(): void;
    /** Set entity active state */
    setActive(active: boolean): void;
    /** Check if entity is active */
    isActive(): boolean;
  }

  // ============================================================================
  // Three.js API
  // ============================================================================

  /**
   * Three.js material API
   */
  interface IThreeJSMaterialAPI {
    /** Get raw Three.js material */
    get(): any; // THREE.Material | THREE.Material[] | null
    /** Set material */
    set(material: any): void; // THREE.Material
    /** Set material property */
    setProperty(property: string, value: unknown): void;
    /** Set material color (hex string like "#ff0000" or number) */
    setColor(color: string | number): void;
    /** Set opacity (0-1) */
    setOpacity(opacity: number): void;
    /** Set metalness (0-1) */
    setMetalness(metalness: number): void;
    /** Set roughness (0-1) */
    setRoughness(roughness: number): void;
  }

  /**
   * Three.js geometry API
   */
  interface IThreeJSGeometryAPI {
    /** Get raw Three.js geometry */
    get(): any; // THREE.BufferGeometry | null
    /** Set geometry property */
    setProperty(property: string, value: unknown): void;
    /** Scale geometry */
    scale(x: number, y: number, z: number): void;
    /** Rotate geometry on X axis */
    rotateX(angle: number): void;
    /** Rotate geometry on Y axis */
    rotateY(angle: number): void;
    /** Rotate geometry on Z axis */
    rotateZ(angle: number): void;
  }

  /**
   * Three.js animation API
   */
  interface IThreeJSAnimateAPI {
    /** Animate position */
    position(target: [number, number, number], duration: number): Promise<void>;
    /** Animate rotation */
    rotation(target: [number, number, number], duration: number): Promise<void>;
    /** Animate scale */
    scale(target: [number, number, number], duration: number): Promise<void>;
  }

  /**
   * Three.js API - access to Three.js objects
   */
  interface IThreeJSAPI {
    /** Three.js Object3D */
    readonly object3D: any; // THREE.Object3D | null
    /** Three.js Mesh */
    readonly mesh: any | null; // THREE.Mesh | null
    /** Three.js Group */
    readonly group: any | null; // THREE.Group | null
    /** Material operations */
    material: IThreeJSMaterialAPI;
    /** Geometry operations */
    geometry: IThreeJSGeometryAPI;
    /** Three.js scene reference */
    readonly scene: any; // THREE.Scene | null
    /** Parent object */
    readonly parent: any; // THREE.Object3D | null
    /** Child objects */
    readonly children: any[]; // THREE.Object3D[]
    /** Animation helpers */
    animate: IThreeJSAnimateAPI;

    /** Raycast from origin in direction */
    raycast(origin: [number, number, number], direction: [number, number, number]): any[]; // THREE.Intersection[]
    /** Look at target position */
    lookAt(target: [number, number, number]): void;
    /** Get world position */
    worldPosition(): [number, number, number];
    /** Get world rotation */
    worldRotation(): [number, number, number];
    /** Set visibility */
    setVisible(visible: boolean): void;
    /** Check visibility */
    isVisible(): boolean;
  }

  // ============================================================================
  // Math API
  // ============================================================================

  /**
   * Math utility API
   */
  interface IMathAPI {
    // Math constants
    readonly PI: number;
    readonly E: number;

    // Basic math functions
    abs(x: number): number;
    acos(x: number): number;
    asin(x: number): number;
    atan(x: number): number;
    atan2(y: number, x: number): number;
    ceil(x: number): number;
    cos(x: number): number;
    exp(x: number): number;
    floor(x: number): number;
    log(x: number): number;
    max(...values: number[]): number;
    min(...values: number[]): number;
    pow(x: number, y: number): number;
    random(): number;
    round(x: number): number;
    sin(x: number): number;
    sqrt(x: number): number;
    tan(x: number): number;

    // Game-specific utilities
    /** Linear interpolation */
    lerp(a: number, b: number, t: number): number;
    /** Clamp value between min and max */
    clamp(value: number, min: number, max: number): number;
    /** Distance between two 3D points */
    distance(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): number;
    /** Convert degrees to radians */
    degToRad(degrees: number): number;
    /** Convert radians to degrees */
    radToDeg(radians: number): number;
  }

  // ============================================================================
  // Input API
  // ============================================================================

  /**
   * Input API - input actions system
   */
  interface IInputAPI {
    // Input Actions System
    /**
     * Get current value of an input action (polling).
     * @param actionMapName - Name of the action map (e.g., "Gameplay", "UI")
     * @param actionName - Name of the action (e.g., "Move", "Jump")
     * @returns Action value: number for buttons/axes, [x,y] for 2D vectors, [x,y,z] for 3D vectors
     * @example
     * const moveInput = input.getActionValue("Gameplay", "Move");
     * if (Array.isArray(moveInput)) {
     *   const [x, y] = moveInput;
     *   entity.position = [x * speed, 0, y * speed];
     * }
     */
    getActionValue(
      actionMapName: string,
      actionName: string,
    ): number | [number, number] | [number, number, number];

    /**
     * Check if an input action is currently active (boolean).
     * @param actionMapName - Name of the action map
     * @param actionName - Name of the action
     * @returns true if action is active (value > threshold)
     * @example
     * if (input.isActionActive("Gameplay", "Jump")) {
     *   console.log("Jump is pressed!");
     * }
     */
    isActionActive(actionMapName: string, actionName: string): boolean;

    /**
     * Subscribe to input action events (event-driven).
     * @param actionMapName - Name of the action map
     * @param actionName - Name of the action
     * @param callback - Function called when action state changes
     * @example
     * input.onAction("Gameplay", "Fire", (phase, value) => {
     *   if (phase === "started") {
     *     console.log("Fire button pressed!");
     *   }
     * });
     */
    onAction(
      actionMapName: string,
      actionName: string,
      callback: (
        phase: 'started' | 'performed' | 'canceled',
        value: number | [number, number] | [number, number, number],
      ) => void,
    ): void;

    /**
     * Unsubscribe from input action events.
     * @param actionMapName - Name of the action map
     * @param actionName - Name of the action
     * @param callback - The callback function to remove
     */
    offAction(
      actionMapName: string,
      actionName: string,
      callback: (
        phase: 'started' | 'performed' | 'canceled',
        value: number | [number, number] | [number, number, number],
      ) => void,
    ): void;

    /**
     * Enable an action map.
     * @param mapName - Name of the action map to enable
     * @example
     * input.enableActionMap("UI"); // Enable UI controls
     */
    enableActionMap(mapName: string): void;

    /**
     * Disable an action map.
     * @param mapName - Name of the action map to disable
     * @example
     * input.disableActionMap("Gameplay"); // Disable gameplay controls
     */
    disableActionMap(mapName: string): void;
  }

  // ============================================================================
  // Time API
  // ============================================================================

  /**
   * Time API - time and frame information
   */
  interface ITimeAPI {
    /** Total time elapsed since start (seconds) */
    time: number;
    /** Delta time since last frame (seconds) */
    deltaTime: number;
    /** Frame count */
    frameCount: number;
  }

  // ============================================================================
  // Console API
  // ============================================================================

  /**
   * Console API for script debugging (sandboxed)
   */
  interface IConsoleAPI {
    log(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    error(...args: unknown[]): void;
    info(...args: unknown[]): void;
  }

  // ============================================================================
  // Event API
  // ============================================================================

  /**
   * Event API for event bus access
   */
  interface IEventAPI {
    /** Subscribe to event */
    on<T extends string>(type: T, handler: (payload: unknown) => void): () => void;
    /** Unsubscribe from event */
    off<T extends string>(type: T, handler: (payload: unknown) => void): void;
    /** Emit event */
    emit<T extends string>(type: T, payload: unknown): void;
  }

  // ============================================================================
  // Audio API
  // ============================================================================

  /**
   * Audio API for sound playback
   */
  interface IAudioAPI {
    /** Play sound from URL */
    play(url: string, options?: Record<string, unknown>): number;
    /** Stop sound by handle or URL */
    stop(handleOrUrl: number | string): void;
    /** Attach audio to entity for positional sound */
    attachToEntity?(follow: boolean): void;
  }

  // ============================================================================
  // Timer API
  // ============================================================================

  /**
   * Timer API for scheduled callbacks
   */
  interface ITimerAPI {
    /** Schedule callback after delay (milliseconds) */
    setTimeout(callback: () => void, ms: number): number;
    /** Clear timeout */
    clearTimeout(id: number): void;
    /** Schedule repeating callback */
    setInterval(callback: () => void, ms: number): number;
    /** Clear interval */
    clearInterval(id: number): void;
    /** Wait for next frame */
    nextTick(): Promise<void>;
    /** Wait for N frames */
    waitFrames(count: number): Promise<void>;
  }

  // ============================================================================
  // Query API
  // ============================================================================

  /**
   * Query API for scene queries
   */
  interface IQueryAPI {
    /** Find entities by tag */
    findByTag(tag: string): number[]; // entity IDs
    /** Raycast and get first hit */
    raycastFirst(origin: [number, number, number], dir: [number, number, number]): unknown | null;
    /** Raycast and get all hits */
    raycastAll(origin: [number, number, number], dir: [number, number, number]): unknown[];
  }

  // ============================================================================
  // Prefab API
  // ============================================================================

  /**
   * Prefab API for entity instantiation and management
   */
  interface IPrefabAPI {
    /** Spawn prefab instance */
    spawn(prefabId: string, overrides?: Record<string, unknown>): number; // entityId
    /** Destroy entity (defaults to current entity if not specified) */
    destroy(entityId?: number): void;
    /** Set entity active state */
    setActive(entityId: number, active: boolean): void;
  }

  // ============================================================================
  // Entities API
  // ============================================================================

  /**
   * Entity reference for cross-entity operations
   */
  interface IEntityRef {
    entityId?: number; // fast path when stable
    guid?: string; // stable id if available
    path?: string; // fallback scene path (e.g., Root/Enemy[2]/Weapon)
  }

  /**
   * Entities API for entity queries and references
   */
  interface IEntitiesAPI {
    /** Resolve entity reference to API */
    fromRef(ref: IEntityRef | number | string): IEntityScriptAPI | null;
    /** Get entity by ID */
    get(entityId: number): IEntityScriptAPI | null;
    /** Find entities by name */
    findByName(name: string): IEntityScriptAPI[];
    /** Find entities by tag */
    findByTag(tag: string): IEntityScriptAPI[];
    /** Check if entity exists */
    exists(entityId: number): boolean;
  }

  // ============================================================================
  // Global Variables
  // ============================================================================

  /** Current entity API */
  const entity: IEntityScriptAPI;

  /** Three.js API for current entity */
  const three: IThreeJSAPI;

  /** Math utilities */
  const math: IMathAPI;

  /** Input API */
  const input: IInputAPI;

  /** Time API */
  const time: ITimeAPI;

  /** Console API */
  const console: IConsoleAPI;

  /** Event bus API */
  const events: IEventAPI;

  /** Audio API */
  const audio: IAudioAPI;

  /** Timer API */
  const timer: ITimerAPI;

  /** Query API */
  const query: IQueryAPI;

  /** Prefab API */
  const prefab: IPrefabAPI;

  /** Entities API */
  const entities: IEntitiesAPI;

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
