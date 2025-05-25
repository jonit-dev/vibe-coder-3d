import React from 'react';

import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { MeshColliderSection } from '@/editor/components/panels/InspectorPanel/MeshCollider/MeshColliderSection';

interface IMeshColliderAdapterProps {
  meshColliderComponent: any;
  updateComponent: (type: string, data: any) => boolean;
  removeComponent?: (type: string) => boolean;
  isPlaying: boolean;
}

export const MeshColliderAdapter: React.FC<IMeshColliderAdapterProps> = ({
  meshColliderComponent,
  updateComponent,
  removeComponent,
  isPlaying,
}) => {
  const data = meshColliderComponent?.data;

  if (!data) return null;

  // Convert ECS data to the format expected by MeshColliderSection
  const meshColliderData = {
    enabled: data.enabled ?? true,
    colliderType: data.colliderType || 'box',
    isTrigger: data.isTrigger ?? false,
    center: data.center || [0, 0, 0],
    size: {
      width: data.size?.width || 1,
      height: data.size?.height || 1,
      depth: data.size?.depth || 1,
      radius: data.size?.radius || 0.5,
      capsuleRadius: data.size?.capsuleRadius || 0.5,
      capsuleHeight: data.size?.capsuleHeight || 2,
    },
    physicsMaterial: {
      friction: data.physicsMaterial?.friction || 0.7,
      restitution: data.physicsMaterial?.restitution || 0.3,
      density: data.physicsMaterial?.density || 1,
    },
  };

  const handleUpdate = (newData: any) => {
    if (newData === null) {
      // Remove component
      if (removeComponent) {
        removeComponent(KnownComponentTypes.MESH_COLLIDER);
      }
    } else {
      // Update component
      updateComponent(KnownComponentTypes.MESH_COLLIDER, newData);
    }
  };

  return (
    <MeshColliderSection
      meshCollider={meshColliderData}
      setMeshCollider={handleUpdate}
      isPlaying={isPlaying}
    />
  );
};
