import React from 'react';

import { IComponent, KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { MeshRendererData } from '@/core/lib/ecs/components/definitions/MeshRendererComponent';
import { MeshRendererSection } from '@/editor/components/panels/InspectorPanel/MeshRenderer/MeshRendererSection';

export interface IMeshRendererAdapterProps {
  meshRendererComponent: IComponent<MeshRendererData> | null;
  updateComponent: (type: string, data: MeshRendererData) => void;
  removeComponent?: (type: string) => void;
  isPlaying: boolean;
}

export const MeshRendererAdapter: React.FC<IMeshRendererAdapterProps> = React.memo(
  ({ meshRendererComponent, updateComponent, removeComponent, isPlaying }) => {
    const data = meshRendererComponent?.data;

    // Memoize the converted data to prevent unnecessary re-renders
    const meshRendererData = React.useMemo(() => {
      if (!data) return null;

      return {
        meshId: data.meshId || 'cube',
        materialId: data.materialId || 'default',
        enabled: data.enabled ?? true,
        castShadows: data.castShadows ?? true,
        receiveShadows: data.receiveShadows ?? true,
        // Only include material overrides if they exist
        material: data.material
          ? {
              color: data.material.color,
              metalness: data.material.metalness,
              roughness: data.material.roughness,
            }
          : undefined,
      };
    }, [data]);

    const handleUpdate = React.useCallback(
      (newData: MeshRendererData | null) => {
        if (newData === null) {
          // Remove component
          if (removeComponent) {
            removeComponent(KnownComponentTypes.MESH_RENDERER);
          }
        } else {
          // Update component
          updateComponent(KnownComponentTypes.MESH_RENDERER, newData);
        }
      },
      [removeComponent, updateComponent],
    );

    if (!meshRendererData) return null;

    return (
      <MeshRendererSection
        meshRenderer={meshRendererData}
        setMeshRenderer={handleUpdate as (data: any) => void}
        isPlaying={isPlaying}
      />
    );
  },
);
