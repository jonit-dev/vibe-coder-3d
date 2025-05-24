import { useCallback, useMemo } from 'react';

import { IRigidBodyData } from '@/editor/components/panels/InspectorPanel/RigidBody/RigidBodySection';
import { useEditorStore } from '@/editor/store/editorStore';

/**
 * Hook to manage rigid body data for entities
 */
export const useRigidBody = (entityId: number | null) => {
  const rigidBodies = useEditorStore((state) => state.rigidBodies);
  const setEntityRigidBody = useEditorStore((state) => state.setEntityRigidBody);

  const rigidBody = useMemo(() => {
    if (entityId == null) return null;
    return rigidBodies[entityId] || null;
  }, [entityId, rigidBodies]);

  const setRigidBody = useCallback(
    (data: IRigidBodyData | null) => {
      if (entityId != null) {
        setEntityRigidBody(entityId, data);
      }
    },
    [entityId, setEntityRigidBody],
  );

  return {
    rigidBody,
    setRigidBody,
  };
};
