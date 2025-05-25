import { useCallback, useEffect, useState } from 'react';

import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { IRigidBodyData } from '@/core/lib/ecs/components/RigidBodyComponent';

import { useComponentManager } from './useComponentManager';

/**
 * Hook to manage rigid body data for entities
 */
export const useRigidBody = (entityId: number | null) => {
  const componentManager = useComponentManager();
  const [rigidBody, setRigidBodyState] = useState<IRigidBodyData | null>(null);

  // Load rigid body data when entity changes
  useEffect(() => {
    if (entityId === null) {
      setRigidBodyState(null);
      return;
    }

    const rigidBodyComponent = componentManager.getRigidBodyComponent(entityId);
    if (rigidBodyComponent?.data) {
      setRigidBodyState(rigidBodyComponent.data);
    } else {
      setRigidBodyState(null);
    }
  }, [entityId, componentManager]);

  const setRigidBody = useCallback(
    (newRigidBody: IRigidBodyData | null) => {
      if (entityId === null) return;

      if (newRigidBody === null) {
        // Remove component
        componentManager.removeComponent(entityId, KnownComponentTypes.RIGID_BODY);
        setRigidBodyState(null);
      } else {
        // Add or update component
        componentManager.addComponent(entityId, KnownComponentTypes.RIGID_BODY, newRigidBody);
        setRigidBodyState(newRigidBody);
      }
    },
    [entityId, componentManager],
  );

  return {
    rigidBody,
    setRigidBody,
  };
};
