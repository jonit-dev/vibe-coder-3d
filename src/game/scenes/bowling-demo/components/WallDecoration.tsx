import { FC } from 'react';

export interface IWallDecorationProps {
  position: [number, number, number];
  width?: number;
  height?: number;
  depth?: number;
  color?: string;
  emissive?: string;
  emissiveIntensity?: number;
}

/**
 * WallDecoration creates decorative stripes or panels for walls
 */
const WallDecoration: FC<IWallDecorationProps> = ({
  position,
  width = 4,
  height = 0.1,
  depth = 0.01,
  color = '#cc3333',
  emissive = '#cc3333',
  emissiveIntensity = 0.3,
}) => {
  return (
    <mesh position={position}>
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
      />
    </mesh>
  );
};

export default WallDecoration;
