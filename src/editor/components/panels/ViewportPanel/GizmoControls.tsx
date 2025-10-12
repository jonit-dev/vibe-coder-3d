import { TransformControls } from '@react-three/drei';
import React, { MutableRefObject, useCallback, useRef } from 'react';
import { Object3D, Group, Mesh } from 'three';
import type { TransformControls as TransformControlsImpl } from 'three-stdlib';

import { ComponentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { ITransformData } from '@/core/lib/ecs/components/TransformComponent';
import { useComponentManager } from '@/editor/hooks/useComponentManager';
import { Logger } from '@/core/lib/logger';

type GizmoMode = 'translate' | 'rotate' | 'scale';

export interface IGizmoControlsProps {
  meshRef: MutableRefObject<Object3D | null>;
  mode: GizmoMode;
  entityId: number;
  onTransformChange?: (values: [number, number, number]) => void;
  setIsTransforming?: (isTransforming: boolean) => void;
  meshType?: string;
}

function updateTransformThroughComponentManager(
  mesh: Object3D,
  mode: GizmoMode,
  entityId: number,
  componentManager: ComponentRegistry,
  onTransformChange?: (values: [number, number, number]) => void,
) {
  const logger = Logger.create('GizmoControls');
  logger.debug(`updateTransformThroughComponentManager - START`, {
    entityId,
    mode,
    meshPosition: [mesh.position.x, mesh.position.y, mesh.position.z],
    meshRotation: [mesh.rotation.x, mesh.rotation.y, mesh.rotation.z],
    meshScale: [mesh.scale.x, mesh.scale.y, mesh.scale.z],
    meshType: mesh.type,
    meshUserData: mesh.userData,
  });

  // Get current transform data from ComponentManager
  const currentTransform = componentManager.getComponent<ITransformData>(
    entityId,
    KnownComponentTypes.TRANSFORM,
  );
  const transformData = currentTransform?.data || {
    position: [0, 0, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    scale: [1, 1, 1] as [number, number, number],
  };

  logger.debug(`Current ECS transform data:`, {
    entityId,
    currentTransformData: transformData,
    hasCurrentTransform: !!currentTransform,
  });

  logger.debug(`DETAILED COMPARISON - mesh vs ECS:`, {
    entityId,
    mode,
    meshPosition: [mesh.position.x, mesh.position.y, mesh.position.z],
    ecsPosition: transformData.position,
    positionDelta: [
      mesh.position.x - transformData.position[0],
      mesh.position.y - transformData.position[1],
      mesh.position.z - transformData.position[2],
    ],
    positionDeltaAbs: [
      Math.abs(mesh.position.x - transformData.position[0]),
      Math.abs(mesh.position.y - transformData.position[1]),
      Math.abs(mesh.position.z - transformData.position[2]),
    ],
    threshold: 0.001,
    wouldTriggerUpdate:
      mode === 'translate' &&
      (Math.abs(mesh.position.x - transformData.position[0]) > 0.001 ||
        Math.abs(mesh.position.y - transformData.position[1]) > 0.001 ||
        Math.abs(mesh.position.z - transformData.position[2]) > 0.001),
    // EXPANDED DEBUGGING
    meshObject: {
      type: mesh.type,
      constructor: mesh.constructor.name,
      isGroup: mesh instanceof Group,
      isMesh: mesh instanceof Mesh,
      children: mesh.children.length,
      parent: mesh.parent?.type,
      matrixAutoUpdate: mesh.matrixAutoUpdate,
      visible: mesh.visible,
    },
  });

  const updatedTransform: ITransformData = { ...transformData };
  let hasChanges = false;

  if (mode === 'translate') {
    const newPosition: [number, number, number] = [
      mesh.position.x,
      mesh.position.y,
      mesh.position.z,
    ];

    // Only update if position actually changed (avoid unnecessary updates)
    if (
      Math.abs(newPosition[0] - transformData.position[0]) > 0.001 ||
      Math.abs(newPosition[1] - transformData.position[1]) > 0.001 ||
      Math.abs(newPosition[2] - transformData.position[2]) > 0.001
    ) {
      logger.debug(`Position change detected:`, {
        entityId,
        oldPosition: transformData.position,
        newPosition,
        delta: [
          newPosition[0] - transformData.position[0],
          newPosition[1] - transformData.position[1],
          newPosition[2] - transformData.position[2],
        ],
      });
      updatedTransform.position = newPosition;
      hasChanges = true;
      if (onTransformChange) {
        onTransformChange(newPosition);
      }
    }
  } else if (mode === 'rotate') {
    const xDeg = mesh.rotation.x * (180 / Math.PI);
    const yDeg = mesh.rotation.y * (180 / Math.PI);
    const zDeg = mesh.rotation.z * (180 / Math.PI);
    const newRotation: [number, number, number] = [xDeg, yDeg, zDeg];

    // Only update if rotation actually changed
    if (
      Math.abs(newRotation[0] - transformData.rotation[0]) > 0.1 ||
      Math.abs(newRotation[1] - transformData.rotation[1]) > 0.1 ||
      Math.abs(newRotation[2] - transformData.rotation[2]) > 0.1
    ) {
      logger.debug(`Rotation change detected:`, {
        entityId,
        oldRotation: transformData.rotation,
        newRotation,
        delta: [
          newRotation[0] - transformData.rotation[0],
          newRotation[1] - transformData.rotation[1],
          newRotation[2] - transformData.rotation[2],
        ],
      });
      updatedTransform.rotation = newRotation;
      hasChanges = true;
      if (onTransformChange) {
        onTransformChange(newRotation);
      }
    }
  } else if (mode === 'scale') {
    const newScale: [number, number, number] = [mesh.scale.x, mesh.scale.y, mesh.scale.z];

    // Only update if scale actually changed
    if (
      Math.abs(newScale[0] - transformData.scale[0]) > 0.001 ||
      Math.abs(newScale[1] - transformData.scale[1]) > 0.001 ||
      Math.abs(newScale[2] - transformData.scale[2]) > 0.001
    ) {
      logger.debug(`Scale change detected:`, {
        entityId,
        oldScale: transformData.scale,
        newScale,
        delta: [
          newScale[0] - transformData.scale[0],
          newScale[1] - transformData.scale[1],
          newScale[2] - transformData.scale[2],
        ],
      });
      updatedTransform.scale = newScale;
      hasChanges = true;
      if (onTransformChange) {
        onTransformChange(newScale);
      }
    }
  }

  // Only update ComponentManager if there were actual changes
  if (hasChanges) {
    logger.debug(`Updating ECS with new transform:`, {
      entityId,
      mode,
      updatedTransform,
      isAddingNewComponent: !currentTransform,
    });

    if (currentTransform) {
      componentManager.updateComponent(entityId, KnownComponentTypes.TRANSFORM, updatedTransform);
    } else {
      componentManager.addComponent(entityId, KnownComponentTypes.TRANSFORM, updatedTransform);
    }

    logger.debug(`ECS update completed for entity ${entityId}`);
  } else {
    logger.debug(`No changes detected, skipping ECS update for entity ${entityId}`);
  }
}

export const GizmoControls: React.FC<IGizmoControlsProps> = React.memo(
  ({ meshRef, mode, entityId, onTransformChange, setIsTransforming, meshType }) => {
    const logger = Logger.create('GizmoControls');
    const transformRef = useRef<TransformControlsImpl | null>(null);
    const componentManager = useComponentManager();
    const [, setForceUpdate] = React.useState(0);
    const isDragging = useRef(false);
    const lastUpdateTime = useRef(0);
    const transformingState = useRef(false);
    const throttleDelay = 8; // Reduced from 16ms to 8ms for 120fps (~better responsiveness)

    logger.debug(`Component render:`, {
      entityId,
      mode,
      meshType,
      hasMeshRef: !!meshRef?.current,
      meshRefType: meshRef?.current?.type,
      meshRefConstructor: meshRef?.current?.constructor.name,
      meshRefPosition: meshRef?.current
        ? [meshRef.current.position.x, meshRef.current.position.y, meshRef.current.position.z]
        : null,
      meshRefChildren: meshRef?.current?.children?.length || 0,
      meshRefFirstChildType: meshRef?.current?.children?.[0]?.type || 'none',
      meshRefMatrixAutoUpdate: meshRef?.current?.matrixAutoUpdate,
    });

    // Force re-render when meshRef becomes available
    React.useEffect(() => {
      if (meshRef.current) {
        logger.debug(`meshRef became available:`, {
          entityId,
          meshRefType: meshRef.current.type,
          meshRefPosition: [
            meshRef.current.position.x,
            meshRef.current.position.y,
            meshRef.current.position.z,
          ],
        });
        setForceUpdate((prev) => prev + 1);
      }
    }, [meshRef.current]);

    // Throttled update function for smooth performance
    const handleTransformUpdate = useCallback(() => {
      if (!meshRef.current) {
        logger.debug(`handleTransformUpdate skipped - no meshRef for entity ${entityId}`,
        );
        return;
      }

      const now = Date.now();
      if (isDragging.current && now - lastUpdateTime.current < throttleDelay) {
        logger.debug(`handleTransformUpdate throttled for entity ${entityId}`);
        return; // Skip update if too frequent during drag
      }
      lastUpdateTime.current = now;

      logger.debug(`handleTransformUpdate executing:`, {
        entityId,
        mode,
        isDragging: isDragging.current,
        timeSinceLastUpdate: now - lastUpdateTime.current,
      });

      updateTransformThroughComponentManager(
        meshRef.current,
        mode,
        entityId,
        componentManager,
        onTransformChange,
      );
    }, [meshRef, mode, entityId, componentManager, onTransformChange, throttleDelay]);

    const handleDragStart = useCallback(() => {
      logger.debug(`Drag START for entity ${entityId}, mode: ${mode}`);
      isDragging.current = true;
      transformingState.current = true;
      if (setIsTransforming) {
        setIsTransforming(true);
      }
    }, [setIsTransforming, entityId, mode]);

    const handleDragEnd = useCallback(() => {
      logger.debug(`Drag END for entity ${entityId}, mode: ${mode}`);
      isDragging.current = false;

      // IMMEDIATE final update (no throttling) to ensure final position is synced
      if (meshRef.current) {
        logger.debug(`Final transform update on drag end:`, {
          entityId,
          mode,
          finalMeshPosition: [
            meshRef.current.position.x,
            meshRef.current.position.y,
            meshRef.current.position.z,
          ],
          finalMeshRotation: [
            meshRef.current.rotation.x,
            meshRef.current.rotation.y,
            meshRef.current.rotation.z,
          ],
          finalMeshScale: [
            meshRef.current.scale.x,
            meshRef.current.scale.y,
            meshRef.current.scale.z,
          ],
        });

        updateTransformThroughComponentManager(
          meshRef.current,
          mode,
          entityId,
          componentManager,
          onTransformChange,
        );
      }

      // Reduced delay for state updates to minimize disconnect time
      setTimeout(() => {
        logger.debug(`Setting transforming to false for entity ${entityId}`);
        transformingState.current = false;
        if (setIsTransforming) {
          setIsTransforming(false);
        }
      }, 16); // Reduced from 50ms to 16ms (~1 frame) for faster sync
    }, [setIsTransforming, meshRef, mode, entityId, componentManager, onTransformChange]);

    // Don't render gizmo controls for camera entities as they contain HTML elements
    // that cause TransformControls scene graph errors
    if (meshType === 'Camera') {
      logger.debug(`Skipping render for Camera entity ${entityId}`);
      return null;
    }

    // Don't render if mesh isn't ready
    if (!meshRef.current) {
      logger.debug(`Skipping render - no meshRef for entity ${entityId}`);
      return null;
    }

    logger.debug(`Rendering TransformControls for entity ${entityId}:`, {
      mode,
      meshRefType: meshRef.current.type,
      meshRefConstructor: meshRef.current.constructor.name,
      attachingToObject: !!meshRef.current,
    });

    // Attach controls directly to the target object
    return (
      <TransformControls
        ref={transformRef as any}
        mode={mode}
        size={0.75}
        translationSnap={0.25}
        rotationSnap={Math.PI / 24}
        scaleSnap={0.1}
        onObjectChange={handleTransformUpdate}
        onMouseDown={handleDragStart}
        onMouseUp={handleDragEnd}
        object={meshRef.current as unknown as Object3D}
      />
    );
  },
);

GizmoControls.displayName = 'GizmoControls';
