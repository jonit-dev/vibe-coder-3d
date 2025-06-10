import { useFrame, useThree } from '@react-three/fiber';
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { CameraData } from '@/core/lib/ecs/components/definitions/CameraComponent';
import { ITransformData } from '@/core/lib/ecs/components/TransformComponent';
import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { registerEntityObject, unregisterEntityObject } from '@/core/systems/cameraSystem';
import { useComponentManager } from '@/editor/hooks/useComponentManager';

export interface IGameCameraManagerProps {
  isPlaying: boolean;
}

/**
 * Game Camera Manager
 *
 * Handles the Unity-like behavior where:
 * - During Editor Mode: Uses the standard OrbitControls camera for scene navigation
 * - During Play Mode: Switches to ECS Camera entities to render what the player sees
 *
 * This component manages camera switching by replacing the main Three.js camera
 * when entering/exiting play mode, just like Unity does.
 */
export const GameCameraManager: React.FC<IGameCameraManagerProps> = ({ isPlaying }) => {
  const componentManager = useComponentManager();
  const { set, camera } = useThree();

  // Store original camera for restoration when exiting play mode
  const originalCameraRef = useRef<THREE.Camera | null>(null);
  const hasSetOriginalCamera = useRef(false);

  // Get all entities with Camera components
  const cameraEntities = useMemo(() => {
    if (!isPlaying) return [];

    const entities = componentManager.getEntitiesWithComponent(KnownComponentTypes.CAMERA);

    return entities
      .map((entityId) => {
        const cameraComponent = componentManager.getComponent(entityId, KnownComponentTypes.CAMERA);
        const transformComponent = componentManager.getComponent(
          entityId,
          KnownComponentTypes.TRANSFORM,
        );

        const cameraData = cameraComponent?.data as CameraData | undefined;
        const transformData = transformComponent?.data as ITransformData | undefined;

        return {
          entityId,
          cameraData,
          transformData,
          isValid: cameraData && transformData,
        };
      })
      .filter((entity) => entity.isValid);
  }, [componentManager, isPlaying]);

  // Find the main camera or use the first available camera
  const mainCamera = useMemo(() => {
    if (cameraEntities.length === 0) {
      console.log('[GameCameraManager] No camera entities found');
      return null;
    }

    // Try to find a camera marked as main
    const mainCam = cameraEntities.find((entity) => entity.cameraData?.isMain);

    if (mainCam) {
      console.log('[GameCameraManager] Found main camera:', mainCam.entityId);
    } else {
      console.log('[GameCameraManager] No main camera found, using first available');
    }

    // Otherwise use the first camera
    return mainCam || cameraEntities[0];
  }, [cameraEntities]);

  // Track if we've already switched cameras for this play session
  const currentPlayState = useRef<boolean>(false);
  const currentCameraEntityId = useRef<number | null>(null);

  // Store the current game camera for updates
  const currentGameCamera = useRef<THREE.Camera | null>(null);

  // Handle camera switching when play mode starts/stops
  useEffect(() => {
    // Store original camera only once when we first encounter it
    if (!hasSetOriginalCamera.current && !isPlaying) {
      originalCameraRef.current = camera;
      hasSetOriginalCamera.current = true;
    }

    // Check if play state actually changed
    if (currentPlayState.current === isPlaying) {
      // Also check if camera entity changed
      const newCameraEntityId = mainCamera?.entityId || null;
      if (currentCameraEntityId.current === newCameraEntityId) {
        return; // No change, skip
      }
      currentCameraEntityId.current = newCameraEntityId;
    } else {
      currentPlayState.current = isPlaying;
      currentCameraEntityId.current = mainCamera?.entityId || null;
    }

    if (!isPlaying) {
      // Restore original editor camera when exiting play mode
      if (originalCameraRef.current && hasSetOriginalCamera.current) {
        set({ camera: originalCameraRef.current as any });
        console.log('[GameCameraManager] Restored editor camera');
      }
      return;
    }

    if (!mainCamera || !mainCamera.cameraData || !mainCamera.transformData) {
      console.warn('[GameCameraManager] No valid main camera found for play mode');
      return;
    }

    const { cameraData, transformData } = mainCamera;

    // Create new camera based on projection type
    let gameCamera: THREE.PerspectiveCamera | THREE.OrthographicCamera;

    if (cameraData.projectionType === 'orthographic') {
      const size = cameraData.orthographicSize || 10;
      const aspect = window.innerWidth / window.innerHeight;
      gameCamera = new THREE.OrthographicCamera(
        -size * aspect,
        size * aspect,
        size,
        -size,
        cameraData.near || 0.3,
        cameraData.far || 1000,
      );
    } else {
      gameCamera = new THREE.PerspectiveCamera(
        cameraData.fov || 60,
        window.innerWidth / window.innerHeight,
        cameraData.near || 0.3,
        cameraData.far || 1000,
      );
    }

    // Set camera position and rotation based on transform
    const position = transformData.position || [0, 1, -10];
    const rotation = transformData.rotation || [0, 0, 0];

    gameCamera.position.set(position[0], position[1], position[2]);
    gameCamera.rotation.set(
      (rotation[0] * Math.PI) / 180,
      (rotation[1] * Math.PI) / 180,
      (rotation[2] * Math.PI) / 180,
    );

    // Apply camera properties from ECS data
    if (gameCamera instanceof THREE.PerspectiveCamera) {
      gameCamera.fov = cameraData.fov;
      gameCamera.near = cameraData.near;
      gameCamera.far = cameraData.far;
      gameCamera.updateProjectionMatrix();
    } else if (gameCamera instanceof THREE.OrthographicCamera) {
      const size = cameraData.orthographicSize;
      const aspect = size * (window.innerWidth / window.innerHeight);
      gameCamera.left = -aspect;
      gameCamera.right = aspect;
      gameCamera.top = size;
      gameCamera.bottom = -size;
      gameCamera.near = cameraData.near;
      gameCamera.far = cameraData.far;
      gameCamera.updateProjectionMatrix();
    }

    // Camera direction is now controlled by Transform component rotation
    // No more lookAt target - Unity-style behavior

    // Store reference for frame updates
    currentGameCamera.current = gameCamera;

    // Register the camera with the camera system for transform updates
    registerEntityObject(mainCamera.entityId, gameCamera);

    // Replace the main Three.js camera with our game camera
    set({ camera: gameCamera as any });

    console.log(`[GameCameraManager] Switched to game camera (Entity ${mainCamera.entityId})`);

    // Cleanup function to unregister camera when switching back
    return () => {
      if (mainCamera?.entityId !== undefined) {
        unregisterEntityObject(mainCamera.entityId);
      }
      currentGameCamera.current = null;
    };
  }, [isPlaying, mainCamera]); // Removed 'set' and 'camera' from deps to prevent infinite loop

  // Continuously sync camera position with ECS transform during play mode
  useFrame(() => {
    if (!isPlaying || !mainCamera || !currentGameCamera.current) {
      return;
    }

    // Get latest camera transform data
    const cameraTransformComponent = componentManager.getComponent(
      mainCamera.entityId,
      KnownComponentTypes.TRANSFORM,
    );
    const cameraTransformData = cameraTransformComponent?.data as ITransformData | undefined;

    // Get camera data to check for follow target
    const cameraData = mainCamera.cameraData;

    if (!cameraTransformData) return;

    const camera = currentGameCamera.current;

    // Check if camera controls are in free mode
    const controlMode = (cameraData as any)?.controlMode ?? 'free';
    const isFreeMode = controlMode === 'free';
    const hasFollowTarget = cameraData?.enableSmoothing && cameraData?.followTarget;

    // Debug: Log the camera behavior strategy (only occasionally to avoid spam)
    if (Math.random() < 0.02) {
      // 2% chance per frame
      console.log('[GameCameraManager] Camera behavior:', {
        controlMode,
        enableSmoothing: cameraData?.enableSmoothing,
        followTarget: cameraData?.followTarget,
        hasFollowTarget,
        strategy:
          isFreeMode && hasFollowTarget
            ? 'Free+Follow'
            : isFreeMode && !hasFollowTarget
              ? 'Free+Static'
              : !isFreeMode && hasFollowTarget
                ? 'Locked+Follow'
                : 'Locked+Static',
      });
    }

    if (!isFreeMode || !hasFollowTarget) {
      // Update camera position if:
      // 1. Not in free mode (locked mode should respect ECS position), OR
      // 2. In free mode but no follow target (use ECS position as base)
      const position = cameraTransformData.position || [0, 1, -10];
      camera.position.set(position[0], position[1], position[2]);
    }
    // In free mode WITH follow target: let CameraFollowManager handle position updates
    // and OrbitControls can modify on top of that

    // Handle camera rotation/lookAt
    if (hasFollowTarget) {
      // Get target entity transform
      const targetTransformComponent = componentManager.getComponent(
        cameraData.followTarget!,
        KnownComponentTypes.TRANSFORM,
      );
      const targetTransformData = targetTransformComponent?.data as ITransformData | undefined;

      if (targetTransformData && !isFreeMode) {
        // Only force lookAt in locked mode; free mode allows orbit controls to handle rotation
        const targetPosition = targetTransformData.position || [0, 0, 0];
        camera.lookAt(targetPosition[0], targetPosition[1], targetPosition[2]);
      }
    } else if (!isFreeMode) {
      // No follow target and not in free mode, use rotation from transform
      const rotation = cameraTransformData.rotation || [0, 0, 0];

      // For first person cameras, we need to set the rotation order correctly
      camera.rotation.order = 'YXZ'; // Yaw-Pitch-Roll order for first person
      camera.rotation.set(
        (rotation[0] * Math.PI) / 180, // Pitch (X)
        (rotation[1] * Math.PI) / 180, // Yaw (Y)
        (rotation[2] * Math.PI) / 180, // Roll (Z)
      );
    }

    // Force matrix update
    camera.updateMatrixWorld();
  });

  // This component doesn't render anything - it just manages camera switching
  return null;
};
