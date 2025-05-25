import React from 'react';

import { MeshRendererSection } from '@/editor/components/panels/InspectorPanel/MeshRenderer/MeshRendererSection';
import { useEntityData } from '@/editor/hooks/useEntityData';
import { KnownComponentTypes } from '@/editor/lib/ecs/IComponent';

interface IMeshRendererAdapterProps {
  meshRendererComponent: any;
  updateComponent: (type: string, data: any) => boolean;
  isPlaying: boolean;
  entityId: number;
}

export const MeshRendererAdapter: React.FC<IMeshRendererAdapterProps> = ({
  meshRendererComponent,
  updateComponent,
  isPlaying,
  entityId,
}) => {
  const data = meshRendererComponent?.data;
  const { getComponentData, updateComponentData } = useEntityData();

  if (!data) return null;

  // Get color from old material component if MeshRenderer doesn't have it
  const getColorFromOldMaterial = () => {
    const materialData = getComponentData(entityId, 'material') as any;
    if (materialData?.color) {
      if (Array.isArray(materialData.color)) {
        // Convert RGB array to hex
        const [r, g, b] = materialData.color;
        return `#${Math.round(r * 255)
          .toString(16)
          .padStart(2, '0')}${Math.round(g * 255)
          .toString(16)
          .padStart(2, '0')}${Math.round(b * 255)
          .toString(16)
          .padStart(2, '0')}`;
      } else if (typeof materialData.color === 'string') {
        return materialData.color;
      }
    }
    return '#3399ff'; // Default blue like old ECS system
  };

  // Convert ECS data to the format expected by MeshRendererSection
  const meshRendererData = {
    enabled: data.enabled ?? true,
    castShadows: data.castShadows ?? true,
    receiveShadows: data.receiveShadows ?? true,
    material: {
      color: data.material?.color || data.color || getColorFromOldMaterial(),
      metalness: data.material?.metalness || data.metalness || 0.0,
      roughness: data.material?.roughness || data.roughness || 0.5,
      emissive: data.material?.emissive || data.emissive || '#000000',
      emissiveIntensity: data.material?.emissiveIntensity || data.emissiveIntensity || 0.0,
    },
  };

  const handleUpdate = (newData: any) => {
    updateComponent(KnownComponentTypes.MESH_RENDERER, newData);

    // Sync color changes to the old material component for viewport compatibility
    if (newData.material?.color) {
      const color = newData.material.color;
      // Convert hex to RGB array for old material component
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;

      updateComponentData(entityId, 'material', { color: [r, g, b] });
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
