import { PhysicsBox } from '@core/components/physics/PhysicsBox';

const LaneMaterial = () => <meshStandardMaterial color="#d9b675" roughness={0.3} metalness={0.1} />;
const WallMaterial = () => <meshStandardMaterial color="#8c6d46" roughness={0.7} metalness={0.2} />;
const GutterMaterial = () => (
  <meshStandardMaterial color="#333333" roughness={0.6} metalness={0.4} />
);

const BowlingLane = () => {
  return (
    <group>
      <PhysicsBox
        position={[0, -0.1, 0]}
        size={[2, 0.2, 20]}
        type="fixed"
        friction={0.1}
        restitution={0.2}
      >
        <mesh receiveShadow>
          <boxGeometry args={[2, 0.2, 20]} />
          <LaneMaterial />
        </mesh>
      </PhysicsBox>
      <PhysicsBox
        position={[-1.3, -0.2, 0]}
        size={[0.4, 0.1, 20]}
        type="fixed"
        friction={0.5}
        restitution={0.2}
      >
        <mesh receiveShadow>
          <boxGeometry args={[0.4, 0.1, 20]} />
          <GutterMaterial />
        </mesh>
      </PhysicsBox>
      <PhysicsBox
        position={[1.3, -0.2, 0]}
        size={[0.4, 0.1, 20]}
        type="fixed"
        friction={0.5}
        restitution={0.2}
      >
        <mesh receiveShadow>
          <boxGeometry args={[0.4, 0.1, 20]} />
          <GutterMaterial />
        </mesh>
      </PhysicsBox>
      <PhysicsBox
        position={[-2, 0.5, 0]}
        size={[0.2, 1, 20]}
        type="fixed"
        friction={0.8}
        restitution={0.4}
      >
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.2, 1, 20]} />
          <WallMaterial />
        </mesh>
      </PhysicsBox>
      <PhysicsBox
        position={[2, 0.5, 0]}
        size={[0.2, 1, 20]}
        type="fixed"
        friction={0.8}
        restitution={0.4}
      >
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.2, 1, 20]} />
          <WallMaterial />
        </mesh>
      </PhysicsBox>
      <PhysicsBox
        position={[0, 0.5, 10.1]}
        size={[4.2, 1, 0.2]}
        type="fixed"
        friction={0.8}
        restitution={0.4}
      >
        <mesh castShadow receiveShadow>
          <boxGeometry args={[4.2, 1, 0.2]} />
          <WallMaterial />
        </mesh>
      </PhysicsBox>
      <mesh position={[0, 0.011, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2, 20]} />
        <meshStandardMaterial color="#e9c68a" />
      </mesh>
      {[-8, -4, 0, 4, 8].map((z, i) => (
        <mesh key={i} position={[0, 0.011, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.05, 16]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      ))}
      <mesh position={[0, 0.011, 6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, 4]} />
        <meshStandardMaterial color="#e0b678" />
      </mesh>
    </group>
  );
};

export default BowlingLane;
