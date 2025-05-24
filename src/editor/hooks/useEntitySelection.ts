import { useFrame } from '@react-three/fiber';
import { RefObject, useState } from 'react';
import { Mesh, Quaternion, Vector3 } from 'three';

interface IUseEntitySelectionProps {
  meshRef: RefObject<Mesh | null>;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  isTransforming: boolean;
  hasPhysics: boolean;
}

export const useEntitySelection = ({
  meshRef,
  position,
  rotation,
  scale,
  isTransforming,
  hasPhysics,
}: IUseEntitySelectionProps) => {
  // State to track outline position that updates every frame
  const [outlinePosition, setOutlinePosition] = useState<[number, number, number]>(position);
  const [outlineRotation, setOutlineRotation] = useState<[number, number, number]>([
    rotation[0] * (Math.PI / 180),
    rotation[1] * (Math.PI / 180),
    rotation[2] * (Math.PI / 180),
  ]);
  const [outlineScale, setOutlineScale] = useState<[number, number, number]>(
    scale.map((s: number) => s + 0.05) as [number, number, number],
  );

  // Update outline position every frame when physics is active
  useFrame(() => {
    if ((isTransforming || hasPhysics) && meshRef.current) {
      if (hasPhysics) {
        // For physics, get world position since mesh is inside RigidBody
        const worldPosition = new Vector3();
        const worldQuaternion = new Quaternion();
        const worldScale = new Vector3();

        meshRef.current.getWorldPosition(worldPosition);
        meshRef.current.getWorldQuaternion(worldQuaternion);
        meshRef.current.getWorldScale(worldScale);

        setOutlinePosition([worldPosition.x, worldPosition.y, worldPosition.z]);
        // Convert quaternion to euler angles for the outline
        const euler = meshRef.current.rotation.clone();
        setOutlineRotation([euler.x, euler.y, euler.z]);
        setOutlineScale([worldScale.x + 0.05, worldScale.y + 0.05, worldScale.z + 0.05]);
      } else {
        // For local transform, use local position
        setOutlinePosition([
          meshRef.current.position.x,
          meshRef.current.position.y,
          meshRef.current.position.z,
        ]);
        setOutlineRotation([
          meshRef.current.rotation.x,
          meshRef.current.rotation.y,
          meshRef.current.rotation.z,
        ]);
        setOutlineScale([
          meshRef.current.scale.x + 0.05,
          meshRef.current.scale.y + 0.05,
          meshRef.current.scale.z + 0.05,
        ]);
      }
    } else {
      // Use ECS position when not transforming or physics
      setOutlinePosition(position);
      setOutlineRotation([
        rotation[0] * (Math.PI / 180),
        rotation[1] * (Math.PI / 180),
        rotation[2] * (Math.PI / 180),
      ]);
      setOutlineScale(scale.map((s: number) => s + 0.05) as [number, number, number]);
    }
  });

  return {
    outlinePosition,
    outlineRotation,
    outlineScale,
  };
};
