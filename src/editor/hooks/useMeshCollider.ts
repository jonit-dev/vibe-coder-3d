import { useCallback, useMemo } from 'react';

import { IMeshColliderData } from '@/editor/components/panels/InspectorPanel/MeshCollider/MeshColliderSection';
import { useEditorStore } from '@/editor/store/editorStore';

/**
 * Hook to manage mesh collider data for entities
 */
export const useMeshCollider = (entityId: number | null) => {
  const meshColliders = useEditorStore((state) => state.meshColliders);
  const setEntityMeshCollider = useEditorStore((state) => state.setEntityMeshCollider);

  const meshCollider = useMemo(() => {
    if (entityId == null) return null;
    return meshColliders[entityId] || null;
  }, [entityId, meshColliders]);

  const setMeshCollider = useCallback(
    (data: IMeshColliderData | null) => {
      if (entityId != null) {
        setEntityMeshCollider(entityId, data);
      }
    },
    [entityId, setEntityMeshCollider],
  );

  return {
    meshCollider,
    setMeshCollider,
  };
};
