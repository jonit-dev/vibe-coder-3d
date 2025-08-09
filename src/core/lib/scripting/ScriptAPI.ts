/**
 * Script API - Provides secure access to entity properties and engine features for user scripts
 */

import * as THREE from 'three';
import { EntityId } from '../ecs/types';

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
  // Keyboard
  isKeyPressed: (key: string) => boolean;
  isKeyDown: (key: string) => boolean;
  isKeyUp: (key: string) => boolean;

  // Mouse
  mousePosition: () => [number, number];
  isMouseButtonPressed: (button: number) => boolean;
  isMouseButtonDown: (button: number) => boolean;
  isMouseButtonUp: (button: number) => boolean;

  // Gamepad (future extension)
  getGamepadAxis: (gamepadIndex: number, axisIndex: number) => number;
  isGamepadButtonPressed: (gamepadIndex: number, buttonIndex: number) => boolean;
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

  // Transform shortcuts (most common operations)
  transform: ITransformAPI;

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
 * Complete script execution context
 */
export interface IScriptContext {
  entity: IEntityScriptAPI;
  time: ITimeAPI;
  input: IInputAPI;
  math: IMathAPI;
  console: IConsoleAPI;
  three: IThreeJSAPI;

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
 * Import ComponentManager for transform operations
 */
import { ComponentManager } from '../ecs/ComponentManager';

/**
 * Transform data interface
 */
interface ITransformData {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

/**
 * Creates a transform API for manipulating entity transform
 */
export const createTransformAPI = (entityId: EntityId): ITransformAPI => {
  const componentManager = ComponentManager.getInstance();

  const getTransform = (): ITransformData => {
    const transformData = componentManager.getComponentData<ITransformData>(entityId, 'Transform');
    if (transformData) {
      return transformData;
    }
    // Return default values if no transform component exists
    return { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] };
  };

  const updateTransform = (updates: Partial<ITransformData>) => {
    const currentTransform = getTransform();
    const newTransform: ITransformData = { ...currentTransform, ...updates };

    try {
      componentManager.updateComponentData(entityId, 'Transform', newTransform);
      console.log(`[ScriptAPI] Updated transform for entity ${entityId}:`, updates);
    } catch (error) {
      console.error(`[ScriptAPI] Failed to update transform for entity ${entityId}:`, error);
    }
  };

  return {
    get position(): [number, number, number] {
      const transform = getTransform();
      return transform?.position || [0, 0, 0];
    },

    get rotation(): [number, number, number] {
      const transform = getTransform();
      return transform?.rotation || [0, 0, 0];
    },

    get scale(): [number, number, number] {
      const transform = getTransform();
      return transform?.scale || [1, 1, 1];
    },

    setPosition: (x: number, y: number, z: number) => {
      updateTransform({ position: [x, y, z] });
    },

    setRotation: (x: number, y: number, z: number) => {
      updateTransform({ rotation: [x, y, z] });
    },

    setScale: (x: number, y: number, z: number) => {
      updateTransform({ scale: [x, y, z] });
    },

    translate: (x: number, y: number, z: number) => {
      const currentTransform = getTransform();
      const [px, py, pz] = currentTransform.position;
      updateTransform({ position: [px + x, py + y, pz + z] });
    },

    rotate: (x: number, y: number, z: number) => {
      const currentTransform = getTransform();
      const [rx, ry, rz] = currentTransform.rotation;
      updateTransform({ rotation: [rx + x, ry + y, rz + z] });
    },

    lookAt: (targetPos: [number, number, number]) => {
      // Simplified lookAt - calculate rotation to look at target
      const currentTransform = getTransform();
      const [px, py, pz] = currentTransform.position;
      const [tx, ty, tz] = targetPos;

      const dx = tx - px;
      const dy = ty - py;
      const dz = tz - pz;

      const yaw = Math.atan2(dx, dz);
      const distance = Math.sqrt(dx * dx + dz * dz);
      const pitch = -Math.atan2(dy, distance);

      updateTransform({ rotation: [pitch, yaw, 0] });
    },

    forward: (): [number, number, number] => {
      const currentTransform = getTransform();
      const [rx, ry] = currentTransform.rotation;
      return [Math.sin(ry) * Math.cos(rx), -Math.sin(rx), Math.cos(ry) * Math.cos(rx)];
    },

    right: (): [number, number, number] => {
      const currentTransform = getTransform();
      const [, ry] = currentTransform.rotation;
      return [Math.cos(ry), 0, -Math.sin(ry)];
    },

    up: (): [number, number, number] => {
      const currentTransform = getTransform();
      const [rx, ry] = currentTransform.rotation;
      return [-Math.sin(ry) * Math.sin(rx), Math.cos(rx), -Math.cos(ry) * Math.sin(rx)];
    },
  };
};

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
      console.warn(`Access to Three.js property '${String(prop)}' is not allowed`);
      return undefined;
    },
    set(obj: any, prop: string | symbol, value: any) {
      if (typeof prop === 'string' && allowedProps.includes(prop)) {
        obj[prop] = value;
        return true;
      }
      console.warn(`Setting Three.js property '${String(prop)}' is not allowed`);
      return false;
    },
  });
};

/**
 * Creates Three.js API with safe access to entity's 3D objects
 */
export const createThreeJSAPI = (
  entityId: EntityId,
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
  // Note: This is a simplified implementation. A full implementation would need
  // access to the entity manager and hierarchy system

  return {
    id: entityId,
    name: 'Entity', // Would need entity manager to get actual name

    getComponent: <T = unknown>(componentType: string): T | null => {
      try {
        // This would need to be implemented with actual component access
        console.warn(`getComponent(${componentType}) not yet fully implemented in script context`);
        return null;
      } catch {
        return null;
      }
    },

    setComponent: <T = unknown>(componentType: string, data: Partial<T>): boolean => {
      try {
        // This would need to be implemented with actual component access
        console.warn(`setComponent(${componentType}) not yet fully implemented in script context`);
        return false;
      } catch {
        return false;
      }
    },

    hasComponent: (componentType: string): boolean => {
      console.warn(`hasComponent(${componentType}) not yet fully implemented in script context`);
      return false;
    },

    removeComponent: (componentType: string): boolean => {
      try {
        console.warn(
          `removeComponent(${componentType}) not yet fully implemented in script context`,
        );
        return false;
      } catch {
        return false;
      }
    },

    transform: createTransformAPI(entityId),

    // Simplified hierarchy methods - would need full entity manager
    getParent: () => null,
    getChildren: () => [],
    findChild: () => null,

    destroy: () => {
      // Would need entity manager to destroy entity
      console.warn(`Entity ${entityId}: destroy() not implemented in script context`);
    },

    setActive: (active: boolean) => {
      console.warn(`Entity ${entityId}: setActive(${active}) not implemented in script context`);
    },

    isActive: () => true,
  };
};
