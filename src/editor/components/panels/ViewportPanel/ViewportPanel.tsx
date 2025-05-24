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
    <section className="flex-1 bg-gradient-to-br from-[#0c0c0d] to-[#18181b] flex flex-col items-stretch border-r border-gray-800/50 relative overflow-hidden">
      {/* Modern viewport header with glassmorphism */}
      <div className="absolute top-4 left-4 z-10 bg-black/30 backdrop-blur-sm border border-gray-700/50 rounded-lg px-3 py-2 flex items-center space-x-2">
        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
        <span className="text-sm text-gray-200 font-medium">Viewport</span>
        <span className="text-xs text-gray-400">Entity {entityId}</span>
      </div>

      {/* Gizmo mode switcher - Modern style with glassmorphism */}
      <div className="absolute top-4 right-4 z-10 bg-black/30 backdrop-blur-sm border border-gray-700/50 rounded-lg p-1 flex gap-1">
        <button
          className={`px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 flex items-center space-x-1 ${
            mode === 'translate'
              ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg'
              : 'text-gray-300 hover:bg-gray-700/50'
          }`}
          onClick={() => setMode('translate')}
          title="Switch to Move Tool (W)"
        >
          <span>Move</span>
          <kbd className="ml-1 bg-black/30 px-1 rounded text-[10px]">W</kbd>
        </button>
        <button
          className={`px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 flex items-center space-x-1 ${
            mode === 'rotate'
              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
              : 'text-gray-300 hover:bg-gray-700/50'
          }`}
          onClick={() => setMode('rotate')}
          title="Switch to Rotate Tool (E)"
        >
          <span>Rotate</span>
          <kbd className="ml-1 bg-black/30 px-1 rounded text-[10px]">E</kbd>
        </button>
        <button
          className={`px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 flex items-center space-x-1 ${
            mode === 'scale'
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
              : 'text-gray-300 hover:bg-gray-700/50'
          }`}
          onClick={() => setMode('scale')}
          title="Switch to Scale Tool (R)"
        >
          <span>Scale</span>
          <kbd className="ml-1 bg-black/30 px-1 rounded text-[10px]">R</kbd>
        </button>
      </div>

      {/* Axes indicator - bottom right with modern styling */}
      <div className="absolute bottom-4 right-4 z-10 bg-black/30 backdrop-blur-sm border border-gray-700/50 rounded-lg px-3 py-2">
        <div className="flex items-center space-x-2 text-sm font-medium">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            <span className="text-red-400">X</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-green-400">Y</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-blue-400">Z</span>
          </div>
        </div>
      </div>

      <div className="w-full h-full">
        <Canvas
          camera={{ position: [0, 5, 10], fov: 50 }}
          style={{
            background: 'linear-gradient(135deg, #0c0c0d 0%, #18181b 50%, #1a1a1e 100%)',
          }}
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
