import { useMemo } from 'react';
import { DoubleSide, Euler, Quaternion } from 'three';

import { EntityMesh } from '@/core/components/EntityMesh';
import { PhysicsBox } from '@core/components/physics/PhysicsBox';

interface IBowlingRoomProps {
  width?: number;
  length?: number;
  height?: number;
  laneWidth?: number;
  laneCount?: number;
  shadowQuality?: 'low' | 'medium' | 'high';
}

// Helper function to convert Euler to Quaternion
const eulerToQuaternion = (x: number, y: number, z: number): [number, number, number, number] => {
  const euler = new Euler(x, y, z);
  const quaternion = new Quaternion();
  quaternion.setFromEuler(euler);
  return [quaternion.x, quaternion.y, quaternion.z, quaternion.w];
};

// Material components with improved lighting properties - simplified to reduce texture usage
const CeilingPanelMaterial = () => (
  <meshStandardMaterial color="#e2d7c1" roughness={0.6} metalness={0.1} />
);

const FloorMaterial = () => (
  <meshStandardMaterial color="#333333" roughness={0.4} metalness={0.2} />
);

const WallMaterial = () => <meshStandardMaterial color="#666666" roughness={0.7} metalness={0.1} />;

const BackWallMaterial = () => (
  <meshStandardMaterial color="#222222" roughness={0.8} metalness={0.2} />
);

const FrontWallMaterial = () => (
  <meshStandardMaterial color="#151515" roughness={0.7} metalness={0.3} />
);

// Simplified neon sign
const NeonSign = ({ position }: { position: [number, number, number] }) => (
  <group position={position}>
    {/* Black background panel */}
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[4, 0.8, 0.05]} />
      <meshStandardMaterial color="#111111" />
    </mesh>

    {/* Neon lights effect */}
    <mesh position={[-1.5, 0, 0.03]}>
      <boxGeometry args={[0.6, 0.4, 0.01]} />
      <meshStandardMaterial color="#ff3333" emissive="#ff3333" emissiveIntensity={1} />
    </mesh>

    <mesh position={[-0.5, 0, 0.03]}>
      <boxGeometry args={[0.6, 0.4, 0.01]} />
      <meshStandardMaterial color="#33ff33" emissive="#33ff33" emissiveIntensity={1} />
    </mesh>

    <mesh position={[0.5, 0, 0.03]}>
      <boxGeometry args={[0.6, 0.4, 0.01]} />
      <meshStandardMaterial color="#3333ff" emissive="#3333ff" emissiveIntensity={1} />
    </mesh>

    <mesh position={[1.5, 0, 0.03]}>
      <boxGeometry args={[0.6, 0.4, 0.01]} />
      <meshStandardMaterial color="#ffff33" emissive="#ffff33" emissiveIntensity={1} />
    </mesh>
  </group>
);

const BowlingRoom = ({
  length = 40,
  height = 6,
  laneWidth = 2,
  laneCount = 1, // Set default to 1 to match existing lane
  shadowQuality = 'medium',
}: IBowlingRoomProps) => {
  // Calculate total bowling area width
  const totalWidth = laneWidth * laneCount + 4; // +4 for additional wall space
  const halfWidth = totalWidth / 2;
  const halfLength = length / 2;

  // Create shared rotations
  const planeRotation = useMemo(() => eulerToQuaternion(-Math.PI / 2, 0, 0), []);

  return (
    <group>
      {/* Floor */}
      <EntityMesh
        position={[0, -0.5, 0]}
        rotation={planeRotation}
        receiveShadow
        performance={shadowQuality}
      >
        <planeGeometry args={[totalWidth, length]} />
        <FloorMaterial />
      </EntityMesh>

      {/* Ceiling */}
      <EntityMesh
        position={[0, height, 0]}
        rotation={planeRotation}
        receiveShadow
        performance={shadowQuality}
      >
        <planeGeometry args={[totalWidth, length]} />
        <CeilingPanelMaterial />
      </EntityMesh>

      {/* Recessed ceiling lights */}
      {Array.from({ length: 5 }).map((_, idx) => (
        <group key={`ceiling-light-${idx}`} position={[0, height - 0.05, -halfLength + 8 * idx]}>
          <pointLight
            position={[0, -0.3, 0]}
            intensity={0.4}
            distance={10}
            castShadow={shadowQuality !== 'low'}
          />
          <EntityMesh position={[0, 0, 0]} performance={shadowQuality}>
            <boxGeometry args={[totalWidth, 0.1, 0.3]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={0.8}
              roughness={0.5}
            />
          </EntityMesh>
        </group>
      ))}

      {/* Side Walls */}
      <PhysicsBox position={[-halfWidth, height / 2, 0]} size={[0.2, height, length]} type="fixed">
        <EntityMesh castShadow receiveShadow performance={shadowQuality}>
          <boxGeometry args={[0.2, height, length]} />
          <WallMaterial />
        </EntityMesh>
      </PhysicsBox>

      <PhysicsBox position={[halfWidth, height / 2, 0]} size={[0.2, height, length]} type="fixed">
        <EntityMesh castShadow receiveShadow performance={shadowQuality}>
          <boxGeometry args={[0.2, height, length]} />
          <WallMaterial />
        </EntityMesh>
      </PhysicsBox>

      {/* Front Wall (near player) - now black with decorations */}
      <PhysicsBox
        position={[0, height / 2, -halfLength]}
        size={[totalWidth, height, 0.2]}
        type="fixed"
      >
        <EntityMesh castShadow receiveShadow performance={shadowQuality}>
          <boxGeometry args={[totalWidth, height, 0.2]} />
          <FrontWallMaterial />
        </EntityMesh>
      </PhysicsBox>

      {/* Decorative elements on the front wall */}
      <NeonSign position={[0, height * 0.7, -halfLength + 0.11]} />

      {/* Decorative stripes on the front wall */}
      <mesh position={[0, height * 0.3, -halfLength + 0.11]}>
        <boxGeometry args={[totalWidth * 0.9, 0.1, 0.01]} />
        <meshStandardMaterial color="#cc3333" emissive="#cc3333" emissiveIntensity={0.3} />
      </mesh>

      <mesh position={[0, height * 0.2, -halfLength + 0.11]}>
        <boxGeometry args={[totalWidth * 0.9, 0.1, 0.01]} />
        <meshStandardMaterial color="#3333cc" emissive="#3333cc" emissiveIntensity={0.3} />
      </mesh>

      {/* Back Wall (pin area) */}
      <PhysicsBox
        position={[0, height / 2, halfLength]}
        size={[totalWidth, height, 0.2]}
        type="fixed"
      >
        <EntityMesh castShadow receiveShadow performance={shadowQuality}>
          <boxGeometry args={[totalWidth, height, 0.2]} />
          <BackWallMaterial />
        </EntityMesh>
      </PhysicsBox>

      {/* Decorative back wall - simplified single panel */}
      <EntityMesh position={[0, height / 2, halfLength - 0.11]} performance={shadowQuality}>
        <planeGeometry args={[totalWidth - 0.5, height - 0.5]} />
        <meshStandardMaterial
          color="#2D9CDB"
          emissive="#2D9CDB"
          emissiveIntensity={0.2}
          side={DoubleSide}
        />
      </EntityMesh>

      {/* Basic lighting */}
      <ambientLight intensity={0.2} />
      <pointLight position={[0, height - 1, 0]} intensity={0.3} />
      <pointLight position={[0, height - 1, halfLength * 0.5]} intensity={0.3} />
    </group>
  );
};

export default BowlingRoom;
