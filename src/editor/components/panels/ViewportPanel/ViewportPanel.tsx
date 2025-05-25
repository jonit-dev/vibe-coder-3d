import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import React, { useEffect, useState } from 'react';

import { GameCameraManager } from '@/core/components/cameras/GameCameraManager';
import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { useComponentManager } from '@/editor/hooks/useComponentManager';
import { GizmoMode } from '@/editor/hooks/useEditorKeyboard';

import { useEditorStore } from '../../../store/editorStore';

import { EntityRenderer } from './EntityRenderer';
import { AxesIndicator } from './components/AxesIndicator';
import { GizmoModeSelector } from './components/GizmoModeSelector';
import { ViewportHeader } from './components/ViewportHeader';

export interface IViewportPanelProps {
  entityId: number | null; // selected entity - can be null
  gizmoMode: GizmoMode;
  setGizmoMode: (mode: GizmoMode) => void;
}

export const ViewportPanel: React.FC<IViewportPanelProps> = ({
  entityId,
  gizmoMode,
  setGizmoMode,
}) => {
  // Get all entities with a Transform from new ECS system
  const [entityIds, setEntityIds] = useState<number[]>([]);
  const isPlaying = useEditorStore((state) => state.isPlaying);
  const componentManager = useComponentManager();

  // Subscribe to component changes only (entities are managed by Editor)
  useEffect(() => {
    const updateEntities = () => {
      const entities = componentManager.getEntitiesWithComponent(KnownComponentTypes.TRANSFORM);
      setEntityIds(entities);
      console.debug(`[ViewportPanel] 🔍 Found ${entities.length} renderable entities:`, entities);
    };

    // Initial load
    updateEntities();

    // Listen only to component events that affect rendering
    const unsubscribeComponentEvents = componentManager.addEventListener((event) => {
      if (event.componentType === KnownComponentTypes.TRANSFORM) {
        updateEntities();
      }
    });

    return () => {
      unsubscribeComponentEvents();
    };
  }, [componentManager]);

  // Track if TransformControls is active
  const [isTransforming, setIsTransforming] = useState(false);

  // Handler to update ECS transform when gizmo is used
  // This is now handled by GizmoControls which properly emits events
  const handleTransformChange = () => () => {
    // This callback is no longer used as GizmoControls handles transform updates
    // Removed debug logging to reduce console spam during drag
  };

  return (
    <section className="flex-1 bg-gradient-to-br from-[#0c0c0d] to-[#18181b] flex flex-col items-stretch border-r border-gray-800/50 relative overflow-hidden">
      {/* Modern viewport header */}
      <ViewportHeader entityId={entityId} />

      {/* Gizmo mode switcher - Only show when entity selected */}
      {entityId != null && <GizmoModeSelector gizmoMode={gizmoMode} setGizmoMode={setGizmoMode} />}

      {/* Axes indicator */}
      <AxesIndicator />

      <div className="w-full h-full">
        <Canvas
          camera={{ position: [0, 5, 10], fov: 50 }}
          style={{
            background: 'linear-gradient(135deg, #0c0c0d 0%, #18181b 50%, #1a1a1e 100%)',
          }}
          shadows
        >
          {/* Game Camera Manager - handles camera switching between editor and play mode */}
          <GameCameraManager isPlaying={isPlaying} />

          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />

          {/* Physics wrapper - only enabled when playing */}
          <Physics paused={!isPlaying} gravity={[0, -9.81, 0]}>
            {/* Grid - Unity style */}
            <gridHelper args={[20, 20, '#444444', '#222222']} />

            {/* Render all entities */}
            {entityIds.map((id) => (
              <EntityRenderer
                key={id}
                entityId={id}
                selected={id === entityId}
                mode={gizmoMode}
                onTransformChange={id === entityId ? handleTransformChange() : undefined}
                setIsTransforming={id === entityId ? setIsTransforming : undefined}
                setGizmoMode={id === entityId ? setGizmoMode : undefined}
              />
            ))}

            {/* Show empty state message when no entities exist or none selected */}
            {entityIds.length === 0 && (
              <group>
                <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[0.1, 0.1, 0.1]} />
                  <meshBasicMaterial transparent opacity={0} />
                </mesh>
              </group>
            )}
          </Physics>

          <OrbitControls enabled={!isTransforming} />
        </Canvas>
      </div>
    </section>
  );
};
