import { ModelErrorBoundary } from '@/editor/components/shared/ModelErrorBoundary';
import { ModelLoadingMesh } from '@/editor/components/shared/ModelLoadingMesh';
import { useGLTF } from '@react-three/drei';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import React, { Suspense, useCallback, useMemo } from 'react';
import type { Group, Mesh, Object3D } from 'three';

import { Logger } from '@/core/lib/logger';
import type { IRenderingContributions } from '@/core/types/entities';
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
  meshRef: React.RefObject<Group | Mesh | Object3D>;
  renderingContributions: IRenderingContributions;
  entityId: number;
  onMeshClick: (e: ThreeEvent<MouseEvent>) => void;
  onMeshDoubleClick?: (e: ThreeEvent<MouseEvent>) => void;
}> = React.memo(
  ({ modelPath, meshRef, renderingContributions, entityId, onMeshClick, onMeshDoubleClick }) => {
    const logger = Logger.create('CustomModelMesh');
    try {
      const { scene } = useGLTF(modelPath);

      // Don't clone the scene - use it directly to avoid transform inheritance issues
      const modelScene = useMemo(() => {
        // Reset position and rotation but preserve original scale
        scene.position.set(0, 0, 0);
        scene.rotation.set(0, 0, 0);
        // DON'T reset scale - preserve the model's original scale
        scene.matrixAutoUpdate = true;

        // Ensure all children respect parent transforms
        scene.traverse((child) => {
          child.matrixAutoUpdate = true;
        });

        return scene;
      }, [scene, entityId]);

      // Use callback ref to ensure proper Group integration with transform system
      const groupRefCallback = useCallback(
        (groupRef: Group | null) => {
          if (groupRef && meshRef) {
            // CRITICAL: Ensure the group can be transformed by gizmos and physics
            groupRef.matrixAutoUpdate = true;
            groupRef.userData = { ...groupRef.userData, entityId };

            // IMPORTANT: Start the group at origin to match other mesh types
            // The transform system will apply the actual entity position
            groupRef.position.set(0, 0, 0);
            groupRef.rotation.set(0, 0, 0);
            groupRef.scale.set(1, 1, 1);

            // Assign to the passed meshRef for transform system integration
            (meshRef as React.MutableRefObject<Group>).current = groupRef;
          } else if (!groupRef && meshRef.current) {
            // Cleanup when component unmounts
            (meshRef as React.MutableRefObject<Group | null>).current = null;
          }
        },
        [meshRef, entityId, modelScene],
      );

      // Force matrix updates using useFrame to ensure proper parent-child transform inheritance
      useFrame(() => {
        if (meshRef?.current) {
          // Force matrix updates on the group to ensure transforms propagate to children
          meshRef.current.updateMatrixWorld(true);
        }
      });

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
    } catch (error) {
      logger.error('Failed to load model:', {
        entityId,
        modelPath,
        error: (error as Error)?.message || 'Unknown error',
      });

      // Fallback to error mesh with callback ref
      const errorRefCallback = useCallback(
        (errorMeshRef: Mesh | null) => {
          if (errorMeshRef && meshRef) {
            // Ensure the error mesh can be transformed
            errorMeshRef.matrixAutoUpdate = true;
            errorMeshRef.userData = { ...errorMeshRef.userData, entityId };

            (meshRef as React.MutableRefObject<Mesh>).current = errorMeshRef;
          } else if (!errorMeshRef && meshRef.current) {
            (meshRef as React.MutableRefObject<Mesh | null>).current = null;
          }
        },
        [meshRef, entityId],
      );

      return (
        <mesh
          ref={errorRefCallback}
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
      );
    }
  },
  // Custom comparison function to prevent unnecessary re-renders
  (prevProps, nextProps) => {
    // Only re-render if actual data changes (return true = skip re-render, false = do re-render)
    return (
      prevProps.modelPath === nextProps.modelPath &&
      prevProps.entityId === nextProps.entityId &&
      prevProps.renderingContributions.castShadow === nextProps.renderingContributions.castShadow &&
      prevProps.renderingContributions.receiveShadow ===
        nextProps.renderingContributions.receiveShadow &&
      prevProps.renderingContributions.visible === nextProps.renderingContributions.visible &&
      JSON.stringify(prevProps.renderingContributions.material) ===
        JSON.stringify(nextProps.renderingContributions.material)
    );
  },
);

export const EntityMesh: React.FC<IEntityMeshProps> = React.memo(
  ({
    meshRef,
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
              ref={meshRef}
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
                entityId={entityId}
                renderingContributions={renderingContributions}
                onMeshClick={onMeshClick}
                onMeshDoubleClick={onMeshDoubleClick}
              />
            }
          >
            <CustomModelMesh
              modelPath={modelPath}
              meshRef={meshRef}
              renderingContributions={renderingContributions}
              entityId={entityId}
              onMeshClick={onMeshClick}
              onMeshDoubleClick={onMeshDoubleClick}
            />
          </Suspense>
        </ModelErrorBoundary>
      );
    }

    // Load material and textures
    const material = renderingContributions.material || {};
    const { textures, isTextureMode } = useTextureLoading(material);

    // Special handling for camera entities
    if (meshType === 'Camera') {
      return (
        <CameraEntity
          meshRef={meshRef}
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
          meshRef={meshRef}
          entityId={entityId}
          entityComponents={entityComponents}
          isPlaying={isPlaying}
          onMeshClick={onMeshClick}
        />
      );
    }

    // Render material-based mesh
    return (
      <MaterialRenderer
        meshRef={meshRef}
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
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function to prevent unnecessary re-renders

    // Compare primitive values first
    if (
      prevProps.entityId !== nextProps.entityId ||
      prevProps.meshType !== nextProps.meshType ||
      prevProps.entityColor !== nextProps.entityColor ||
      prevProps.isPlaying !== nextProps.isPlaying
    ) {
      return false;
    }

    // Deep compare renderingContributions
    const prevRC = prevProps.renderingContributions;
    const nextRC = nextProps.renderingContributions;
    if (
      prevProps.meshType !== nextProps.meshType ||
      prevRC.castShadow !== nextRC.castShadow ||
      prevRC.receiveShadow !== nextRC.receiveShadow ||
      prevRC.visible !== nextRC.visible ||
      JSON.stringify(prevRC.material) !== JSON.stringify(nextRC.material)
    ) {
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
    for (let i = 0; i < relevantPrevComponents.length; i++) {
      const prev = relevantPrevComponents[i];
      const next = relevantNextComponents[i];

      if (prev.type !== next.type || JSON.stringify(prev.data) !== JSON.stringify(next.data)) {
        return false;
      }
    }

    // Function references can be ignored for memo - they're event handlers
    // and don't affect rendering output directly

    return true; // Props are equal, skip re-render
  },
);

EntityMesh.displayName = 'EntityMesh';
