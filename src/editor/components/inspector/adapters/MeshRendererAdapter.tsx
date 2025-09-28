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

export const MeshRendererAdapter: React.FC<IMeshRendererAdapterProps> = ({
  meshRendererComponent,
  updateComponent,
  removeComponent,
  isPlaying,
}) => {
  const data = meshRendererComponent?.data;

  if (!data) return null;

  // Convert ECS data to the format expected by MeshRendererSection
  const meshRendererData = {
    meshId: data.meshId || 'cube',
    materialId: data.materialId || 'default',
    enabled: data.enabled ?? true,
    castShadows: data.castShadows ?? true,
    receiveShadows: data.receiveShadows ?? true,
    // Only include material overrides if they exist
    material: data.material ? {
      color: data.material.color,
      metalness: data.material.metalness,
      roughness: data.material.roughness,
    } : undefined,
  };

  const handleUpdate = (newData: MeshRendererData | null) => {
    if (newData === null) {
      // Remove component
      if (removeComponent) {
        removeComponent(KnownComponentTypes.MESH_RENDERER);
      }
    } else {
      // Update component
      updateComponent(KnownComponentTypes.MESH_RENDERER, newData);
    }
  };

  return (
    <MeshRendererSection
      meshRenderer={meshRendererData}
      setMeshRenderer={handleUpdate as (data: any) => void}
      isPlaying={isPlaying}
    />
  );
};
