import { TransformControls } from '@react-three/drei';
import React, { MutableRefObject, useRef } from 'react';
import { Object3D } from 'three';

import { Transform, incrementWorldVersion } from '@/core/lib/ecs';

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
    Transform.position[entityId][0] = mesh.position.x;
    Transform.position[entityId][1] = mesh.position.y;
    Transform.position[entityId][2] = mesh.position.z;
    if (onTransformChange) {
      onTransformChange([mesh.position.x, mesh.position.y, mesh.position.z]);
    }
  } else if (mode === 'rotate') {
    const xDeg = mesh.rotation.x * (180 / Math.PI);
    const yDeg = mesh.rotation.y * (180 / Math.PI);
    const zDeg = mesh.rotation.z * (180 / Math.PI);
    Transform.rotation[entityId][0] = xDeg;
    Transform.rotation[entityId][1] = yDeg;
    Transform.rotation[entityId][2] = zDeg;
    if (onTransformChange) {
      onTransformChange([xDeg, yDeg, zDeg]);
    }
  } else if (mode === 'scale') {
    Transform.scale[entityId][0] = mesh.scale.x;
    Transform.scale[entityId][1] = mesh.scale.y;
    Transform.scale[entityId][2] = mesh.scale.z;
    if (onTransformChange) {
      onTransformChange([mesh.scale.x, mesh.scale.y, mesh.scale.z]);
    }
  }
  Transform.needsUpdate[entityId] = 1;
  incrementWorldVersion();
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
