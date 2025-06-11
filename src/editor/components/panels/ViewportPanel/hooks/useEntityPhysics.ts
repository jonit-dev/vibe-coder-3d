import { useMemo } from 'react';

import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import type { IMeshColliderData } from '@/editor/components/panels/InspectorPanel/MeshCollider/MeshColliderSection';
import { useComponentManager } from '@/editor/hooks/useComponentManager';

interface IPhysicsContributions {
  enabled: boolean;
  [key: string]: unknown;
}

export interface IUseEntityPhysicsProps {
  entityId: number;
  meshType: string;
  isPlaying: boolean;
  physicsContributions: IPhysicsContributions;
}

export const useEntityPhysics = ({
  entityId,
  meshType,
  isPlaying,
  physicsContributions,
}: IUseEntityPhysicsProps) => {
  const componentManager = useComponentManager();

  // Get individual component data when needed for specific logic
  const meshCollider = componentManager.getComponent(entityId, KnownComponentTypes.MESH_COLLIDER);

  // Check if this entity should have physics
  const shouldHavePhysics = useMemo(
    () => isPlaying && physicsContributions.enabled,
    [isPlaying, physicsContributions.enabled],
  );

  // Memoized collider type calculation
  const colliderType = useMemo(() => {
    const meshColliderData = meshCollider?.data as IMeshColliderData | undefined;
    if (meshColliderData && meshColliderData.enabled) {
      switch (meshColliderData.colliderType) {
        case 'box':
          return 'cuboid';
        case 'sphere':
          return 'ball';
        case 'capsule':
          return 'hull';
        case 'convex':
          return 'hull';
        case 'mesh':
          return 'trimesh';
        default:
          return 'cuboid';
      }
    }

    // Fallback to auto-detection based on mesh type
    switch (meshType) {
      case 'Sphere':
        return 'ball';
      case 'Cylinder':
        return 'hull';
      case 'Cone':
        return 'hull';
      case 'Torus':
        return 'hull';
      case 'Plane':
        return 'cuboid';
      default:
        return 'cuboid';
    }
  }, [meshCollider?.data, meshType]);

  return {
    meshCollider,
    shouldHavePhysics,
    colliderType,
  };
};
