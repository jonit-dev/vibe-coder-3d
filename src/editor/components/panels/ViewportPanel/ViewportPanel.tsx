import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import React, { useState } from 'react';

import { useECSQuery } from '@core/hooks/useECS';
import { Transform } from '@core/lib/ecs';

import { EntityRenderer } from './EntityRenderer';

type GizmoMode = 'translate' | 'rotate' | 'scale';

export interface IViewportPanelProps {
  entityId: number; // selected entity
}

export const ViewportPanel: React.FC<IViewportPanelProps> = ({ entityId }) => {
  // Get all entities with a Transform
  const entityIds = useECSQuery([Transform]);

  // Gizmo mode state
  const [mode, setMode] = useState<GizmoMode>('translate');
  // Track if TransformControls is active
  const [isTransforming, setIsTransforming] = useState(false);

  // Handler to update ECS transform when gizmo is used
  // This is now handled by GizmoControls which properly emits events
  const handleTransformChange = (id: number) => (values: [number, number, number]) => {
    // This callback is no longer used as GizmoControls handles transform updates
    console.log(`Transform updated for entity ${id}:`, values);
  };

  return (
    <section className="flex-1 bg-[#18181b] flex flex-col items-stretch border-r border-[#181a1b] relative">
      <div className="absolute top-2 left-2 z-10 text-xs bg-black/60 px-2 py-1 rounded text-gray-300">
        Viewport (Entity {entityId})
      </div>

      {/* Gizmo mode switcher - Unity style with keyboard shortcuts */}
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <button
          className={`px-2 py-1 rounded text-xs font-bold flex items-center ${mode === 'translate'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          onClick={() => setMode('translate')}
          title="Switch to Move Tool (W)"
        >
          <span>Move</span>
          <span className="ml-1 bg-black/30 px-1 rounded text-[10px]">W</span>
        </button>
        <button
          className={`px-2 py-1 rounded text-xs font-bold flex items-center ${mode === 'rotate'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          onClick={() => setMode('rotate')}
          title="Switch to Rotate Tool (E)"
        >
          <span>Rotate</span>
          <span className="ml-1 bg-black/30 px-1 rounded text-[10px]">E</span>
        </button>
        <button
          className={`px-2 py-1 rounded text-xs font-bold flex items-center ${mode === 'scale'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          onClick={() => setMode('scale')}
          title="Switch to Scale Tool (R)"
        >
          <span>Scale</span>
          <span className="ml-1 bg-black/30 px-1 rounded text-[10px]">R</span>
        </button>
      </div>

      {/* Axes indicator - bottom right */}
      <div className="absolute bottom-2 right-2 z-10 opacity-75 text-xs">
        <div className="flex items-center">
          <span className="text-[#ff5555] font-bold mr-1">X</span>
          <span className="text-[#55ff55] font-bold mr-1">Y</span>
          <span className="text-[#5555ff] font-bold">Z</span>
        </div>
      </div>

      <div className="w-full h-full">
        <Canvas
          camera={{ position: [0, 5, 10], fov: 50 }}
          style={{ background: '#18181b' }}
          shadows
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />

          {/* Grid - Unity style */}
          <gridHelper args={[20, 20, '#444444', '#222222']} />

          {/* Ground */}
          <mesh position={[0, -0.05, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#333333" />
          </mesh>

          {/* Render all entities */}
          {entityIds.map((id) => (
            <EntityRenderer
              key={id}
              entityId={id}
              selected={id === entityId}
              mode={mode}
              onTransformChange={id === entityId ? handleTransformChange(id) : undefined}
              setIsTransforming={id === entityId ? setIsTransforming : undefined}
              setGizmoMode={id === entityId ? setMode : undefined}
            />
          ))}

          <OrbitControls enabled={!isTransforming} />
        </Canvas>
      </div>
    </section>
  );
};
