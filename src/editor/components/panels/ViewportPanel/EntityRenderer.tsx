import { useThree } from '@react-three/fiber';
import { BallCollider, CuboidCollider, RigidBody } from '@react-three/rapier';
import React, { useEffect, useState } from 'react';

import { useEntityMesh } from '@/editor/hooks/useEntityMesh';
import { useEntitySelection } from '@/editor/hooks/useEntitySelection';
import { useEntityTransform } from '@/editor/hooks/useEntityTransform';
import { useEntityTransformSync } from '@/editor/hooks/useEntityTransformSync';
import { useMeshCollider } from '@/editor/hooks/useMeshCollider';
import { useMeshRenderer } from '@/editor/hooks/useMeshRenderer';
import { useRigidBody } from '@/editor/hooks/useRigidBody';
import { useEditorStore } from '@/editor/store/editorStore';

import { ColliderVisualization } from './ColliderVisualization';
import { GizmoControls } from './GizmoControls';
import { SelectionOutline } from './SelectionOutline';

type GizmoMode = 'translate' | 'rotate' | 'scale';

export interface IEntityRendererProps {
  entityId: number;
  selected: boolean;
  mode: GizmoMode;
  onTransformChange?: (values: [number, number, number]) => void;
  setGizmoMode?: (mode: GizmoMode) => void;
  setIsTransforming?: (isTransforming: boolean) => void;
}

export const EntityRenderer: React.FC<IEntityRendererProps> = ({
  entityId,
  selected,
  mode,
  onTransformChange,
  setGizmoMode,
  setIsTransforming,
}) => {
  const [isTransformingLocal, setIsTransformingLocal] = useState(false);
  const [dragTick, setDragTick] = useState(0);

  // Custom hooks for clean separation of concerns
  const { position, rotation, scale, rotationRadians } = useEntityTransform(entityId);
  const { meshRef, meshType, entityColor } = useEntityMesh(entityId);
  const { rigidBody } = useRigidBody(entityId);
  const { meshCollider } = useMeshCollider(entityId);
  const { meshRenderer } = useMeshRenderer(entityId);
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const setSelectedId = useEditorStore((s) => s.setSelectedId);

  useThree(); // Required for some R3F functionality

  // Check if this entity should have physics
  const shouldHavePhysics = isPlaying && rigidBody && rigidBody.enabled;

  // Sync transform between ECS and mesh
  useEntityTransformSync({
    meshRef,
    position,
    rotation,
    scale,
    isTransforming: isTransformingLocal,
    hasPhysics: Boolean(shouldHavePhysics),
    setDragTick,
  });

  // Get selection outline position (tracks physics correctly)
  const { outlinePosition, outlineRotation, outlineScale } = useEntitySelection({
    meshRef,
    position,
    rotation,
    scale,
    isTransforming: isTransformingLocal,
    hasPhysics: Boolean(shouldHavePhysics),
  });

  // Handle keyboard shortcuts for gizmo mode switching
  useEffect(() => {
    if (!selected || !setGizmoMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'W') setGizmoMode('translate');
      else if (e.key === 'e' || e.key === 'E') setGizmoMode('rotate');
      else if (e.key === 'r' || e.key === 'R') setGizmoMode('scale');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, setGizmoMode]);

  // Geometry selection based on mesh type
  const getGeometry = () => {
    switch (meshType) {
      case 'Sphere':
        return <sphereGeometry args={[0.5, 32, 32]} />;
      case 'Cylinder':
        return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
      case 'Cone':
        return <coneGeometry args={[0.5, 1, 32]} />;
      case 'Torus':
        return <torusGeometry args={[0.5, 0.2, 16, 100]} />;
      case 'Plane':
        return <planeGeometry args={[1, 1]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  // Get appropriate collider type - use meshCollider setting or auto-detect from mesh type
  const getColliderType = () => {
    if (meshCollider && meshCollider.enabled) {
      // Convert our ColliderType to react-three-rapier collider string
      switch (meshCollider.colliderType) {
        case 'box':
          return 'cuboid';
        case 'sphere':
          return 'ball';
        case 'capsule':
          return 'hull'; // Capsule might not be directly supported
        case 'convex':
          return 'hull';
        case 'mesh':
          return 'trimesh';
        default:
          return 'cuboid';
      }
    }

    // Fallback to auto-detection based on mesh type
    switch (meshType) {
      case 'Sphere':
        return 'ball';
      case 'Cylinder':
        return 'hull';
      case 'Cone':
        return 'hull';
      case 'Torus':
        return 'hull';
      case 'Plane':
        return 'cuboid';
      default:
        return 'cuboid';
    }
  };

  // Create the mesh content that will be either wrapped with physics or not
  const meshContent = (
    <mesh
      ref={meshRef}
      castShadow={meshRenderer?.castShadows ?? true}
      receiveShadow={meshRenderer?.receiveShadows ?? true}
      userData={{ entityId }}
      visible={meshRenderer?.enabled ?? true}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(entityId);
      }}
    >
      {getGeometry()}
      <meshStandardMaterial
        color={meshRenderer?.material.color ?? entityColor}
        metalness={meshRenderer?.material.metalness ?? 0}
        roughness={meshRenderer?.material.roughness ?? 0.5}
        emissive={meshRenderer?.material.emissive ?? '#000000'}
        emissiveIntensity={meshRenderer?.material.emissiveIntensity ?? 0}
      />
    </mesh>
  );

  return (
    <group>
      {shouldHavePhysics ? (
        <RigidBody
          type={rigidBody.bodyType}
          mass={rigidBody.mass}
          friction={meshCollider?.physicsMaterial.friction ?? rigidBody.material.friction}
          restitution={meshCollider?.physicsMaterial.restitution ?? rigidBody.material.restitution}
          density={meshCollider?.physicsMaterial.density ?? rigidBody.material.density}
          gravityScale={rigidBody.gravityScale}
          canSleep={rigidBody.canSleep}
          position={position}
          rotation={rotationRadians}
          scale={scale}
          colliders={meshCollider ? false : getColliderType()} // Disable auto colliders if we have custom ones
        >
          {/* Custom Colliders based on MeshCollider settings */}
          {meshCollider && meshCollider.enabled && (
            <>
              {meshCollider.colliderType === 'box' && (
                <CuboidCollider
                  args={[
                    meshCollider.size.width / 2,
                    meshCollider.size.height / 2,
                    meshCollider.size.depth / 2,
                  ]}
                  position={meshCollider.center}
                  sensor={meshCollider.isTrigger}
                />
              )}
              {meshCollider.colliderType === 'sphere' && (
                <BallCollider
                  args={[meshCollider.size.radius]}
                  position={meshCollider.center}
                  sensor={meshCollider.isTrigger}
                />
              )}
              {meshCollider.colliderType === 'capsule' && (
                <CuboidCollider
                  args={[
                    meshCollider.size.capsuleRadius,
                    meshCollider.size.capsuleHeight / 2,
                    meshCollider.size.capsuleRadius,
                  ]}
                  position={meshCollider.center}
                  sensor={meshCollider.isTrigger}
                />
              )}
              {(meshCollider.colliderType === 'convex' || meshCollider.colliderType === 'mesh') && (
                <CuboidCollider
                  args={[0.5, 0.5, 0.5]} // Default size for convex/mesh - should use hull/trimesh
                  position={meshCollider.center}
                  sensor={meshCollider.isTrigger}
                />
              )}
            </>
          )}
          {meshContent}
        </RigidBody>
      ) : (
        meshContent
      )}

      {/* Gizmo controls (disabled during physics) */}
      {selected && !shouldHavePhysics && (
        <GizmoControls
          meshRef={meshRef}
          mode={mode}
          entityId={entityId}
          onTransformChange={onTransformChange}
          setIsTransforming={(val) => {
            setIsTransformingLocal(val);
            if (setIsTransforming) setIsTransforming(val);
          }}
        />
      )}

      {/* Selection outline (tracks physics correctly) */}
      {selected && (
        <SelectionOutline
          geometry={getGeometry()}
          position={outlinePosition}
          rotation={outlineRotation}
          scale={outlineScale}
          key={dragTick}
        />
      )}

      {/* Collider Visualization (Unity-style wireframes) */}
      {selected && (
        <group position={position} rotation={rotationRadians} scale={scale}>
          <ColliderVisualization
            meshCollider={meshCollider}
            visible={!shouldHavePhysics} // Show collider bounds in edit mode
          />
        </group>
      )}
    </group>
  );
};
