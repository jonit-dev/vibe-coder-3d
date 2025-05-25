import { TransformControls } from '@react-three/drei';
import React, { MutableRefObject, useRef } from 'react';
import { Object3D } from 'three';

import { useComponentManager } from '@/editor/hooks/useComponentManager';
import { ComponentManager } from '@/editor/lib/ecs/ComponentManager';
import { KnownComponentTypes } from '@/editor/lib/ecs/IComponent';
import { ITransformData } from '@/editor/lib/ecs/components/TransformComponent';

type GizmoMode = 'translate' | 'rotate' | 'scale';

export interface IGizmoControlsProps {
  meshRef: MutableRefObject<Object3D | null>;
  mode: GizmoMode;
  entityId: number;
  onTransformChange?: (values: [number, number, number]) => void;
  setIsTransforming?: (isTransforming: boolean) => void;
}

function updateTransformThroughComponentManager(
  mesh: Object3D,
  mode: GizmoMode,
  entityId: number,
  componentManager: ComponentManager,
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
    const position: [number, number, number] = [mesh.position.x, mesh.position.y, mesh.position.z];
    updatedTransform.position = position;
    if (onTransformChange) {
      onTransformChange(position);
    }
  } else if (mode === 'rotate') {
    const xDeg = mesh.rotation.x * (180 / Math.PI);
    const yDeg = mesh.rotation.y * (180 / Math.PI);
    const zDeg = mesh.rotation.z * (180 / Math.PI);
    const rotation: [number, number, number] = [xDeg, yDeg, zDeg];
    updatedTransform.rotation = rotation;
    if (onTransformChange) {
      onTransformChange(rotation);
    }
  } else if (mode === 'scale') {
    const scale: [number, number, number] = [mesh.scale.x, mesh.scale.y, mesh.scale.z];
    updatedTransform.scale = scale;
    if (onTransformChange) {
      onTransformChange(scale);
    }
  }

  // Update through ComponentManager (single source of truth)
  if (currentTransform) {
    componentManager.updateComponent(entityId, KnownComponentTypes.TRANSFORM, updatedTransform);
  } else {
    componentManager.addComponent(entityId, KnownComponentTypes.TRANSFORM, updatedTransform);
  }

  console.debug(`[GizmoControls] Updated ${mode} for entity ${entityId} through ComponentManager`);
}

export const GizmoControls: React.FC<IGizmoControlsProps> = ({
  meshRef,
  mode,
  entityId,
  onTransformChange,
  setIsTransforming,
}) => {
  const transformRef = useRef<any>(null);
  const componentManager = useComponentManager();

  return (
    <>
      {meshRef.current && (
        <TransformControls
          ref={transformRef}
          object={meshRef.current}
          mode={mode}
          size={0.75}
          translationSnap={0.25}
          rotationSnap={Math.PI / 24}
          scaleSnap={0.1}
          onObjectChange={() => {
            if (!meshRef.current) return;
            updateTransformThroughComponentManager(
              meshRef.current,
              mode,
              entityId,
              componentManager,
              onTransformChange,
            );
          }}
          onChange={() => {
            if (!meshRef.current) return;
            updateTransformThroughComponentManager(
              meshRef.current,
              mode,
              entityId,
              componentManager,
              onTransformChange,
            );
          }}
          onMouseDown={() => setIsTransforming && setIsTransforming(true)}
          onMouseUp={() => setIsTransforming && setIsTransforming(false)}
        />
      )}
    </>
  );
};
