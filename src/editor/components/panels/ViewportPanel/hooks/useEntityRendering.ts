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

  const shouldShowGizmo = React.useMemo(
    () => isPrimarySelection && !shouldHavePhysics,
    [isPrimarySelection, shouldHavePhysics],
  );

  return {
    shouldHideMesh,
    shouldShowGizmo,
  };
}
