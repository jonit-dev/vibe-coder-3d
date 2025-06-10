import { OrbitControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useEvent } from '@/core/hooks/useEvent';
import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { CameraData } from '@/core/lib/ecs/components/definitions/CameraComponent';
import { ITransformData } from '@/core/lib/ecs/components/TransformComponent';

export interface ICameraControlsManagerProps {
  isPlaying: boolean;
  isTransforming: boolean;
}

/**
 * Camera Controls Manager
 *
 * Handles Unity-style camera controls during play mode:
 * - Locked mode: Camera cannot be moved or rotated
 * - Free mode: OrbitControls allow orbit, zoom, and pan
 */
export const CameraControlsManager: React.FC<ICameraControlsManagerProps> = ({
  isPlaying,
  isTransforming,
}) => {
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const orbitControlsRef = useRef<any>(null);

  // Find the main camera and get its control mode
  const findMainCameraData = useCallback(() => {
    if (!isPlaying) {
      return null;
    }

    // Use ComponentRegistry to get camera entities
    const cameraEntities = componentRegistry.getEntitiesWithComponent(KnownComponentTypes.CAMERA);

    for (const entityId of cameraEntities) {
      const cameraData = componentRegistry.getComponentData<CameraData>(
        entityId,
        KnownComponentTypes.CAMERA,
      );

      if (cameraData?.isMain) {
        return {
          entityId,
          cameraData,
        };
      }
    }

    // If no main camera found, use the first camera
    if (cameraEntities.length > 0) {
      const firstEntityId = cameraEntities[0];
      const cameraData = componentRegistry.getComponentData<CameraData>(
        firstEntityId,
        KnownComponentTypes.CAMERA,
      );

      if (cameraData) {
        return {
          entityId: firstEntityId,
          cameraData,
        };
      }
    }
    return null;
  }, [isPlaying, updateTrigger]);

  const mainCameraData = useMemo(() => findMainCameraData(), [findMainCameraData]);

  // Listen for camera component updates to refresh the camera data
  useEvent('component:updated', (event) => {
    if (event.componentId === KnownComponentTypes.CAMERA) {
      setUpdateTrigger((prev) => prev + 1);
    }
  });

  // Also refresh when entering play mode
  useEffect(() => {
    if (isPlaying) {
      setUpdateTrigger((prev) => prev + 1);
    }
  }, [isPlaying]);

  // Dynamically update OrbitControls target when follow target moves
  useFrame(() => {
    if (!isPlaying || !mainCameraData || !orbitControlsRef.current) {
      return;
    }

    const { cameraData } = mainCameraData;
    const controlMode = (cameraData as any).controlMode ?? 'free';

    // Update target in free mode with follow enabled (even when transforming)
    if (controlMode === 'free' && cameraData.enableSmoothing && cameraData.followTarget) {
      const targetTransform = componentRegistry.getComponentData<ITransformData>(
        cameraData.followTarget,
        KnownComponentTypes.TRANSFORM,
      );

      if (targetTransform?.position && orbitControlsRef.current.target) {
        const newTarget = [
          targetTransform.position[0] || 0,
          targetTransform.position[1] || 0,
          targetTransform.position[2] || 0,
        ];

        // Update OrbitControls target smoothly - this should work even when controls are disabled
        orbitControlsRef.current.target.lerp(
          { x: newTarget[0], y: newTarget[1], z: newTarget[2] },
          0.1, // Smooth lerp factor
        );

        // Force OrbitControls to update even when disabled
        orbitControlsRef.current.update();
      }
    }
  });

  // Don't render controls if not playing or no camera found
  if (!isPlaying || !mainCameraData) {
    return null;
  }

  const { cameraData } = mainCameraData;
  const controlMode = (cameraData as any).controlMode ?? 'free';

  // Only render OrbitControls if in free mode AND not transforming
  if (controlMode === 'free') {
    // Determine the target position for OrbitControls
    let targetPosition: [number, number, number] = [0, 0, 0];

    // If camera has a follow target, use its position
    if (cameraData.enableSmoothing && cameraData.followTarget) {
      const targetTransform = componentRegistry.getComponentData<ITransformData>(
        cameraData.followTarget,
        KnownComponentTypes.TRANSFORM,
      );

      if (targetTransform?.position) {
        targetPosition = [
          targetTransform.position[0] || 0,
          targetTransform.position[1] || 0,
          targetTransform.position[2] || 0,
        ];
      }
    }

    return (
      <OrbitControls
        ref={orbitControlsRef}
        enabled={!isTransforming} // Disable when transforming entities
        target={targetPosition}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        dampingFactor={0.05}
        enableDamping={true}
        minDistance={1}
        maxDistance={100}
        maxPolarAngle={Math.PI}
        minPolarAngle={0}
        key="play-controls" // Ensure different instances
      />
    );
  }

  // In locked mode, return null (no controls)
  return null;
};
