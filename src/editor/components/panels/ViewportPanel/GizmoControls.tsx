import { TransformControls } from '@react-three/drei';
import React, { MutableRefObject, useCallback, useRef } from 'react';
import { Object3D } from 'three';

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

  if (mode === 'translate') {
    const newPosition: [number, number, number] = [
      mesh.position.x,
      mesh.position.y,
      mesh.position.z,
    ];
    updatedTransform.position = newPosition;
    if (onTransformChange) {
      onTransformChange(newPosition);
    }
  } else if (mode === 'rotate') {
    const xDeg = mesh.rotation.x * (180 / Math.PI);
    const yDeg = mesh.rotation.y * (180 / Math.PI);
    const zDeg = mesh.rotation.z * (180 / Math.PI);
    const newRotation: [number, number, number] = [xDeg, yDeg, zDeg];
    updatedTransform.rotation = newRotation;
    if (onTransformChange) {
      onTransformChange(newRotation);
    }
  } else if (mode === 'scale') {
    const newScale: [number, number, number] = [mesh.scale.x, mesh.scale.y, mesh.scale.z];
    updatedTransform.scale = newScale;
    if (onTransformChange) {
      onTransformChange(newScale);
    }
  }

  // Update ComponentManager (restore original immediate update behavior)
  if (currentTransform) {
    componentManager.updateComponent(entityId, KnownComponentTypes.TRANSFORM, updatedTransform);
  } else {
    componentManager.addComponent(entityId, KnownComponentTypes.TRANSFORM, updatedTransform);
  }

  console.debug(`[GizmoControls] Updated ${mode} for entity ${entityId} through ComponentManager`);
}

export const GizmoControls: React.FC<IGizmoControlsProps> = React.memo(
  ({ meshRef, mode, entityId, onTransformChange, setIsTransforming, meshType }) => {
    const transformRef = useRef<any>(null);
    const componentManager = useComponentManager();
    const [, setForceUpdate] = React.useState(0);
    const isDragging = useRef(false);
    const lastUpdateTime = useRef(0);
    const throttleDelay = 16; // ~60fps throttling

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

    const handleMouseDown = useCallback(() => {
      isDragging.current = true;
      if (setIsTransforming) {
        setIsTransforming(true);
      }
    }, [setIsTransforming]);

    const handleMouseUp = useCallback(() => {
      isDragging.current = false;
      if (setIsTransforming) {
        setIsTransforming(false);
      }
      // Always do final update on mouse up (no throttling)
      lastUpdateTime.current = 0;
      handleTransformUpdate();
    }, [setIsTransforming, handleTransformUpdate]);

    // Don't render gizmo controls for camera entities as they contain HTML elements
    // that cause TransformControls scene graph errors
    if (meshType === 'Camera') {
      return null;
    }

    // Only use onObjectChange to avoid duplicate updates
    return (
      <TransformControls
        ref={transformRef}
        object={meshRef.current || undefined}
        mode={mode}
        size={0.75}
        translationSnap={0.25}
        rotationSnap={Math.PI / 24}
        scaleSnap={0.1}
        onObjectChange={handleTransformUpdate}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      />
    );
  },
);

GizmoControls.displayName = 'GizmoControls';
