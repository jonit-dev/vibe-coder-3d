import React, { ForwardedRef, forwardRef } from 'react';

import { MeshTypeEnum } from '@core/lib/ecs';

interface IEntityMeshProps {
  meshType: MeshTypeEnum;
  selected: boolean;
  meshRef: ForwardedRef<any>;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  children?: React.ReactNode; // for edges
}

const EntityMesh = forwardRef<any, IEntityMeshProps>(
  ({ meshType, selected, meshRef, position, rotation, scale, children }, ref) => (
    <mesh ref={meshRef} position={position} rotation={rotation} scale={scale} castShadow>
      {meshType === MeshTypeEnum.Cube ? (
        <boxGeometry args={[1, 1, 1]} />
      ) : meshType === MeshTypeEnum.Sphere ? (
        <sphereGeometry args={[0.5, 32, 32]} />
      ) : (
        <boxGeometry args={[1, 1, 1]} />
      )}
      <meshStandardMaterial color="#3399ff" />
      {children}
    </mesh>
  ),
);

export default EntityMesh;
