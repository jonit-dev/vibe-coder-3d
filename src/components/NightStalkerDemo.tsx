import { ContactShadows, Environment, OrbitControls, Sparkles, Text } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import { NightStalkerModel } from '@/game/models/NightStalkerModel';
import { useDemo } from '@/game/stores/demoStore';

// Custom hooks
const useDebugLogger = (componentName: string) => {
  useEffect(() => {
    console.log(`${componentName} mounted`);
    return () => console.log(`${componentName} unmounted`);
  }, [componentName]);
};

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

// Animated Hologram Screen
const HologramScreen = ({
  position,
  rotation,
  width = 2,
  height = 1,
  text = 'XENO DATA',
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
  text?: string;
}) => {
  const [glow, setGlow] = useState(0.7);
  useFrame((state) => {
    setGlow(0.7 + Math.sin(state.clock.getElapsedTime() * 2) * 0.2);
  });
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.18 + glow * 0.1} />
      </mesh>
      <Text
        position={[0, 0, 0.01]}
        fontSize={0.18}
        color="#00e5ff"
        anchorX="center"
        anchorY="middle"
        outlineColor="#18ffff"
        outlineWidth={0.01}
      >
        {text}
      </Text>
      {/* Animated scan lines */}
      <mesh position={[0, 0, 0.012]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.08} />
      </mesh>
    </group>
  );
};

// Blinking Warning Light
const BlinkingLight = ({
  position,
  color = '#ff1744',
  intensity = 2,
  blinkSpeed = 2,
}: {
  position: [number, number, number];
  color?: string;
  intensity?: number;
  blinkSpeed?: number;
}) => {
  const lightRef = useRef<THREE.PointLight>(null);
  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.intensity =
        intensity * (0.5 + 0.5 * Math.abs(Math.sin(state.clock.getElapsedTime() * blinkSpeed)));
    }
  });
  return (
    <pointLight
      ref={lightRef}
      position={position}
      color={color}
      intensity={intensity}
      distance={5}
    />
  );
};

// Subtle Steam/Fog VFX
const SteamVFX = ({
  position,
  count = 8,
  area = 2,
}: {
  position: [number, number, number];
  count?: number;
  area?: number;
}) => {
  // Use Sparkles for a subtle floating effect
  return (
    <Sparkles
      count={count}
      scale={[area, 0.5, area]}
      size={8}
      color="#b3e5fc"
      opacity={0.18}
      speed={0.2}
      position={position}
    />
  );
};

// Server Rack
const ServerRack = ({
  position,
  rotation = [0, 0, 0],
  height = 3,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  height?: number;
}) => (
  <group position={position} rotation={rotation}>
    {/* Main rack body */}
    <mesh castShadow receiveShadow>
      <boxGeometry args={[1, height, 1]} />
      <meshStandardMaterial color="#23272e" metalness={0.7} roughness={0.3} />
    </mesh>
    {/* Blinking lights */}
    {Array.from({ length: Math.floor(height * 3) }).map((_, i) => (
      <mesh key={i} position={[0.4, -height / 2 + 0.3 + i * 0.3, 0.51]}>
        <boxGeometry args={[0.08, 0.08, 0.02]} />
        <meshStandardMaterial
          color={i % 3 === 0 ? '#00e5ff' : i % 3 === 1 ? '#ff1744' : '#ffea00'}
          emissiveIntensity={1}
          emissive={i % 3 === 0 ? '#00e5ff' : i % 3 === 1 ? '#ff1744' : '#ffea00'}
        />
      </mesh>
    ))}
  </group>
);

// Computer Terminal
const ComputerTerminal = ({
  position,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) => (
  <group position={position} rotation={rotation}>
    {/* Base */}
    <mesh castShadow receiveShadow>
      <boxGeometry args={[0.7, 0.4, 0.5]} />
      <meshStandardMaterial color="#263238" metalness={0.6} roughness={0.4} />
    </mesh>
    {/* Screen */}
    <mesh position={[0, 0.25, 0.18]} rotation={[-0.3, 0, 0]}>
      <boxGeometry args={[0.6, 0.35, 0.05]} />
      <meshStandardMaterial
        color="#00e5ff"
        emissive="#00e5ff"
        emissiveIntensity={0.7}
        metalness={0.2}
        roughness={0.1}
      />
    </mesh>
    {/* Keyboard */}
    <mesh position={[0, 0.05, 0.32]}>
      <boxGeometry args={[0.5, 0.05, 0.18]} />
      <meshStandardMaterial color="#37474f" />
    </mesh>
  </group>
);

// Scattered Lab Tools
const LabTool = ({
  position,
  rotation = [0, 0, 0],
  color = '#bdbdbd',
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
}) => (
  <mesh position={position} rotation={rotation}>
    <boxGeometry args={[0.18, 0.03, 0.04]} />
    <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
  </mesh>
);

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

      {/* Hologram screens */}
      <HologramScreen position={[-10, 3.5, -13.5]} width={2.5} height={1.2} text="DNA SEQUENCE" />
      <HologramScreen position={[10, 3.5, -13.5]} width={2.5} height={1.2} text="VITALS" />
      <HologramScreen
        position={[0, 4.5, 0]}
        width={3.5}
        height={1.5}
        text="CONTAINMENT STATUS: STABLE"
      />

      {/* Blinking warning lights */}
      <BlinkingLight position={[-4, 5.2, -4]} color="#ff1744" intensity={3} blinkSpeed={2.5} />
      <BlinkingLight position={[4, 5.2, -4]} color="#ffea00" intensity={2.5} blinkSpeed={1.7} />
      <BlinkingLight position={[0, 5.2, 4]} color="#00e5ff" intensity={2.5} blinkSpeed={2.1} />

      {/* Subtle steam/fog VFX near floor and chambers */}
      <SteamVFX position={[-4, 0.2, -4]} area={1.5} />
      <SteamVFX position={[4, 0.2, -4]} area={1.5} />
      <SteamVFX position={[0, 0.2, 4]} area={1.5} />
      <SteamVFX position={[0, 0.1, 0]} area={2.5} count={16} />

      {/* Sparkling containment field effect */}
      <Sparkles
        count={30}
        scale={[2, 3, 2]}
        size={6}
        color="#00e5ff"
        opacity={0.12}
        speed={0.5}
        position={[0, 1.5, 0]}
      />

      {/* Server racks */}
      <ServerRack position={[-12, 1.5, -10]} height={3.2} />
      <ServerRack position={[-13, 1.5, -8]} height={2.8} rotation={[0, Math.PI / 6, 0]} />
      <ServerRack position={[12, 1.5, 10]} height={3.5} />

      {/* Computer terminals */}
      <ComputerTerminal position={[-10, 0.25, -13.2]} />
      <ComputerTerminal position={[10, 0.25, -13.2]} rotation={[0, Math.PI, 0]} />
      <ComputerTerminal position={[0, 0.25, 13.2]} rotation={[0, Math.PI, 0]} />

      {/* Scattered lab tools */}
      <LabTool position={[-9.8, 0.05, -13.1]} rotation={[0, 0.2, 0]} />
      <LabTool position={[9.8, 0.05, -13.1]} rotation={[0, -0.3, 0]} color="#90caf9" />
      <LabTool position={[0.2, 0.05, 13.1]} rotation={[0, 0.1, 0]} color="#ff1744" />
      <LabTool position={[-8, 0.05, -6.2]} rotation={[0, 0.5, 0]} />
      <LabTool position={[8, 0.05, 6.2]} rotation={[0, -0.4, 0]} />
    </group>
  );
};

export const NightStalkerDemo = () => {
  const { goBack } = useDemo();
  useDebugLogger('NightStalkerDemo');

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
