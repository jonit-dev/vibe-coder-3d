import type { ThreeEvent } from '@react-three/fiber';
import React from 'react';
import * as THREE from 'three';

import type { IMeshColliderData } from '@/editor/components/panels/InspectorPanel/MeshCollider/MeshColliderSection';
import { compareArrays } from '@/core/utils/comparison';

import { GizmoControls } from './GizmoControls';
import { EntityMesh } from './components/EntityMesh';
import { EntityOutline } from './components/EntityOutline';
import { useEntityColliders } from './hooks/useEntityColliders';
import { useEntityComponents } from './hooks/useEntityComponents';
import { useEntityMesh } from './hooks/useEntityMesh';
import { useEntitySelection } from './hooks/useEntitySelection';
import { useEntityTransform } from './hooks/useEntityTransform';
import { useEntityValidation } from './hooks/useEntityValidation';
import { useFollowedEntityCheck } from './hooks/useFollowedEntityCheck';
import { useGizmoInteraction } from './hooks/useGizmoInteraction';
import { useColliderConfiguration } from './hooks/useColliderConfiguration';
import { useEntityRendering } from './hooks/useEntityRendering';
import { EntityColliderVisualization } from './components/EntityColliderVisualization';
import { EntityPhysicsBody } from './components/EntityPhysicsBody';

type GizmoMode = 'translate' | 'rotate' | 'scale';

export interface IEntityRendererProps {
  entityId: number;
  selected: boolean;
  isPrimarySelection?: boolean;
  mode: GizmoMode;
  onTransformChange?: (values: [number, number, number]) => void;
  setGizmoMode?: (mode: GizmoMode) => void;
  setIsTransforming?: (isTransforming: boolean) => void;
  allEntityIds?: number[];
  isPlaying?: boolean;
}

export const EntityRenderer: React.FC<IEntityRendererProps> = React.memo(
  ({
    entityId,
    selected,
    isPrimarySelection = false,
    mode,
    onTransformChange,
    setGizmoMode,
    setIsTransforming,
    allEntityIds = [],
    isPlaying = false,
  }) => {
    // isPlaying is now passed as a prop instead of reading from store
    // This ensures the component re-renders when play mode changes

    // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS!
    // This prevents "Rendered fewer hooks than expected" React error
    const { transform, entityComponents, meshCollider } = useEntityComponents(entityId);
    const { isValid } = useEntityValidation({ entityId, transform, isPlaying });
    const { isTransformingLocal, handleSetIsTransforming } = useGizmoInteraction({
      selected,
      setGizmoMode,
      setIsTransforming,
    });

    const {
      meshType,
      entityColor,
      renderingContributions,
      physicsContributions,
      shouldHavePhysics,
    } = useEntityMesh({
      entityComponents,
      isPlaying,
    });

    const { meshRef, meshInstanceRef, position, scale, rotationRadians } = useEntityTransform({
      transform,
      isTransforming: isTransformingLocal,
      isPhysicsDriven: shouldHavePhysics,
    });

    const { colliderType, colliderConfig, hasCustomColliders } = useEntityColliders({
      meshCollider,
      meshType: meshType || 'unknown', // Provide fallback to avoid null issues
    });

    const { outlineGroupRef, outlineMeshRef, handleMeshClick, handleMeshDoubleClick } =
      useEntitySelection({
        entityId,
        selected,
        meshRef,
        isTransforming: isTransformingLocal,
        position: position || [0, 0, 0], // Provide fallback to avoid null issues
        rotationRadians: rotationRadians || [0, 0, 0],
        scale: scale || [1, 1, 1],
        allEntityIds,
      });

    // Extract terrain component data for physics key generation
    const terrainComponent = React.useMemo(
      () => entityComponents.find((c) => c.type === 'Terrain'),
      [entityComponents.find((c) => c.type === 'Terrain')],
    ) as
      | {
          type: string;
          data: {
            size: [number, number];
            segments: [number, number];
            heightScale: number;
            noiseEnabled: boolean;
            noiseSeed: number;
            noiseFrequency: number;
            noiseOctaves: number;
            noisePersistence: number;
            noiseLacunarity: number;
          };
        }
      | undefined;

    const { terrainColliderKey, enhancedColliderConfig, hasEffectiveCustomColliders } =
      useColliderConfiguration({
        entityId,
        isPlaying,
        colliderConfig,
        meshType,
        shouldHavePhysics,
        hasCustomColliders,
        terrainComponent,
      });

    // Check if this entity is being followed by the main camera (first-person view)
    const isFollowedEntity = useFollowedEntityCheck(entityId, isPlaying);

    const { shouldHideMesh, shouldShowGizmo } = useEntityRendering({
      isFollowedEntity,
      isPlaying,
      meshType,
      entityId,
      isPrimarySelection,
      shouldHavePhysics,
    });

    // Early return AFTER all hooks - don't render if entity doesn't exist
    if (!isValid) {
      return null;
    }

    // CRITICAL: Block all rendering until all core data is ready (especially for cameras)
    if (!meshRef || !position || !scale || !rotationRadians || !meshType) {
      return null;
    }

    // Create the mesh content (but hide it if being followed)
    const meshContent = !shouldHideMesh ? (
      <EntityMesh
        meshRef={meshRef as React.RefObject<THREE.Group | THREE.Mesh>}
        meshInstanceRef={meshInstanceRef}
        meshType={meshType}
        renderingContributions={renderingContributions}
        entityColor={entityColor}
        entityId={entityId}
        onMeshClick={handleMeshClick as unknown as (e: ThreeEvent<MouseEvent>) => void}
        onMeshDoubleClick={handleMeshDoubleClick as unknown as (e: ThreeEvent<MouseEvent>) => void}
        isPlaying={isPlaying}
        entityComponents={entityComponents}
      />
    ) : null;

    return (
      <group>
        <EntityPhysicsBody
          entityId={entityId}
          terrainColliderKey={terrainColliderKey}
          physicsContributions={shouldHavePhysics ? physicsContributions : undefined}
          position={position}
          rotationRadians={rotationRadians}
          scale={scale}
          enhancedColliderConfig={enhancedColliderConfig}
          hasCustomColliders={hasCustomColliders}
          hasEffectiveCustomColliders={hasEffectiveCustomColliders}
          colliderType={colliderType}
        >
          {meshContent}
        </EntityPhysicsBody>

        {/* Gizmo controls (disabled during physics) - only show on primary selection */}
        {shouldShowGizmo && (
          <GizmoControls
            meshRef={meshRef as React.RefObject<THREE.Group | THREE.Mesh>}
            mode={mode}
            entityId={entityId}
            onTransformChange={onTransformChange}
            setIsTransforming={handleSetIsTransforming}
            meshType={meshType}
          />
        )}

        {/* Debug logging for custom models is done via useEffect instead of in JSX */}

        {/* Selection outline with smooth real-time updates */}
        <EntityOutline
          selected={selected}
          meshType={meshType}
          outlineGroupRef={outlineGroupRef}
          outlineMeshRef={outlineMeshRef}
          isPlaying={isPlaying}
          targetRef={meshRef as React.RefObject<THREE.Group | THREE.Object3D | THREE.Mesh>}
          entityComponents={entityComponents}
        />

        {/* Collider Visualization (Unity-style wireframes) */}
        <EntityColliderVisualization
          selected={selected}
          position={position}
          rotationRadians={rotationRadians}
          scale={scale}
          enhancedColliderConfig={enhancedColliderConfig}
          meshCollider={
            meshCollider && Object.keys(meshCollider.data || {}).length > 0
              ? (meshCollider as { data: IMeshColliderData })
              : null
          }
        />
      </group>
    );
  },
  (prevProps, nextProps) => {
    // Optimized memo comparison to prevent unnecessary re-renders
    // while ensuring all prop changes trigger re-renders (no regressions)

    // Check all primitive props
    if (
      prevProps.entityId !== nextProps.entityId ||
      prevProps.selected !== nextProps.selected ||
      prevProps.isPrimarySelection !== nextProps.isPrimarySelection ||
      prevProps.mode !== nextProps.mode ||
      prevProps.isPlaying !== nextProps.isPlaying
    ) {
      return false; // Props changed, need re-render
    }

    // Check array equality (entity hierarchy changes)
    if (!compareArrays(prevProps.allEntityIds, nextProps.allEntityIds)) {
      return false;
    }

    // Function props are typically stable from parent component
    // but we check for safety (though they rarely change)
    if (
      prevProps.onTransformChange !== nextProps.onTransformChange ||
      prevProps.setIsTransforming !== nextProps.setIsTransforming ||
      prevProps.setGizmoMode !== nextProps.setGizmoMode
    ) {
      return false;
    }

    // All props are equal, skip re-render
    return true;
  },
);

EntityRenderer.displayName = 'EntityRenderer';
