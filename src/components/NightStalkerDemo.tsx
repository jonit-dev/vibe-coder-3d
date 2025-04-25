import { ContactShadows, Environment, OrbitControls, Text } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import { NightStalkerModel } from '@/game/models/NightStalkerModel';

import { useDemo } from '../game/stores/demoStore';

// Type definitions for component props
interface IPositionProps {
  position: [number, number, number];
  rotation: [number, number, number];
}

interface IAlienWallProps extends IPositionProps {
  color?: string;
  emissive?: string;
}

interface ICircularLightProps {
  position: [number, number, number];
  color: string;
  intensity?: number;
}

interface IAlienTechPanelProps extends IPositionProps {
  width?: number;
  height?: number;
}

// Room components
const LabFloor = () => {
  // Create a reflective floor material
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: '#0a192f',
    roughness: 0.1, // Very smooth for reflections
    metalness: 0.9, // Very metallic
    emissive: '#0a2e4a',
    emissiveIntensity: 0.2,
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[30, 30, 50, 50]} />
      <primitive object={floorMaterial} />
    </mesh>
  );
};

const LabWall = ({
  position,
  rotation,
  color = '#0a192f',
  emissive = '#051525',
}: IAlienWallProps) => {
  // Create a procedural wall material
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.3,
    metalness: 0.8,
    emissive: emissive,
    emissiveIntensity: 0.2,
  });

  return (
    <mesh position={position} rotation={rotation} receiveShadow>
      <boxGeometry args={[30, 12, 0.3]} />
      <primitive object={wallMaterial} />
    </mesh>
  );
};

const LabCeiling = () => {
  // Create a procedural ceiling material
  const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: '#0a1525',
    roughness: 0.3,
    metalness: 0.8,
    emissive: '#051020',
    emissiveIntensity: 0.3,
  });

  return (
    <mesh position={[0, 5.5, 0]} receiveShadow>
      <boxGeometry args={[30, 0.5, 30]} />
      <primitive object={ceilingMaterial} />
    </mesh>
  );
};

// Glowing experimental tube/chamber
const ExperimentChamber = ({
  position,
  rotation = [0, 0, 0],
  scale = 1,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}) => {
  const glowRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (glowRef.current) {
      const time = state.clock.getElapsedTime();
      glowRef.current.intensity = 1.5 + Math.sin(time * 0.5) * 0.3;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Base platform */}
      <mesh position={[0, -1.5, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.2 * scale, 1.5 * scale, 0.3 * scale, 16]} />
        <meshStandardMaterial color="#0a2e4a" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Main glass tube */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[1 * scale, 1 * scale, 3 * scale, 32, 1, true]} />
        <meshPhysicalMaterial
          color="#80deea"
          transparent={true}
          opacity={0.2}
          roughness={0}
          metalness={0.2}
          transmission={0.9}
          thickness={0.5}
          emissive="#00bcd4"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Top cap */}
      <mesh position={[0, 1.5 * scale, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.2 * scale, 1 * scale, 0.3 * scale, 16]} />
        <meshStandardMaterial color="#0a2e4a" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Glow light inside */}
      <pointLight
        ref={glowRef}
        position={[0, 0, 0]}
        color="#00e5ff"
        intensity={1.5}
        distance={8 * scale}
      />

      {/* Control panel on the base */}
      <mesh position={[0, -1.3, 1 * scale]} rotation={[Math.PI / 3, 0, 0]}>
        <boxGeometry args={[1.5 * scale, 0.5 * scale, 0.1 * scale]} />
        <meshStandardMaterial color="#081c2b" metalness={0.7} roughness={0.2} emissive="#051015" />
      </mesh>

      {/* Control panel lights */}
      <mesh position={[0.5 * scale, -1.25, 1.05 * scale]} rotation={[Math.PI / 3, 0, 0]}>
        <boxGeometry args={[0.1 * scale, 0.1 * scale, 0.05 * scale]} />
        <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={1} />
      </mesh>

      <mesh position={[0.3 * scale, -1.25, 1.05 * scale]} rotation={[Math.PI / 3, 0, 0]}>
        <boxGeometry args={[0.1 * scale, 0.1 * scale, 0.05 * scale]} />
        <meshStandardMaterial color="#ff1744" emissive="#ff1744" emissiveIntensity={1} />
      </mesh>

      {/* Cables and tubes */}
      <mesh position={[1 * scale, -0.5 * scale, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1 * scale, 0.1 * scale, 2 * scale, 8]} />
        <meshStandardMaterial color="#01579b" metalness={0.7} roughness={0.2} />
      </mesh>

      <mesh position={[-1 * scale, -0.2 * scale, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08 * scale, 0.08 * scale, 1.8 * scale, 8]} />
        <meshStandardMaterial color="#006064" metalness={0.7} roughness={0.2} />
      </mesh>
    </group>
  );
};

const CircularLight = ({ position, color, intensity = 1 }: ICircularLightProps) => {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (lightRef.current) {
      const time = state.clock.getElapsedTime();
      lightRef.current.intensity = intensity + Math.sin(time * 2) * 0.2;
    }
  });

  return (
    <group position={position}>
      <pointLight ref={lightRef} color={color} intensity={intensity} distance={12} castShadow />
      <mesh>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
};

const LabTechPanel = ({ position, rotation, width = 2, height = 1.5 }: IAlienTechPanelProps) => {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position} rotation={rotation}>
      <mesh onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
        <boxGeometry args={[width, height, 0.05]} />
        <meshStandardMaterial
          color={hovered ? '#0d3b55' : '#0a2e4a'}
          emissive={hovered ? '#4fc3f7' : '#29b6f6'}
          emissiveIntensity={0.5}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>
      <Text
        position={[0, 0.5, 0.03]}
        fontSize={0.15}
        color="#80deea"
        anchorX="center"
        anchorY="middle"
      >
        XENO-RESEARCH LAB
      </Text>
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[width * 0.9, height * 0.5]} />
        <meshBasicMaterial color="#071a2a" opacity={0.8} transparent />
      </mesh>
      <Text
        position={[0, 0, 0.04]}
        fontSize={0.1}
        color="#00e5ff"
        anchorX="center"
        anchorY="middle"
      >
        SUBJECT: NST-ZX9
      </Text>
      <Text
        position={[0, -0.2, 0.04]}
        fontSize={0.08}
        color="#4dd0e1"
        anchorX="center"
        anchorY="middle"
      >
        STATUS: CONTAINED
      </Text>
    </group>
  );
};

// Pipes, conduits and other lab details
const LabInfrastructure = () => {
  return (
    <group>
      {/* Ceiling mounted equipment */}
      <group position={[0, 5.2, 0]}>
        {/* Central distribution node */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[3, 0.8, 3]} />
          <meshStandardMaterial color="#0a2e4a" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Radial pipes from central node */}
        {[-1, 1].map((x) =>
          [-1, 1].map((z) => (
            <mesh
              key={`pipe-${x}-${z}`}
              position={[x * 5, 0, z * 5]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.2, 0.2, 10, 8]} />
              <meshStandardMaterial color="#01579b" metalness={0.7} roughness={0.2} />
            </mesh>
          )),
        )}

        {/* Vertical pipes to chambers */}
        {[-4, 0, 4].map((x) =>
          [-4, 0, 4].map((z) => {
            // Skip the center position [0,0]
            if (x === 0 && z === 0) return null;

            return (
              <mesh key={`vert-pipe-${x}-${z}`} position={[x, -2.5, z]}>
                <cylinderGeometry args={[0.15, 0.15, 5, 8]} />
                <meshStandardMaterial color="#006064" metalness={0.7} roughness={0.2} />
              </mesh>
            );
          }),
        )}
      </group>

      {/* Wall-mounted conduits */}
      {/* North wall */}
      <mesh position={[0, 2, -14.8]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 20, 8]} />
        <meshStandardMaterial color="#0288d1" metalness={0.7} roughness={0.2} />
      </mesh>

      {/* South wall */}
      <mesh position={[0, 2, 14.8]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 20, 8]} />
        <meshStandardMaterial color="#0288d1" metalness={0.7} roughness={0.2} />
      </mesh>

      {/* East wall */}
      <mesh position={[14.8, 2, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.3, 20, 8]} />
        <meshStandardMaterial color="#0288d1" metalness={0.7} roughness={0.2} />
      </mesh>

      {/* West wall */}
      <mesh position={[-14.8, 2, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.3, 20, 8]} />
        <meshStandardMaterial color="#0288d1" metalness={0.7} roughness={0.2} />
      </mesh>

      {/* Corner structural pillars */}
      {[-14, 14].map((x) =>
        [-14, 14].map((z) => (
          <mesh key={`pillar-${x}-${z}`} position={[x, 2.5, z]}>
            <cylinderGeometry args={[0.4, 0.4, 6, 8]} />
            <meshStandardMaterial color="#051525" metalness={0.9} roughness={0.1} />
          </mesh>
        )),
      )}

      {/* Floor embedded power lines - adjusted positions for new floor height */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[7, 7.3, 64]} />
        <meshStandardMaterial color="#0277bd" emissive="#01579b" emissiveIntensity={1} />
      </mesh>

      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[10, 10.2, 64]} />
        <meshStandardMaterial color="#00bcd4" emissive="#00838f" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
};

// Replace the ModelSpotlight component with a more effective lighting setup
const ModelLighting = () => {
  // Create multiple lights to ensure model visibility
  return (
    <group>
      {/* Very direct spotlight from above */}
      <spotLight
        position={[0, 8, 0]}
        angle={Math.PI / 8}
        penumbra={0.1}
        intensity={20}
        distance={20}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        target-position={[0, 1, 0]}
      />

      {/* Front fill light for the face */}
      <spotLight
        position={[0, 3, 6]}
        angle={Math.PI / 6}
        penumbra={0.2}
        intensity={15}
        distance={12}
        color="#80deea"
        castShadow
        target-position={[0, 1.5, 0]}
      />

      {/* Rim light from behind */}
      <spotLight
        position={[0, 2, -4]}
        angle={Math.PI / 5}
        penumbra={0.3}
        intensity={10}
        distance={10}
        color="#4fc3f7"
        castShadow
        target-position={[0, 1, 0]}
      />

      {/* Direct point light at model height */}
      <pointLight position={[0, 1.5, 1]} intensity={5} distance={5} color="#e0f7fa" />

      {/* Floor highlight beneath model - adjusted for new floor height */}
      <pointLight position={[0, 0.1, 0]} intensity={3} distance={3} color="#00e5ff" />
    </group>
  );
};

const AlienLab = () => {
  return (
    <group>
      <LabFloor />
      <LabCeiling />
      <LabWall position={[0, 2.5, -15]} rotation={[0, 0, 0]} />
      <LabWall position={[0, 2.5, 15]} rotation={[0, Math.PI, 0]} />
      <LabWall position={[-15, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} />
      <LabWall position={[15, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]} />

      {/* Infrastructure (pipes, conduits, etc.) */}
      <LabInfrastructure />

      {/* Experiment chambers - adjusted y position relative to new floor height */}
      <ExperimentChamber position={[-4, 1, -4]} scale={1.2} />
      <ExperimentChamber position={[4, 1, -4]} scale={1.2} />
      <ExperimentChamber position={[0, 1, 4]} scale={1.2} />

      {/* Smaller chambers - adjusted y position */}
      <ExperimentChamber position={[-8, 1, -8]} scale={0.8} />
      <ExperimentChamber position={[8, 1, -8]} scale={0.8} />
      <ExperimentChamber position={[-8, 1, 8]} scale={0.8} />
      <ExperimentChamber position={[8, 1, 8]} scale={0.8} />

      {/* Tech panels and monitoring stations */}
      <LabTechPanel position={[-10, 1.5, -14.7]} rotation={[0, 0, 0]} width={3} height={1.8} />
      <LabTechPanel position={[10, 1.5, -14.7]} rotation={[0, 0, 0]} width={3} height={1.8} />
      <LabTechPanel
        position={[-14.7, 1.5, -5]}
        rotation={[0, Math.PI / 2, 0]}
        width={2.5}
        height={1.6}
      />
      <LabTechPanel
        position={[-14.7, 1.5, 5]}
        rotation={[0, Math.PI / 2, 0]}
        width={2.5}
        height={1.6}
      />

      {/* Enhanced lighting for the model */}
      <ModelLighting />

      {/* Ambient lab lights */}
      <CircularLight position={[-12, 5, -12]} color="#00e5ff" intensity={1.5} />
      <CircularLight position={[12, 5, -12]} color="#4fc3f7" intensity={1.3} />
      <CircularLight position={[-12, 5, 12]} color="#80deea" intensity={1.2} />
      <CircularLight position={[12, 5, 12]} color="#26c6da" intensity={1.4} />

      {/* Central overhead light */}
      <CircularLight position={[0, 5, 0]} color="#18ffff" intensity={2} />

      {/* Floor accent lights - adjusted y position */}
      <CircularLight position={[-10, 0.1, -10]} color="#0097a7" intensity={0.8} />
      <CircularLight position={[10, 0.1, -10]} color="#006064" intensity={0.7} />
      <CircularLight position={[-10, 0.1, 10]} color="#00acc1" intensity={0.7} />
      <CircularLight position={[10, 0.1, 10]} color="#0097a7" intensity={0.8} />

      {/* Scene specific lighting */}
      <fog attach="fog" args={['#04121d', 15, 50]} />
      <ambientLight intensity={0.3} color="#b3e5fc" />
    </group>
  );
};

export const NightStalkerDemo = () => {
  const { goBack } = useDemo();

  useEffect(() => {
    console.log('NightStalkerDemo mounted');
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'absolute',
        top: 0,
        left: 0,
        background: '#000000',
        overflow: 'hidden',
      }}
    >
      <Canvas camera={{ position: [4, 2, 8], fov: 60 }} shadows gl={{ alpha: false }}>
        {/* Environment */}
        <Environment preset="night" />

        <Suspense fallback={null}>
          {/* Alien experiment lab */}
          <AlienLab />

          {/* Character in center of lab - adjusting position to sit on floor */}
          <group position={[0, 0, 0]}>
            <NightStalkerModel />
          </group>

          {/* Shadow under character - adjusted to match floor position */}
          <ContactShadows
            opacity={0.5}
            scale={5}
            blur={1}
            far={5}
            resolution={256}
            color="#03121c"
            position={[0, 0.01, 0]}
          />
        </Suspense>

        <OrbitControls
          target={[0, 1, 0]}
          maxPolarAngle={Math.PI / 2}
          minDistance={3}
          maxDistance={25}
        />
      </Canvas>

      <div className="absolute top-4 left-4 bg-black/70 text-white px-4 py-2 rounded">
        <button
          onClick={goBack}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
        >
          ← Back
        </button>
        <h2 className="text-lg font-bold mt-4">Alien Research Lab</h2>
        <p>Xenobiology specimen containment facility</p>
      </div>
    </div>
  );
};
