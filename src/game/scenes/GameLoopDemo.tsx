// Game Loop Demo Scene - Solar System
// Demonstrates the game engine loop with controls
import { OrbitControls, Stars } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Import our new core abstractions instead of the old hooks
import { EngineLoop } from '@core/components/EngineLoop';
import { useECS } from '@core/hooks/useECS';
import { EntityMesh } from '@core/index';
import { Transform } from '@core/lib/ecs';

// Planet component with rotation
function Planet(props: {
  position: [number, number, number];
  size: number;
  color: string;
  orbitRadius: number;
  orbitSpeed: number;
  rotationSpeed: number;
  hasMoon: boolean;
}) {
  const { position, size, color, orbitRadius, orbitSpeed, rotationSpeed, hasMoon } = props;
  const ref = useRef<THREE.Mesh>(null);
  const moonRef = useRef<THREE.Mesh>(null);
  const orbitRef = useRef({ angle: Math.random() * Math.PI * 2 });
  const { createEntity } = useECS();

  // Create an ECS entity for the planet when the component mounts
  useEffect(() => {
    if (ref.current) {
      // Create a new ECS entity
      const entity = createEntity();

      // Set the initial position
      Transform.position[entity][0] = position[0];
      Transform.position[entity][1] = position[1];
      Transform.position[entity][2] = position[2];

      // Mark it for update
      Transform.needsUpdate[entity] = 1;
    }
  }, [createEntity, position]);

  useFrame((_, delta) => {
    // Self rotation
    if (ref.current) {
      ref.current.rotation.y += rotationSpeed * delta;
    }

    // Orbit around sun
    if (orbitRadius > 0) {
      orbitRef.current.angle += orbitSpeed * delta;
      const x = Math.sin(orbitRef.current.angle) * orbitRadius;
      const z = Math.cos(orbitRef.current.angle) * orbitRadius;

      if (ref.current) {
        ref.current.position.x = x;
        ref.current.position.z = z;
      }

      // Moon orbit
      if (hasMoon && moonRef.current) {
        const moonAngle = orbitRef.current.angle * 3; // faster than planet
        const moonOrbitRadius = size * 2;
        const moonX = x + Math.sin(moonAngle) * moonOrbitRadius;
        const moonZ = z + Math.cos(moonAngle) * moonOrbitRadius;

        moonRef.current.position.x = moonX;
        moonRef.current.position.z = moonZ;
      }
    }
  });

  return (
    <>
      <EntityMesh ref={ref} position={position} castShadow receiveShadow>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
      </EntityMesh>

      {hasMoon && (
        <EntityMesh ref={moonRef} position={[position[0] + 2, position[1], position[2]]} castShadow>
          <sphereGeometry args={[size * 0.3, 16, 16]} />
          <meshStandardMaterial color="#AAAAAA" roughness={0.8} />
        </EntityMesh>
      )}
    </>
  );
}

// Main Game Loop demo scene component - Solar System
export function GameLoopDemo() {
  // We don't need the game engine hooks anymore since EngineLoop handles this

  return (
    <EngineLoop autoStart={true} debug={false}>
      {/* Camera controls */}
      <OrbitControls minDistance={10} maxDistance={100} enableDamping dampingFactor={0.05} />

      {/* Background stars */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />

      {/* Lighting */}
      <ambientLight intensity={0.1} />
      <pointLight position={[0, 0, 0]} intensity={2} color="#FDF4DC" castShadow />
      <pointLight position={[10, 20, 10]} intensity={0.5} />

      {/* Sun (center) */}
      <EntityMesh position={[0, 0, 0]}>
        <sphereGeometry args={[3, 32, 32]} />
        <meshBasicMaterial color="#FDB813" />
      </EntityMesh>

      {/* Sun glow */}
      <EntityMesh position={[0, 0, 0]}>
        <sphereGeometry args={[3.2, 32, 32]} />
        <meshBasicMaterial color="#FDF4DC" transparent opacity={0.3} />
      </EntityMesh>

      {/* Planets */}
      <Planet
        position={[6, 0, 0]}
        size={0.8}
        color="#E17B35"
        orbitRadius={6}
        orbitSpeed={0.2}
        rotationSpeed={0.5}
        hasMoon={false}
      />

      <Planet
        position={[10, 0, 0]}
        size={1.2}
        color="#3498db"
        orbitRadius={10}
        orbitSpeed={0.15}
        rotationSpeed={0.4}
        hasMoon={true}
      />

      <Planet
        position={[14, 0, 0]}
        size={0.9}
        color="#E55B13"
        orbitRadius={14}
        orbitSpeed={0.1}
        rotationSpeed={0.3}
        hasMoon={false}
      />

      <Planet
        position={[19, 0, 0]}
        size={1.6}
        color="#F7CA18"
        orbitRadius={19}
        orbitSpeed={0.08}
        rotationSpeed={0.6}
        hasMoon={false}
      />

      <Planet
        position={[26, 0, 0]}
        size={0.7}
        color="#C3272B"
        orbitRadius={26}
        orbitSpeed={0.06}
        rotationSpeed={0.5}
        hasMoon={false}
      />
    </EngineLoop>
  );
}
