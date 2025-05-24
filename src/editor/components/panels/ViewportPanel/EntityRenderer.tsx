import { useThree } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import React, { useEffect, useState } from 'react';

import { useEntityMesh } from '@/editor/hooks/useEntityMesh';
import { useEntitySelection } from '@/editor/hooks/useEntitySelection';
import { useEntityTransform } from '@/editor/hooks/useEntityTransform';
import { useEntityTransformSync } from '@/editor/hooks/useEntityTransformSync';
import { useRigidBody } from '@/editor/hooks/useRigidBody';
import { useEditorStore } from '@/editor/store/editorStore';

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
  const isPlaying = useEditorStore((s) => s.isPlaying);

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

  // Create the mesh content that will be either wrapped with physics or not
  const meshContent = (
    <mesh ref={meshRef} castShadow receiveShadow userData={{ entityId }}>
      {getGeometry()}
      <meshStandardMaterial color={entityColor} />
    </mesh>
  );

  return (
    <group>
      {shouldHavePhysics ? (
        <RigidBody
          type={rigidBody.bodyType}
          mass={rigidBody.mass}
          friction={rigidBody.material.friction}
          restitution={rigidBody.material.restitution}
          density={rigidBody.material.density}
          gravityScale={rigidBody.gravityScale}
          canSleep={rigidBody.canSleep}
          position={position}
          rotation={rotationRadians}
          scale={scale}
        >
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
    </group>
  );
};
