import { useCallback, useEffect, useState } from 'react';

import { componentManager } from '@/core/dynamic-components/init';
import { IMeshRendererData } from '@/editor/components/panels/InspectorPanel/MeshRenderer/MeshRendererSection';

/**
 * Hook to manage mesh renderer data for entities
 */
export const useMeshRenderer = (entityId: number | null) => {
  const [meshRenderer, setMeshRendererState] = useState<IMeshRendererData | null>(null);

  useEffect(() => {
    if (entityId == null) {
      setMeshRendererState(null);
      return;
    }

    const updateMeshRenderer = () => {
      const meshRendererData = componentManager.getComponentData(entityId, 'meshRenderer');
      setMeshRendererState(meshRendererData || null);
    };

    // Initial load
    updateMeshRenderer();

    // Listen for component changes
    const handleComponentChange = (event: any) => {
      if (event.entityId === entityId && event.componentId === 'meshRenderer') {
        updateMeshRenderer();
      }
    };

    componentManager.addEventListener(handleComponentChange);

    return () => {
      componentManager.removeEventListener(handleComponentChange);
    };
  }, [entityId]);

  const setMeshRenderer = useCallback(
    async (data: IMeshRendererData | null) => {
      if (entityId == null) return;

      if (data === null) {
        // Remove the component
        const result = await componentManager.removeComponent(entityId, 'meshRenderer');
        if (result.valid) {
          setMeshRendererState(null);
        } else {
          console.warn('[useMeshRenderer] Failed to remove mesh renderer:', result.errors);
        }
      } else {
        // Add or update the component
        const hasComponent = componentManager.hasComponent(entityId, 'meshRenderer');

        if (hasComponent) {
          const result = await componentManager.updateComponent(entityId, 'meshRenderer', data);
          if (result.valid) {
            setMeshRendererState(data);
          } else {
            console.warn('[useMeshRenderer] Failed to update mesh renderer:', result.errors);
          }
        } else {
          const result = await componentManager.addComponent(entityId, 'meshRenderer', data);
          if (result.valid) {
            setMeshRendererState(data);
          } else {
            console.warn('[useMeshRenderer] Failed to add mesh renderer:', result.errors);
          }
        }
      }
    },
    [entityId],
  );

  return {
    meshRenderer,
    setMeshRenderer,
  };
};
