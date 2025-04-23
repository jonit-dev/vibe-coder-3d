import { OrbitControls, Sky, Stats } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Physics, RigidBody } from '@react-three/rapier';
import React, { useEffect, useRef, useState } from 'react';
import { Mesh } from 'three';

import { Entity, PhysicsBox, PhysicsSphere } from '@/core';

/**
 * Entity Scene Component
 *
 * This scene demonstrates the usage of the Entity component and the ECS system
 */
export const EntityScene: React.FC = () => {
  // Debug flag to track component mounting/unmounting
  const [isReady, setIsReady] = useState(false);

  // When component mounts, wait a short time to ensure physics is properly initialized
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 500);

    return () => {
      clearTimeout(timer);
      setIsReady(false);
    };
  }, []);

  return (
    <>
      <Stats />
      <Sky distance={450000} sunPosition={[0, 1, 0]} inclination={0} azimuth={0.25} />
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Physics system with debug visualization */}
      <Physics debug>
        {/* Static ground - using RigidBody directly for the ground as it's simpler */}
        <RigidBody type="fixed" position={[0, -0.5, 0]}>
          <mesh receiveShadow>
            <boxGeometry args={[20, 1, 20]} />
            <meshStandardMaterial color="#555555" />
          </mesh>
        </RigidBody>

        {/* Only render the more complex entity components once physics is ready */}
        {isReady && (
          <>
            {/* Dynamic boxes */}
            <DynamicEntities />

            {/* Custom entity with update logic */}
            <RotatingEntity />
          </>
        )}
      </Physics>

      <OrbitControls />
    </>
  );
};

/**
 * Group of dynamic entities with physics
 */
const DynamicEntities: React.FC = () => {
  // Cleanup function to run when component unmounts
  useEffect(() => {
    return () => {
      console.log('Cleaning up DynamicEntities');
    };
  }, []);

  return (
    <>
      {/* Boxes */}
      <Entity position={[0, 5, 0]}>
        <PhysicsBox args={[1, 1, 1]} type="dynamic">
          <mesh castShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#ff0000" />
          </mesh>
        </PhysicsBox>
      </Entity>

      <Entity position={[1, 7, 0]}>
        <PhysicsBox args={[1, 1, 1]} type="dynamic">
          <mesh castShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#00ff00" />
          </mesh>
        </PhysicsBox>
      </Entity>

      {/* Spheres */}
      <Entity position={[-1, 9, 0]}>
        <PhysicsSphere args={[0.5]} type="dynamic">
          <mesh castShadow>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial color="#0000ff" />
          </mesh>
        </PhysicsSphere>
      </Entity>

      <Entity position={[0, 11, 0]}>
        <PhysicsSphere args={[0.5]} type="dynamic">
          <mesh castShadow>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial color="#ffff00" />
          </mesh>
        </PhysicsSphere>
      </Entity>
    </>
  );
};

/**
 * Example of an entity with custom update logic
 */
const RotatingEntity: React.FC = () => {
  const speedRef = useRef(0.5);
  const meshRef = useRef<Mesh>(null);

  // Animate the object using regular R3F useFrame instead of ECS
  // This is a safer approach for testing
  useFrame((_, delta) => {
    if (meshRef.current) {
      const speed = Math.sin(Date.now() / 1000) * 0.5 + 0.5;
      meshRef.current.rotation.y += delta * speed;
    }
  });

  return (
    <Entity position={[3, 1, 0]} rotation={[0, 0, 0, 1]}>
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#9900ff" />
      </mesh>
    </Entity>
  );
};

export default EntityScene;
