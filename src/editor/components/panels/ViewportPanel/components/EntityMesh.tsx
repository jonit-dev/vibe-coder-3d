import { ModelErrorBoundary } from '@/editor/components/shared/ModelErrorBoundary';
import { ModelLoadingMesh } from '@/editor/components/shared/ModelLoadingMesh';
import { useGLTF } from '@react-three/drei';
import { invalidate, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import React, { Suspense, useCallback, useEffect, useMemo } from 'react';
import type { Group, Mesh, Object3D } from 'three';
import { Box3, OrthographicCamera, Vector3 } from 'three';
import { SkeletonUtils } from 'three-stdlib';

import type { IRenderingContributions } from '@/core/types/entities';
import { compareMaterials, deepEqual, shallowEqual } from '@/core/utils/comparison';
import { useLOD } from '@core/hooks/useLOD';
import { Logger } from '@core/lib/logger';
// import { useAutoLOD } from './AutoLOD'; // Disabled - offline optimization is sufficient
import { CameraEntity } from './CameraEntity';
import { useEntityRegistration } from './hooks/useEntityRegistration';
import { useTextureLoading } from './hooks/useTextureLoading';
import { LightEntity } from './LightEntity';
import { MaterialRenderer } from './MaterialRenderer';
import type { IEntityMeshProps } from './types';
import { isMeshRendererData } from './utils';

const logger = Logger.create('EntityMesh');

// Custom Model Mesh Component - FIXED VERSION
const CustomModelMesh: React.FC<{
  modelPath: string;
  meshInstanceRef: React.Ref<Group | Mesh | Object3D | null>;
  renderingContributions: IRenderingContributions;
  entityId: number;
  onMeshClick: (e: ThreeEvent<MouseEvent>) => void;
  onMeshDoubleClick?: (e: ThreeEvent<MouseEvent>) => void;
}> = React.memo(
  ({
    modelPath,
    meshInstanceRef,
    renderingContributions,
    entityId,
    onMeshClick,
    onMeshDoubleClick,
  }) => {
    // Apply LOD system - automatically switches between original/high_fidelity/low_fidelity
    // based on global LOD quality setting or distance
    const [lodDistance, setLodDistance] = React.useState<number | undefined>(undefined);
    const selfGroupRef = React.useRef<Group | null>(null);
    const tmpVecRef = React.useRef(new Vector3());
    const lastEmitRef = React.useRef<number | null>(null);
    const smoothedRef = React.useRef<number | null>(null);
    const lastTickMsRef = React.useRef(0);

    // Compute effective camera distance (accounts for ortho zoom) with heavy smoothing
    // to prevent rapid LOD switching that breaks TransformControls
    useFrame(({ clock }) => {
      if (!selfGroupRef.current) return;

      const nowMs = clock.elapsedTime * 1000;
      // Throttle updates to 5Hz (was 10Hz) to reduce LOD switching frequency
      if (nowMs - lastTickMsRef.current < 200) return;
      lastTickMsRef.current = nowMs;

      // Get world position of this model
      const worldPos = tmpVecRef.current;
      worldPos.setFromMatrixPosition(selfGroupRef.current.matrixWorld);

      // Measure distance
      let dist = camera.position.distanceTo(worldPos);

      // Adjust for orthographic zoom (zoom in => lower effective distance)
      if (camera instanceof OrthographicCamera) {
        const zoom = Math.max(0.0001, (camera as OrthographicCamera).zoom);
        dist = dist / zoom;
      }

      // Heavy smoothing to avoid rapid toggling near thresholds (was 0.85/0.15, now 0.95/0.05)
      if (smoothedRef.current == null) {
        smoothedRef.current = dist;
      } else {
        smoothedRef.current = smoothedRef.current * 0.95 + dist * 0.05;
      }

      const smoothed = smoothedRef.current;

      // Only emit state update when change is very significant (was 0.25, now 1.0)
      // This prevents frequent LOD switches during normal camera movement
      const last = lastEmitRef.current;
      if (last == null || Math.abs(smoothed - last) > 1.0) {
        lastEmitRef.current = smoothed;
        setLodDistance(smoothed);
        // Ensure a frame is rendered if frameloop="demand"
        invalidate();
      }
    });

    // Apply LOD system - automatically switches between original/high_fidelity/low_fidelity
    // based on global LOD quality setting or distance
    const lodPath = useLOD({ basePath: modelPath, distance: lodDistance });

    // Log LOD path changes (only when actually switching)
    const prevLodPathRef = React.useRef<string>(lodPath);
    React.useEffect(() => {
      if (lodPath !== prevLodPathRef.current) {
        logger.info('🔄 LOD model switched', {
          from: prevLodPathRef.current,
          to: lodPath,
          entityId,
          distance: lodDistance,
        });
        prevLodPathRef.current = lodPath;
      }
    }, [lodPath, entityId, lodDistance]);

    // Don't wrap useGLTF in try-catch - it throws promises for Suspense, not errors
    // The Suspense boundary in the parent component will handle loading states
    const { scene } = useGLTF(lodPath);
    const { gl, scene: r3fScene, camera } = useThree();

    // Log model details for debugging LOD switching
    React.useEffect(() => {
      let triangles = 0;
      scene.traverse((obj) => {
        if ('geometry' in obj && obj.geometry) {
          const geom = obj.geometry as any;
          if (geom.index) {
            triangles += geom.index.count / 3;
          } else if (geom.attributes?.position) {
            triangles += geom.attributes.position.count / 3;
          }
        }
      });
      logger.info('Model loaded from LOD path', {
        path: lodPath,
        triangles: Math.floor(triangles),
        entityId,
      });
    }, [scene, lodPath]);

    // NOTE: Runtime AutoLOD disabled - offline optimization via scripts/optimize-models.js is more reliable
    // SimplifyModifier has issues with interleaved buffers and certain geometry types
    // We use offline 75% triangle reduction instead (501k → 125k triangles)

    const modelScene = useMemo(() => {
      // Clone the cached scene so multiple entities don't mutate the same instance
      const clonedScene = SkeletonUtils.clone(scene) as Group;

      // Calculate bounding box to find the actual center
      const box = new Box3();
      box.setFromObject(clonedScene);

      // Get the center of the bounding box
      const center = new Vector3();
      box.getCenter(center);

      // Offset the scene so its bounding box center is at origin
      // This ensures consistent centering across all LOD levels
      clonedScene.position.set(-center.x, -center.y, -center.z);
      clonedScene.rotation.set(0, 0, 0);
      clonedScene.scale.set(1, 1, 1);
      clonedScene.matrixAutoUpdate = true;

      // Ensure all children respect parent transforms and enable frustum culling
      clonedScene.traverse((child) => {
        child.matrixAutoUpdate = true;
        // Enable frustum culling for all meshes (major performance optimization)
        if ('isMesh' in child && child.isMesh) {
          (child as Mesh).frustumCulled = true;
        }
      });

      // CRITICAL: Force update world matrix to ensure transforms are applied
      clonedScene.updateMatrixWorld(true);

      logger.debug('Model centered', {
        entityId,
        lodPath,
        originalCenter: [center.x, center.y, center.z],
        offset: [-center.x, -center.y, -center.z],
      });

      return clonedScene;
    }, [scene, entityId, lodPath]);

    // Shader warm-up: Precompile using the REAL scene + camera so lighting variants match
    useEffect(() => {
      if (!gl || !r3fScene || !camera) return;

      // Defer to next frame to ensure this model is attached to the scene graph
      const rafId = requestAnimationFrame(() => {
        try {
          gl.compile(r3fScene, camera);
        } catch (error) {
          console.error('[PERF] Shader precompile failed:', error);
        }
      });

      return () => cancelAnimationFrame(rafId);
    }, [gl, r3fScene, camera, modelScene]);

    // Use callback ref to ensure proper Group integration with transform system
    const groupRefCallback = useCallback(
      (node: Group | null) => {
        if (node) {
          // CRITICAL: Ensure the group can be transformed by gizmos and physics
          node.matrixAutoUpdate = true;
          node.userData = { ...node.userData, entityId };

          // IMPORTANT: Start the group at origin to match other mesh types
          // The transform system will apply the actual entity position
          node.position.set(0, 0, 0);
          node.rotation.set(0, 0, 0);
          node.scale.set(1, 1, 1);

          // Store local ref for distance calculations
          selfGroupRef.current = node;

          if (typeof meshInstanceRef === 'function') {
            meshInstanceRef(node);
          } else if (meshInstanceRef && 'current' in meshInstanceRef) {
            (meshInstanceRef as React.MutableRefObject<Group | Mesh | Object3D | null>).current =
              node;
          }
        } else if (typeof meshInstanceRef === 'function') {
          meshInstanceRef(null);
        } else if (meshInstanceRef && 'current' in meshInstanceRef) {
          (meshInstanceRef as React.MutableRefObject<Group | Mesh | Object3D | null>).current =
            null;
        }
        // Clear local ref when unmounted
        if (!node) {
          selfGroupRef.current = null;
        }
      },
      [meshInstanceRef, entityId],
    );

    // PERFORMANCE: Matrix updates now handled by ModelMatrixSystem (batched)
    // See: performance-audit-report.md #4 - removes N individual useFrame hooks

    // CRITICAL: Use lodPath as key on primitive (not group) to force remount when LOD changes
    // This ensures TransformControls properly detaches before the mesh changes
    // while preserving the group's transform (position/rotation/scale)
    return (
      <group
        ref={groupRefCallback}
        userData={{ entityId }}
        onClick={onMeshClick}
        onDoubleClick={onMeshDoubleClick}
        castShadow={renderingContributions.castShadow}
        receiveShadow={renderingContributions.receiveShadow}
        visible={renderingContributions.visible}
        frustumCulled={true}
      >
        <primitive key={lodPath} object={modelScene} />
      </group>
    );
  },
  // Custom comparison function to prevent unnecessary re-renders
  // PERFORMANCE: Replaced JSON.stringify with fast shallow comparison
  (prevProps, nextProps) => {
    // Only re-render if actual data changes (return true = skip re-render, false = do re-render)
    if (prevProps.modelPath !== nextProps.modelPath || prevProps.entityId !== nextProps.entityId) {
      return false;
    }

    const prevRC = prevProps.renderingContributions;
    const nextRC = nextProps.renderingContributions;

    if (
      prevRC.castShadow !== nextRC.castShadow ||
      prevRC.receiveShadow !== nextRC.receiveShadow ||
      prevRC.visible !== nextRC.visible
    ) {
      return false;
    }

    // Fast material comparison without JSON.stringify
    if (!compareMaterials(prevRC.material, nextRC.material)) {
      return false;
    }

    return true; // All props equal, skip re-render
  },
);

export const EntityMesh: React.FC<IEntityMeshProps> = React.memo(
  ({
    meshRef,
    meshInstanceRef,
    meshType,
    renderingContributions,
    entityColor,
    entityId,
    onMeshClick,
    onMeshDoubleClick,
    isPlaying = false,
    entityComponents = [],
  }) => {
    // Use custom hooks for entity management
    useEntityRegistration(meshRef, entityId);

    // Load material and textures - must be called before any conditional returns
    const material = renderingContributions.material || {};
    const { textures, isTextureMode } = useTextureLoading(material);

    // Don't render anything if no mesh type is set
    if (!meshType) {
      return null;
    }

    // Check if this is a custom model
    const meshRendererComponent = entityComponents.find((c) => c.type === 'MeshRenderer');
    const meshRendererData = meshRendererComponent?.data;
    const modelPath = isMeshRendererData(meshRendererData) ? meshRendererData.modelPath : undefined;

    // If it's a custom model with a valid path, render the custom model
    if (meshType === 'custom' && modelPath) {
      return (
        <ModelErrorBoundary
          entityId={entityId}
          fallbackMesh={
            <mesh
              ref={meshInstanceRef as React.Ref<Mesh>}
              userData={{ entityId }}
              onClick={onMeshClick}
              onDoubleClick={onMeshDoubleClick}
              castShadow={renderingContributions.castShadow}
              receiveShadow={renderingContributions.receiveShadow}
              visible={renderingContributions.visible}
              frustumCulled={true}
            >
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#ff4444" wireframe />
            </mesh>
          }
        >
          <Suspense
            fallback={
              <ModelLoadingMesh
                meshRef={meshRef}
                meshInstanceRef={meshInstanceRef}
                entityId={entityId}
                renderingContributions={renderingContributions}
                onMeshClick={onMeshClick}
                onMeshDoubleClick={onMeshDoubleClick}
              />
            }
          >
            <CustomModelMesh
              modelPath={modelPath}
              meshInstanceRef={meshInstanceRef}
              renderingContributions={renderingContributions}
              entityId={entityId}
              onMeshClick={onMeshClick}
              onMeshDoubleClick={onMeshDoubleClick}
            />
          </Suspense>
        </ModelErrorBoundary>
      );
    }

    // Special handling for camera entities
    if (meshType === 'Camera') {
      return (
        <CameraEntity
          meshInstanceRef={meshInstanceRef}
          entityId={entityId}
          entityComponents={entityComponents}
          isPlaying={isPlaying}
          onMeshClick={onMeshClick}
        />
      );
    }

    // Special handling for light entities
    if (meshType === 'Light') {
      return (
        <LightEntity
          meshInstanceRef={meshInstanceRef}
          entityId={entityId}
          entityComponents={entityComponents}
          isPlaying={isPlaying}
          onMeshClick={onMeshClick}
        />
      );
    }

    // Render material-based mesh with Suspense to handle texture loading
    return (
      <Suspense
        fallback={
          <mesh
            ref={meshInstanceRef as React.Ref<Mesh>}
            userData={{ entityId }}
            onClick={onMeshClick}
            onDoubleClick={onMeshDoubleClick}
            castShadow={renderingContributions.castShadow}
            receiveShadow={renderingContributions.receiveShadow}
            visible={renderingContributions.visible}
            frustumCulled={true}
          >
            {/* Simple geometry fallback while textures load */}
            {meshType === 'cube' && <boxGeometry args={[1, 1, 1]} />}
            {meshType === 'sphere' && <sphereGeometry args={[0.5, 32, 16]} />}
            {meshType === 'plane' && <planeGeometry args={[1, 1]} />}
            {meshType === 'cylinder' && <cylinderGeometry args={[0.5, 0.5, 1, 32]} />}
            {!['cube', 'sphere', 'plane', 'cylinder'].includes(meshType) && (
              <boxGeometry args={[1, 1, 1]} />
            )}
            <meshStandardMaterial
              color={
                typeof material.color === 'string'
                  ? material.color
                  : typeof material.color === 'object' && material.color !== null
                    ? `rgb(${material.color.r}, ${material.color.g}, ${material.color.b})`
                    : entityColor
              }
            />
          </mesh>
        }
      >
        <MaterialRenderer
          meshInstanceRef={meshInstanceRef}
          meshType={meshType}
          entityComponents={entityComponents}
          renderingContributions={renderingContributions}
          entityColor={entityColor}
          entityId={entityId}
          onMeshClick={onMeshClick}
          onMeshDoubleClick={onMeshDoubleClick}
          textures={textures}
          isTextureMode={isTextureMode}
          material={material}
        />
      </Suspense>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function to prevent unnecessary re-renders

    // Compare primitive values first
    if (
      prevProps.entityId !== nextProps.entityId ||
      prevProps.meshType !== nextProps.meshType ||
      prevProps.entityColor !== nextProps.entityColor ||
      prevProps.isPlaying !== nextProps.isPlaying ||
      prevProps.meshInstanceRef !== nextProps.meshInstanceRef
    ) {
      return false;
    }

    // Deep compare renderingContributions
    // PERFORMANCE: Replaced JSON.stringify with fast shallow comparison
    const prevRC = prevProps.renderingContributions;
    const nextRC = nextProps.renderingContributions;
    if (
      prevProps.meshType !== nextProps.meshType ||
      prevRC.castShadow !== nextRC.castShadow ||
      prevRC.receiveShadow !== nextRC.receiveShadow ||
      prevRC.visible !== nextRC.visible
    ) {
      return false;
    }

    // Fast material comparison without JSON.stringify
    if (!compareMaterials(prevRC.material, nextRC.material)) {
      return false;
    }

    // Compare entityComponents (focus on data changes, not reference changes)
    // IMPORTANT: Exclude Transform component changes to prevent mesh re-rendering during gizmo transforms
    const relevantPrevComponents = (prevProps.entityComponents || []).filter(
      (c) => c.type !== 'Transform',
    );
    const relevantNextComponents = (nextProps.entityComponents || []).filter(
      (c) => c.type !== 'Transform',
    );

    if (relevantPrevComponents.length !== relevantNextComponents.length) {
      return false;
    }

    // Check if any relevant component data has actually changed
    // PERFORMANCE: Use shallow/deep comparison to avoid JSON.stringify entirely
    for (let i = 0; i < relevantPrevComponents.length; i++) {
      const prev = relevantPrevComponents[i];
      const next = relevantNextComponents[i];

      if (prev.type !== next.type) {
        return false;
      }

      // For component types with simple flat data, use fast shallow comparison
      if (
        ['MeshRenderer', 'RigidBody', 'Camera', 'Light', 'Sound', 'PrefabInstance'].includes(
          prev.type,
        )
      ) {
        if (
          !shallowEqual(prev.data as Record<string, unknown>, next.data as Record<string, unknown>)
        ) {
          return false;
        }
      } else {
        // For complex components (Script, Terrain, CustomShape), use deep comparison
        // Still faster than JSON.stringify and avoids string allocation
        if (!deepEqual(prev.data, next.data)) {
          return false;
        }
      }
    }

    // Function references can be ignored for memo - they're event handlers
    // and don't affect rendering output directly

    return true; // Props are equal, skip re-render
  },
);

EntityMesh.displayName = 'EntityMesh';
