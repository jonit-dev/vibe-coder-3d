import { TransformControls } from '@react-three/drei';
import React, { MutableRefObject, useRef } from 'react';
import { Object3D } from 'three';

import { Transform } from '@/core/lib/ecs';

type GizmoMode = 'translate' | 'rotate' | 'scale';

export interface IGizmoControlsProps {
  meshRef: MutableRefObject<Object3D | null>;
  mode: GizmoMode;
  entityId: number;
  onTransformChange?: (values: [number, number, number]) => void;
  setIsTransforming?: (isTransforming: boolean) => void;
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
            if (mode === 'translate') {
              Transform.position[entityId][0] = meshRef.current.position.x;
              Transform.position[entityId][1] = meshRef.current.position.y;
              Transform.position[entityId][2] = meshRef.current.position.z;
              if (onTransformChange) {
                onTransformChange([
                  meshRef.current.position.x,
                  meshRef.current.position.y,
                  meshRef.current.position.z,
                ]);
              }
            } else if (mode === 'rotate') {
              const xDeg = meshRef.current.rotation.x * (180 / Math.PI);
              const yDeg = meshRef.current.rotation.y * (180 / Math.PI);
              const zDeg = meshRef.current.rotation.z * (180 / Math.PI);
              Transform.rotation[entityId][0] = xDeg;
              Transform.rotation[entityId][1] = yDeg;
              Transform.rotation[entityId][2] = zDeg;
              if (onTransformChange) {
                onTransformChange([xDeg, yDeg, zDeg]);
              }
            } else if (mode === 'scale') {
              Transform.scale[entityId][0] = meshRef.current.scale.x;
              Transform.scale[entityId][1] = meshRef.current.scale.y;
              Transform.scale[entityId][2] = meshRef.current.scale.z;
              if (onTransformChange) {
                onTransformChange([
                  meshRef.current.scale.x,
                  meshRef.current.scale.y,
                  meshRef.current.scale.z,
                ]);
              }
            }
            Transform.needsUpdate[entityId] = 1;
          }}
          onMouseDown={() => setIsTransforming && setIsTransforming(true)}
          onMouseUp={() => setIsTransforming && setIsTransforming(false)}
        />
      )}
    </>
  );
};
