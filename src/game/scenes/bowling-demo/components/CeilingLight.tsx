import { FC } from 'react';

import { EntityMesh } from '@/core/components/EntityMesh';

export interface ICeilingLightProps {
  position: [number, number, number];
  width?: number;
  intensity?: number;
  distance?: number;
  castShadow?: boolean;
  performance?: 'low' | 'medium' | 'high';
}

/**
 * CeilingLight creates a recessed ceiling light with point light
 */
const CeilingLight: FC<ICeilingLightProps> = ({
  position,
  width = 4,
  intensity = 0.4,
  distance = 10,
  castShadow = true,
  performance = 'medium',
}) => {
  return (
    <group position={position}>
      <pointLight
        position={[0, -0.3, 0]}
        intensity={intensity}
        distance={distance}
        castShadow={castShadow}
      />
      <EntityMesh position={[0, 0, 0]} performance={performance}>
        <boxGeometry args={[width, 0.1, 0.3]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.8}
          roughness={0.5}
        />
      </EntityMesh>
    </group>
  );
};

export default CeilingLight;
