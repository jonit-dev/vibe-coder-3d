// Camera System
// Synchronizes Camera components with Three.js cameras
import { defineQuery } from 'bitecs';
import { OrthographicCamera, PerspectiveCamera } from 'three';

import { componentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { ECSWorld } from '@core/lib/ecs/World';

// Get world instance
const world = ECSWorld.getInstance().getWorld();

// Lazy-initialize the query to avoid module-load timing issues
let cameraQuery: ReturnType<typeof defineQuery> | null = null;

// Initialize the query when needed
function getCameraQuery() {
  if (!cameraQuery) {
    const cameraComponent = componentRegistry.getBitECSComponent('Camera');
    if (!cameraComponent) {
      console.warn('[cameraSystem] Camera component not yet registered, skipping update');
      return null;
    }
    cameraQuery = defineQuery([cameraComponent]);
  }
  return cameraQuery;
}

// Global reference to the editor camera (set by viewport)
let editorCamera: PerspectiveCamera | OrthographicCamera | null = null;
let selectedCameraEntityId: number | null = null;

// Entity to Three.js object mapping (simplified for now)
const entityToObject = new Map<number, any>();

/**
 * Set the editor camera reference for real-time updates
 * This should be called by the viewport when the camera changes
 */
export function setEditorCamera(camera: PerspectiveCamera | OrthographicCamera | null): void {
  editorCamera = camera;
}

/**
 * Set which camera entity is currently selected in the editor
 * This allows real-time updates of the editor camera when the entity changes
 */
export function setSelectedCameraEntity(entityId: number | null): void {
  selectedCameraEntityId = entityId;
}

/**
 * Camera System - Updates cameras based on ECS Camera component data
 * Returns the number of updated cameras
 */
export function cameraSystem(): number {
  // Get the query (lazy-initialized)
  const query = getCameraQuery();
  if (!query) {
    return 0; // Camera component not yet registered
  }

  const entities = query(world);
  let updatedCount = 0;

  entities.forEach((eid: number) => {
    // Get camera data using the new component registry
    const cameraData = componentRegistry.getComponentData(eid, 'Camera');
    if (!cameraData) return;

    // Check if camera needs update (we'll use a simple flag for now)
    const bitECSCamera = componentRegistry.getBitECSComponent('Camera') as
      | (Record<string, Record<number, number>> & { needsUpdate?: Record<number, number> })
      | undefined;
    if (!bitECSCamera?.needsUpdate?.[eid]) {
      return;
    }

    // For editor mode: if this camera entity is selected, update the editor camera
    if (selectedCameraEntityId === eid && editorCamera) {
      updateCameraFromData(editorCamera, cameraData);
      updatedCount++;
    }

    // For game mode: check for actual camera objects (during play mode)
    const object = entityToObject.get(eid);
    if (object && (object instanceof PerspectiveCamera || object instanceof OrthographicCamera)) {
      updateCameraFromData(object as PerspectiveCamera | OrthographicCamera, cameraData);
      updatedCount++;
    }

    // Reset the needsUpdate flag
    if (bitECSCamera?.needsUpdate) {
      bitECSCamera.needsUpdate[eid] = 0;
    }
  });

  return updatedCount;
}

/**
 * Apply camera data to a Three.js camera object
 */
function updateCameraFromData(
  camera: PerspectiveCamera | OrthographicCamera,
  cameraData: any,
): void {
  // Update orthographic camera
  if (camera instanceof OrthographicCamera) {
    const size = cameraData.orthographicSize || 10;
    const aspect = window.innerWidth / window.innerHeight;
    camera.left = -size * aspect;
    camera.right = size * aspect;
    camera.top = size;
    camera.bottom = -size;
    camera.near = cameraData.near;
    camera.far = cameraData.far;
  } else if (camera instanceof PerspectiveCamera) {
    // Update perspective camera
    camera.fov = cameraData.fov;
    camera.near = cameraData.near;
    camera.far = cameraData.far;
    camera.aspect = window.innerWidth / window.innerHeight;
  }

  // Update projection matrix for changes to take effect
  camera.updateProjectionMatrix();
}

/**
 * Mark all cameras for update
 * Useful after window resize or camera property changes
 */
export function markAllCamerasForUpdate(): number {
  // Get the query (lazy-initialized)
  const query = getCameraQuery();
  if (!query) {
    return 0; // Camera component not yet registered
  }

  const entities = query(world);
  const bitECSCamera = componentRegistry.getBitECSComponent('Camera') as
    | (Record<string, Record<number, number>> & { needsUpdate?: Record<number, number> })
    | undefined;

  if (!bitECSCamera?.needsUpdate) {
    return 0;
  }

  entities.forEach((eid: number) => {
    if (bitECSCamera?.needsUpdate) {
      bitECSCamera.needsUpdate[eid] = 1;
    }
  });

  return entities.length;
}

/**
 * Register an entity-to-object mapping for game mode camera switching
 */
export function registerEntityObject(entityId: number, object: any): void {
  entityToObject.set(entityId, object);
}

/**
 * Unregister an entity-to-object mapping
 */
export function unregisterEntityObject(entityId: number): void {
  entityToObject.delete(entityId);
}
