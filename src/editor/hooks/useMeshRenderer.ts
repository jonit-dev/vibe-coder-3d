import { useCallback, useMemo } from 'react';

import { IMeshRendererData } from '@/editor/components/panels/InspectorPanel/MeshRenderer/MeshRendererSection';
import { useEditorStore } from '@/editor/store/editorStore';

/**
 * Hook to manage mesh renderer data for entities
 */
export const useMeshRenderer = (entityId: number | null) => {
  const meshRenderers = useEditorStore((state) => state.meshRenderers);
  const setEntityMeshRenderer = useEditorStore((state) => state.setEntityMeshRenderer);

  const meshRenderer = useMemo(() => {
    if (entityId == null) return null;
    return meshRenderers[entityId] || null;
  }, [entityId, meshRenderers]);

  const setMeshRenderer = useCallback(
    (data: IMeshRendererData | null) => {
      if (entityId != null) {
        setEntityMeshRenderer(entityId, data);
      }
    },
    [entityId, setEntityMeshRenderer],
  );

  return {
    meshRenderer,
    setMeshRenderer,
  };
};
