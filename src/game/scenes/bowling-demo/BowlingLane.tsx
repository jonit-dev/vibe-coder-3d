import { useMemo } from 'react';
import { Euler, Quaternion } from 'three';

import { OptimizedEntityMesh } from '@core/components/OptimizedEntityMesh';
import { PhysicsBox } from '@core/components/physics/PhysicsBox';

const LaneMaterial = () => <meshStandardMaterial color="#d9b675" roughness={0.3} metalness={0.1} />;
const WallMaterial = () => <meshStandardMaterial color="#8c6d46" roughness={0.7} metalness={0.2} />;
const GutterMaterial = () => (
  <meshStandardMaterial color="#333333" roughness={0.6} metalness={0.4} />
);

// Convert Euler rotation to quaternion for OptimizedEntityMesh
const eulerToQuaternion = (x: number, y: number, z: number): [number, number, number, number] => {
  const quaternion = new Quaternion().setFromEuler(new Euler(x, y, z));
  return [quaternion.x, quaternion.y, quaternion.z, quaternion.w];
};

// Lane is a static object that doesn't change, so we can use a lower performance setting
const BowlingLane = () => {
  // Create circle positions once rather than in every render
  const spotPositions = useMemo(() => {
    return [-8, -4, 0, 4, 8].map((z, i) => ({ z, key: i }));
  }, []);

  // Create shared rotations
  const planeRotation = useMemo(() => eulerToQuaternion(-Math.PI / 2, 0, 0), []);

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
        <OptimizedEntityMesh receiveShadow performance="medium" frustumCulled={true}>
          <boxGeometry args={[2, 0.2, 20]} />
          <LaneMaterial />
        </OptimizedEntityMesh>
      </PhysicsBox>

      {/* Gutters - use low performance as they're less important visually */}
      <PhysicsBox
        position={[-1.3, -0.2, 0]}
        size={[0.4, 0.1, 20]}
        type="fixed"
        friction={0.5}
        restitution={0.2}
      >
        <OptimizedEntityMesh receiveShadow performance="low" frustumCulled={true}>
          <boxGeometry args={[0.4, 0.1, 20]} />
          <GutterMaterial />
        </OptimizedEntityMesh>
      </PhysicsBox>

      <PhysicsBox
        position={[1.3, -0.2, 0]}
        size={[0.4, 0.1, 20]}
        type="fixed"
        friction={0.5}
        restitution={0.2}
      >
        <OptimizedEntityMesh receiveShadow performance="low" frustumCulled={true}>
          <boxGeometry args={[0.4, 0.1, 20]} />
          <GutterMaterial />
        </OptimizedEntityMesh>
      </PhysicsBox>

      {/* Walls - use low performance as they're peripheral */}
      <PhysicsBox
        position={[-2, 0.5, 0]}
        size={[0.2, 1, 20]}
        type="fixed"
        friction={0.8}
        restitution={0.4}
      >
        <OptimizedEntityMesh castShadow receiveShadow performance="low" frustumCulled={true}>
          <boxGeometry args={[0.2, 1, 20]} />
          <WallMaterial />
        </OptimizedEntityMesh>
      </PhysicsBox>

      <PhysicsBox
        position={[2, 0.5, 0]}
        size={[0.2, 1, 20]}
        type="fixed"
        friction={0.8}
        restitution={0.4}
      >
        <OptimizedEntityMesh castShadow receiveShadow performance="low" frustumCulled={true}>
          <boxGeometry args={[0.2, 1, 20]} />
          <WallMaterial />
        </OptimizedEntityMesh>
      </PhysicsBox>

      <PhysicsBox
        position={[0, 0.5, 10.1]}
        size={[4.2, 1, 0.2]}
        type="fixed"
        friction={0.8}
        restitution={0.4}
      >
        <OptimizedEntityMesh castShadow receiveShadow performance="low" frustumCulled={true}>
          <boxGeometry args={[4.2, 1, 0.2]} />
          <WallMaterial />
        </OptimizedEntityMesh>
      </PhysicsBox>

      {/* Lane decorative elements - use low performance */}
      <OptimizedEntityMesh
        position={[0, 0.011, 0]}
        rotation={planeRotation}
        receiveShadow
        performance="low"
        frustumCulled={true}
      >
        <planeGeometry args={[2, 20]} />
        <meshStandardMaterial color="#e9c68a" />
      </OptimizedEntityMesh>

      {/* Lane spots - use low performance and batch them */}
      <group>
        {spotPositions.map(({ z, key }) => (
          <OptimizedEntityMesh
            key={key}
            position={[0, 0.011, z]}
            rotation={planeRotation}
            performance="low"
            frustumCulled={true}
          >
            <circleGeometry args={[0.05, 16]} />
            <meshStandardMaterial color="#333" />
          </OptimizedEntityMesh>
        ))}
      </group>

      <OptimizedEntityMesh
        position={[0, 0.011, 6]}
        rotation={planeRotation}
        performance="low"
        frustumCulled={true}
      >
        <planeGeometry args={[2, 4]} />
        <meshStandardMaterial color="#e0b678" />
      </OptimizedEntityMesh>
    </group>
  );
};

export default BowlingLane;
