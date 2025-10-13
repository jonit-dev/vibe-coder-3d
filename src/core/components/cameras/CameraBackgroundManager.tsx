import { defineQuery } from 'bitecs';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { ISkyboxTransform, useCameraBackground } from '../../hooks/useCameraBackground';
import { useEvent } from '../../hooks/useEvent';
import { componentRegistry } from '../../lib/ecs/ComponentRegistry';
import { CameraData } from '../../lib/ecs/components/definitions/CameraComponent';
import { ECSWorld } from '../../lib/ecs/World';

export const CameraBackgroundManager: React.FC = () => {
  const [clearFlags, setClearFlags] = useState<string>('skybox');
  const [backgroundColor, setBackgroundColor] = useState<
    { r: number; g: number; b: number; a: number } | undefined
  >();
  const [skyboxTexture, setSkyboxTexture] = useState<string>('');
  const [skyboxTransform, setSkyboxTransform] = useState<ISkyboxTransform | undefined>();

  const world = ECSWorld.getInstance().getWorld();
  const lastUpdateRef = useRef<{
    clearFlags: string;
    backgroundColor?: { r: number; g: number; b: number; a: number };
    skyboxTexture?: string;
    skyboxTransform?: ISkyboxTransform;
  }>({
    clearFlags: 'skybox',
  });

  const updateFromMainCamera = useCallback(() => {
    try {
      const cameraComponent = componentRegistry.getBitECSComponent('Camera');
      if (!cameraComponent) {
        return;
      }

      const query = defineQuery([cameraComponent]);
      const entities = query(world);

      if (entities.length === 0) {
        return;
      }

      // Find the main camera
      let mainCameraEntity: number | null = null;

      for (const eid of entities) {
        const cameraData = componentRegistry.getComponentData<CameraData>(eid, 'Camera');

        if (cameraData?.isMain) {
          mainCameraEntity = eid;
          break;
        }
      }

      // If no main camera found, use the first camera
      if (mainCameraEntity === null && entities.length > 0) {
        mainCameraEntity = entities[0];
      }

      if (mainCameraEntity !== null) {
        const cameraData = componentRegistry.getComponentData<CameraData>(
          mainCameraEntity,
          'Camera',
        );

        if (cameraData) {
          const newClearFlags = cameraData.clearFlags || 'skybox';
          const newBackgroundColor = cameraData.backgroundColor;
          const newSkyboxTexture = cameraData.skyboxTexture || '';
          const newSkyboxTransform: ISkyboxTransform = {
            scale: cameraData.skyboxScale,
            rotation: cameraData.skyboxRotation,
            repeat: cameraData.skyboxRepeat,
            offset: cameraData.skyboxOffset,
            intensity: cameraData.skyboxIntensity,
            blur: cameraData.skyboxBlur,
          };

          // Check if data actually changed
          const clearFlagsChanged = lastUpdateRef.current.clearFlags !== newClearFlags;
          const backgroundColorChanged =
            JSON.stringify(lastUpdateRef.current.backgroundColor) !==
            JSON.stringify(newBackgroundColor);
          const skyboxTextureChanged = lastUpdateRef.current.skyboxTexture !== newSkyboxTexture;
          const skyboxTransformChanged =
            JSON.stringify(lastUpdateRef.current.skyboxTransform) !==
            JSON.stringify(newSkyboxTransform);

          if (
            clearFlagsChanged ||
            backgroundColorChanged ||
            skyboxTextureChanged ||
            skyboxTransformChanged
          ) {
            // Camera background updated

            setClearFlags(newClearFlags);
            setBackgroundColor(newBackgroundColor);
            setSkyboxTexture(newSkyboxTexture);
            setSkyboxTransform(newSkyboxTransform);

            // Update the ref for next comparison
            lastUpdateRef.current = {
              clearFlags: newClearFlags,
              backgroundColor: newBackgroundColor,
              skyboxTexture: newSkyboxTexture,
              skyboxTransform: newSkyboxTransform,
            };
          }
        }
      }
    } catch (error) {
      console.error('[CameraBackgroundManager] Error updating from main camera:', error);
    }
  }, [world]);

  // Initial load
  useEffect(() => {
    updateFromMainCamera();
  }, [updateFromMainCamera]);

  // Listen to component events for real-time updates
  useEvent('component:updated', (event) => {
    if (event.componentId === 'Camera') {
      updateFromMainCamera();
    }
  });

  useEvent('component:added', (event) => {
    if (event.componentId === 'Camera') {
      updateFromMainCamera();
    }
  });

  useEvent('component:removed', (event) => {
    if (event.componentId === 'Camera') {
      updateFromMainCamera();
    }
  });

  // Use the hook to actually apply the changes to the scene
  useCameraBackground(clearFlags, backgroundColor, skyboxTexture, skyboxTransform);

  return null; // This component doesn't render anything
};
