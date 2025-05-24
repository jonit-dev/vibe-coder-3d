import { useCallback, useEffect, useState } from 'react';

import { componentManager } from '@/core/dynamic-components/init';
import { IRigidBodyData } from '@/editor/components/panels/InspectorPanel/RigidBody/RigidBodySection';

/**
 * Hook to manage rigid body data for entities
 */
export const useRigidBody = (entityId: number | null) => {
  const [rigidBody, setRigidBodyState] = useState<IRigidBodyData | null>(null);

  useEffect(() => {
    if (entityId == null) {
      setRigidBodyState(null);
      return;
    }

    const updateRigidBody = () => {
      const rigidBodyData = componentManager.getComponentData(entityId, 'rigidBody');
      setRigidBodyState(rigidBodyData || null);
    };

    // Initial load
    updateRigidBody();

    // Listen for component changes
    const handleComponentChange = (event: any) => {
      if (event.entityId === entityId && event.componentId === 'rigidBody') {
        updateRigidBody();
      }
    };

    componentManager.addEventListener(handleComponentChange);

    return () => {
      componentManager.removeEventListener(handleComponentChange);
    };
  }, [entityId]);

  const setRigidBody = useCallback(
    async (data: IRigidBodyData | null) => {
      if (entityId == null) return;

      if (data === null) {
        // Remove the component
        const result = await componentManager.removeComponent(entityId, 'rigidBody');
        if (result.valid) {
          setRigidBodyState(null);
        } else {
          console.warn('[useRigidBody] Failed to remove rigid body:', result.errors);
        }
      } else {
        // Add or update the component
        const hasComponent = componentManager.hasComponent(entityId, 'rigidBody');

        if (hasComponent) {
          const result = await componentManager.updateComponent(entityId, 'rigidBody', data);
          if (result.valid) {
            setRigidBodyState(data);
          } else {
            console.warn('[useRigidBody] Failed to update rigid body:', result.errors);
          }
        } else {
          const result = await componentManager.addComponent(entityId, 'rigidBody', data);
          if (result.valid) {
            setRigidBodyState(data);
          } else {
            console.warn('[useRigidBody] Failed to add rigid body:', result.errors);
          }
        }
      }
    },
    [entityId],
  );

  return {
    rigidBody,
    setRigidBody,
  };
};
