import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Mesh } from 'three';

interface HelloWorldProps {
  position: [number, number, number];
}

export default function HelloWorld({ position }: HelloWorldProps) {
  const meshRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime()) * 0.2;
      meshRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.5;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <boxGeometry args={[3, 0.2, 0.2]} />
        <meshStandardMaterial color="#ff9900" />
      </mesh>
      <Text
        position={[0, 0, 0.2]}
        fontSize={0.5}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        Hello World
      </Text>
    </group>
  );
} 
