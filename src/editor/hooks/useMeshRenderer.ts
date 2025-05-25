import { useCallback, useEffect, useState } from 'react';

import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { IMeshRendererData } from '@/core/lib/ecs/components/MeshRendererComponent';

import { useComponentManager } from './useComponentManager';

/**
 * Hook to manage mesh renderer data for entities
 */
export const useMeshRenderer = (entityId: number | null) => {
  const componentManager = useComponentManager();
  const [meshRenderer, setMeshRendererState] = useState<IMeshRendererData | null>(null);

  // Load mesh renderer data when entity changes
  useEffect(() => {
    if (entityId === null) {
      setMeshRendererState(null);
      return;
    }

    const meshRendererComponent = componentManager.getMeshRendererComponent(entityId);
    if (meshRendererComponent?.data) {
      setMeshRendererState(meshRendererComponent.data);
    } else {
      setMeshRendererState(null);
    }
  }, [entityId, componentManager]);

  const setMeshRenderer = useCallback(
    (newMeshRenderer: IMeshRendererData | null) => {
      if (entityId === null) return;

      if (newMeshRenderer === null) {
        // Remove component
        componentManager.removeComponent(entityId, KnownComponentTypes.MESH_RENDERER);
        setMeshRendererState(null);
      } else {
        // Add or update component
        componentManager.addComponent(entityId, KnownComponentTypes.MESH_RENDERER, newMeshRenderer);
        setMeshRendererState(newMeshRenderer);
      }
    },
    [entityId, componentManager],
  );

  return {
    meshRenderer,
    setMeshRenderer,
  };
};
