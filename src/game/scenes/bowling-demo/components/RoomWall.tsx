import { FC } from 'react';

import { EntityMesh } from '@/core/components/EntityMesh';
import { PhysicsBox } from '@core/components/physics/PhysicsBox';

export interface IRoomWallProps {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  shadowQuality?: 'low' | 'medium' | 'high';
}

/**
 * RoomWall creates a physics-enabled wall with material properties
 */
const RoomWall: FC<IRoomWallProps> = ({
  position,
  size,
  color = '#666666',
  roughness = 0.7,
  metalness = 0.1,
  emissive = '#000000',
  emissiveIntensity = 0,
  shadowQuality = 'medium',
}) => {
  return (
    <PhysicsBox position={position} size={size} type="fixed">
      <EntityMesh castShadow receiveShadow performance={shadowQuality}>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          roughness={roughness}
          metalness={metalness}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </EntityMesh>
    </PhysicsBox>
  );
};

export default RoomWall;
