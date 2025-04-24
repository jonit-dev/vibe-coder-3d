import { useMemo } from 'react';
import { DoubleSide, Euler, Quaternion } from 'three';

import { EntityMesh } from '@/core';
import { PhysicsBox } from '@/core/components/physics/PhysicsBox';

// High quality materials with better reflections
const LaneMaterial = () => (
  <meshStandardMaterial color="#e6d2a8" roughness={0.03} metalness={0.4} envMapIntensity={2.0} />
);

const LaneOverlayMaterial = () => (
  <meshStandardMaterial
    color="#f0e0c0"
    roughness={0.04}
    metalness={0.3}
    envMapIntensity={1.8}
    transparent
    opacity={0.7}
  />
);

const PolishedLaneFinish = () => (
  <meshStandardMaterial
    color="#ffffff"
    roughness={0.01}
    metalness={0.5}
    transparent
    opacity={0.15}
    envMapIntensity={3.0}
  />
);

const WallMaterial = () => <meshStandardMaterial color="#8c6d46" roughness={0.7} metalness={0.2} />;

const GutterMaterial = () => (
  <meshStandardMaterial color="#111111" roughness={0.2} metalness={0.8} envMapIntensity={1.2} />
);

// Convert Euler rotation to quaternion for EntityMesh
const eulerToQuaternion = (x: number, y: number, z: number): [number, number, number, number] => {
  const quaternion = new Quaternion().setFromEuler(new Euler(x, y, z));
  return [quaternion.x, quaternion.y, quaternion.z, quaternion.w];
};

// Arrow marker component
const ArrowMarker = ({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation?: [number, number, number, number];
}) => (
  <EntityMesh position={position} rotation={rotation} performance="medium" frustumCulled={true}>
    <planeGeometry args={[0.15, 0.15]} />
    <meshStandardMaterial color="#222222" side={DoubleSide} />
  </EntityMesh>
);

// Improved gutter with realistic depression
const ConcaveGutter = ({
  position,
  isLeft,
}: {
  position: [number, number, number];
  isLeft: boolean;
}) => {
  // Adjust rotation based on whether it's the left or right gutter
  const angle = Math.PI / 5; // Less steep angle for more realistic look
  const rotation: [number, number, number] = isLeft ? [0, 0, angle] : [0, 0, -angle];
  const secondRotation: [number, number, number] = isLeft ? [0, 0, -angle] : [0, 0, angle];

  return (
    <group position={position}>
      {/* Main gutter piece - angled to create depression */}
      <PhysicsBox
        position={[isLeft ? -0.12 : 0.12, -0.12, 0]}
        rotation={rotation}
        size={[0.38, 0.05, 20]}
        type="fixed"
        friction={0.5}
        restitution={0.2}
      >
        <EntityMesh receiveShadow performance="medium" frustumCulled={true}>
          <boxGeometry args={[0.38, 0.05, 20]} />
          <GutterMaterial />
        </EntityMesh>
      </PhysicsBox>

      {/* Second gutter piece - angled opposite to create V shape */}
      <PhysicsBox
        position={[isLeft ? 0.12 : -0.12, -0.12, 0]}
        rotation={secondRotation}
        size={[0.38, 0.05, 20]}
        type="fixed"
        friction={0.5}
        restitution={0.2}
      >
        <EntityMesh receiveShadow performance="medium" frustumCulled={true}>
          <boxGeometry args={[0.38, 0.05, 20]} />
          <GutterMaterial />
        </EntityMesh>
      </PhysicsBox>

      {/* Bottom piece */}
      <PhysicsBox
        position={[0, -0.2, 0]}
        size={[0.5, 0.05, 20]}
        type="fixed"
        friction={0.5}
        restitution={0.2}
      >
        <EntityMesh receiveShadow performance="medium" frustumCulled={true}>
          <boxGeometry args={[0.5, 0.05, 20]} />
          <GutterMaterial />
        </EntityMesh>
      </PhysicsBox>

      {/* Add highlights to create a realistic shine */}
      <mesh position={[0, -0.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.3, 20]} />
        <meshStandardMaterial
          color="#444444"
          roughness={0.1}
          metalness={0.9}
          envMapIntensity={2.0}
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  );
};

// Lane is a static object that doesn't change, so we can use a lower performance setting
const BowlingLane = () => {
  // Create arrow marker patterns
  const arrowPositions = useMemo(() => {
    // Standard bowling lane has arrows at 7.5 feet from foul line
    const zOffset = -2; // Arrows are typically around 7 feet from the foul line

    // Create 5 arrows in a row
    return [
      { x: -0.6, z: zOffset, key: 0 },
      { x: -0.3, z: zOffset, key: 1 },
      { x: 0, z: zOffset, key: 2 },
      { x: 0.3, z: zOffset, key: 3 },
      { x: 0.6, z: zOffset, key: 4 },
    ];
  }, []);

  // Create dot positions for lane markers
  const dotPositions = useMemo(() => {
    // Create pattern of dots down the lane
    const dots = [];
    // First row of dots closer to the player
    const firstRowZ = -5;
    for (let x = -0.6; x <= 0.6; x += 0.3) {
      dots.push({ x, z: firstRowZ, key: `first-${x}` });
    }

    // Second row of dots
    const secondRowZ = 0;
    for (let x = -0.6; x <= 0.6; x += 0.3) {
      dots.push({ x, z: secondRowZ, key: `second-${x}` });
    }

    // Third row of dots
    const thirdRowZ = 5;
    for (let x = -0.6; x <= 0.6; x += 0.3) {
      dots.push({ x, z: thirdRowZ, key: `third-${x}` });
    }

    return dots;
  }, []);

  // Create shared rotations
  const planeRotation = useMemo(() => eulerToQuaternion(-Math.PI / 2, 0, 0), []);

  // Create arrow rotation
  const arrowRotation = useMemo(() => eulerToQuaternion(-Math.PI / 2, 0, 0), []);

  // Generate wood grain pattern positions
  const woodGrainPositions = useMemo(() => {
    const positions = [];
    for (let i = 0; i < 10; i++) {
      positions.push({
        x: Math.random() * 1.6 - 0.8,
        z: Math.random() * 18 - 9,
        width: Math.random() * 0.2 + 0.05,
        length: Math.random() * 3 + 2,
        key: `grain-${i}`,
      });
    }
    return positions;
  }, []);

  return (
    <group>
      {/* Main lane surface - most visible object, use medium performance */}
      <PhysicsBox
        position={[0, -0.1, 0]}
        size={[2, 0.2, 20]}
        type="fixed"
        friction={0.1}
        restitution={0.2}
      >
        <EntityMesh receiveShadow performance="high" frustumCulled={true}>
          <boxGeometry args={[2, 0.2, 20]} />
          <LaneMaterial />
        </EntityMesh>
      </PhysicsBox>

      {/* Lane surface texture overlay */}
      <EntityMesh
        position={[0, 0.012, 0]}
        rotation={planeRotation}
        receiveShadow
        performance="high"
        frustumCulled={true}
      >
        <planeGeometry args={[1.95, 19.9]} />
        <LaneOverlayMaterial />
      </EntityMesh>

      {/* Wood grain details for lane realism */}
      {woodGrainPositions.map(({ x, z, width, length, key }) => (
        <EntityMesh
          key={key}
          position={[x, 0.013, z]}
          rotation={planeRotation}
          performance="medium"
          frustumCulled={true}
        >
          <planeGeometry args={[width, length]} />
          <meshStandardMaterial color="#e0c080" transparent opacity={0.15} roughness={0.1} />
        </EntityMesh>
      ))}

      {/* Lane polish/oil - gives the shiny reflective appearance */}
      <EntityMesh
        position={[0, 0.014, 0]}
        rotation={planeRotation}
        receiveShadow
        performance="high"
        frustumCulled={true}
      >
        <planeGeometry args={[1.9, 19.8]} />
        <PolishedLaneFinish />
      </EntityMesh>

      {/* Concave gutters with depression in the middle */}
      <ConcaveGutter position={[-1.25, -0.2, 0]} isLeft={true} />
      <ConcaveGutter position={[1.25, -0.2, 0]} isLeft={false} />

      {/* Side walls */}
      <PhysicsBox
        position={[-2, 0.5, 0]}
        size={[0.2, 1, 20]}
        type="fixed"
        friction={0.8}
        restitution={0.4}
      >
        <EntityMesh castShadow receiveShadow performance="low" frustumCulled={true}>
          <boxGeometry args={[0.2, 1, 20]} />
          <WallMaterial />
        </EntityMesh>
      </PhysicsBox>

      <PhysicsBox
        position={[2, 0.5, 0]}
        size={[0.2, 1, 20]}
        type="fixed"
        friction={0.8}
        restitution={0.4}
      >
        <EntityMesh castShadow receiveShadow performance="low" frustumCulled={true}>
          <boxGeometry args={[0.2, 1, 20]} />
          <WallMaterial />
        </EntityMesh>
      </PhysicsBox>

      <PhysicsBox
        position={[0, 0.5, 10.1]}
        size={[4.2, 1, 0.2]}
        type="fixed"
        friction={0.8}
        restitution={0.4}
      >
        <EntityMesh castShadow receiveShadow performance="low" frustumCulled={true}>
          <boxGeometry args={[4.2, 1, 0.2]} />
          <WallMaterial />
        </EntityMesh>
      </PhysicsBox>

      {/* Arrow markers - standard bowling lane has arrow markers */}
      {arrowPositions.map(({ x, z, key }) => (
        <ArrowMarker key={`arrow-${key}`} position={[x, 0.016, z]} rotation={arrowRotation} />
      ))}

      {/* Dot markers along the lane */}
      {dotPositions.map(({ x, z, key }) => (
        <EntityMesh
          key={key}
          position={[x, 0.016, z]}
          rotation={planeRotation}
          performance="low"
          frustumCulled={true}
        >
          <circleGeometry args={[0.05, 16]} />
          <meshStandardMaterial color="#333" />
        </EntityMesh>
      ))}

      {/* Lane approach area - different wood tone */}
      <EntityMesh
        position={[0, 0.011, -14]}
        rotation={planeRotation}
        receiveShadow
        performance="medium"
        frustumCulled={true}
      >
        <planeGeometry args={[2, 4]} />
        <meshStandardMaterial color="#d4b278" roughness={0.06} metalness={0.2} />
      </EntityMesh>

      {/* Foul line */}
      <EntityMesh
        position={[0, 0.014, -10]}
        rotation={planeRotation}
        performance="medium"
        frustumCulled={true}
      >
        <planeGeometry args={[2, 0.1]} />
        <meshBasicMaterial color="#ffffff" />
      </EntityMesh>

      {/* Pin deck area - different section at the end */}
      <EntityMesh
        position={[0, 0.013, 8]}
        rotation={planeRotation}
        performance="medium"
        frustumCulled={true}
      >
        <planeGeometry args={[2, 4]} />
        <meshStandardMaterial
          color="#e0b678"
          roughness={0.04}
          metalness={0.2}
          envMapIntensity={1.2}
        />
      </EntityMesh>

      {/* Lane divider caps - white line between lane and gutter */}
      <EntityMesh
        position={[-0.98, 0.015, 0]}
        rotation={planeRotation}
        performance="medium"
        frustumCulled={true}
      >
        <planeGeometry args={[0.03, 20]} />
        <meshStandardMaterial color="#ffffff" />
      </EntityMesh>

      <EntityMesh
        position={[0.98, 0.015, 0]}
        rotation={planeRotation}
        performance="medium"
        frustumCulled={true}
      >
        <planeGeometry args={[0.03, 20]} />
        <meshStandardMaterial color="#ffffff" />
      </EntityMesh>
    </group>
  );
};

export default BowlingLane;
