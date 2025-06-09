import { defineQuery } from 'bitecs';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useCameraBackground } from '@core/hooks/useCameraBackground';
import { useEvent } from '@core/hooks/useEvent';
import { componentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { CameraData } from '@core/lib/ecs/components/definitions/CameraComponent';
import { ECSWorld } from '@core/lib/ecs/World';

export const CameraBackgroundManager: React.FC = () => {
  const [clearFlags, setClearFlags] = useState<string>('skybox');
  const [backgroundColor, setBackgroundColor] = useState<
    { r: number; g: number; b: number; a: number } | undefined
  >();
  const [forceUpdate, setForceUpdate] = useState(0);

  const world = ECSWorld.getInstance().getWorld();
  const lastUpdateRef = useRef<{ clearFlags: string; backgroundColor?: any }>({
    clearFlags: 'skybox',
  });

  const updateFromMainCamera = useCallback(() => {
    try {
      const cameraComponent = componentRegistry.getBitECSComponent('Camera');
      if (!cameraComponent) {
        console.log('[CameraBackgroundManager] Camera component not registered yet');
        return;
      }

      const query = defineQuery([cameraComponent]);
      const entities = query(world);

      console.log('[CameraBackgroundManager] Found camera entities:', entities.length);

      if (entities.length === 0) {
        console.log('[CameraBackgroundManager] No camera entities found');
        return;
      }

      // Find the main camera with better debugging
      let mainCameraEntity: number | null = null;

      for (const eid of entities) {
        const cameraData = componentRegistry.getComponentData<CameraData>(eid, 'Camera');
        console.log(`[CameraBackgroundManager] Entity ${eid} - Camera data:`, cameraData);

        if (cameraData?.isMain) {
          mainCameraEntity = eid;
          console.log(`[CameraBackgroundManager] Found main camera: entity ${eid}`);
          break;
        }
      }

      // If no main camera found, use the first camera
      if (mainCameraEntity === null && entities.length > 0) {
        mainCameraEntity = entities[0];
        console.log(
          '[CameraBackgroundManager] No main camera found, using first camera:',
          mainCameraEntity,
        );
      }

      if (mainCameraEntity !== null) {
        console.log('[CameraBackgroundManager] Processing camera entity:', mainCameraEntity);

        // Try to get the raw BitECS component data for debugging
        const cameraComponent = componentRegistry.getBitECSComponent('Camera');
        if (cameraComponent) {
          const rawClearFlags = cameraComponent.clearFlags?.[mainCameraEntity];
          const rawBgR = cameraComponent.backgroundR?.[mainCameraEntity];
          const rawBgG = cameraComponent.backgroundG?.[mainCameraEntity];
          const rawBgB = cameraComponent.backgroundB?.[mainCameraEntity];
          const rawBgA = cameraComponent.backgroundA?.[mainCameraEntity];

          console.log('[CameraBackgroundManager] Raw BitECS data:', {
            clearFlags: rawClearFlags,
            backgroundR: rawBgR,
            backgroundG: rawBgG,
            backgroundB: rawBgB,
            backgroundA: rawBgA,
          });
        }

        const cameraData = componentRegistry.getComponentData<CameraData>(
          mainCameraEntity,
          'Camera',
        );
        console.log('[CameraBackgroundManager] Retrieved camera data:', cameraData);

        if (cameraData) {
          const newClearFlags = cameraData.clearFlags || 'skybox';
          const newBackgroundColor = cameraData.backgroundColor;

          console.log(
            '[CameraBackgroundManager] Processing - clearFlags:',
            newClearFlags,
            'backgroundColor:',
            newBackgroundColor,
          );

          // Check if data actually changed
          const clearFlagsChanged = lastUpdateRef.current.clearFlags !== newClearFlags;
          const backgroundColorChanged =
            JSON.stringify(lastUpdateRef.current.backgroundColor) !==
            JSON.stringify(newBackgroundColor);

          console.log('[CameraBackgroundManager] Change detection:', {
            clearFlagsChanged,
            backgroundColorChanged,
            currentClearFlags: lastUpdateRef.current.clearFlags,
            currentBackgroundColor: lastUpdateRef.current.backgroundColor,
            newClearFlags,
            newBackgroundColor,
          });

          if (clearFlagsChanged || backgroundColorChanged) {
            console.log('[CameraBackgroundManager] Data changed, updating state:', {
              clearFlagsChanged,
              backgroundColorChanged,
              newClearFlags,
              newBackgroundColor,
            });

            setClearFlags(newClearFlags);
            setBackgroundColor(newBackgroundColor);
            setForceUpdate((prev) => prev + 1);

            // Update the ref for next comparison
            lastUpdateRef.current = {
              clearFlags: newClearFlags,
              backgroundColor: newBackgroundColor,
            };
          } else {
            console.log('[CameraBackgroundManager] No data changes detected');
          }
        } else {
          console.warn(
            '[CameraBackgroundManager] No camera data found for entity:',
            mainCameraEntity,
          );
        }
      } else {
        console.warn('[CameraBackgroundManager] No valid camera entity found');
      }
    } catch (error) {
      console.error('[CameraBackgroundManager] Error updating from main camera:', error);
    }
  }, [world]);

  // Update on component changes - use events for real-time updates
  useEffect(() => {
    updateFromMainCamera();
  }, [updateFromMainCamera]);

  // Listen to component update events for real-time synchronization
  useEvent('component:updated', (event) => {
    if (event.componentId === 'Camera') {
      console.log('[CameraBackgroundManager] Camera component updated for entity:', event.entityId);
      // Use immediate update for camera changes
      setTimeout(() => updateFromMainCamera(), 0);
    }
  });

  useEvent('component:added', (event) => {
    if (event.componentId === 'Camera') {
      console.log('[CameraBackgroundManager] Camera component added to entity:', event.entityId);
      setTimeout(() => updateFromMainCamera(), 0);
    }
  });

  useEvent('component:removed', (event) => {
    if (event.componentId === 'Camera') {
      console.log(
        '[CameraBackgroundManager] Camera component removed from entity:',
        event.entityId,
      );
      setTimeout(() => updateFromMainCamera(), 0);
    }
  });

  // Reduced polling frequency as fallback (only for emergency sync)
  useEffect(() => {
    const interval = setInterval(updateFromMainCamera, 2000); // Reduced to 2 seconds
    return () => clearInterval(interval);
  }, [updateFromMainCamera]);

  // Use the hook to actually apply the changes to the scene
  useCameraBackground(clearFlags, backgroundColor);

  return null; // This component doesn't render anything
};
