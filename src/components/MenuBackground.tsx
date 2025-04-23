import { Environment, MeshTransmissionMaterial, Sparkles } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { EllipseCurve, MathUtils, Mesh, MeshBasicMaterial, Vector3Tuple } from 'three';

interface OrbitingParticleProps {
  radius: number;
  rotationAxis?: Vector3Tuple;
  speed?: number;
  offset?: number;
  color?: string;
}

const OrbitingParticle = ({
  radius,
  rotationAxis = [0, 0, 0],
  speed = 0.3,
  offset = 0,
  color = '#88ccff',
}: OrbitingParticleProps) => {
  const meshRef = useRef<Mesh>(null);
  const glowRef = useRef<Mesh>(null);

  // Define the elliptical path matching the torus major radius
  const curve = new EllipseCurve(
    0,
    0, // ax, aY
    radius * 1.5,
    radius, // xRadius, yRadius
    0,
    2 * Math.PI, // aStartAngle, aEndAngle
    false, // aClockwise
    0 // aRotation
  );

  useFrame((state) => {
    if (!meshRef.current || !glowRef.current) return;
    const time = (state.clock.getElapsedTime() * speed + offset) % 1;
    const point = curve.getPoint(time);
    meshRef.current.position.set(point.x, point.y, 0);
    glowRef.current.position.set(point.x, point.y, 0);

    // Pulse the glow effect
    const pulse = Math.sin(state.clock.getElapsedTime() * 3) * 0.1 + 0.9;
    glowRef.current.scale.set(pulse * 2, pulse * 2, pulse * 2);
  });

  return (
    <group rotation={rotationAxis}>
      {/* Core electron */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <MeshTransmissionMaterial
          color={color}
          thickness={0.2}
          chromaticAberration={0.05}
          transmission={1}
          roughness={0.1}
          metalness={0.9}
          emissive={color}
          emissiveIntensity={0.8}
          distortion={0.1}
          distortionScale={0.2}
          temporalDistortion={0.1}
          reflectivity={1}
          clearcoat={1}
          attenuationDistance={0.5}
          attenuationColor="white"
          backside
        />
      </mesh>

      {/* Glow effect */}
      <mesh ref={glowRef} scale={2}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} toneMapped={false} />
      </mesh>
    </group>
  );
};

interface OrbitRingProps {
  radius: number;
  rotationAxis?: Vector3Tuple;
  color?: string;
}

const OrbitRing = ({ radius, rotationAxis = [0, 0, 0], color = '#345' }: OrbitRingProps) => {
  const ref = useRef<Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime() / 10;
    // Type assertion for material
    const material = ref.current.material as MeshBasicMaterial;
    material.opacity = 0.3 + Math.sin(t) * 0.1;
  });

  return (
    <group rotation={rotationAxis}>
      <mesh ref={ref}>
        <torusGeometry args={[radius * 1.5, 0.015, 16, 100]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} toneMapped={false} />
      </mesh>
    </group>
  );
};

const Nucleus = () => {
  const nucleusRef = useRef<Mesh>(null);
  const glowRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (!glowRef.current) return;
    // Pulsing glow effect
    const pulse = Math.sin(state.clock.getElapsedTime() * 1.5) * 0.1 + 1.1;
    glowRef.current.scale.set(pulse, pulse, pulse);
  });

  return (
    <group>
      {/* Core nucleus */}
      <mesh ref={nucleusRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshTransmissionMaterial
          color="#ff3333"
          thickness={0.6}
          roughness={0}
          metalness={1}
          transmission={0.1}
          emissive="#ff0000"
          emissiveIntensity={0.8}
          chromaticAberration={0.06}
          distortion={0.2}
          temporalDistortion={0.2}
          distortionScale={0.5}
          reflectivity={1}
          clearcoat={1}
          attenuationDistance={0.2}
          attenuationColor="#ff8888"
          backside
        />
      </mesh>

      {/* Glow effect */}
      <mesh ref={glowRef} scale={1.2}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#ff4444" transparent opacity={0.4} toneMapped={false} />
      </mesh>

      {/* Inner sparkles */}
      <Sparkles count={20} scale={[2, 2, 2]} size={0.2} speed={0.2} opacity={0.8} color="#ffaaaa" />
    </group>
  );
};

export const MenuBackground = () => {
  const orbits = [
    { radius: 4, axis: [0, 0, MathUtils.degToRad(90)] as Vector3Tuple, color: '#5599ff' },
    {
      radius: 4,
      axis: [MathUtils.degToRad(60), 0, MathUtils.degToRad(90)] as Vector3Tuple,
      color: '#55aaff',
    },
    {
      radius: 4,
      axis: [MathUtils.degToRad(-60), 0, MathUtils.degToRad(90)] as Vector3Tuple,
      color: '#55ccff',
    },
  ];

  return (
    <group rotation={[MathUtils.degToRad(-15), MathUtils.degToRad(30), 0]}>
      {/* Environment lighting for reflections */}
      <Environment preset="studio" />

      {/* Nucleus */}
      <Nucleus />

      {/* Orbits */}
      {orbits.map((orbit, i) => (
        <group key={i}>
          <OrbitRing radius={orbit.radius} rotationAxis={orbit.axis} color={orbit.color} />
          <OrbitingParticle
            radius={orbit.radius}
            rotationAxis={orbit.axis}
            speed={0.25}
            offset={0}
            color={orbit.color}
          />
          <OrbitingParticle
            radius={orbit.radius}
            rotationAxis={orbit.axis}
            speed={0.25}
            offset={0.5}
            color={orbit.color}
          />
        </group>
      ))}

      {/* Ambient sparkles for atmosphere */}
      <Sparkles
        count={100}
        scale={[20, 20, 20]}
        size={0.2}
        speed={0.3}
        opacity={0.2}
        color="white"
      />

      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <pointLight position={[5, 5, 8]} intensity={1} color="#ffffff" />
      <pointLight position={[-8, -5, -10]} intensity={0.4} color="#8888ff" />

      {/* Key lighting for dramatic effect */}
      <spotLight
        position={[15, 15, 15]}
        angle={0.3}
        penumbra={0.8}
        intensity={2}
        color="#ffffff"
        castShadow
      />

      {/* Rim light */}
      <pointLight position={[-10, 2, 5]} intensity={0.3} color="#ff5555" />
    </group>
  );
};
