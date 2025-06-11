import { RigidBody } from '@react-three/rapier';
import React from 'react';

import type { IMeshColliderData } from '@/editor/components/panels/InspectorPanel/MeshCollider/MeshColliderSection';
import { useEditorStore } from '@/editor/store/editorStore';

import { ColliderVisualization } from './ColliderVisualization';
import { GizmoControls } from './GizmoControls';
import { EntityColliders } from './components/EntityColliders';
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

type GizmoMode = 'translate' | 'rotate' | 'scale';

export interface IEntityRendererProps {
  entityId: number;
  selected: boolean;
  isPrimarySelection?: boolean;
  mode: GizmoMode;
  onTransformChange?: (values: [number, number, number]) => void;
  setGizmoMode?: (mode: GizmoMode) => void;
  setIsTransforming?: (isTransforming: boolean) => void;
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
  }) => {
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

    const { outlineGroupRef, outlineMeshRef, handleMeshClick } = useEntitySelection({
      entityId,
      selected,
      meshRef,
      isTransforming: isTransformingLocal,
      position: position || [0, 0, 0], // Provide fallback to avoid null issues
      rotationRadians: rotationRadians || [0, 0, 0],
      scale: scale || [1, 1, 1],
    });

    // Check if this entity is being followed by the main camera (first-person view)
    const isFollowedEntity = useFollowedEntityCheck(entityId, isPlaying);

    // Early return AFTER all hooks - don't render if entity doesn't exist
    if (!isValid) {
      return null;
    }

    // CRITICAL: Block all rendering until all core data is ready (especially for cameras)
    if (!meshRef || !position || !scale || !rotationRadians || !meshType) {
      return null;
    }

    // Hide mesh rendering when this entity is being followed in play mode (first-person view)
    const shouldHideMesh = isFollowedEntity && isPlaying;

    // Create the mesh content (but hide it if being followed)
    const meshContent = !shouldHideMesh ? (
      <EntityMesh
        meshRef={meshRef}
        meshType={meshType}
        renderingContributions={renderingContributions}
        entityColor={entityColor}
        entityId={entityId}
        onMeshClick={handleMeshClick}
        isPlaying={isPlaying}
        entityComponents={entityComponents}
      />
    ) : null;

    return (
      <group>
        {shouldHavePhysics ? (
          <RigidBody
            type={physicsContributions.rigidBodyProps?.type as any}
            mass={physicsContributions.rigidBodyProps?.mass ?? 1}
            friction={physicsContributions.rigidBodyProps?.friction ?? 0.7}
            restitution={physicsContributions.rigidBodyProps?.restitution ?? 0.3}
            density={physicsContributions.rigidBodyProps?.density ?? 1}
            gravityScale={physicsContributions.rigidBodyProps?.gravityScale ?? 1}
            canSleep={physicsContributions.rigidBodyProps?.canSleep ?? true}
            position={position}
            rotation={rotationRadians}
            scale={scale}
            colliders={hasCustomColliders ? false : (colliderType as any)}
          >
            {/* Custom Colliders based on MeshCollider settings */}
            <EntityColliders colliderConfig={colliderConfig} />
            {meshContent}
          </RigidBody>
        ) : (
          meshContent
        )}

        {/* Gizmo controls (disabled during physics) - only show on primary selection */}
        {isPrimarySelection && !shouldHavePhysics && (
          <GizmoControls
            meshRef={meshRef}
            mode={mode}
            entityId={entityId}
            onTransformChange={onTransformChange}
            setIsTransforming={handleSetIsTransforming}
            meshType={meshType}
          />
        )}

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
        {selected && (
          <group position={position} rotation={rotationRadians} scale={scale}>
            <ColliderVisualization
              meshCollider={(meshCollider?.data as IMeshColliderData) || null}
              visible={!shouldHavePhysics}
            />
          </group>
        )}
      </group>
    );
  },
);

EntityRenderer.displayName = 'EntityRenderer';
