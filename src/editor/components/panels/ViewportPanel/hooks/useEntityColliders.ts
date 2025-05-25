import { useMemo } from 'react';

import type { IMeshColliderData } from '@/editor/components/panels/InspectorPanel/MeshCollider/MeshColliderSection';

interface IUseEntityCollidersProps {
  meshCollider: { data: any } | null | undefined;
  meshType: string;
}

export const useEntityColliders = ({ meshCollider, meshType }: IUseEntityCollidersProps) => {
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

  // Memoized collider configuration data
  const colliderConfig = useMemo(() => {
    const meshColliderData = meshCollider?.data as IMeshColliderData | undefined;
    if (!meshColliderData || !meshColliderData.enabled) {
      return null;
    }

    return {
      type: meshColliderData.colliderType,
      center: meshColliderData.center ?? [0, 0, 0],
      isTrigger: meshColliderData.isTrigger,
      size: meshColliderData.size,
    };
  }, [meshCollider?.data]);

  return {
    colliderType,
    colliderConfig,
    hasCustomColliders: !!colliderConfig,
  };
};
