import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import React, { useState } from 'react';

import { useECSQuery } from '@core/hooks/useECS';
import { Transform } from '@core/lib/ecs';

import EntityRenderer from './EntityRenderer';

export interface IViewportPanelProps {
  entityId: number; // selected entity
}

type GizmoMode = 'translate' | 'rotate' | 'scale';

const ViewportPanel: React.FC<IViewportPanelProps> = ({ entityId }) => {
  // Get all entities with a Transform
  const entityIds = useECSQuery([Transform]);

  // Gizmo mode state
  const [mode, setMode] = useState<GizmoMode>('translate');
  // Track if TransformControls is active
  const [isTransforming, setIsTransforming] = useState(false);

  // Handler to update ECS transform when gizmo is used
  const handleTransformChange = (id: number) => (values: [number, number, number]) => {
    if (mode === 'translate') {
      Transform.position[id][0] = values[0];
      Transform.position[id][1] = values[1];
      Transform.position[id][2] = values[2];
    } else if (mode === 'rotate') {
      Transform.rotation[id][0] = values[0];
      Transform.rotation[id][1] = values[1];
      Transform.rotation[id][2] = values[2];
    } else if (mode === 'scale') {
      Transform.scale[id][0] = values[0];
      Transform.scale[id][1] = values[1];
      Transform.scale[id][2] = values[2];
    }
    Transform.needsUpdate[id] = 1;
  };

  return (
    <section className="flex-1 bg-[#18181b] flex flex-col items-stretch border-r border-[#181a1b] relative">
      <div className="absolute top-2 left-2 z-10 text-xs bg-black/60 px-2 py-1 rounded text-gray-300">
        Viewport (Entity {entityId})
      </div>
      {/* Gizmo mode switcher */}
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <button
          className={`px-2 py-1 rounded text-xs font-bold ${mode === 'translate' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          onClick={() => setMode('translate')}
        >
          Move
        </button>
        <button
          className={`px-2 py-1 rounded text-xs font-bold ${mode === 'rotate' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          onClick={() => setMode('rotate')}
        >
          Rotate
        </button>
        <button
          className={`px-2 py-1 rounded text-xs font-bold ${mode === 'scale' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          onClick={() => setMode('scale')}
        >
          Scale
        </button>
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
          {/* Render all entities */}
          {entityIds.map((id) => (
            <EntityRenderer
              key={id}
              entityId={id}
              selected={id === entityId}
              mode={mode}
              onTransformChange={id === entityId ? handleTransformChange(id) : undefined}
              setIsTransforming={id === entityId ? setIsTransforming : undefined}
            />
          ))}
          <OrbitControls enabled={!isTransforming} />
        </Canvas>
      </div>
    </section>
  );
};

export default ViewportPanel;
