// Camera System
// Synchronizes Camera components with Three.js cameras
import { OrthographicCamera, PerspectiveCamera } from 'three';

import { cameraQuery, entityToObject, world } from '@core/lib/ecs';
import { Camera } from '@core/lib/ecs/BitECSComponents';

// Global reference to the editor camera (set by viewport)
let editorCamera: PerspectiveCamera | OrthographicCamera | null = null;
let selectedCameraEntityId: number | null = null;

/**
 * Set the editor camera reference for real-time updates
 * This should be called by the viewport when the camera changes
 */
export function setEditorCamera(camera: PerspectiveCamera | OrthographicCamera | null): void {
  editorCamera = camera;
}

/**
 * Set which camera entity is currently selected
 * This allows the system to update the editor camera based on the selected camera's properties
 */
export function setSelectedCameraEntity(entityId: number | null): void {
  selectedCameraEntityId = entityId;
}

/**
 * System that synchronizes ECS Camera data with Three.js cameras
 * Returns the number of updated cameras
 */
export function cameraSystem(): number {
  // Get all entities with Camera components
  const entities = cameraQuery(world);
  let updatedCount = 0;

  // Update Three.js cameras from ECS data
  entities.forEach((eid: number) => {
    // Skip if doesn't need update
    if (!Camera.needsUpdate[eid]) {
      return;
    }

    // For editor mode: if this camera entity is selected, update the editor camera
    if (selectedCameraEntityId === eid && editorCamera) {
      updateCameraFromEntity(editorCamera, eid);
      updatedCount++;
    }

    // For game mode: check for actual camera objects (during play mode)
    const object = entityToObject.get(eid);
    if (object && (object instanceof PerspectiveCamera || object instanceof OrthographicCamera)) {
      updateCameraFromEntity(object as PerspectiveCamera | OrthographicCamera, eid);
      updatedCount++;
    }

    // Reset update flag
    Camera.needsUpdate[eid] = 0;
  });

  return updatedCount;
}

/**
 * Helper function to update a Three.js camera from ECS camera data
 */
function updateCameraFromEntity(camera: PerspectiveCamera | OrthographicCamera, eid: number): void {
  const isOrthographic = Camera.projectionType[eid] === 1;

  if (isOrthographic && camera instanceof OrthographicCamera) {
    // Update orthographic camera
    const size = Camera.orthographicSize[eid];
    const aspect = window.innerWidth / window.innerHeight;

    camera.left = -size * aspect;
    camera.right = size * aspect;
    camera.top = size;
    camera.bottom = -size;
    camera.near = Camera.near[eid];
    camera.far = Camera.far[eid];
  } else if (!isOrthographic && camera instanceof PerspectiveCamera) {
    // Update perspective camera
    camera.fov = Camera.fov[eid];
    camera.near = Camera.near[eid];
    camera.far = Camera.far[eid];
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
  const entities = cameraQuery(world);

  entities.forEach((eid: number) => {
    Camera.needsUpdate[eid] = 1;
  });

  return entities.length;
}
