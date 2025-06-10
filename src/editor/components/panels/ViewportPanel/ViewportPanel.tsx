import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import React, { useEffect, useState } from 'react';

import { CameraBackgroundManager } from '@/core/components/cameras/CameraBackgroundManager';
import { CameraControlsManager } from '@/core/components/cameras/CameraControlsManager';
import { CameraFollowManager } from '@/core/components/cameras/CameraFollowManager';
import { GameCameraManager } from '@/core/components/cameras/GameCameraManager';
import { useEvent } from '@/core/hooks/useEvent';
import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { isValidEntityId } from '@/core/lib/ecs/utils';
import { setSelectedCameraEntity } from '@/core/systems/cameraSystem';
import { useComponentManager } from '@/editor/hooks/useComponentManager';
import { GizmoMode } from '@/editor/hooks/useEditorKeyboard';

import { useEditorStore } from '../../../store/editorStore';

import { EntityRenderer } from './EntityRenderer';
import { AxesIndicator } from './components/AxesIndicator';
import { CameraSystemConnector } from './components/CameraSystemConnector';
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
    };

    // Initial load
    updateEntities();
  }, [componentManager]);

  // Listen to component events using the global event system
  useEvent('component:added', (event) => {
    if (event.componentId === KnownComponentTypes.TRANSFORM) {
      const entities = componentManager.getEntitiesWithComponent(KnownComponentTypes.TRANSFORM);
      setEntityIds(entities);
    }
  });

  useEvent('component:removed', (event) => {
    if (event.componentId === KnownComponentTypes.TRANSFORM) {
      const entities = componentManager.getEntitiesWithComponent(KnownComponentTypes.TRANSFORM);
      setEntityIds(entities);
    }
  });

  // Track if TransformControls is active
  const [isTransforming, setIsTransforming] = useState(false);

  // Check if selected entity is a camera using isValidEntityId
  const selectedEntityIsCamera = isValidEntityId(entityId)
    ? componentManager.hasComponent(entityId, KnownComponentTypes.CAMERA)
    : false;

  // Notify camera system when a camera entity is selected
  useEffect(() => {
    if (selectedEntityIsCamera && isValidEntityId(entityId)) {
      setSelectedCameraEntity(entityId);
    } else {
      setSelectedCameraEntity(null);
    }
  }, [selectedEntityIsCamera, entityId]);

  return (
    <section className="flex-1 bg-gradient-to-br from-[#0c0c0d] to-[#18181b] flex flex-col items-stretch border-r border-gray-800/50 relative overflow-hidden">
      {/* Modern viewport header */}
      <ViewportHeader entityId={entityId} />

      {/* Gizmo mode switcher - Only show when entity selected */}
      {isValidEntityId(entityId) && (
        <GizmoModeSelector gizmoMode={gizmoMode} setGizmoMode={setGizmoMode} />
      )}

      {/* Axes indicator */}
      <AxesIndicator />

      <div className="w-full h-full">
        <Canvas
          camera={{ position: [0, 5, 10], fov: 50 }}
          shadows
          onCreated={({ camera }) => {
            // Fix camera orientation - look at origin from a good angle
            camera.lookAt(0, 0, 0);
          }}
        >
          {/* Camera System Connector - connects editor camera to camera system */}
          <CameraSystemConnector />

          {/* Game Camera Manager - handles camera switching between editor and play mode */}
          <GameCameraManager isPlaying={isPlaying} />

          {/* Camera Follow Manager - handles smooth camera following behavior */}
          <CameraFollowManager />

          {/* Camera Background Manager - handles scene background based on camera settings */}
          <CameraBackgroundManager />

          {/* Camera Controls Manager - handles runtime camera controls */}
          <CameraControlsManager isPlaying={isPlaying} isTransforming={isTransforming} />

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
                onTransformChange={undefined}
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

          {/* OrbitControls - only for editor mode when not transforming. Play mode controls handled by CameraControlsManager */}
          {!isPlaying && (
            <OrbitControls
              enabled={!isTransforming}
              target={[0, 0, 0]} // Look at origin
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              dampingFactor={0.05}
              enableDamping={true}
              minDistance={1}
              maxDistance={100}
              key="editor-controls" // Ensure different instances
            />
          )}
        </Canvas>
      </div>
    </section>
  );
};
