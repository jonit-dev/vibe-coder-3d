import { Environment, Float, MeshDistortMaterial, Trail } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Group, MathUtils, Mesh, Vector3Tuple } from 'three'

interface OrbitingParticleProps {
  radius: number
  speed: number
  rotationAxis?: Vector3Tuple
  color?: string
  size?: number
}

const OrbitingParticle = ({ radius, speed, rotationAxis = [0, 1, 0], color = '#4a9eff', size = 0.2 }: OrbitingParticleProps) => {
  const meshRef = useRef<Mesh>(null)
  const initialPosition: Vector3Tuple = [radius, 0, 0]

  useFrame((state) => {
    if (!meshRef.current) return
    const time = state.clock.getElapsedTime() * speed
    meshRef.current.position.x = Math.cos(time) * radius
    meshRef.current.position.z = Math.sin(time) * radius
  })

  return (
    <group rotation={rotationAxis}>
      <Trail
        width={0.2}
        length={4}
        color={color}
        attenuation={(t) => t * t}
      >
        <mesh ref={meshRef} position={initialPosition}>
          <sphereGeometry args={[size, 16, 16]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </Trail>
    </group>
  )
}

interface OrbitRingProps {
  radius: number
  rotationAxis?: Vector3Tuple
  color?: string
}

const OrbitRing = ({ radius, rotationAxis = [0, 0, 0], color = '#4a9eff33' }: OrbitRingProps) => {
  return (
    <group rotation={rotationAxis}>
      <mesh>
        <ringGeometry args={[radius - 0.1, radius + 0.1, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} />
      </mesh>
    </group>
  )
}

const Nucleus = () => {
  const groupRef = useRef<Group>(null)

  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.2
  })

  return (
    <Float
      speed={2}
      rotationIntensity={0.5}
      floatIntensity={0.2}
    >
      <group ref={groupRef}>
        <mesh>
          <sphereGeometry args={[1, 32, 32]} />
          <MeshDistortMaterial
            color="#4a9eff"
            speed={2}
            distort={0.4}
            radius={1}
          />
        </mesh>
      </group>
    </Float>
  )
}

export const MenuBackground = () => {
  const orbits = useMemo(() => [
    { radius: 3, axis: [0, 0, 0] as Vector3Tuple, speed: 0.5 },
    { radius: 4, axis: [0, 0, MathUtils.degToRad(60)] as Vector3Tuple, speed: 0.3 },
    { radius: 5, axis: [0, 0, MathUtils.degToRad(-45)] as Vector3Tuple, speed: 0.2 },
  ], [])

  return (
    <group>
      {/* Nucleus */}
      <Nucleus />

      {/* Orbits */}
      {orbits.map((orbit, i) => (
        <group key={i}>
          <OrbitRing
            radius={orbit.radius}
            rotationAxis={orbit.axis}
            color={`hsl(${i * 120}, 70%, 60%)`}
          />
          <OrbitingParticle
            radius={orbit.radius}
            speed={orbit.speed}
            rotationAxis={orbit.axis}
            color={`hsl(${i * 120}, 70%, 60%)`}
          />
          <OrbitingParticle
            radius={orbit.radius}
            speed={-orbit.speed}
            rotationAxis={orbit.axis}
            color={`hsl(${i * 120}, 70%, 60%)`}
            size={0.15}
          />
        </group>
      ))}

      {/* Environment and lighting */}
      <Environment preset="sunset" />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      {/* Background particles */}
      {Array.from({ length: 50 }).map((_, i) => (
        <mesh
          key={i}
          position={[
            MathUtils.randFloat(-20, 20),
            MathUtils.randFloat(-20, 20),
            MathUtils.randFloat(-20, 20)
          ] as Vector3Tuple}
        >
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  )
} 
