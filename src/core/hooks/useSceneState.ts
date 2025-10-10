import { addEntity } from 'bitecs';
import { useCallback, useEffect, useState } from 'react';

import { EntityId } from '../lib/ecs/types';
import { ECSWorld } from '../lib/ecs/World';
import { EntityQueries } from '../lib/ecs/queries/entityQueries';
import { useComponentRegistry } from './useComponentRegistry';
import { useEvent } from './useEvent';

/**
 * Hook for scene-level state management
 * Provides utilities for entity creation, deletion, and scene management
 */
export const useSceneState = () => {
  const componentRegistry = useComponentRegistry();
  const world = ECSWorld.getInstance().getWorld();
  const queries = EntityQueries.getInstance();

  const [entities, setEntities] = useState<EntityId[]>([]);

  // Update entities list using indexed queries (no O(N²) scans)
  const updateEntitiesList = useCallback(() => {
    const entityIds = queries.listAllEntities();
    setEntities(entityIds.sort((a, b) => a - b));
  }, [queries]);

  // Listen for component events to update entities list
  useEvent('component:added', () => {
    updateEntitiesList();
  });

  useEvent('component:removed', () => {
    updateEntitiesList();
  });

  // Update entities list on mount
  useEffect(() => {
    updateEntitiesList();
  }, [updateEntitiesList]);

  // Create a new entity with optional components
  const createEntity = useCallback(
    (components?: Array<{ type: string; data: unknown }>) => {
      const entityId = addEntity(world);

      // Add components if provided
      if (components) {
        components.forEach(({ type, data }) => {
          componentRegistry.addComponent(entityId, type, data);
        });
      }

      return entityId;
    },
    [world, componentRegistry],
  );

  // Create a basic entity with Transform
  const createBasicEntity = useCallback(() => {
    return createEntity([
      {
        type: 'Transform',
        data: {
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
      },
    ]);
  }, [createEntity]);

  // Create a mesh entity (Transform + MeshRenderer)
  const createMeshEntity = useCallback(
    (meshId?: string, materialColor?: string) => {
      return createEntity([
        {
          type: 'Transform',
          data: {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
        },
        {
          type: 'MeshRenderer',
          data: {
            meshId: meshId || 'cube',
            materialId: 'default',
            enabled: true,
            castShadows: true,
            receiveShadows: true,
            ...(materialColor
              ? {
                  material: {
                    color: materialColor,
                  },
                }
              : {}),
          },
        },
      ]);
    },
    [createEntity],
  );

  // Create a physics entity (Transform + MeshRenderer + RigidBody + MeshCollider)
  const createPhysicsEntity = useCallback(
    (meshId?: string, materialColor?: string) => {
      return createEntity([
        {
          type: 'Transform',
          data: {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
        },
        {
          type: 'MeshRenderer',
          data: {
            meshId: meshId || 'cube',
            materialId: 'default',
            enabled: true,
            castShadows: true,
            receiveShadows: true,
            ...(materialColor
              ? {
                  material: {
                    color: materialColor,
                  },
                }
              : {}),
          },
        },
        {
          type: 'RigidBody',
          data: {
            enabled: true,
            bodyType: 'dynamic',
            mass: 1,
            gravityScale: 1,
            canSleep: true,
            material: {
              friction: 0.5,
              restitution: 0.3,
              density: 1,
            },
          },
        },
        {
          type: 'MeshCollider',
          data: {
            enabled: true,
            isTrigger: false,
            colliderType: 'box',
            center: [0, 0, 0],
            size: {
              width: 1,
              height: 1,
              depth: 1,
              radius: 0.5,
              capsuleRadius: 0.5,
              capsuleHeight: 2,
            },
            physicsMaterial: {
              friction: 0.5,
              restitution: 0.3,
              density: 1,
            },
          },
        },
      ]);
    },
    [createEntity],
  );

  // Create a camera entity
  const createCameraEntity = useCallback(() => {
    return createEntity([
      {
        type: 'Transform',
        data: {
          position: [0, 0, 5],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
      },
      {
        type: 'Camera',
        data: {
          fov: 75,
          near: 0.1,
          far: 1000,
          projectionType: 'perspective',
          orthographicSize: 10,
          depth: 0,
          isMain: false,
        },
      },
    ]);
  }, [createEntity]);

  // Delete an entity and all its components
  const deleteEntity = useCallback(
    (entityId: EntityId) => {
      componentRegistry.removeComponentsForEntity(entityId);
      // Note: BitECS doesn't have a direct removeEntity method
      // The entity will be effectively "deleted" when it has no components
    },
    [componentRegistry],
  );

  // Get all entities with a specific component
  const getEntitiesWithComponent = useCallback(
    (componentId: string) => {
      return componentRegistry.getEntitiesWithComponent(componentId);
    },
    [componentRegistry],
  );

  // Get entity count by component type
  const getEntityStats = useCallback(() => {
    const stats: Record<string, number> = {};
    const componentTypes = componentRegistry.listComponents();

    componentTypes.forEach((componentId) => {
      stats[componentId] = componentRegistry.getEntitiesWithComponent(componentId).length;
    });

    return {
      totalEntities: entities.length,
      componentStats: stats,
    };
  }, [entities, componentRegistry]);

  return {
    // Entity list
    entities,

    // Entity creation
    createEntity,
    createBasicEntity,
    createMeshEntity,
    createPhysicsEntity,
    createCameraEntity,

    // Entity management
    deleteEntity,
    getEntitiesWithComponent,
    getEntityStats,

    // Utilities
    updateEntitiesList,
  };
};
