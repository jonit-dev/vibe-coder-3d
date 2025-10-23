/**
 * Query API implementation
 * Provides scripts with entity and scene queries
 */

import * as THREE from 'three';

import { TagManager } from '@/core/lib/ecs/tags/TagManager';
import { EntityMetadataManager } from '@/core/lib/ecs/metadata/EntityMetadataManager';
import { Logger } from '@/core/lib/logger';

import type { IQueryAPI } from '../ScriptAPI';

const logger = Logger.create('QueryAPI');

/**
 * Creates a query API for scripts
 */
export const createQueryAPI = (
  _entityId: number,
  getScene: () => THREE.Scene | null,
): IQueryAPI => {
  const tagManager = TagManager.getInstance();
  const metadataManager = EntityMetadataManager.getInstance();

  return {
    findByTag: (tag: string): number[] => {
      logger.debug(`Finding entities by tag: ${tag}`);
      return tagManager.findByTag(tag);
    },

    findByName: (name: string): number[] => {
      logger.debug(`Finding entities by name: ${name}`);
      return metadataManager.findByName(name);
    },

    raycastFirst: (
      origin: [number, number, number],
      dir: [number, number, number],
    ): unknown | null => {
      const scene = getScene();
      if (!scene) {
        logger.warn('Cannot raycast: scene not available');
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
        logger.warn('Cannot raycast: scene not available');
        return [];
      }

      const raycaster = new THREE.Raycaster();
      raycaster.set(new THREE.Vector3(...origin), new THREE.Vector3(...dir).normalize());

      return raycaster.intersectObjects(scene.children, true);
    },
  };
};
