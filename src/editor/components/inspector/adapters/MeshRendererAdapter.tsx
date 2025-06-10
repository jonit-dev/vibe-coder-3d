import React from 'react';

import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { MeshRendererSection } from '@/editor/components/panels/InspectorPanel/MeshRenderer/MeshRendererSection';

export interface IMeshRendererAdapterProps {
  meshRendererComponent: any;
  updateComponent: (type: string, data: any) => void;
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
    material: {
      shader: data.material?.shader || 'standard',
      materialType: data.material?.materialType || 'solid',
      color: data.material?.color || '#cccccc',
      normalScale: data.material?.normalScale ?? 1,
      metalness: data.material?.metalness ?? 0.0,
      roughness: data.material?.roughness ?? 0.7,
      emissive: data.material?.emissive || '#000000',
      emissiveIntensity: data.material?.emissiveIntensity ?? 0.0,
      occlusionStrength: data.material?.occlusionStrength ?? 1.0,
      // Texture properties
      albedoTexture: data.material?.albedoTexture,
      normalTexture: data.material?.normalTexture,
      metallicTexture: data.material?.metallicTexture,
      roughnessTexture: data.material?.roughnessTexture,
      emissiveTexture: data.material?.emissiveTexture,
      occlusionTexture: data.material?.occlusionTexture,
    },
  };

  const handleUpdate = (newData: any) => {
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
      setMeshRenderer={handleUpdate}
      isPlaying={isPlaying}
    />
  );
};
