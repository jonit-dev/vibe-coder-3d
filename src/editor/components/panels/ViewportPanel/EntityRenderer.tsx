import type { ThreeEvent } from '@react-three/fiber';
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
import type { IPhysicsContributions, IRenderingContributions } from './hooks/useEntityMesh';
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
  allEntityIds?: number[];
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
      allEntityIds,
    });

    // When terrain params change, force-remount physics body so trimesh collider rebuilds
    const terrainColliderKey = React.useMemo(() => {
      const t = entityComponents.find((c) => c.type === 'Terrain')?.data as any;
      if (!t) return undefined;
      try {
        return `rb-terrain-${entityId}-${[
          ...(Array.isArray(t.size) ? t.size : []),
          ...(Array.isArray(t.segments) ? t.segments : []),
          t.heightScale,
          t.noiseEnabled,
          t.noiseSeed,
          t.noiseFrequency,
          t.noiseOctaves,
          t.noisePersistence,
          t.noiseLacunarity,
        ].join('|')}`;
      } catch {
        return undefined;
      }
    }, [entityComponents, entityId]);

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
        meshType={meshType as string | null}
        renderingContributions={renderingContributions as IRenderingContributions}
        entityColor={entityColor as string}
        entityId={entityId}
        onMeshClick={handleMeshClick as unknown as (e: ThreeEvent<MouseEvent>) => void}
        isPlaying={isPlaying}
        entityComponents={entityComponents}
      />
    ) : null;

    // When not using physics, render mesh normally and overlay gizmo controls separately
    const renderedNonPhysicsMesh = meshContent;

    return (
      <group>
        {shouldHavePhysics ? (
          <RigidBody
            key={terrainColliderKey}
            type={(physicsContributions as IPhysicsContributions).rigidBodyProps.type as any}
            mass={(physicsContributions as IPhysicsContributions).rigidBodyProps.mass}
            friction={(physicsContributions as IPhysicsContributions).rigidBodyProps.friction}
            restitution={(physicsContributions as IPhysicsContributions).rigidBodyProps.restitution}
            density={(physicsContributions as IPhysicsContributions).rigidBodyProps.density}
            gravityScale={
              (physicsContributions as IPhysicsContributions).rigidBodyProps.gravityScale
            }
            canSleep={(physicsContributions as IPhysicsContributions).rigidBodyProps.canSleep}
            position={position}
            rotation={rotationRadians}
            scale={scale}
            colliders={
              hasCustomColliders ? false : (colliderType as 'ball' | 'cuboid' | 'hull' | 'trimesh')
            }
          >
            {/* Custom Colliders based on MeshCollider settings */}
            <EntityColliders colliderConfig={colliderConfig} />
            {meshContent}
          </RigidBody>
        ) : (
          renderedNonPhysicsMesh
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
