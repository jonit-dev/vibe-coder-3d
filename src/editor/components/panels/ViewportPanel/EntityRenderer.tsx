import type { ThreeEvent } from '@react-three/fiber';
import React from 'react';
import type { Mesh } from 'three';

import type { IMeshColliderData } from '@/editor/components/panels/InspectorPanel/MeshCollider/MeshColliderSection';
import { useEditorStore } from '@/editor/store/editorStore';

import { GizmoControls } from './GizmoControls';
import { EntityColliders } from './components/EntityColliders';
import { EntityMesh } from './components/EntityMesh';
import { EntityOutline } from './components/EntityOutline';
import { useEntityColliders } from './hooks/useEntityColliders';
import { useEntityComponents } from './hooks/useEntityComponents';
import type { IPhysicsContributions, IRenderingContributions } from './hooks/useEntityMesh';
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
}

import type { TerrainData } from '@/core/lib/ecs/components/definitions/TerrainComponent';
import { Logger } from '@/core/lib/logger';
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
  }) => {
    const logger = Logger.create('EntityRenderer');
    const isPlaying = useEditorStore((s) => s.isPlaying);

    // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS!
    // This prevents "Rendered fewer hooks than expected" React error
    const { transform, entityComponents, meshCollider } = useEntityComponents(entityId);
    const { isValid } = useEntityValidation({ entityId, transform, isPlaying });
    const { isTransformingLocal, handleSetIsTransforming } = useGizmoInteraction({
      selected,
      setGizmoMode,
      setIsTransforming,
    });

    const { meshRef, position, scale, rotationRadians } = useEntityTransform({
      transform,
      isTransforming: isTransformingLocal,
      isPlaying,
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
    );

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
        meshRef={meshRef}
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
            meshRef={meshRef}
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
          entityComponents={entityComponents}
        />

        {/* Collider Visualization (Unity-style wireframes) */}
        <EntityColliderVisualization
          selected={selected}
          position={position}
          rotationRadians={rotationRadians}
          scale={scale}
          enhancedColliderConfig={enhancedColliderConfig}
          meshCollider={meshCollider}
        />
      </group>
    );
  },
);

EntityRenderer.displayName = 'EntityRenderer';
