import React from 'react';

interface IUseEntityRenderingProps {
  isFollowedEntity: boolean;
  isPlaying: boolean;
  meshType: string | null;
  entityId: number;
  isPrimarySelection: boolean;
  shouldHavePhysics: boolean;
}

export function useEntityRendering({
  isFollowedEntity,
  isPlaying,
  meshType,
  entityId,
  isPrimarySelection,
  shouldHavePhysics,
}: IUseEntityRenderingProps) {
  // Hide mesh rendering when this entity is being followed in play mode (first-person view)
  const shouldHideMesh = isFollowedEntity && isPlaying;

  // Debug logging for custom models
  React.useEffect(() => {
    if (meshType === 'custom') {
      console.debug('Custom model debug:', {
        entityId,
        meshType,
        isPrimarySelection,
        shouldHavePhysics,
        willRenderGizmo: isPrimarySelection && !shouldHavePhysics,
      });
    }
  }, [meshType, entityId, isPrimarySelection, shouldHavePhysics]);

  const shouldShowGizmo = React.useMemo(() => {
    // Show gizmo for primary selection when not in play mode and no physics
    // This should work for all entity types including cameras
    const result = isPrimarySelection && !shouldHavePhysics && !isPlaying;

    // Debug logging for cameras specifically
    if (meshType === 'Camera') {
      console.log('Camera gizmo logic:', {
        entityId,
        meshType,
        isPrimarySelection,
        shouldHavePhysics,
        isPlaying,
        willShowGizmo: result,
      });
    }

    return result;
  }, [isPrimarySelection, shouldHavePhysics, isPlaying, entityId, meshType]);

  return {
    shouldHideMesh,
    shouldShowGizmo,
  };
}
