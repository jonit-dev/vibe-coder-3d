import { TransformControls } from '@react-three/drei';
import React, { useCallback, useRef, useMemo } from 'react';
import { Object3D } from 'three';

import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { ITransformData } from '@/core/lib/ecs/components/TransformComponent';
import { useComponentManager } from '@/editor/hooks/useComponentManager';

type GizmoMode = 'translate' | 'rotate' | 'scale';

export interface IGroupGizmoControlsProps {
  selectedIds: number[];
  mode: GizmoMode;
  onTransformChange?: (values: [number, number, number]) => void;
  setIsTransforming?: (isTransforming: boolean) => void;
}

export const GroupGizmoControls: React.FC<IGroupGizmoControlsProps> = React.memo(
  ({ selectedIds, mode, onTransformChange, setIsTransforming }) => {
    const transformRef = useRef<any>(null);
    const componentManager = useComponentManager();
    const isDragging = useRef(false);
    const lastUpdateTime = useRef(0);
    const throttleDelay = 16; // ~60fps throttling
    const initialValues = useRef<Record<number, ITransformData>>({});
    const initialGroupCenter = useRef<[number, number, number]>([0, 0, 0]);
    const stableGroupCenter = useRef<[number, number, number]>([0, 0, 0]);

    // Create a virtual group center object for the gizmo to attach to
    const groupCenterRef = useRef<Object3D>(null as any);

    console.log(
      `[GroupGizmoControls] Rendering with ${selectedIds.length} selected IDs:`,
      selectedIds,
    );

    // Calculate the center position of all selected entities
    const calculateGroupCenter = useCallback((): [number, number, number] => {
      if (selectedIds.length === 0) return [0, 0, 0];

      let totalX = 0,
        totalY = 0,
        totalZ = 0;
      let validCount = 0;

      selectedIds.forEach((entityId) => {
        const transform = componentManager.getComponent<ITransformData>(
          entityId,
          KnownComponentTypes.TRANSFORM,
        );

        if (transform?.data?.position) {
          totalX += transform.data.position[0];
          totalY += transform.data.position[1];
          totalZ += transform.data.position[2];
          validCount++;
        }
      });

      if (validCount === 0) return [0, 0, 0];

      return [totalX / validCount, totalY / validCount, totalZ / validCount];
    }, [selectedIds, componentManager]);

    // Update stable group center when selection changes or component updates (but not during drag)
    React.useEffect(() => {
      if (!isDragging.current) {
        const newCenter = calculateGroupCenter();
        stableGroupCenter.current = newCenter;
        console.log(`[GroupGizmoControls] Updated stable group center for selection:`, newCenter);

        // Also position the gizmo object immediately
        if (groupCenterRef.current) {
          groupCenterRef.current.position.set(newCenter[0], newCenter[1], newCenter[2]);
          groupCenterRef.current.rotation.set(0, 0, 0);
          groupCenterRef.current.scale.set(1, 1, 1);
          console.log(`[GroupGizmoControls] Positioned gizmo at:`, newCenter);
        }
      }
    }, [selectedIds, calculateGroupCenter]);

    // Use stable group center for rendering
    const groupCenter = stableGroupCenter.current;

    // Store initial values when dragging starts
    const handleMouseDown = useCallback(() => {
      isDragging.current = true;

      // Calculate and store the current group center as the initial center
      const currentCenter = calculateGroupCenter();
      initialGroupCenter.current = [...currentCenter];

      console.log(
        `[GroupGizmoControls] Starting drag - initial group center:`,
        initialGroupCenter.current,
      );

      // Store initial transform data for all entities
      selectedIds.forEach((entityId) => {
        const transform = componentManager.getComponent<ITransformData>(
          entityId,
          KnownComponentTypes.TRANSFORM,
        );

        if (transform?.data) {
          initialValues.current[entityId] = { ...transform.data };
          console.log(
            `[GroupGizmoControls] Stored initial transform for entity ${entityId}:`,
            transform.data,
          );
        }
      });

      if (setIsTransforming) {
        setIsTransforming(true);
      }
    }, [selectedIds, componentManager, calculateGroupCenter, setIsTransforming]);

    // Throttled update function for smooth performance
    const handleTransformUpdate = useCallback(() => {
      if (!groupCenterRef.current || selectedIds.length === 0 || !isDragging.current) return;

      const now = Date.now();
      if (now - lastUpdateTime.current < throttleDelay) {
        return; // Skip update if too frequent during drag
      }
      lastUpdateTime.current = now;

      // Calculate the delta from initial group center
      const centerObj = groupCenterRef.current;
      if (!centerObj) return;

      const deltaX = centerObj.position.x - initialGroupCenter.current[0];
      const deltaY = centerObj.position.y - initialGroupCenter.current[1];
      const deltaZ = centerObj.position.z - initialGroupCenter.current[2];

      console.log(`[GroupGizmoControls] Delta movement: [${deltaX}, ${deltaY}, ${deltaZ}]`);

      // Check for NaN values and skip update if found
      if (isNaN(deltaX) || isNaN(deltaY) || isNaN(deltaZ)) {
        console.warn(
          '[GroupGizmoControls] Detected NaN values in delta calculation, skipping update',
        );
        return;
      }

      if (mode === 'translate') {
        // Move each entity by the same delta from their original positions
        selectedIds.forEach((entityId) => {
          const initialTransform = initialValues.current[entityId];
          if (!initialTransform) {
            console.warn(`[GroupGizmoControls] No initial transform for entity ${entityId}`);
            return;
          }

          // Calculate new position based on initial position + delta
          const newPosX = initialTransform.position[0] + deltaX;
          const newPosY = initialTransform.position[1] + deltaY;
          const newPosZ = initialTransform.position[2] + deltaZ;

          console.log(
            `[GroupGizmoControls] Entity ${entityId}: delta=[${deltaX}, ${deltaY}, ${deltaZ}], initial=[${initialTransform.position}], new=[${newPosX}, ${newPosY}, ${newPosZ}]`,
          );

          // Validate no NaN values before updating
          if (isNaN(newPosX) || isNaN(newPosY) || isNaN(newPosZ)) {
            console.warn(
              `[GroupGizmoControls] Detected NaN in position for entity ${entityId}, skipping`,
            );
            return;
          }

          const updatedTransform: ITransformData = {
            ...initialTransform,
            position: [newPosX, newPosY, newPosZ],
          };

          componentManager.updateComponent(
            entityId,
            KnownComponentTypes.TRANSFORM,
            updatedTransform,
          );
        });
      } else if (mode === 'rotate') {
        // Apply rotation to each entity (for now, just apply to each individually)
        const rotX = centerObj.rotation.x * (180 / Math.PI);
        const rotY = centerObj.rotation.y * (180 / Math.PI);
        const rotZ = centerObj.rotation.z * (180 / Math.PI);

        selectedIds.forEach((entityId) => {
          const initialTransform = initialValues.current[entityId];
          if (!initialTransform) return;

          const updatedTransform: ITransformData = {
            ...initialTransform,
            rotation: [
              initialTransform.rotation[0] + rotX,
              initialTransform.rotation[1] + rotY,
              initialTransform.rotation[2] + rotZ,
            ],
          };

          componentManager.updateComponent(
            entityId,
            KnownComponentTypes.TRANSFORM,
            updatedTransform,
          );
        });
      } else if (mode === 'scale') {
        // Apply scale to each entity
        selectedIds.forEach((entityId) => {
          const initialTransform = initialValues.current[entityId];
          if (!initialTransform) return;

          const updatedTransform: ITransformData = {
            ...initialTransform,
            scale: [
              initialTransform.scale[0] * centerObj.scale.x,
              initialTransform.scale[1] * centerObj.scale.y,
              initialTransform.scale[2] * centerObj.scale.z,
            ],
          };

          componentManager.updateComponent(
            entityId,
            KnownComponentTypes.TRANSFORM,
            updatedTransform,
          );
        });
      }

      if (onTransformChange) {
        onTransformChange([deltaX, deltaY, deltaZ]);
      }
    }, [selectedIds, mode, componentManager, onTransformChange, groupCenter, throttleDelay]);

    const handleMouseUp = useCallback(() => {
      isDragging.current = false;
      initialValues.current = {};
      initialGroupCenter.current = [0, 0, 0];

      // Update stable group center with new positions
      const newCenter = calculateGroupCenter();
      stableGroupCenter.current = newCenter;

      // Position the gizmo at the new center
      if (groupCenterRef.current) {
        groupCenterRef.current.position.set(newCenter[0], newCenter[1], newCenter[2]);
        groupCenterRef.current.rotation.set(0, 0, 0);
        groupCenterRef.current.scale.set(1, 1, 1);
      }

      console.log(`[GroupGizmoControls] Drag ended - new stable center:`, newCenter);

      if (setIsTransforming) {
        setIsTransforming(false);
      }

      // Always do final update on mouse up (no throttling)
      lastUpdateTime.current = 0;
      handleTransformUpdate();
    }, [setIsTransforming, handleTransformUpdate, calculateGroupCenter]);

    // Don't render if no entities selected
    if (selectedIds.length === 0) {
      return null;
    }

    return (
      <group>
        {/* Invisible object for the gizmo to attach to - positioned manually to avoid React updates */}
        <object3D ref={groupCenterRef}>
          <mesh visible={false}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshBasicMaterial />
          </mesh>
        </object3D>

        {/* Transform controls attached to the group center */}
        <TransformControls
          ref={transformRef}
          object={groupCenterRef}
          mode={mode}
          size={0.75}
          translationSnap={0.25}
          rotationSnap={Math.PI / 24}
          scaleSnap={0.1}
          onObjectChange={handleTransformUpdate}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        />
      </group>
    );
  },
);

GroupGizmoControls.displayName = 'GroupGizmoControls';
