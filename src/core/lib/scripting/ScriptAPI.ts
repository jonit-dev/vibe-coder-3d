/**
 * Script API - Provides secure access to entity properties and engine features for user scripts
 */

import * as THREE from 'three';
import { EntityId } from '../ecs/types';
import type {
  IMeshRendererAccessor,
  ICameraAccessor,
  IRigidBodyAccessor,
  IMeshColliderAccessor,
} from '../ecs/components/accessors/types';

/**
 * Math utilities available to scripts
 */
export interface IMathAPI {
  // Basic math constants and functions (from Math object)
  PI: number;
  E: number;
  abs: (x: number) => number;
  acos: (x: number) => number;
  asin: (x: number) => number;
  atan: (x: number) => number;
  atan2: (y: number, x: number) => number;
  ceil: (x: number) => number;
  cos: (x: number) => number;
  exp: (x: number) => number;
  floor: (x: number) => number;
  log: (x: number) => number;
  max: (...values: number[]) => number;
  min: (...values: number[]) => number;
  pow: (x: number, y: number) => number;
  random: () => number;
  round: (x: number) => number;
  sin: (x: number) => number;
  sqrt: (x: number) => number;
  tan: (x: number) => number;

  // Additional game-specific math utilities
  clamp: (value: number, min: number, max: number) => number;
  lerp: (a: number, b: number, t: number) => number;
  radToDeg: (rad: number) => number;
  degToRad: (deg: number) => number;
  distance: (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) => number;
}

/**
 * Transform utilities for entity manipulation
 */
export interface ITransformAPI {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];

  setPosition: (x: number, y: number, z: number) => void;
  setRotation: (x: number, y: number, z: number) => void;
  setScale: (x: number, y: number, z: number) => void;

  translate: (x: number, y: number, z: number) => void;
  rotate: (x: number, y: number, z: number) => void;

  // Utility methods
  lookAt: (targetPos: [number, number, number]) => void;
  forward: () => [number, number, number];
  right: () => [number, number, number];
  up: () => [number, number, number];
}

/**
 * Input system access for scripts
 */
export interface IInputAPI {
  // Basic Keyboard Input
  isKeyDown: (key: string) => boolean;
  isKeyPressed: (key: string) => boolean;
  isKeyReleased: (key: string) => boolean;

  // Basic Mouse Input
  isMouseButtonDown: (button: number) => boolean;
  isMouseButtonPressed: (button: number) => boolean;
  isMouseButtonReleased: (button: number) => boolean;
  mousePosition: () => [number, number];
  mouseDelta: () => [number, number];
  mouseWheel: () => number;

  // Pointer Lock
  lockPointer: () => void;
  unlockPointer: () => void;
  isPointerLocked: () => boolean;

  // Input Actions System
  getActionValue: (
    actionMapName: string,
    actionName: string,
  ) => number | [number, number] | [number, number, number];
  isActionActive: (actionMapName: string, actionName: string) => boolean;
  onAction: (
    actionMapName: string,
    actionName: string,
    callback: (
      phase: 'started' | 'performed' | 'canceled',
      value: number | [number, number] | [number, number, number],
    ) => void,
  ) => void;
  offAction: (
    actionMapName: string,
    actionName: string,
    callback: (
      phase: 'started' | 'performed' | 'canceled',
      value: number | [number, number] | [number, number, number],
    ) => void,
  ) => void;
  enableActionMap: (mapName: string) => void;
  disableActionMap: (mapName: string) => void;
}

/**
 * Console API for script debugging (sandboxed)
 */
export interface IConsoleAPI {
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
}

/**
 * Time and frame information
 */
export interface ITimeAPI {
  time: number; // Total time since start
  deltaTime: number; // Time since last frame
  frameCount: number; // Total frames rendered
}

/**
 * Safe entity API for scripts - provides controlled access to entity properties
 */
export interface IEntityScriptAPI {
  readonly id: EntityId;
  readonly name: string;

  // Component access
  getComponent<T = unknown>(componentType: string): T | null;
  setComponent<T = unknown>(componentType: string, data: Partial<T>): boolean;
  hasComponent(componentType: string): boolean;
  removeComponent(componentType: string): boolean;

  // Legacy transform API (kept for backwards compatibility)
  // Prefer using entity.transform accessor for new code
  transform: ITransformAPI;

  // Direct component accessors (KISS approach - optional fields per component)
  // These are undefined if the component doesn't exist on the entity
  // All accessors use mutation buffer for batched updates
  meshRenderer?: IMeshRendererAccessor;
  camera?: ICameraAccessor;
  rigidBody?: IRigidBodyAccessor;
  meshCollider?: IMeshColliderAccessor;

  // Physics events for collision/trigger callbacks
  physicsEvents?: IPhysicsEventsAPI;

  // Character controller for simple character movement
  controller?: ICharacterControllerAPI;

  // Entity hierarchy
  getParent(): IEntityScriptAPI | null;
  getChildren(): IEntityScriptAPI[];
  findChild(name: string): IEntityScriptAPI | null;

  // Utility methods
  destroy(): void;
  setActive(active: boolean): void;
  isActive(): boolean;
}

/**
 * Three.js API for manipulating 3D objects
 */
export interface IThreeJSAPI {
  // Direct object3D access
  readonly object3D: THREE.Object3D | null;
  readonly mesh: THREE.Mesh | null;
  readonly group: THREE.Group | null;

  // Material manipulation
  material: {
    get(): THREE.Material | THREE.Material[] | null;
    set(material: THREE.Material): void;
    setProperty(property: string, value: unknown): void;
    setColor(color: string | number): void;
    setOpacity(opacity: number): void;
    setMetalness(metalness: number): void;
    setRoughness(roughness: number): void;
  };

  // Geometry access
  geometry: {
    get(): THREE.BufferGeometry | null;
    setProperty(property: string, value: unknown): void;
    scale(x: number, y: number, z: number): void;
    rotateX(angle: number): void;
    rotateY(angle: number): void;
    rotateZ(angle: number): void;
  };

  // Scene graph access
  readonly scene: THREE.Scene | null;
  readonly parent: THREE.Object3D | null;
  readonly children: THREE.Object3D[];

  // Animation helpers
  animate: {
    position(to: [number, number, number], duration: number): Promise<void>;
    rotation(to: [number, number, number], duration: number): Promise<void>;
    scale(to: [number, number, number], duration: number): Promise<void>;
  };

  // Utility methods
  raycast(
    origin: [number, number, number],
    direction: [number, number, number],
  ): THREE.Intersection[];
  lookAt(target: [number, number, number]): void;
  worldPosition(): [number, number, number];
  worldRotation(): [number, number, number];

  // Visibility and rendering
  setVisible(visible: boolean): void;
  isVisible(): boolean;
}

/**
 * Entity reference for cross-entity operations
 */
export interface IEntityRef {
  entityId?: number; // fast path when stable
  guid?: string; // stable id if available
  name?: string; // entity name lookup
  path?: string; // fallback scene path (e.g., Root/Enemy[2]/Weapon)
}

/**
 * Entities API for entity queries and references
 */
export interface IEntitiesAPI {
  fromRef(ref: IEntityRef | number | string): IEntityScriptAPI | null; // accepts id/guid/path
  get(entityId: number): IEntityScriptAPI | null;
  findByName(name: string): IEntityScriptAPI[];
  findByTag(tag: string): IEntityScriptAPI[];
  exists(entityId: number): boolean;
}

/**
 * Event API for event bus access
 */
export interface IEventAPI {
  on<T extends string>(type: T, handler: (payload: unknown) => void): () => void;
  off<T extends string>(type: T, handler: (payload: unknown) => void): void;
  emit<T extends string>(type: T, payload: unknown): void;
}

/**
 * Audio API for sound playback
 */
export interface IAudioAPI {
  play(url: string, options?: Record<string, unknown>): number;
  stop(handleOrUrl: number | string): void;
  attachToEntity?(follow: boolean): void;
}

/**
 * Timer API for scheduled callbacks
 */
export interface ITimerAPI {
  setTimeout(cb: () => void, ms: number): number;
  clearTimeout(id: number): void;
  setInterval(cb: () => void, ms: number): number;
  clearInterval(id: number): void;
  nextTick(): Promise<void>;
  waitFrames(count: number): Promise<void>;
}

/**
 * Query API for scene queries
 */
export interface IQueryAPI {
  findByTag(tag: string): number[]; // entity IDs
  raycastFirst(origin: [number, number, number], dir: [number, number, number]): unknown | null;
  raycastAll(origin: [number, number, number], dir: [number, number, number]): unknown[];
}

/**
 * Prefab API for entity instantiation and management
 */
export interface IPrefabAPI {
  spawn(prefabId: string, overrides?: Record<string, unknown>): number; // entityId
  destroy(entityId?: number): void; // default current
  setActive(entityId: number, active: boolean): void;
}

/**
 * Physics Events API for collision/trigger callbacks
 */
export interface IPhysicsEventsAPI {
  onCollisionEnter(cb: (otherEntityId: number) => void): () => void;
  onCollisionExit(cb: (otherEntityId: number) => void): () => void;
  onTriggerEnter(cb: (otherEntityId: number) => void): () => void;
  onTriggerExit(cb: (otherEntityId: number) => void): () => void;
}

/**
 * Character Controller API for simple character movement
 */
export interface ICharacterControllerAPI {
  isGrounded(): boolean;
  move(inputXZ: [number, number], speed: number): void;
  jump(strength: number): void;
  setSlopeLimit(maxDegrees: number): void;
  setStepOffset(value: number): void;
}

/**
 * GameObject API for runtime entity CRUD operations
 */
export interface IGameObjectAPI {
  createEntity: (name?: string, parent?: number) => number;
  createPrimitive: (
    kind: 'cube' | 'sphere' | 'plane' | 'cylinder' | 'cone' | 'torus',
    options?: {
      name?: string;
      parent?: number;
      transform?: {
        position?: [number, number, number];
        rotation?: [number, number, number];
        scale?: [number, number, number] | number;
      };
      material?: { color?: string; metalness?: number; roughness?: number };
      physics?: {
        body?: 'dynamic' | 'kinematic' | 'static';
        collider?: 'box' | 'sphere' | 'mesh';
        mass?: number;
      };
    },
  ) => number;
  createModel: (
    model: string,
    options?: {
      name?: string;
      parent?: number;
      transform?: {
        position?: [number, number, number];
        rotation?: [number, number, number];
        scale?: [number, number, number] | number;
      };
      material?: { color?: string; metalness?: number; roughness?: number };
      physics?: { body?: 'dynamic' | 'kinematic' | 'static'; collider?: 'mesh' | 'box'; mass?: number };
    },
  ) => number;
  clone: (
    source: number,
    overrides?: {
      name?: string;
      parent?: number;
      transform?: {
        position?: [number, number, number];
        rotation?: [number, number, number];
        scale?: [number, number, number] | number;
      };
    },
  ) => number;
  attachComponents: (entityId: number, components: Array<{ type: string; data: unknown }>) => void;
  setParent: (entityId: number, parent?: number) => void;
  setActive: (entityId: number, active: boolean) => void;
  destroy: (target?: number) => void;
}

/**
 * Complete script execution context
 */
export interface IScriptContext {
  entity: IEntityScriptAPI;
  time: ITimeAPI;
  input: IInputAPI;
  math: IMathAPI;
  console: IConsoleAPI;
  three: IThreeJSAPI;
  events: IEventAPI;
  audio: IAudioAPI;
  timer: ITimerAPI;
  query: IQueryAPI;
  prefab: IPrefabAPI;
  entities: IEntitiesAPI;
  gameObject: IGameObjectAPI;

  // Script lifecycle methods that users can override
  onStart?: () => void;
  onUpdate?: (deltaTime: number) => void;
  onDestroy?: () => void;
  onEnable?: () => void;
  onDisable?: () => void;

  // Parameters passed from the component
  parameters: Record<string, unknown>;
}

/**
 * Creates a math API implementation
 */
export const createMathAPI = (): IMathAPI => ({
  // Math constants and functions
  PI: Math.PI,
  E: Math.E,
  abs: Math.abs,
  acos: Math.acos,
  asin: Math.asin,
  atan: Math.atan,
  atan2: Math.atan2,
  ceil: Math.ceil,
  cos: Math.cos,
  exp: Math.exp,
  floor: Math.floor,
  log: Math.log,
  max: Math.max,
  min: Math.min,
  pow: Math.pow,
  random: Math.random,
  round: Math.round,
  sin: Math.sin,
  sqrt: Math.sqrt,
  tan: Math.tan,

  // Game-specific utilities
  clamp: (value: number, min: number, max: number) => Math.max(min, Math.min(max, value)),
  lerp: (a: number, b: number, t: number) => a + (b - a) * t,
  radToDeg: (rad: number) => rad * (180 / Math.PI),
  degToRad: (deg: number) => deg * (Math.PI / 180),
  distance: (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dz = z2 - z1;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  },
});

/**
 * Creates a sandboxed console API for scripts
 */
export const createConsoleAPI = (entityId: EntityId): IConsoleAPI => ({
  log: (...args: unknown[]) => console.log(`[Script:${entityId}]`, ...args),
  warn: (...args: unknown[]) => console.warn(`[Script:${entityId}]`, ...args),
  error: (...args: unknown[]) => console.error(`[Script:${entityId}]`, ...args),
  info: (...args: unknown[]) => console.info(`[Script:${entityId}]`, ...args),
});

/**
 * Import ComponentRegistry and EntityManager for entity operations (single source of truth)
 */
import { componentRegistry } from '../ecs/ComponentRegistry';
import { EntityManager } from '../ecs/EntityManager';

/**
 * Safe Three.js operations whitelist
 */
const SAFE_THREEJS_OPERATIONS = {
  Object3D: ['position', 'rotation', 'scale', 'visible', 'lookAt', 'add', 'remove', 'userData'],
  Material: ['color', 'opacity', 'transparent', 'metalness', 'roughness', 'emissive', 'wireframe'],
  Geometry: ['scale', 'rotateX', 'rotateY', 'rotateZ', 'translate'],
  Mesh: [
    'position',
    'rotation',
    'scale',
    'visible',
    'material',
    'geometry',
    'castShadow',
    'receiveShadow',
  ],
};

/**
 * Creates a safe Three.js proxy for controlled property access
 */
const createSafeThreeJSProxy = <T extends object>(target: T, allowedProps: string[]): T => {
  return new Proxy(target, {
    get(obj: any, prop: string | symbol) {
      if (
        typeof prop === 'string' &&
        (allowedProps.includes(prop) || typeof obj[prop] === 'function')
      ) {
        return obj[prop];
      }
      if (typeof prop === 'symbol') {
        return obj[prop];
      }
      // Access to Three.js property not allowed
      return undefined;
    },
    set(obj: any, prop: string | symbol, value: any) {
      if (typeof prop === 'string' && allowedProps.includes(prop)) {
        obj[prop] = value;
        return true;
      }
      // Setting Three.js property not allowed
      return false;
    },
  });
};

/**
 * Creates Three.js API with safe access to entity's 3D objects
 */
export const createThreeJSAPI = (
  _entityId: EntityId,
  getMeshRef: () => THREE.Object3D | null,
  getScene: () => THREE.Scene | null,
): IThreeJSAPI => {
  const api: IThreeJSAPI = {
    get object3D() {
      return getMeshRef();
    },

    get mesh() {
      const obj = getMeshRef();
      return obj instanceof THREE.Mesh ? obj : null;
    },

    get group() {
      const obj = getMeshRef();
      return obj instanceof THREE.Group ? obj : null;
    },

    material: {
      get: () => {
        const mesh = api.mesh;
        return mesh ? mesh.material : null;
      },

      set: (material: THREE.Material) => {
        const mesh = api.mesh;
        if (mesh) {
          mesh.material = createSafeThreeJSProxy(material, SAFE_THREEJS_OPERATIONS.Material);
        }
      },

      setProperty: (property: string, value: unknown) => {
        const material = api.material.get();
        if (
          material &&
          !Array.isArray(material) &&
          SAFE_THREEJS_OPERATIONS.Material.includes(property)
        ) {
          (material as any)[property] = value;
          material.needsUpdate = true;
        }
      },

      setColor: (color: string | number) => {
        const material = api.material.get();
        if (material && !Array.isArray(material) && 'color' in material) {
          (material as any).color = new THREE.Color(color);
          material.needsUpdate = true;
        }
      },

      setOpacity: (opacity: number) => {
        api.material.setProperty('opacity', Math.max(0, Math.min(1, opacity)));
        api.material.setProperty('transparent', opacity < 1);
      },

      setMetalness: (metalness: number) => {
        api.material.setProperty('metalness', Math.max(0, Math.min(1, metalness)));
      },

      setRoughness: (roughness: number) => {
        api.material.setProperty('roughness', Math.max(0, Math.min(1, roughness)));
      },
    },

    geometry: {
      get: () => {
        const mesh = api.mesh;
        return mesh ? mesh.geometry : null;
      },

      setProperty: (property: string, value: unknown) => {
        const geometry = api.geometry.get();
        if (geometry && SAFE_THREEJS_OPERATIONS.Geometry.includes(property)) {
          (geometry as any)[property] = value;
        }
      },

      scale: (x: number, y: number, z: number) => {
        const geometry = api.geometry.get();
        if (geometry) {
          geometry.scale(x, y, z);
        }
      },

      rotateX: (angle: number) => {
        const geometry = api.geometry.get();
        if (geometry) {
          geometry.rotateX(angle);
        }
      },

      rotateY: (angle: number) => {
        const geometry = api.geometry.get();
        if (geometry) {
          geometry.rotateY(angle);
        }
      },

      rotateZ: (angle: number) => {
        const geometry = api.geometry.get();
        if (geometry) {
          geometry.rotateZ(angle);
        }
      },
    },

    get scene() {
      return getScene();
    },

    get parent() {
      const obj = getMeshRef();
      return obj ? obj.parent : null;
    },

    get children() {
      const obj = getMeshRef();
      return obj ? obj.children : [];
    },

    animate: {
      position: async (to: [number, number, number], duration: number) => {
        const obj = getMeshRef();
        if (!obj) return;

        return new Promise<void>((resolve) => {
          const start = performance.now();
          const startPos = obj.position.clone();
          const endPos = new THREE.Vector3(...to);

          const animate = (currentTime: number) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);

            // Smooth easing
            const easedProgress = 1 - Math.pow(1 - progress, 3);

            obj.position.lerpVectors(startPos, endPos, easedProgress);

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              resolve();
            }
          };

          requestAnimationFrame(animate);
        });
      },

      rotation: async (to: [number, number, number], duration: number) => {
        const obj = getMeshRef();
        if (!obj) return;

        return new Promise<void>((resolve) => {
          const start = performance.now();
          const startRot = obj.rotation.clone();
          const endRot = new THREE.Euler(...to);

          const animate = (currentTime: number) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);

            const easedProgress = 1 - Math.pow(1 - progress, 3);

            obj.rotation.x = startRot.x + (endRot.x - startRot.x) * easedProgress;
            obj.rotation.y = startRot.y + (endRot.y - startRot.y) * easedProgress;
            obj.rotation.z = startRot.z + (endRot.z - startRot.z) * easedProgress;

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              resolve();
            }
          };

          requestAnimationFrame(animate);
        });
      },

      scale: async (to: [number, number, number], duration: number) => {
        const obj = getMeshRef();
        if (!obj) return;

        return new Promise<void>((resolve) => {
          const start = performance.now();
          const startScale = obj.scale.clone();
          const endScale = new THREE.Vector3(...to);

          const animate = (currentTime: number) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);

            const easedProgress = 1 - Math.pow(1 - progress, 3);

            obj.scale.lerpVectors(startScale, endScale, easedProgress);

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              resolve();
            }
          };

          requestAnimationFrame(animate);
        });
      },
    },

    raycast: (origin: [number, number, number], direction: [number, number, number]) => {
      const scene = getScene();
      if (!scene) return [];

      const raycaster = new THREE.Raycaster();
      raycaster.set(new THREE.Vector3(...origin), new THREE.Vector3(...direction).normalize());

      return raycaster.intersectObjects(scene.children, true);
    },

    lookAt: (target: [number, number, number]) => {
      const obj = getMeshRef();
      if (obj) {
        obj.lookAt(new THREE.Vector3(...target));
      }
    },

    worldPosition: () => {
      const obj = getMeshRef();
      if (!obj) return [0, 0, 0];

      const worldPos = new THREE.Vector3();
      obj.getWorldPosition(worldPos);
      return [worldPos.x, worldPos.y, worldPos.z] as [number, number, number];
    },

    worldRotation: () => {
      const obj = getMeshRef();
      if (!obj) return [0, 0, 0];

      const worldQuat = new THREE.Quaternion();
      obj.getWorldQuaternion(worldQuat);
      const euler = new THREE.Euler().setFromQuaternion(worldQuat);
      return [euler.x, euler.y, euler.z] as [number, number, number];
    },

    setVisible: (visible: boolean) => {
      const obj = getMeshRef();
      if (obj) {
        obj.visible = visible;
      }
    },

    isVisible: () => {
      const obj = getMeshRef();
      return obj ? obj.visible : false;
    },
  };

  return api;
};

/**
 * Creates a safe entity API for scripts
 */
export const createEntityAPI = (entityId: EntityId): IEntityScriptAPI => {
  // Use ComponentRegistry as single source of truth
  const registry = componentRegistry;

  return {
    id: entityId,
    name: 'Entity', // Would need entity manager to get actual name

    getComponent: <T = unknown>(componentType: string): T | null => {
      try {
        const data = registry.getComponentData<T>(entityId, componentType);
        return data || null;
      } catch (error) {
        console.warn(
          `[ScriptAPI] Failed to get component ${componentType} for entity ${entityId}:`,
          error,
        );
        return null;
      }
    },

    setComponent: <T = unknown>(componentType: string, data: Partial<T>): boolean => {
      try {
        // Check if entity has the component, if so update it, otherwise add it
        if (registry.hasComponent(entityId, componentType)) {
          return registry.updateComponent<T>(entityId, componentType, data);
        } else {
          return registry.addComponent(entityId, componentType, data as T);
        }
      } catch (error) {
        console.warn(
          `[ScriptAPI] Failed to set component ${componentType} for entity ${entityId}:`,
          error,
        );
        return false;
      }
    },

    hasComponent: (componentType: string): boolean => {
      try {
        return registry.hasComponent(entityId, componentType);
      } catch (error) {
        console.warn(
          `[ScriptAPI] Failed to check component ${componentType} for entity ${entityId}:`,
          error,
        );
        return false;
      }
    },

    removeComponent: (componentType: string): boolean => {
      try {
        return registry.removeComponent(entityId, componentType);
      } catch (error) {
        console.warn(
          `[ScriptAPI] Failed to remove component ${componentType} for entity ${entityId}:`,
          error,
        );
        return false;
      }
    },

    // Transform API will be overridden in ScriptContextFactory
    // to use the mutation buffer system
    transform: {
      get position(): [number, number, number] {
        return [0, 0, 0];
      },
      get rotation(): [number, number, number] {
        return [0, 0, 0];
      },
      get scale(): [number, number, number] {
        return [1, 1, 1];
      },
      setPosition: () => {},
      setRotation: () => {},
      setScale: () => {},
      translate: () => {},
      rotate: () => {},
      lookAt: () => {},
      forward: () => [0, 0, 1] as [number, number, number],
      right: () => [1, 0, 0] as [number, number, number],
      up: () => [0, 1, 0] as [number, number, number],
    },

    // Simplified hierarchy methods - would need full entity manager
    getParent: () => null,
    getChildren: () => [],
    findChild: () => null,

    destroy: () => {
      const entityManager = EntityManager.getInstance();
      const success = entityManager.deleteEntity(entityId);
      if (!success) {
        console.warn(`[ScriptAPI] Failed to destroy entity ${entityId}`);
      }
    },

    setActive: (active: boolean) => {
      console.warn(`Entity ${entityId}: setActive(${active}) not implemented in script context`);
    },

    isActive: () => true,
  };
};
