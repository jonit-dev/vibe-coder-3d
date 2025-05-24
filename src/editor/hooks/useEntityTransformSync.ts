import { useFrame } from '@react-three/fiber';
import { RefObject } from 'react';
import { Mesh } from 'three';

interface IUseEntityTransformSyncProps {
  meshRef: RefObject<Mesh | null>;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  isTransforming: boolean;
  hasPhysics: boolean;
  setDragTick: (updateFn: (prev: number) => number) => void;
}

export const useEntityTransformSync = ({
  meshRef,
  position,
  rotation,
  scale,
  isTransforming,
  hasPhysics,
  setDragTick,
}: IUseEntityTransformSyncProps) => {
  // Sync mesh transform from ECS (but NOT during physics or transform)
  useFrame(() => {
    if (isTransforming) {
      setDragTick((tick: number) => tick + 1);
    }

    if (meshRef.current && !isTransforming && !hasPhysics) {
      // Only sync transform when NOT using physics, as physics will handle transform
      meshRef.current.position.set(position[0], position[1], position[2]);
      meshRef.current.rotation.set(
        rotation[0] * (Math.PI / 180),
        rotation[1] * (Math.PI / 180),
        rotation[2] * (Math.PI / 180),
      );
      meshRef.current.scale.set(scale[0], scale[1], scale[2]);
    }
  });
};
