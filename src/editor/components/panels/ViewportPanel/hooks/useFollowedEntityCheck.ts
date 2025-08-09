import { useCallback, useEffect, useState } from 'react';

import { useEvent } from '@/core/hooks/useEvent';
import { CameraData } from '@/core/lib/ecs/components/definitions/CameraComponent';
import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { useComponentRegistry } from '@/core/hooks/useComponentRegistry';

/**
 * Hook to check if an entity is being followed by the main camera
 * Returns true if the entity should be hidden during play mode (first-person view)
 */
export const useFollowedEntityCheck = (entityId: number, isPlaying: boolean) => {
  const [isFollowedEntity, setIsFollowedEntity] = useState(false);
  const { getComponentData, getEntitiesWithComponent } = useComponentRegistry();

  const checkIfFollowed = useCallback(() => {
    if (!isPlaying) {
      setIsFollowedEntity(false);
      return;
    }

    try {
      // Get all camera entities
      const cameraEntities = getEntitiesWithComponent(KnownComponentTypes.CAMERA);

      for (const cameraEntityId of cameraEntities) {
        const cameraComponent = getComponentData(cameraEntityId, KnownComponentTypes.CAMERA);
        const cameraData = cameraComponent as CameraData | undefined;

        // Check if this camera is main, has following enabled, and targets our entity
        if (
          cameraData?.isMain &&
          cameraData?.enableSmoothing &&
          cameraData?.followTarget === entityId
        ) {
          // ONLY hide mesh if it's a first-person setup (camera offset near zero)
          const offset = cameraData.followOffset || { x: 0, y: 0, z: 0 };
          const isFirstPerson =
            Math.abs(offset.x) < 0.5 && Math.abs(offset.y) < 0.5 && Math.abs(offset.z) < 0.5;

          setIsFollowedEntity(isFirstPerson);
          return;
        }
      }

      setIsFollowedEntity(false);
    } catch (error) {
      console.error('[useFollowedEntityCheck] Error checking follow status:', error);
      setIsFollowedEntity(false);
    }
  }, [entityId, isPlaying, getComponentData, getEntitiesWithComponent]);

  // Check on mount and when dependencies change
  useEffect(() => {
    checkIfFollowed();
  }, [checkIfFollowed]);

  // Listen for camera component updates using the global event system
  useEvent('component:updated', (event) => {
    if (event.componentId === KnownComponentTypes.CAMERA) {
      checkIfFollowed();
    }
  });

  useEvent('component:added', (event) => {
    if (event.componentId === KnownComponentTypes.CAMERA) {
      checkIfFollowed();
    }
  });

  useEvent('component:removed', (event) => {
    if (event.componentId === KnownComponentTypes.CAMERA) {
      checkIfFollowed();
    }
  });

  return isFollowedEntity;
};
