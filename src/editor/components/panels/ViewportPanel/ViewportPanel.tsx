import { InputManager } from '@/core/lib/input/InputManager';
import { Logger } from '@core/lib/logger';
import { OrbitControls } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import React, { useEffect, useState } from 'react';
import * as THREE from 'three';

import { EngineLoop } from '@/core/components/EngineLoop';
import { SceneStatsExporter } from '../../debug/SceneStatsExporter';

import { CameraBackgroundManager } from '@/core/components/cameras/CameraBackgroundManager';
import { CameraControlsManager } from '@/core/components/cameras/CameraControlsManager';
import { CameraFollowManager } from '@/core/components/cameras/CameraFollowManager';
import { GameCameraManager } from '@/core/components/cameras/GameCameraManager';
import { EnvironmentLighting } from '@/core/components/lighting/EnvironmentLighting';
import { useComponentRegistry } from '@/core/hooks/useComponentRegistry';
import { useEvent } from '@/core/hooks/useEvent';
import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { isValidEntityId } from '@/core/lib/ecs/utils';
import { setSelectedCameraEntity } from '@/core/systems/cameraSystem';
import { ModelMatrixSystem } from '@/core/systems/ModelMatrixSystem';
import { GizmoMode } from '@/editor/hooks/useEditorKeyboard';
import { useGroupSelection } from '@/editor/hooks/useGroupSelection';

import { useEditorStore } from '../../../store/editorStore';

import { CharacterControllerPhysicsSystem } from '@/core/components/physics/CharacterControllerPhysicsSystem';
import { lodManager } from '@/core/lib/rendering/LODManager';
import { AnimationFocusEffect } from '@editor/components/panels/TimelinePanel/components/AnimationFocusEffect';
import { AxesIndicator } from './components/AxesIndicator';
import { CameraPerformanceController } from './components/CameraPerformanceController';
import { CameraSystemConnector } from './components/CameraSystemConnector';
import { GizmoModeSelector } from './components/GizmoModeSelector';
import { ModelDropZone } from './components/ModelDropZone';
import { PhysicsBindingManager } from './components/PhysicsBindingManager';
import { ViewportHeader } from './components/ViewportHeader';
import { ViewportInvalidateExporter } from './components/ViewportInvalidateExporter';
import { EntityRenderer } from './EntityRenderer';
import { GroupGizmoControls } from './GroupGizmoControls';
import { LightRenderer } from './LightRenderer';
import { useTimelineStore } from '@editor/store/timelineStore';

export interface IViewportPanelProps {
  entityId: number | null; // selected entity - can be null
  gizmoMode: GizmoMode;
  setGizmoMode: (mode: GizmoMode) => void;
}

export const ViewportPanel: React.FC<IViewportPanelProps> = React.memo(
  ({ entityId, gizmoMode, setGizmoMode }) => {
    const logger = Logger.create('ViewportPanel');

    // Track viewport initialization
    useEffect(() => {
      try {
        // Enable LOD auto-switching globally in editor viewport
        lodManager.setAutoSwitch(true);
      } catch (error) {
        logger.error('Failed to initialize LOD manager', { error });
      }
    }, []);

    // Get all entities with a Transform from new ECS system
    const [entityIds, setEntityIds] = useState<number[]>([]);
    const [lightIds, setLightIds] = useState<number[]>([]);
    const isPlaying = useEditorStore((state) => state.isPlaying);
    const selectedIds = useEditorStore((state) => state.selectedIds);
    const groupSelection = useGroupSelection();
    const { getEntitiesWithComponent, hasComponent } = useComponentRegistry();

    // Timeline state for animation focus effects
    const isTimelineOpen = useTimelineStore((state) => state.isOpen);

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

    // PERFORMANCE: Pre-compute selection info to prevent re-renders
    // Use selectedIds directly from store to avoid dependency on groupSelection object
    const selectedIdsSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);
    const primarySelectionId = React.useMemo(
      () => (selectedIds.length > 0 ? selectedIds[0] : null),
      [selectedIds],
    );
    const hasMultipleSelected = React.useMemo(() => selectedIds.length > 1, [selectedIds]);

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

        <div className="w-full h-full relative">
          {/* Drag-and-drop model ingestion overlay */}
          <ModelDropZone />
          <Canvas
            camera={{ position: [-10, 12, -10], fov: 50 }}
            shadows="percentage"
            gl={{
              powerPreference: 'high-performance',
              // Preserve drawing buffer so screenshots can read pixels from the current frame
              preserveDrawingBuffer: true,
              // Enable fail if major performance caveat
              failIfMajorPerformanceCaveat: false,
            }}
            onCreated={({ camera, gl }) => {
              // Fix camera orientation - look at origin from a good angle
              camera.lookAt(0, 0, 0);

              // Ensure shadow mapping is enabled with good settings
              gl.shadowMap.enabled = true;
              gl.shadowMap.type = 2; // PCFSoftShadowMap

              // Add WebGL context loss/restore handlers
              const canvas = gl.domElement;

              // Expose canvas/renderer for tooling (e.g., screenshot feedback tool)
              const globalWindow = window as Window & {
                __editorCanvas?: HTMLCanvasElement;
                __editorRenderer?: THREE.WebGLRenderer;
              };
              globalWindow.__editorCanvas = canvas;
              globalWindow.__editorRenderer = gl;

              canvas.addEventListener(
                'webglcontextlost',
                (event) => {
                  event.preventDefault();
                  logger.error('WebGL context lost! Attempting recovery...', {
                    timestamp: new Date().toISOString(),
                  });
                },
                false,
              );

              canvas.addEventListener(
                'webglcontextrestored',
                () => {
                  logger.info('WebGL context restored successfully', {
                    timestamp: new Date().toISOString(),
                  });
                  // Context will be automatically recreated by Three.js/React Three Fiber
                },
                false,
              );

              // Initialize InputManager with the canvas element
              const inputManager = InputManager.getInstance();
              inputManager.initialize(gl.domElement);

              // LOD auto-switch already enabled in mount effect
            }}
          >
            {/* Selection framer: provides frame function for double-click */}
            <SelectionFramer />
            {/* Scene stats exporter: exposes scene to window for LOD demo */}
            <SceneStatsExporter />
            {/* Viewport invalidate exporter: exposes invalidate function for agent tools */}
            <ViewportInvalidateExporter />
            {/* Animation focus effect: fades out non-focused entities when timeline is open */}
            <AnimationFocusEffect isTimelineOpen={isTimelineOpen} />
            {/* Adaptive quality: DPR + shadow updates throttling while moving */}
            <CameraPerformanceController />
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

            {/* Engine Loop - handles script execution and system updates */}
            <EngineLoop paused={!isPlaying} isPlaying={isPlaying} />

            {/* Model Matrix System - batches matrix updates for custom models */}
            <ModelMatrixSystem />

            {/* Scene Readiness Tracker */}
            <SceneReadinessTracker entityCount={entityIds.length} lightCount={lightIds.length} />

            {/* Dynamic Light Rendering */}
            {lightIds.map((lightId) => (
              <LightRenderer key={`light-${lightId}`} entityId={lightId} />
            ))}

            {/* Physics wrapper - only enabled when playing */}
            {/* CRITICAL: key prop forces full remount on play/stop to prevent Rapier WASM aliasing errors */}
            <Physics
              key={isPlaying ? 'playing' : 'stopped'}
              paused={!isPlaying}
              gravity={[0, -9.81, 0]}
            >
              {/* Physics binding - processes script physics mutations */}
              <PhysicsBindingManager />

              {/* Character Controller Physics System - handles WASD movement with physics */}
              <CharacterControllerPhysicsSystem isPlaying={isPlaying} />

              {/* Grid - Unity style - only show in edit mode */}
              {!isPlaying && <gridHelper args={[20, 20, '#444444', '#222222']} />}

              {/* Render all entities */}
              {entityIds.map((id) => {
                // PERFORMANCE: Use memoized values instead of function calls
                const isSelected = selectedIdsSet.has(id);
                const isPrimary = primarySelectionId === id;

                // Check if entity is camera for gizmo logic

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
                    isPlaying={isPlaying}
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
                enableDamping={false}
                minDistance={1}
                maxDistance={100}
                zoomSpeed={0.5}
                key="editor-controls" // Ensure different instances
              />
            )}
          </Canvas>
        </div>
      </section>
    );
  },
);

// Scene Readiness Tracker - monitors when scene is fully loaded and rendered
const SceneReadinessTracker: React.FC<{ entityCount: number; lightCount: number }> = ({
  entityCount,
  lightCount,
}) => {
  const logger = Logger.create('ViewportPanel:Readiness');

  useEffect(() => {
    if (entityCount > 0 || lightCount > 0) {
      // Use a timeout to ensure all React Three Fiber objects are created
      const timer = setTimeout(() => {
        logger.debug('Scene Fully Rendered', {
          entitiesRendered: entityCount,
          lightsRendered: lightCount,
          totalObjects: entityCount + lightCount,
        });
      }, 100); // Small delay to ensure rendering completion

      return () => clearTimeout(timer);
    }
  }, [entityCount, lightCount, logger]);

  return null;
};

// Internal helper to frame/focus entity on double-click in the viewport
const SelectionFramer: React.FC = () => {
  const logger = Logger.create('SelectionFramer');
  const { camera } = useThree();
  const { getComponentData } = useComponentRegistry();

  const _frameEntity = (entityId: number) => {
    logger.debug(`frameEntity called with entityId: ${entityId}`);
    if (!isValidEntityId(entityId)) {
      logger.debug(`Invalid entity ID: ${entityId}`);
      return;
    }

    // Get transform to position camera target
    const transformData = getComponentData(entityId, KnownComponentTypes.TRANSFORM) as
      | { position?: [number, number, number]; scale?: [number, number, number] }
      | undefined;

    if (!transformData) {
      logger.debug(`No transform found for entity: ${entityId}`);
      return;
    }

    const pos = transformData?.position ?? [0, 0, 0];
    const scale = transformData?.scale ?? [1, 1, 1];

    logger.debug(`Entity ${entityId} position:`, pos, 'scale:', scale);

    // Calculate object size for proper framing
    const objectSize = Math.max(Math.abs(scale[0]), Math.abs(scale[1]), Math.abs(scale[2]));

    // Calculate distance needed to frame the object properly
    // Use camera's field of view to determine optimal distance (assume perspective camera)
    const fov = (camera as THREE.PerspectiveCamera).fov || 60; // Default to 60 if not available
    const fovRad = (fov * Math.PI) / 180;
    const distance = Math.max(3, (objectSize * 2.5) / Math.tan(fovRad / 2));

    logger.debug(`Object size: ${objectSize}, Distance: ${distance}`);

    // Target position (object center)
    const target = new THREE.Vector3(pos[0], pos[1], pos[2]);

    // Position camera in front of the object (simple approach for reliable centering)
    // Use current camera direction but ensure good framing
    const currentDirection = new THREE.Vector3();
    camera.getWorldDirection(currentDirection);

    // Position camera directly opposite to its current viewing direction
    const cameraOffset = currentDirection.clone().multiplyScalar(-distance);
    const newCameraPosition = target.clone().add(cameraOffset);

    logger.debug(`Target:`, target, 'New camera position:', newCameraPosition);

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
        logger.debug(`Animation complete - camera at:`, camera.position);
      }
    };

    requestAnimationFrame(animate);
  };

  // No auto-framing - only on double-click

  // Also store the frame function for external use
  useEffect(() => {
    (window as Window & { __frameEntity?: (entityId: number) => void }).__frameEntity =
      _frameEntity;
  }, [camera, getComponentData]);

  return null;
};
