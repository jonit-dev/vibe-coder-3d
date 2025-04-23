import { OrbitControls, Text } from '@react-three/drei';
import { CuboidCollider, Physics, RapierRigidBody, RigidBody } from '@react-three/rapier';
import { ReactNode, useEffect, useRef, useState } from 'react';

// Import our new core abstractions
import { PhysicsJoint } from '@/core/components/physics/PhysicsJoint';
import { PhysicsSystem } from '@/core/components/physics/PhysicsSystem';
import { EngineLoop } from '@core/components/EngineLoop';
import { useECS } from '@core/hooks/useECS';
import { Transform } from '@core/lib/ecs';
import { registerPhysicsBody } from '@core/systems/PhysicsSyncSystem';

const colors = ['#fe4a49', '#2ab7ca', '#fed766', '#e6e6ea', '#f4f4f8'];

/**
 * A simple box with physics, now using our ECS system
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
  const { createEntity } = useECS();

  // Create an ECS entity when the component mounts
  useEffect(() => {
    if (ref.current) {
      // Create a new ECS entity
      const entity = createEntity();

      // Set the initial position in the Transform component
      Transform.position[entity][0] = position[0];
      Transform.position[entity][1] = position[1];
      Transform.position[entity][2] = position[2];

      // Mark it for update
      Transform.needsUpdate[entity] = 1;

      // Register the physics body with our ECS entity
      registerPhysicsBody(entity, ref.current);

      // Clean up on unmount
      return () => {
        // Any cleanup needed when the component unmounts
      };
    }
  }, [ref, createEntity, position]);

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
 * A simple sphere with physics, now using our ECS system
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
  const { createEntity } = useECS();

  // Create an ECS entity when the component mounts
  useEffect(() => {
    if (ref.current) {
      // Create a new ECS entity
      const entity = createEntity();

      // Set the initial position in the Transform component
      Transform.position[entity][0] = position[0];
      Transform.position[entity][1] = position[1];
      Transform.position[entity][2] = position[2];

      // Mark it for update
      Transform.needsUpdate[entity] = 1;

      // Register the physics body with our ECS entity
      registerPhysicsBody(entity, ref.current);
    }
  }, [ref, createEntity, position]);

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
 * Chain of objects connected by joints
 */
const JointChain = ({ position = [0, 8, 0] }: { position?: [number, number, number] }) => {
  // Create refs for all the chain elements
  const anchorRef = useRef<RapierRigidBody>(null);
  const link1Ref = useRef<RapierRigidBody>(null);
  const link2Ref = useRef<RapierRigidBody>(null);
  const link3Ref = useRef<RapierRigidBody>(null);
  const ballRef = useRef<RapierRigidBody>(null);

  return (
    <group position={position}>
      {/* Anchor - fixed at the top */}
      <RigidBody ref={anchorRef} type="fixed">
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.4, 0.8]} />
          <meshStandardMaterial color="#545454" />
        </mesh>
      </RigidBody>

      {/* Link 1 */}
      <RigidBody ref={link1Ref} position={[0, -1, 0]} colliders="cuboid">
        <mesh castShadow>
          <boxGeometry args={[0.4, 1, 0.4]} />
          <meshStandardMaterial color="#898989" />
        </mesh>
      </RigidBody>

      {/* Link 2 */}
      <RigidBody ref={link2Ref} position={[0, -2.5, 0]} colliders="cuboid">
        <mesh castShadow>
          <boxGeometry args={[0.4, 1, 0.4]} />
          <meshStandardMaterial color="#898989" />
        </mesh>
      </RigidBody>

      {/* Link 3 */}
      <RigidBody ref={link3Ref} position={[0, -4, 0]} colliders="cuboid">
        <mesh castShadow>
          <boxGeometry args={[0.4, 1, 0.4]} />
          <meshStandardMaterial color="#898989" />
        </mesh>
      </RigidBody>

      {/* Ball at the end */}
      <RigidBody ref={ballRef} position={[0, -5.5, 0]} colliders="ball">
        <mesh castShadow>
          <sphereGeometry args={[0.6, 32, 32]} />
          <meshStandardMaterial color="#4e598c" />
        </mesh>
      </RigidBody>

      {/* Joints connecting the chain elements */}
      {/* Anchor to Link 1 - Fixed joint */}
      <PhysicsJoint
        bodyA={anchorRef as any}
        bodyB={link1Ref as any}
        type="fixed"
        anchor={{
          pointA: [0, -0.2, 0],
          pointB: [0, 0.5, 0],
        }}
      />

      {/* Link 1 to Link 2 - Spherical joint */}
      <PhysicsJoint
        bodyA={link1Ref as any}
        bodyB={link2Ref as any}
        type="spherical"
        anchor={{
          pointA: [0, -0.5, 0],
          pointB: [0, 0.5, 0],
        }}
      />

      {/* Link 2 to Link 3 - Spherical joint */}
      <PhysicsJoint
        bodyA={link2Ref as any}
        bodyB={link3Ref as any}
        type="spherical"
        anchor={{
          pointA: [0, -0.5, 0],
          pointB: [0, 0.5, 0],
        }}
      />

      {/* Link 3 to Ball - Spherical joint */}
      <PhysicsJoint
        bodyA={link3Ref as any}
        bodyB={ballRef as any}
        type="spherical"
        anchor={{
          pointA: [0, -0.5, 0],
          pointB: [0, 0, 0],
        }}
      />
    </group>
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
        <PhysicsSphere key={`sphere-${i}`} position={[x, y, z]} radius={radius} color={color} />,
      );
    }
  }

  return objects;
};

/**
 * Raycaster demo component
 */
const RaycasterDemo = () => {
  // We'll use the physics in the future, but for this demo just show visual feedback
  // const physics = usePhysics();
  const [hitPoint, setHitPoint] = useState<[number, number, number] | null>(null);

  // Cast a ray when clicking on the scene
  const handleClick = (event: any) => {
    // Get normalized device coordinates
    const ndc = {
      x: (event.clientX / window.innerWidth) * 2 - 1,
      y: -(event.clientY / window.innerHeight) * 2 + 1,
    };

    // This is a simplified example - in a real app we would
    // convert NDC to a world ray and use physics.raycast

    // For demo purposes, just show a point at a fixed distance in the direction
    // Using our physics hooks would require more setup with the actual camera
    const origin: [number, number, number] = [0, 0, 5];
    const direction: [number, number, number] = [ndc.x, ndc.y, -1];

    // Normalize direction
    const length = Math.sqrt(direction[0] ** 2 + direction[1] ** 2 + direction[2] ** 2);
    direction[0] /= length;
    direction[1] /= length;
    direction[2] /= length;

    // Set a hit point for visualization
    setHitPoint([
      origin[0] + direction[0] * 10,
      origin[1] + direction[1] * 10,
      origin[2] + direction[2] * 10,
    ]);
  };

  useEffect(() => {
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <>
      {hitPoint && (
        <mesh position={hitPoint}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="red" />
        </mesh>
      )}
    </>
  );
};

/**
 * PhysicsDemo component
 */
export const PhysicsDemo = () => {
  const [objects, setObjects] = useState<ReactNode[]>([]);

  // Add keyboard listener to toggle debug mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    <EngineLoop autoStart={true} debug={false}>
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
        {/* Initialize physics system with our new component */}
        <PhysicsSystem />

        <Floor />

        {/* Add walls to contain objects */}
        <CuboidCollider args={[15, 10, 0.5]} position={[0, 10, -15]} sensor={false} />
        <CuboidCollider args={[15, 10, 0.5]} position={[0, 10, 15]} sensor={false} />
        <CuboidCollider args={[0.5, 10, 15]} position={[-15, 10, 0]} sensor={false} />
        <CuboidCollider args={[0.5, 10, 15]} position={[15, 10, 0]} sensor={false} />

        {/* Add the joint chain */}
        <JointChain position={[0, 12, 0]} />

        {objects}

        <RaycasterDemo />
      </Physics>

      <Text position={[0, 0, -5]} fontSize={0.5} color="white" anchorX="center" anchorY="middle">
        Press 'R' to reset | Click to cast ray
      </Text>
    </EngineLoop>
  );
};
