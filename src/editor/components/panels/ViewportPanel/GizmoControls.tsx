import { TransformControls } from '@react-three/drei';
import React, { MutableRefObject, useRef } from 'react';
import { Object3D } from 'three';

import { ecsManager } from '@/core/lib/ecs-manager';
import { frameEventBatch } from '@core/lib/ecs-events';

type GizmoMode = 'translate' | 'rotate' | 'scale';

export interface IGizmoControlsProps {
  meshRef: MutableRefObject<Object3D | null>;
  mode: GizmoMode;
  entityId: number;
  onTransformChange?: (values: [number, number, number]) => void;
  setIsTransforming?: (isTransforming: boolean) => void;
}

function updateEcsFromMesh(
  mesh: Object3D,
  mode: GizmoMode,
  entityId: number,
  onTransformChange?: (values: [number, number, number]) => void,
) {
  if (mode === 'translate') {
    const position: [number, number, number] = [mesh.position.x, mesh.position.y, mesh.position.z];
    ecsManager.updateTransform(entityId, { position });
    if (onTransformChange) {
      onTransformChange(position);
    }
  } else if (mode === 'rotate') {
    const xDeg = mesh.rotation.x * (180 / Math.PI);
    const yDeg = mesh.rotation.y * (180 / Math.PI);
    const zDeg = mesh.rotation.z * (180 / Math.PI);
    const rotation: [number, number, number] = [xDeg, yDeg, zDeg];
    ecsManager.updateTransform(entityId, { rotation });
    if (onTransformChange) {
      onTransformChange(rotation);
    }
  } else if (mode === 'scale') {
    const scale: [number, number, number] = [mesh.scale.x, mesh.scale.y, mesh.scale.z];
    ecsManager.updateTransform(entityId, { scale });
    if (onTransformChange) {
      onTransformChange(scale);
    }
  }

  // Immediately emit events to ensure inspector panel updates
  frameEventBatch.emit();
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
            updateEcsFromMesh(meshRef.current, mode, entityId, onTransformChange);
          }}
          onChange={() => {
            if (!meshRef.current) return;
            updateEcsFromMesh(meshRef.current, mode, entityId, onTransformChange);
          }}
          onMouseDown={() => setIsTransforming && setIsTransforming(true)}
          onMouseUp={() => setIsTransforming && setIsTransforming(false)}
        />
      )}
    </>
  );
};
