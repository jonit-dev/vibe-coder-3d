import { Camera, Mesh, Scene } from 'three';
import { getBVHManager } from '@core/lib/rendering/BVHManager';
import { Logger } from '@core/lib/logger';

const logger = Logger.create('BVHSystem');

/**
 * BVH System - Integrates BVH optimization into the game loop
 *
 * This system:
 * - Updates BVH structures for dynamic meshes
 * - Performs frustum culling using BVH
 * - Monitors performance statistics
 */
export interface IBVHSystemState {
  enabled: boolean;
  scene: Scene | null;
  camera: Camera | null;
  lastStatsLog: number;
  statsLogInterval: number; // Log stats every N milliseconds
}

const state: IBVHSystemState = {
  enabled: true,
  scene: null,
  camera: null,
  lastStatsLog: 0,
  statsLogInterval: 10000, // Log stats every 10 seconds
};

/**
 * Initialize the BVH system with scene and camera references
 */
export const initBVHSystem = (scene: Scene, camera: Camera, processScene = false): void => {
  try {
    state.scene = scene;
    state.camera = camera;

    const bvhManager = getBVHManager({
      enableFrustumCulling: true,
      enableRaycastAcceleration: true,
      updateInterval: 1000,
      maxLeafTris: 10,
      strategy: 'SAH',
    });

    // Only process scene if explicitly requested (deferred by default)
    if (processScene && state.enabled) {
      logger.info('Processing scene for BVH (this may take a moment for large scenes)...');
      bvhManager.processScene(scene);
    }
  } catch (error) {
    logger.error('Failed to initialize BVH system', { error });
  }
};

/**
 * Update the BVH system
 * Should be called every frame from the game loop
 */
export const updateBVHSystem = (): void => {
  if (!state.enabled || !state.scene || !state.camera) {
    return;
  }

  try {
    const bvhManager = getBVHManager();

    // Update BVH structures
    bvhManager.update();

    // Perform frustum culling
    const stats = bvhManager.performFrustumCulling(state.scene, state.camera);

    // Periodic stats logging
    const now = performance.now();
    if (now - state.lastStatsLog > state.statsLogInterval) {
      state.lastStatsLog = now;

      if (stats.totalObjects > 0) {
        logger.debug('BVH culling stats', {
          total: stats.totalObjects,
          culled: stats.culledObjects,
          visible: stats.visibleObjects,
          cullingRatio: `${(stats.cullingRatio * 100).toFixed(1)}%`,
        });
      }
    }
  } catch (error) {
    logger.error('Error in BVH system update', { error });
    // Disable system on error to prevent cascading failures
    state.enabled = false;
  }
};

/**
 * Enable or disable the BVH system
 * When enabling for the first time, processes the scene
 */
export const setBVHSystemEnabled = (enabled: boolean): void => {
  const wasEnabled = state.enabled;
  state.enabled = enabled;

  // If enabling for the first time, process the scene
  if (enabled && !wasEnabled && state.scene && state.camera) {
    try {
      const bvhManager = getBVHManager();
      logger.info('Processing scene for BVH (first-time enable)...');
      bvhManager.processScene(state.scene);
      logger.info('BVH scene processing complete');
    } catch (error) {
      logger.error('Failed to process scene when enabling BVH', { error });
      state.enabled = false;
    }
  }
};

/**
 * Get current BVH system state
 */
export const getBVHSystemState = (): Readonly<IBVHSystemState> => {
  return { ...state };
};

/**
 * Register a new mesh with the BVH system
 * Useful for dynamically created meshes
 */
export const registerMeshWithBVH = (mesh: Mesh, id?: string): void => {
  const bvhManager = getBVHManager();
  bvhManager.registerMesh(mesh, id);
};

/**
 * Unregister a mesh from the BVH system
 * Should be called when a mesh is removed from the scene
 */
export const unregisterMeshFromBVH = (id: string): void => {
  const bvhManager = getBVHManager();
  bvhManager.unregisterMesh(id);
};

/**
 * Rebuild all BVH structures
 * Useful after significant scene changes
 */
export const rebuildBVH = (): void => {
  const bvhManager = getBVHManager();
  bvhManager.rebuildAll();
  logger.info('BVH rebuild triggered');
};

/**
 * Clean up BVH system resources
 */
export const disposeBVHSystem = (): void => {
  const bvhManager = getBVHManager();
  bvhManager.dispose();
  state.scene = null;
  state.camera = null;
};
