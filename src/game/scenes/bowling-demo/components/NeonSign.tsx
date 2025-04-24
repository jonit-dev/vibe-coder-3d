import { FC } from 'react';

export interface INeonSignProps {
  position: [number, number, number];
  width?: number;
  height?: number;
  colors?: string[];
}

/**
 * NeonSign creates a decorative neon sign with multiple colored segments
 */
const NeonSign: FC<INeonSignProps> = ({
  position,
  width = 4,
  height = 0.8,
  colors = ['#ff3333', '#33ff33', '#3333ff', '#ffff33'],
}) => {
  const segmentWidth = width / colors.length;
  const spacing = segmentWidth * 0.9;

  return (
    <group position={position}>
      {/* Background panel */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width, height, 0.05]} />
        <meshStandardMaterial color="#111111" />
      </mesh>

      {/* Neon light segments */}
      {colors.map((color, idx) => {
        const x = -width / 2 + segmentWidth / 2 + idx * segmentWidth;
        return (
          <mesh key={`neon-${idx}`} position={[x, 0, 0.03]}>
            <boxGeometry args={[spacing, height * 0.5, 0.01]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} />
          </mesh>
        );
      })}
    </group>
  );
};

export default NeonSign;
