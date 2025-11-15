import React from 'react';

import { IComponent, KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { MeshRendererData } from '@/core/lib/ecs/components/definitions/MeshRendererComponent';
import { IMeshRendererData } from '@/core/lib/ecs/components/MeshRendererComponent';
import { MeshRendererSection } from '@/editor/components/panels/InspectorPanel/MeshRenderer/MeshRendererSection';

export interface IMeshRendererAdapterProps {
  meshRendererComponent: IComponent<MeshRendererData> | null;
  updateComponent: (type: string, data: Partial<MeshRendererData>) => void;
  removeComponent?: (type: string) => void;
  isPlaying: boolean;
}

export const MeshRendererAdapter: React.FC<IMeshRendererAdapterProps> = React.memo(
  ({ meshRendererComponent, updateComponent, removeComponent, isPlaying }) => {
    const data = meshRendererComponent?.data;

    // Convert between the two MeshRendererData types safely
    const convertToIMeshRendererData = (data: MeshRendererData): IMeshRendererData => ({
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
    });

    // Convert from IMeshRendererData back to MeshRendererData for updates
    const convertFromIMeshRendererData = (data: IMeshRendererData | null): Partial<MeshRendererData> | null => {
      if (!data) return null;

      return {
        meshId: data.meshId,
        materialId: data.materialId,
        enabled: data.enabled ?? true,
        castShadows: data.castShadows ?? true,
        receiveShadows: data.receiveShadows ?? true,
        material: data.material ? {
          ...data.material,
          // Ensure required fields have defaults
          shader: data.material.shader ?? 'standard',
          materialType: data.material.materialType ?? 'solid',
          color: data.material.color ?? '#ffffff',
          metalness: data.material.metalness ?? 0,
          roughness: data.material.roughness ?? 1,
          emissive: data.material.emissive ?? '#000000',
          emissiveIntensity: data.material.emissiveIntensity ?? 0,
          normalScale: data.material.normalScale ?? 1,
          occlusionStrength: data.material.occlusionStrength ?? 1,
          textureOffsetX: data.material.textureOffsetX ?? 0,
          textureOffsetY: data.material.textureOffsetY ?? 0,
          textureRepeatX: data.material.textureRepeatX ?? 1,
          textureRepeatY: data.material.textureRepeatY ?? 1,
        } : undefined,
      };
    };

    // Memoize the converted data to prevent unnecessary re-renders
    const meshRendererData = React.useMemo(() => {
      if (!data) return null;
      return convertToIMeshRendererData(data);
    }, [data]);

    const handleUpdate = React.useCallback(
      (newData: IMeshRendererData | null) => {
        if (newData === null) {
          // Remove component
          if (removeComponent) {
            removeComponent(KnownComponentTypes.MESH_RENDERER);
          }
        } else {
          // Convert back to MeshRendererData before updating
          const convertedData = convertFromIMeshRendererData(newData);
          if (convertedData) {
            updateComponent(KnownComponentTypes.MESH_RENDERER, convertedData);
          }
        }
      },
      [removeComponent, updateComponent],
    );

    if (!meshRendererData) return null;

    return (
      <MeshRendererSection
        meshRenderer={meshRendererData}
        setMeshRenderer={handleUpdate}
        isPlaying={isPlaying}
      />
    );
  },
);
