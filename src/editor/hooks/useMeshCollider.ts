import { useCallback, useEffect, useState } from 'react';

import { KnownComponentTypes } from '@/editor/lib/ecs/IComponent';
import { IMeshColliderData } from '@/editor/lib/ecs/components/MeshColliderComponent';

import { useComponentManager } from './useComponentManager';

/**
 * Hook to manage mesh collider data for entities
 */
export const useMeshCollider = (entityId: number | null) => {
  const componentManager = useComponentManager();
  const [meshCollider, setMeshColliderState] = useState<IMeshColliderData | null>(null);

  // Load mesh collider data when entity changes
  useEffect(() => {
    if (entityId === null) {
      setMeshColliderState(null);
      return;
    }

    const meshColliderComponent = componentManager.getMeshColliderComponent(entityId);
    if (meshColliderComponent?.data) {
      setMeshColliderState(meshColliderComponent.data);
    } else {
      setMeshColliderState(null);
    }
  }, [entityId, componentManager]);

  const setMeshCollider = useCallback(
    (newMeshCollider: IMeshColliderData | null) => {
      if (entityId === null) return;

      if (newMeshCollider === null) {
        // Remove component
        componentManager.removeComponent(entityId, KnownComponentTypes.MESH_COLLIDER);
        setMeshColliderState(null);
      } else {
        // Add or update component
        componentManager.addComponent(entityId, KnownComponentTypes.MESH_COLLIDER, newMeshCollider);
        setMeshColliderState(newMeshCollider);
      }
    },
    [entityId, componentManager],
  );

  return {
    meshCollider,
    setMeshCollider,
  };
};
