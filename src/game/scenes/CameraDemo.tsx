import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Mesh, PerspectiveCamera as ThreePerspectiveCamera, Vector3 } from 'three';

type CameraDemoProps = {
  type: 'orbit' | 'thirdPerson' | 'firstPerson' | 'fixed' | 'cinematic';
};

export const CameraDemo = ({ type }: CameraDemoProps) => {
  const targetRef = useRef<Mesh>(null);
  const cameraRef = useRef<ThreePerspectiveCamera>(null);

  // Example target object (a box) that we'll use for camera demos
  const TargetObject = () => (
    <mesh ref={targetRef} position={[0, 1, 0]}>
      <boxGeometry args={[1, 2, 1]} />
      <meshStandardMaterial color="#4a9eff" />
    </mesh>
  );

  useFrame(state => {
    if (!targetRef.current || !cameraRef.current) return;

    switch (type) {
      case 'orbit':
        // Orbit controls handle this automatically
        break;

      case 'thirdPerson': {
        const target = targetRef.current;
        const camera = cameraRef.current;

        // Example: Position camera behind and slightly above target
        const offset = new Vector3(0, 2, -5);
        const targetPosition = target.position.clone();
        camera.position.copy(targetPosition.add(offset));
        camera.lookAt(target.position);
        break;
      }

      case 'firstPerson': {
        const target = targetRef.current;
        const camera = cameraRef.current;

        // Position camera at "head" level
        const headOffset = new Vector3(0, 1.7, 0);
        camera.position.copy(target.position.clone().add(headOffset));
        break;
      }

      case 'fixed': {
        const target = targetRef.current;
        const camera = cameraRef.current;

        // Fixed position, but look at target
        camera.position.set(10, 5, 10);
        camera.lookAt(target.position);
        break;
      }

      case 'cinematic': {
        const camera = cameraRef.current;

        // Example: Simple circular path
        const time = state.clock.getElapsedTime();
        const radius = 8;
        camera.position.x = Math.cos(time * 0.5) * radius;
        camera.position.z = Math.sin(time * 0.5) * radius;
        camera.position.y = 3 + Math.sin(time * 0.3) * 2;
        camera.lookAt(0, 0, 0);
        break;
      }
    }
  });

  return (
    <>
      <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 2, 5]} fov={75} />

      {/* Only show OrbitControls for orbit demo */}
      {type === 'orbit' && <OrbitControls />}

      {/* Demo scene content */}
      <TargetObject />

      {/* Environment setup */}
      <gridHelper args={[20, 20]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Additional objects for visual reference */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh
          key={i}
          position={[Math.cos((i / 5) * Math.PI * 2) * 5, 0.5, Math.sin((i / 5) * Math.PI * 2) * 5]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
      ))}
    </>
  );
};
