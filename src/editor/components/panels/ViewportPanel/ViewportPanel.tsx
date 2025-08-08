import { OrbitControls } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import React, { useEffect, useState } from 'react';

import { CameraBackgroundManager } from '@/core/components/cameras/CameraBackgroundManager';
import { CameraControlsManager } from '@/core/components/cameras/CameraControlsManager';
import { CameraFollowManager } from '@/core/components/cameras/CameraFollowManager';
import { GameCameraManager } from '@/core/components/cameras/GameCameraManager';
import { EnvironmentLighting } from '@/core/components/lighting/EnvironmentLighting';
import { useEvent } from '@/core/hooks/useEvent';
import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { isValidEntityId } from '@/core/lib/ecs/utils';
import { setSelectedCameraEntity } from '@/core/systems/cameraSystem';
import { useComponentManager } from '@/editor/hooks/useComponentManager';
import { GizmoMode } from '@/editor/hooks/useEditorKeyboard';
import { useGroupSelection } from '@/editor/hooks/useGroupSelection';

import { useEditorStore } from '../../../store/editorStore';

import { EntityRenderer } from './EntityRenderer';
import { GroupGizmoControls } from './GroupGizmoControls';
import { LightRenderer } from './LightRenderer';
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
  const [lightIds, setLightIds] = useState<number[]>([]);
  const isPlaying = useEditorStore((state) => state.isPlaying);
  const componentManager = useComponentManager();
  const groupSelection = useGroupSelection();

  // Subscribe to component changes only (entities are managed by Editor)
  useEffect(() => {
    const updateEntities = () => {
      const entities = componentManager.getEntitiesWithComponent(KnownComponentTypes.TRANSFORM);
      setEntityIds(entities);

      const lights = componentManager.getEntitiesWithComponent(KnownComponentTypes.LIGHT);
      setLightIds(lights);
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
    if (event.componentId === KnownComponentTypes.LIGHT) {
      const lights = componentManager.getEntitiesWithComponent(KnownComponentTypes.LIGHT);
      setLightIds(lights);
    }
  });

  useEvent('component:removed', (event) => {
    if (event.componentId === KnownComponentTypes.TRANSFORM) {
      const entities = componentManager.getEntitiesWithComponent(KnownComponentTypes.TRANSFORM);
      setEntityIds(entities);
    }
    if (event.componentId === KnownComponentTypes.LIGHT) {
      const lights = componentManager.getEntitiesWithComponent(KnownComponentTypes.LIGHT);
      setLightIds(lights);
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

      {/* Gizmo mode switcher - Only show when entities selected */}
      {groupSelection.selectedIds.length > 0 && (
        <GizmoModeSelector gizmoMode={gizmoMode} setGizmoMode={setGizmoMode} />
      )}

      {/* Axes indicator */}
      <AxesIndicator />

      <div className="w-full h-full">
        <Canvas
          camera={{ position: [0, 5, 10], fov: 50 }}
          shadows="percentage"
          onCreated={({ camera, gl }) => {
            // Fix camera orientation - look at origin from a good angle
            camera.lookAt(0, 0, 0);

            // Ensure shadow mapping is enabled with good settings
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = 2; // PCFSoftShadowMap
            console.log('[ViewportPanel] Shadow mapping enabled with PCF soft shadows');
          }}
        >
          {/* Selection framer: centers the view on newly selected entity */}
          <SelectionFramer selectedEntityId={entityId} />
          {/* Camera System Connector - connects editor camera to camera system */}
          <CameraSystemConnector />

          {/* Game Camera Manager - handles camera switching between editor and play mode */}
          <GameCameraManager isPlaying={isPlaying} />

          {/* Camera Follow Manager - handles smooth camera following behavior */}
          <CameraFollowManager isPlaying={isPlaying} />

          {/* Camera Background Manager - handles scene background based on camera settings */}
          <CameraBackgroundManager />

          {/* Environment Lighting Manager - handles IBL and ambient lighting */}
          <EnvironmentLighting />

          {/* Camera Controls Manager - handles runtime camera controls */}
          <CameraControlsManager isPlaying={isPlaying} isTransforming={isTransforming} />

          {/* Dynamic Light Rendering */}
          {lightIds.map((lightId) => (
            <LightRenderer key={`light-${lightId}`} entityId={lightId} />
          ))}

          {/* Physics wrapper - only enabled when playing */}
          <Physics paused={!isPlaying} gravity={[0, -9.81, 0]}>
            {/* Grid - Unity style */}
            <gridHelper args={[20, 20, '#444444', '#222222']} />

            {/* Render all entities */}
            {entityIds.map((id) => {
              const isSelected = groupSelection.isSelected(id);
              const isPrimary = groupSelection.isPrimarySelection(id);
              const hasMultipleSelected = groupSelection.selectedIds.length > 1;

              // console.log(`[ViewportPanel] Entity ${id}: selected=${isSelected}, isPrimary=${isPrimary}, multipleSelected=${hasMultipleSelected}`);

              return (
                <EntityRenderer
                  key={id}
                  entityId={id}
                  selected={isSelected}
                  isPrimarySelection={isPrimary && !hasMultipleSelected}
                  mode={gizmoMode}
                  onTransformChange={undefined}
                  setIsTransforming={
                    isPrimary && !hasMultipleSelected ? setIsTransforming : undefined
                  }
                  setGizmoMode={isPrimary && !hasMultipleSelected ? setGizmoMode : undefined}
                  allEntityIds={entityIds}
                />
              );
            })}

            {/* Group Gizmo Controls - shows when multiple entities are selected */}
            {groupSelection.selectedIds.length > 1 && (
              <GroupGizmoControls
                selectedIds={groupSelection.selectedIds}
                mode={gizmoMode}
                onTransformChange={undefined}
                setIsTransforming={setIsTransforming}
              />
            )}

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

// Internal helper to frame/focus the current selection in the viewport
const SelectionFramer: React.FC<{ selectedEntityId: number | null }> = ({ selectedEntityId }) => {
  const { camera } = useThree();
  const componentManager = useComponentManager();

  useEffect(() => {
    if (!isValidEntityId(selectedEntityId)) return;

    // Get transform to position camera target; simple heuristic
    const transform = componentManager.getComponent(
      selectedEntityId!,
      KnownComponentTypes.TRANSFORM,
    )?.data as
      | { position?: [number, number, number]; scale?: [number, number, number] }
      | undefined;

    const pos = transform?.position ?? [0, 0, 0];
    const scale = transform?.scale ?? [1, 1, 1];

    // Compute a distance based on scale to frame object reasonably
    const maxExtent = Math.max(Math.abs(scale[0]), Math.abs(scale[1]), Math.abs(scale[2]));
    const distance = Math.max(3, maxExtent * 3);

    // Move camera to look at the entity smoothly
    const target = { x: pos[0], y: pos[1], z: pos[2] } as any;
    const start = camera.position.clone();
    const end = start.clone().set(pos[0] + distance, pos[1] + distance * 0.5, pos[2] + distance);

    let t = 0;
    const durationMs = 180;
    const startTime = performance.now();
    const animate = () => {
      t = Math.min(1, (performance.now() - startTime) / durationMs);
      camera.position.lerpVectors(start, end, t);
      camera.lookAt(target.x, target.y, target.z);
      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [selectedEntityId, camera, componentManager]);

  return null;
};
