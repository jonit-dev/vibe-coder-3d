import { OrbitControls, Text } from '@react-three/drei';
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RapierRigidBody,
  RigidBody,
  useRevoluteJoint,
} from '@react-three/rapier';
import { useEffect, useRef, useState } from 'react';

/**
 * A simple box with physics
 */
const PhysicsBox = ({
  position,
  size = [1, 1, 1],
  color = '#f15946',
}: {
  position: [number, number, number];
  size?: [number, number, number];
  color?: string;
}) => {
  const rigidBody = useRef<RapierRigidBody>(null);

  // Apply random impulse when clicked
  const handleClick = () => {
    if (rigidBody.current) {
      const impulse = {
        x: (Math.random() - 0.5) * 10,
        y: Math.random() * 10,
        z: (Math.random() - 0.5) * 10,
      };

      rigidBody.current.applyImpulse(impulse, true);
    }
  };

  return (
    <RigidBody position={position} ref={rigidBody} colliders="cuboid" restitution={0.7}>
      <mesh castShadow receiveShadow onClick={handleClick}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} />
      </mesh>
    </RigidBody>
  );
};

/**
 * A rotating pendulum with a joint
 */
const Pendulum = ({ position = [0, 8, 0] }: { position?: [number, number, number] }) => {
  const anchor = useRef<RapierRigidBody>(null);
  const pendulum = useRef<RapierRigidBody>(null);

  // Create a revolute joint between the anchor and pendulum
  const jointAxis: [number, number, number] = [0, 0, 1];

  useRevoluteJoint(
    anchor as React.RefObject<RapierRigidBody>,
    pendulum as React.RefObject<RapierRigidBody>,
    [
      // Position in anchor's local space
      [0, -2, 0] as [number, number, number],
      // Position in pendulum's local space
      [0, 2, 0] as [number, number, number],
      // Axis of rotation
      jointAxis,
    ],
  );

  return (
    <group position={position}>
      {/* Anchor */}
      <RigidBody ref={anchor} type="fixed">
        <mesh castShadow>
          <boxGeometry args={[0.5, 1, 0.5]} />
          <meshStandardMaterial color="#545454" />
        </mesh>
      </RigidBody>

      {/* Pendulum body */}
      <RigidBody ref={pendulum} position={[0, -4, 0]} colliders={false}>
        <BallCollider args={[1]} position={[0, -1, 0]} />
        <mesh castShadow>
          <cylinderGeometry args={[0.1, 0.1, 4]} />
          <meshStandardMaterial color="#898989" />
        </mesh>
        <mesh castShadow position={[0, -2, 0]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#4e598c" />
        </mesh>
      </RigidBody>
    </group>
  );
};

/**
 * A seesaw with a pivot joint
 */
const Seesaw = ({ position = [0, 1, 0] }: { position?: [number, number, number] }) => {
  const base = useRef<RapierRigidBody>(null);
  const plank = useRef<RapierRigidBody>(null);

  // Create a revolute joint for the seesaw
  const jointAxis: [number, number, number] = [0, 0, 1];

  useRevoluteJoint(
    base as React.RefObject<RapierRigidBody>,
    plank as React.RefObject<RapierRigidBody>,
    [
      // Position in base's local space
      [0, 1, 0] as [number, number, number],
      // Position in plank's local space
      [0, 0, 0] as [number, number, number],
      // Axis of rotation
      jointAxis,
    ],
  );

  return (
    <group position={position}>
      {/* Base */}
      <RigidBody ref={base} type="fixed">
        <mesh castShadow>
          <coneGeometry args={[1, 1, 32]} />
          <meshStandardMaterial color="#393e41" />
        </mesh>
      </RigidBody>

      {/* Plank */}
      <RigidBody ref={plank} colliders={false}>
        <CuboidCollider args={[4, 0.2, 1]} />
        <mesh castShadow>
          <boxGeometry args={[8, 0.4, 2]} />
          <meshStandardMaterial color="#d5ac4e" />
        </mesh>
      </RigidBody>
    </group>
  );
};

/**
 * Floor component
 */
const Floor = () => {
  return (
    <RigidBody type="fixed" friction={0.7}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.5, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
    </RigidBody>
  );
};

/**
 * Advanced Physics Demo component
 */
export const AdvancedPhysicsDemo = () => {
  const [showHelp, setShowHelp] = useState(true);

  // Hide help text after a few seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHelp(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'h') {
        setShowHelp((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 10, 10]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      <OrbitControls enableDamping dampingFactor={0.05} minDistance={5} maxDistance={30} />

      <Physics gravity={[0, -9.81, 0]}>
        <Floor />

        {/* Pendulums */}
        <Pendulum position={[-8, 10, -8]} />
        <Pendulum position={[-8, 10, 0]} />
        <Pendulum position={[-8, 10, 8]} />

        {/* Seesaws */}
        <Seesaw position={[8, 1, -6]} />
        <Seesaw position={[8, 1, 6]} />

        {/* Add some boxes on the seesaws */}
        <PhysicsBox position={[6, 3, -6]} size={[1, 1, 1]} color="#f15946" />
        <PhysicsBox position={[10, 3, -6]} size={[1, 1, 1]} color="#f15946" />
        <PhysicsBox position={[6, 3, 6]} size={[0.8, 0.8, 0.8]} color="#f15946" />
        <PhysicsBox position={[10, 3, 6]} size={[1.2, 1.2, 1.2]} color="#f15946" />

        {/* Add some boxes around the scene */}
        <PhysicsBox position={[0, 3, 0]} size={[1, 1, 1]} color="#5463ff" />
        <PhysicsBox position={[2, 5, 2]} size={[1.5, 1.5, 1.5]} color="#549bff" />
        <PhysicsBox position={[-2, 4, 2]} size={[1, 1, 1]} color="#43bccd" />
        <PhysicsBox position={[0, 6, -3]} size={[1.2, 1.2, 1.2]} color="#f9c80e" />
      </Physics>

      {showHelp && (
        <Text
          position={[0, 2, -15]}
          fontSize={0.8}
          color="white"
          anchorX="center"
          anchorY="middle"
          maxWidth={10}
          textAlign="center"
        >
          Click on boxes to apply random forces{'\n'}
          Press 'H' to toggle help
        </Text>
      )}
    </>
  );
};
