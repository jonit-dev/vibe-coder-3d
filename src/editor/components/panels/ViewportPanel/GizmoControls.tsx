import { TransformControls } from '@react-three/drei';
import React, { MutableRefObject, useRef } from 'react';
import { Object3D } from 'three';

import { componentManager } from '@/core/dynamic-components/init';

type GizmoMode = 'translate' | 'rotate' | 'scale';

export interface IGizmoControlsProps {
  meshRef: MutableRefObject<Object3D | null>;
  mode: GizmoMode;
  entityId: number;
  onTransformChange?: (values: [number, number, number]) => void;
  setIsTransforming?: (isTransforming: boolean) => void;
}

async function updateTransformThroughComponentManager(
  mesh: Object3D,
  mode: GizmoMode,
  entityId: number,
  onTransformChange?: (values: [number, number, number]) => void,
) {
  // Get current transform data from ComponentManager
  const currentTransform = componentManager.getComponentData(entityId, 'transform') || {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    needsUpdate: 1,
  };

  const updatedTransform = { ...currentTransform };

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
  updatedTransform.needsUpdate = 1;
  await componentManager.updateComponent(entityId, 'transform', updatedTransform);

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
              onTransformChange,
            );
          }}
          onChange={() => {
            if (!meshRef.current) return;
            updateTransformThroughComponentManager(
              meshRef.current,
              mode,
              entityId,
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
