import { useFrame, useThree } from '@react-three/fiber';
import { defineQuery } from 'bitecs';
import React, { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';

import { useEvent } from '@/core/hooks/useEvent';
import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import { CameraData } from '@/core/lib/ecs/components/definitions/CameraComponent';
import { ITransformData } from '@/core/lib/ecs/components/TransformComponent';
import { ECSWorld } from '@/core/lib/ecs/World';

/**
 * Camera Follow Manager
 *
 * Event-driven component that handles smooth camera following behavior.
 * Updates camera transforms when target entities move or camera settings change.
 */
export const CameraFollowManager: React.FC = () => {
  const { invalidate } = useThree();
  const world = ECSWorld.getInstance().getWorld();

  // Store follow state for smooth interpolation
  const followStateRef = useRef<{
    targetPosition: THREE.Vector3;
    currentCameraPosition: THREE.Vector3;
    isFollowing: boolean;
    followTarget: number | null;
    smoothingSpeed: number;
    followOffset: { x: number; y: number; z: number };
    followingCamera: number | null;
  }>({
    targetPosition: new THREE.Vector3(),
    currentCameraPosition: new THREE.Vector3(),
    isFollowing: false,
    followTarget: null,
    smoothingSpeed: 2.0,
    followOffset: { x: 0, y: 5, z: -10 },
    followingCamera: null,
  });

  const updateCameraFollow = useCallback(() => {
    try {
      console.log('[CameraFollowManager] === Update Camera Follow ===');

      // Get camera components
      const cameraComponent = componentRegistry.getBitECSComponent('Camera');
      if (!cameraComponent) {
        console.log('[CameraFollowManager] Camera component not registered yet');
        return;
      }

      const transformComponent = componentRegistry.getBitECSComponent('Transform');
      if (!transformComponent) {
        console.log('[CameraFollowManager] Transform component not registered yet');
        return;
      }

      // Query camera entities
      const query = defineQuery([cameraComponent]);
      const cameraEntities = query(world);
      console.log('[CameraFollowManager] Found camera entities:', cameraEntities.length);

      // Find main camera with follow enabled
      let followingCamera: number | null = null;
      for (const eid of cameraEntities) {
        const cameraData = componentRegistry.getComponentData<CameraData>(eid, 'Camera');
        console.log(`[CameraFollowManager] Camera ${eid} data:`, {
          isMain: cameraData?.isMain,
          enableSmoothing: cameraData?.enableSmoothing,
          followTarget: cameraData?.followTarget,
        });

        if (cameraData?.isMain && cameraData?.enableSmoothing && cameraData?.followTarget) {
          followingCamera = eid;
          console.log(`[CameraFollowManager] Found following camera: ${eid}`);
          break;
        }
      }

      if (followingCamera === null) {
        console.log('[CameraFollowManager] No camera with follow enabled found');
        followStateRef.current.isFollowing = false;
        return;
      }

      // Get camera and target data
      const cameraData = componentRegistry.getComponentData<CameraData>(followingCamera, 'Camera');
      const cameraTransform = componentRegistry.getComponentData<ITransformData>(
        followingCamera,
        'Transform',
      );
      const targetTransform = componentRegistry.getComponentData<ITransformData>(
        cameraData!.followTarget!,
        'Transform',
      );

      if (!cameraData || !cameraTransform || !targetTransform) {
        console.warn('[CameraFollowManager] Missing required data for follow');
        return;
      }

      // Update follow state
      const state = followStateRef.current;
      state.isFollowing = true;
      state.followTarget = cameraData.followTarget!;
      state.followingCamera = followingCamera; // Store camera entity ID
      state.smoothingSpeed = cameraData.smoothingSpeed || 2.0;
      state.followOffset = cameraData.followOffset || { x: 0, y: 5, z: -10 };

      // Update target position (entity being followed)
      state.targetPosition.set(
        targetTransform.position?.[0] || 0,
        targetTransform.position?.[1] || 0,
        targetTransform.position?.[2] || 0,
      );

      // Update current camera position
      state.currentCameraPosition.set(
        cameraTransform.position?.[0] || 0,
        cameraTransform.position?.[1] || 0,
        cameraTransform.position?.[2] || 0,
      );

      console.log('[CameraFollowManager] Follow state updated:', {
        target: state.targetPosition.toArray(),
        camera: state.currentCameraPosition.toArray(),
        offset: state.followOffset,
        smoothing: state.smoothingSpeed,
      });
    } catch (error) {
      console.error('[CameraFollowManager] Error updating camera follow:', error);
    }
  }, [world]);

  // Update camera position each frame when following
  useFrame((_, deltaTime) => {
    const state = followStateRef.current;

    if (!state.isFollowing || !state.followTarget || state.followingCamera === null) {
      return;
    }

    try {
      // Calculate desired camera position
      const desiredPosition = state.targetPosition
        .clone()
        .add(new THREE.Vector3(state.followOffset.x, state.followOffset.y, state.followOffset.z));

      // Check if camera needs to move
      const distance = state.currentCameraPosition.distanceTo(desiredPosition);
      if (distance < 0.01) {
        return; // Close enough, no update needed
      }

      // Smooth lerp to desired position
      const lerpFactor = Math.min(1.0, state.smoothingSpeed * deltaTime);
      const newPosition = state.currentCameraPosition.clone().lerp(desiredPosition, lerpFactor);

      // Update our cached position
      state.currentCameraPosition.copy(newPosition);

      // Calculate lookAt rotation using Three.js
      const tempCamera = new THREE.Object3D();
      tempCamera.position.copy(newPosition);
      tempCamera.lookAt(state.targetPosition);

      // Convert to degrees for ECS system
      const newRotation: [number, number, number] = [
        (tempCamera.rotation.x * 180) / Math.PI,
        (tempCamera.rotation.y * 180) / Math.PI,
        (tempCamera.rotation.z * 180) / Math.PI,
      ];

      // Update the ECS Transform component - this is the key fix!
      const success = componentRegistry.updateComponent(state.followingCamera, 'Transform', {
        position: [newPosition.x, newPosition.y, newPosition.z],
        rotation: newRotation,
      });

      if (success) {
        // Mark camera for rendering update so camera system syncs it
        const cameraComponent = componentRegistry.getBitECSComponent('Camera');
        if (cameraComponent?.needsUpdate && state.followingCamera !== null) {
          cameraComponent.needsUpdate[state.followingCamera] = 1;
        }

        // Invalidate frame to trigger re-render
        invalidate();
      }

      // Only log occasionally to avoid spam
      if (Math.random() < 0.05) {
        // 5% of frames
        console.log('[CameraFollowManager] Following update:', {
          distance: distance.toFixed(3),
          cameraPos: newPosition.toArray().map((v) => v.toFixed(2)),
          targetPos: state.targetPosition.toArray().map((v) => v.toFixed(2)),
          rotation: newRotation.map((v) => v.toFixed(1)),
        });
      }
    } catch (error) {
      console.error('[CameraFollowManager] Error in frame update:', error);
    }
  });

  // Event-driven updates - ONLY listen to target entity changes, not camera changes
  useEvent('component:updated', (event) => {
    // Only update when the TARGET entity (what we're following) changes, not the camera
    if (event.componentId === 'Transform') {
      const state = followStateRef.current;

      // Ignore updates to camera entities to prevent feedback loop
      if (state.followingCamera !== null && event.entityId === state.followingCamera) {
        return; // Skip camera entity transform updates
      }

      // Only care about the target entity we're following
      if (state.isFollowing && event.entityId === state.followTarget) {
        console.log(
          `[CameraFollowManager] Target entity ${event.entityId} moved, updating follow state`,
        );

        // Update just the target position, don't re-query everything
        try {
          const targetTransform = componentRegistry.getComponentData<ITransformData>(
            event.entityId,
            'Transform',
          );

          if (targetTransform) {
            state.targetPosition.set(
              targetTransform.position?.[0] || 0,
              targetTransform.position?.[1] || 0,
              targetTransform.position?.[2] || 0,
            );
            console.log(
              `[CameraFollowManager] Updated target position:`,
              state.targetPosition.toArray(),
            );
          }
        } catch (error) {
          console.error('[CameraFollowManager] Error updating target position:', error);
        }
      }
    }

    // Only re-initialize when camera settings change (not position/rotation changes)
    if (event.componentId === 'Camera') {
      console.log(`[CameraFollowManager] Camera settings updated for entity ${event.entityId}`);
      setTimeout(() => updateCameraFollow(), 0);
    }
  });

  useEvent('component:added', (event) => {
    if (event.componentId === 'Camera') {
      console.log(`[CameraFollowManager] Camera component added to entity ${event.entityId}`);
      setTimeout(() => updateCameraFollow(), 0);
    }
  });

  useEvent('component:removed', (event) => {
    if (event.componentId === 'Camera') {
      console.log(`[CameraFollowManager] Camera component removed from entity ${event.entityId}`);
      followStateRef.current.isFollowing = false;
    }
  });

  // Initial update
  useEffect(() => {
    updateCameraFollow();
  }, [updateCameraFollow]);

  return null; // This component doesn't render anything
};
