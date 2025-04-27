import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import React from 'react';

import type { ISceneObject } from '../Editor';

function ensureVec3(
  arr: number[] | undefined,
  fallback: [number, number, number],
): [number, number, number] {
  if (!arr || arr.length !== 3) return fallback;
  return [arr[0], arr[1], arr[2]];
}

export interface IViewportPanelProps {
  selectedObject: ISceneObject;
}

const ViewportPanel: React.FC<IViewportPanelProps> = ({ selectedObject }) => {
  const pos = ensureVec3(selectedObject.components.Transform.position, [0, 0, 0]);
  const scale = ensureVec3(selectedObject.components.Transform.scale, [1, 1, 1]);
  const rot = ensureVec3(selectedObject.components.Transform.rotation, [0, 0, 0]);
  return (
    <section className="flex-1 bg-[#18181b] flex items-center justify-center border-r border-[#181a1b] relative">
      <div className="absolute top-2 left-2 z-10 text-xs bg-black/60 px-2 py-1 rounded text-gray-300">
        Viewport
      </div>
      <div className="w-full h-full">
        <Canvas
          camera={{ position: [0, 5, 10], fov: 50 }}
          style={{ background: '#18181b' }}
          shadows
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />
          {/* Ground */}
          <mesh position={[0, 0, 0]} receiveShadow>
            <boxGeometry args={[10, 0.1, 10]} />
            <meshStandardMaterial color="#e5e5e5" />
          </mesh>
          {/* Player Cube */}
          {selectedObject.name === 'Player' && (
            <mesh
              position={pos}
              scale={scale}
              rotation={rot.map((r) => (r * Math.PI) / 180) as [number, number, number]}
              castShadow
            >
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#e53e3e" />
            </mesh>
          )}
          <OrbitControls />
        </Canvas>
      </div>
    </section>
  );
};

export default ViewportPanel;
