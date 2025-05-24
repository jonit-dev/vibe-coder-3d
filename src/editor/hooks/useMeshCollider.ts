import { useCallback, useEffect, useState } from 'react';

import { componentManager } from '@/core/dynamic-components/init';
import { IMeshColliderData } from '@/editor/components/panels/InspectorPanel/MeshCollider/MeshColliderSection';

/**
 * Hook to manage mesh collider data for entities
 */
export const useMeshCollider = (entityId: number | null) => {
  const [meshCollider, setMeshColliderState] = useState<IMeshColliderData | null>(null);

  useEffect(() => {
    if (entityId == null) {
      setMeshColliderState(null);
      return;
    }

    const updateMeshCollider = () => {
      const meshColliderData = componentManager.getComponentData(entityId, 'meshCollider');
      setMeshColliderState(meshColliderData || null);
    };

    // Initial load
    updateMeshCollider();

    // Listen for component changes
    const handleComponentChange = (event: any) => {
      if (event.entityId === entityId && event.componentId === 'meshCollider') {
        updateMeshCollider();
      }
    };

    componentManager.addEventListener(handleComponentChange);

    return () => {
      componentManager.removeEventListener(handleComponentChange);
    };
  }, [entityId]);

  const setMeshCollider = useCallback(
    async (data: IMeshColliderData | null) => {
      if (entityId == null) return;

      if (data === null) {
        // Remove the component
        const result = await componentManager.removeComponent(entityId, 'meshCollider');
        if (result.valid) {
          setMeshColliderState(null);
        } else {
          console.warn('[useMeshCollider] Failed to remove mesh collider:', result.errors);
        }
      } else {
        // Add or update the component
        const hasComponent = componentManager.hasComponent(entityId, 'meshCollider');

        if (hasComponent) {
          const result = await componentManager.updateComponent(entityId, 'meshCollider', data);
          if (result.valid) {
            setMeshColliderState(data);
          } else {
            console.warn('[useMeshCollider] Failed to update mesh collider:', result.errors);
          }
        } else {
          const result = await componentManager.addComponent(entityId, 'meshCollider', data);
          if (result.valid) {
            setMeshColliderState(data);
          } else {
            console.warn('[useMeshCollider] Failed to add mesh collider:', result.errors);
          }
        }
      }
    },
    [entityId],
  );

  return {
    meshCollider,
    setMeshCollider,
  };
};
