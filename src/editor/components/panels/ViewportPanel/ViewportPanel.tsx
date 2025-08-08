import { OrbitControls } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import React, { useEffect, useState } from 'react';
import * as THREE from 'three';

import { CameraBackgroundManager } from '@/core/components/cameras/CameraBackgroundManager';
import { CameraControlsManager } from '@/core/components/cameras/CameraControlsManager';
import { CameraFollowManager } from '@/core/components/cameras/CameraFollowManager';
import { GameCameraManager } from '@/core/components/cameras/GameCameraManager';
import { EnvironmentLighting } from '@/core/components/lighting/EnvironmentLighting';
import { useEvent } from '@/core/hooks/useEvent';
import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { isValidEntityId } from '@/core/lib/ecs/utils';
import { setSelectedCameraEntity } from '@/core/systems/cameraSystem';
import { useComponentRegistry } from '@/core/hooks/useComponentRegistry';
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
  const groupSelection = useGroupSelection();
  const { getEntitiesWithComponent, getComponentData } = useComponentRegistry();

  // Subscribe to component changes only (entities are managed by Editor)
  useEffect(() => {
    const updateEntities = () => {
      const entities = getEntitiesWithComponent(KnownComponentTypes.TRANSFORM);
      setEntityIds(entities);

      const lights = getEntitiesWithComponent(KnownComponentTypes.LIGHT);
      setLightIds(lights);
    };

    // Initial load
    updateEntities();
  }, [getEntitiesWithComponent]);

  // Listen to component events using the global event system
  useEvent('component:added', (event) => {
    if (event.componentId === KnownComponentTypes.TRANSFORM) {
      const entities = getEntitiesWithComponent(KnownComponentTypes.TRANSFORM);
      setEntityIds(entities);
    }
    if (event.componentId === KnownComponentTypes.LIGHT) {
      const lights = getEntitiesWithComponent(KnownComponentTypes.LIGHT);
      setLightIds(lights);
    }
  });

  useEvent('component:removed', (event) => {
    if (event.componentId === KnownComponentTypes.TRANSFORM) {
      const entities = getEntitiesWithComponent(KnownComponentTypes.TRANSFORM);
      setEntityIds(entities);
    }
    if (event.componentId === KnownComponentTypes.LIGHT) {
      const lights = getEntitiesWithComponent(KnownComponentTypes.LIGHT);
      setLightIds(lights);
    }
  });

  // Track if TransformControls is active
  const [isTransforming, setIsTransforming] = useState(false);

  // Check if selected entity is a camera using isValidEntityId
  const selectedEntityIsCamera = isValidEntityId(entityId)
    ? hasComponent(entityId, KnownComponentTypes.CAMERA)
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
          {/* Selection framer: provides frame function for double-click */}
          <SelectionFramer />
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

// Internal helper to frame/focus entity on double-click in the viewport
const SelectionFramer: React.FC = () => {
  const { camera } = useThree();

  const _frameEntity = (entityId: number) => {
    console.log(`[SelectionFramer] frameEntity called with entityId: ${entityId}`);
    if (!isValidEntityId(entityId)) {
      console.log(`[SelectionFramer] Invalid entity ID: ${entityId}`);
      return;
    }

    // Get transform to position camera target
    const transformData = getComponentData(entityId, KnownComponentTypes.TRANSFORM) as { position?: [number, number, number]; scale?: [number, number, number] } | undefined;

    if (!transformData) {
      console.log(`[SelectionFramer] No transform found for entity: ${entityId}`);
      return;
    }

    const pos = transformData?.position ?? [0, 0, 0];
    const scale = transformData?.scale ?? [1, 1, 1];

    console.log(`[SelectionFramer] Entity ${entityId} position:`, pos, 'scale:', scale);

    // Calculate object size for proper framing
    const objectSize = Math.max(Math.abs(scale[0]), Math.abs(scale[1]), Math.abs(scale[2]));

    // Calculate distance needed to frame the object properly
    // Use camera's field of view to determine optimal distance (assume perspective camera)
    const fov = (camera as THREE.PerspectiveCamera).fov || 60; // Default to 60 if not available
    const fovRad = (fov * Math.PI) / 180;
    const distance = Math.max(3, (objectSize * 2.5) / Math.tan(fovRad / 2));

    console.log(`[SelectionFramer] Object size: ${objectSize}, Distance: ${distance}`);

    // Target position (object center)
    const target = new THREE.Vector3(pos[0], pos[1], pos[2]);

    // Position camera in front of the object (simple approach for reliable centering)
    // Use current camera direction but ensure good framing
    const currentDirection = new THREE.Vector3();
    camera.getWorldDirection(currentDirection);

    // Position camera directly opposite to its current viewing direction
    const cameraOffset = currentDirection.clone().multiplyScalar(-distance);
    const newCameraPosition = target.clone().add(cameraOffset);

    console.log(`[SelectionFramer] Target:`, target, 'New camera position:', newCameraPosition);

    // Smooth animation
    const startPosition = camera.position.clone();
    let t = 0;
    const durationMs = 600; // Slightly longer for smoother feel
    const startTime = performance.now();

    const animate = () => {
      t = Math.min(1, (performance.now() - startTime) / durationMs);

      // Smooth ease-in-out animation
      const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      // Interpolate camera position
      camera.position.lerpVectors(startPosition, newCameraPosition, easeT);

      // Always look directly at the target center
      camera.lookAt(target);

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        console.log(`[SelectionFramer] Animation complete - camera at:`, camera.position);
      }
    };

    requestAnimationFrame(animate);
  };

  // No auto-framing - only on double-click

  // Also store the frame function for external use
  useEffect(() => {
    (window as Window & { __frameEntity?: (entityId: number) => void }).__frameEntity = frameEntity;
    console.log('[SelectionFramer] Frame function registered on window');
  }, [camera, componentManager]);

  return null;
};
