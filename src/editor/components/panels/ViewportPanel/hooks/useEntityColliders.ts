import { useMemo } from 'react';

import type { IMeshColliderData } from '@/editor/components/panels/InspectorPanel/MeshCollider/MeshColliderSection';

interface IUseEntityCollidersProps {
  meshCollider: { data: unknown } | null | undefined;
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
        case 'heightfield':
          // Heightfield is not a valid automatic collider shape for RigidBody.colliders.
          // Use trimesh automatic collider and rely on the terrain mesh geometry instead.
          return 'trimesh';
        default:
          return 'cuboid';
      }
    }

    // Fallback to auto-detection based on mesh type
    switch (meshType) {
      case 'Terrain':
        // Use trimesh auto-collider for terrain (heightfield component may not be available)
        return 'trimesh';
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

    const base = {
      type: meshColliderData.colliderType,
      center: meshColliderData.center ?? [0, 0, 0],
      isTrigger: meshColliderData.isTrigger,
      size: meshColliderData.size,
    } as any;

    // For heightfield, we need to pass the terrain data
    if (meshColliderData.colliderType === 'heightfield') {
      // Pull terrain from entityComponents is not available here; this hook only has meshCollider.
      // So TerrainHeightfield will be provided via fallback path in EntityRenderer when meshType is Terrain.
      // Keep base structure; EntityRenderer will inject terrain details where needed.
    }

    return base;
  }, [meshCollider?.data]);

  return {
    colliderType,
    colliderConfig,
    hasCustomColliders: !!colliderConfig,
  };
};
