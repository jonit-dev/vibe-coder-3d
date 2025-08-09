import { TransformControls } from '@react-three/drei';
import React, { MutableRefObject, useCallback, useRef } from 'react';
import { Object3D } from 'three';
import type { TransformControls as TransformControlsImpl } from 'three-stdlib';

import { ComponentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { ITransformData } from '@/core/lib/ecs/components/TransformComponent';
import { useComponentManager } from '@/editor/hooks/useComponentManager';

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
      updatedTransform.scale = newScale;
      hasChanges = true;
      if (onTransformChange) {
        onTransformChange(newScale);
      }
    }
  }

  // Only update ComponentManager if there were actual changes
  if (hasChanges) {
    if (currentTransform) {
      componentManager.updateComponent(entityId, KnownComponentTypes.TRANSFORM, updatedTransform);
    } else {
      componentManager.addComponent(entityId, KnownComponentTypes.TRANSFORM, updatedTransform);
    }

    console.debug(
      `[GizmoControls] Updated ${mode} for entity ${entityId} through ComponentManager`,
    );
  }
}

export const GizmoControls: React.FC<IGizmoControlsProps> = React.memo(
  ({ meshRef, mode, entityId, onTransformChange, setIsTransforming, meshType }) => {
    const transformRef = useRef<TransformControlsImpl | null>(null);
    const componentManager = useComponentManager();
    const [, setForceUpdate] = React.useState(0);
    const isDragging = useRef(false);
    const lastUpdateTime = useRef(0);
    const transformingState = useRef(false);
    const throttleDelay = 8; // Reduced from 16ms to 8ms for 120fps (~better responsiveness)

    // Force re-render when meshRef becomes available
    React.useEffect(() => {
      if (meshRef.current) {
        setForceUpdate((prev) => prev + 1);
      }
    }, [meshRef.current]);

    // Throttled update function for smooth performance
    const handleTransformUpdate = useCallback(() => {
      if (!meshRef.current) return;

      const now = Date.now();
      if (isDragging.current && now - lastUpdateTime.current < throttleDelay) {
        return; // Skip update if too frequent during drag
      }
      lastUpdateTime.current = now;

      updateTransformThroughComponentManager(
        meshRef.current,
        mode,
        entityId,
        componentManager,
        onTransformChange,
      );
    }, [meshRef, mode, entityId, componentManager, onTransformChange, throttleDelay]);

    const handleDragStart = useCallback(() => {
      isDragging.current = true;
      transformingState.current = true;
      if (setIsTransforming) {
        setIsTransforming(true);
      }
    }, [setIsTransforming]);

    const handleDragEnd = useCallback(() => {
      isDragging.current = false;

      // IMMEDIATE final update (no throttling) to ensure final position is synced
      if (meshRef.current) {
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
        transformingState.current = false;
        if (setIsTransforming) {
          setIsTransforming(false);
        }
      }, 16); // Reduced from 50ms to 16ms (~1 frame) for faster sync
    }, [setIsTransforming, meshRef, mode, entityId, componentManager, onTransformChange]);

    // Don't render gizmo controls for camera entities as they contain HTML elements
    // that cause TransformControls scene graph errors
    if (meshType === 'Camera') {
      return null;
    }

    // Don't render if mesh isn't ready
    if (!meshRef.current) {
      return null;
    }

    // Attach controls directly to the target object
    return (
      <TransformControls
        ref={transformRef}
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
