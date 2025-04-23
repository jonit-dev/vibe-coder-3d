import { OrbitControls, Text } from '@react-three/drei';
import { CuboidCollider, Physics, RigidBody } from '@react-three/rapier';
import { ReactNode, useEffect, useRef, useState } from 'react';

const colors = ['#fe4a49', '#2ab7ca', '#fed766', '#e6e6ea', '#f4f4f8'];

/**
 * A simple box with physics
 */
const PhysicsBox = ({
  position,
  size = [1, 1, 1],
  color,
}: {
  position: [number, number, number];
  size?: [number, number, number];
  color: string;
}) => {
  const ref = useRef<any>(null);

  return (
    <RigidBody position={position} ref={ref} colliders="cuboid" restitution={0.7}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} />
      </mesh>
    </RigidBody>
  );
};

/**
 * A simple sphere with physics
 */
const PhysicsSphere = ({
  position,
  radius = 0.5,
  color,
}: {
  position: [number, number, number];
  radius?: number;
  color: string;
}) => {
  const ref = useRef<any>(null);

  return (
    <RigidBody position={position} ref={ref} colliders="ball" restitution={0.7}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </RigidBody>
  );
};

/**
 * A floor plane
 */
const Floor = () => {
  return (
    <RigidBody type="fixed" friction={1}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.5, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
    </RigidBody>
  );
};

/**
 * Creates a random box at a random position
 */
const createRandomObject = (count: number) => {
  const objects = [];

  for (let i = 0; i < count; i++) {
    const isBox = Math.random() > 0.5;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const x = (Math.random() - 0.5) * 8;
    const y = Math.random() * 10 + 2;
    const z = (Math.random() - 0.5) * 8;

    if (isBox) {
      const size: [number, number, number] = [
        Math.random() * 0.5 + 0.5,
        Math.random() * 0.5 + 0.5,
        Math.random() * 0.5 + 0.5,
      ];
      objects.push(<PhysicsBox key={`box-${i}`} position={[x, y, z]} size={size} color={color} />);
    } else {
      const radius = Math.random() * 0.5 + 0.3;
      objects.push(
        <PhysicsSphere key={`sphere-${i}`} position={[x, y, z]} radius={radius} color={color} />
      );
    }
  }

  return objects;
};

/**
 * PhysicsDemo component
 */
export const PhysicsDemo = () => {
  const [debugMode, setDebugMode] = useState(false);
  const [objects, setObjects] = useState<ReactNode[]>([]);

  // Add keyboard listener to toggle debug mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'd') {
        setDebugMode((prev) => !prev);
      }
      if (e.key === 'r') {
        // Reset scene by adding new objects
        setObjects(createRandomObject(10));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initialize with some objects
  useEffect(() => {
    setObjects(createRandomObject(10));
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
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      <OrbitControls enableDamping dampingFactor={0.05} minDistance={5} maxDistance={20} />

      <Physics gravity={[0, -9.81, 0]}>
        <Floor />

        {/* Add walls to contain objects */}
        <CuboidCollider args={[15, 10, 0.5]} position={[0, 10, -15]} sensor={false} />
        <CuboidCollider args={[15, 10, 0.5]} position={[0, 10, 15]} sensor={false} />
        <CuboidCollider args={[0.5, 10, 15]} position={[-15, 10, 0]} sensor={false} />
        <CuboidCollider args={[0.5, 10, 15]} position={[15, 10, 0]} sensor={false} />

        {objects}
      </Physics>

      <Text position={[0, 0, -5]} fontSize={0.5} color="white" anchorX="center" anchorY="middle">
        Press 'R' to reset | Press 'D' to toggle debug
      </Text>
    </>
  );
};
