/**
 * Query API implementation
 * Provides scripts with entity and scene queries
 */

import * as THREE from 'three';
import type { IQueryAPI } from '../ScriptAPI';
import { Logger } from '@/core/lib/logger';

const logger = Logger.create('QueryAPI');

/**
 * Creates a query API for scripts
 */
export const createQueryAPI = (entityId: number, getScene: () => THREE.Scene | null): IQueryAPI => {
  return {
    findByTag: (tag: string): number[] => {
      // TODO: Implement tag system integration
      // For now, return empty array
      logger.debug(`Finding entities by tag: ${tag}`, { entityId });
      logger.warn('Tag system not yet fully integrated');
      return [];
    },

    raycastFirst: (
      origin: [number, number, number],
      dir: [number, number, number],
    ): unknown | null => {
      const scene = getScene();
      if (!scene) {
        logger.warn('Cannot raycast: scene not available', { entityId });
        return null;
      }

      const raycaster = new THREE.Raycaster();
      raycaster.set(new THREE.Vector3(...origin), new THREE.Vector3(...dir).normalize());

      const intersections = raycaster.intersectObjects(scene.children, true);
      return intersections.length > 0 ? intersections[0] : null;
    },

    raycastAll: (origin: [number, number, number], dir: [number, number, number]): unknown[] => {
      const scene = getScene();
      if (!scene) {
        logger.warn('Cannot raycast: scene not available', { entityId });
        return [];
      }

      const raycaster = new THREE.Raycaster();
      raycaster.set(new THREE.Vector3(...origin), new THREE.Vector3(...dir).normalize());

      return raycaster.intersectObjects(scene.children, true);
    },
  };
};
