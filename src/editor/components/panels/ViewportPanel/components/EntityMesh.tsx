import { ModelErrorBoundary } from '@/editor/components/shared/ModelErrorBoundary';
import { ModelLoadingMesh } from '@/editor/components/shared/ModelLoadingMesh';
import { useGLTF } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import React, { Suspense, useCallback, useMemo } from 'react';
import type { Group, Mesh, Object3D } from 'three';
import { SkeletonUtils } from 'three-stdlib';

import type { IRenderingContributions } from '@/core/types/entities';
import { compareMaterials, shallowEqual, deepEqual } from '@/core/utils/comparison';
import { CameraEntity } from './CameraEntity';
import { useEntityRegistration } from './hooks/useEntityRegistration';
import { useTextureLoading } from './hooks/useTextureLoading';
import { LightEntity } from './LightEntity';
import { MaterialRenderer } from './MaterialRenderer';
import type { IEntityMeshProps } from './types';
import { isMeshRendererData } from './utils';

// Custom Model Mesh Component - FIXED VERSION
const CustomModelMesh: React.FC<{
  modelPath: string;
  meshInstanceRef: React.Ref<Group | Mesh | Object3D | null>;
  renderingContributions: IRenderingContributions;
  entityId: number;
  onMeshClick: (e: ThreeEvent<MouseEvent>) => void;
  onMeshDoubleClick?: (e: ThreeEvent<MouseEvent>) => void;
}> = React.memo(
  ({ modelPath, meshInstanceRef, renderingContributions, entityId, onMeshClick, onMeshDoubleClick }) => {
    // Don't wrap useGLTF in try-catch - it throws promises for Suspense, not errors
    // The Suspense boundary in the parent component will handle loading states
    const { scene } = useGLTF(modelPath);

    const modelScene = useMemo(() => {
      // Clone the cached scene so multiple entities don't mutate the same instance
      const clonedScene = SkeletonUtils.clone(scene) as Group;
      clonedScene.position.set(0, 0, 0);
      clonedScene.rotation.set(0, 0, 0);
      clonedScene.matrixAutoUpdate = true;

      // Ensure all children respect parent transforms
      clonedScene.traverse((child) => {
        child.matrixAutoUpdate = true;
      });

      return clonedScene;
    }, [scene]);

    // Use callback ref to ensure proper Group integration with transform system
    const groupRefCallback = useCallback(
      (groupRef: Group | null) => {
        if (groupRef) {
          // CRITICAL: Ensure the group can be transformed by gizmos and physics
          groupRef.matrixAutoUpdate = true;
          groupRef.userData = { ...groupRef.userData, entityId };

          // IMPORTANT: Start the group at origin to match other mesh types
          // The transform system will apply the actual entity position
          groupRef.position.set(0, 0, 0);
          groupRef.rotation.set(0, 0, 0);
          groupRef.scale.set(1, 1, 1);

          if (typeof meshInstanceRef === 'function') {
            meshInstanceRef(groupRef);
          } else if (meshInstanceRef && 'current' in meshInstanceRef) {
            (meshInstanceRef as React.MutableRefObject<Group | Mesh | Object3D | null>).current =
              groupRef;
          }
        } else if (typeof meshInstanceRef === 'function') {
          meshInstanceRef(null);
        } else if (meshInstanceRef && 'current' in meshInstanceRef) {
          (meshInstanceRef as React.MutableRefObject<Group | Mesh | Object3D | null>).current = null;
        }
      },
      [meshInstanceRef, entityId],
    );

    // PERFORMANCE: Matrix updates now handled by ModelMatrixSystem (batched)
    // See: performance-audit-report.md #4 - removes N individual useFrame hooks

    return (
      <group
        ref={groupRefCallback}
        userData={{ entityId }}
        onClick={onMeshClick}
        onDoubleClick={onMeshDoubleClick}
        castShadow={renderingContributions.castShadow}
        receiveShadow={renderingContributions.receiveShadow}
        visible={renderingContributions.visible}
      >
        <primitive object={modelScene} />
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
