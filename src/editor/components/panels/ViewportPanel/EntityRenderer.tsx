import { useThree } from '@react-three/fiber';
import { BallCollider, CuboidCollider, RigidBody } from '@react-three/rapier';
import React, { useEffect, useRef, useState } from 'react';
import { Mesh } from 'three';

import { useComponentManager } from '@/editor/hooks/useComponentManager';
import { KnownComponentTypes } from '@/editor/lib/ecs/IComponent';
import { IMeshColliderData } from '@/editor/lib/ecs/components/MeshColliderComponent';
import { IMeshRendererData } from '@/editor/lib/ecs/components/MeshRendererComponent';
import { IRigidBodyData } from '@/editor/lib/ecs/components/RigidBodyComponent';
import { ITransformData } from '@/editor/lib/ecs/components/TransformComponent';
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

  // Use new ECS system
  const componentManager = useComponentManager();
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const setSelectedId = useEditorStore((s) => s.setSelectedId);

  // Get components using new ECS system
  const transform = componentManager.getComponent<ITransformData>(
    entityId,
    KnownComponentTypes.TRANSFORM,
  );
  const rigidBody = componentManager.getComponent<IRigidBodyData>(
    entityId,
    KnownComponentTypes.RIGID_BODY,
  );
  const meshCollider = componentManager.getComponent<IMeshColliderData>(
    entityId,
    KnownComponentTypes.MESH_COLLIDER,
  );
  const meshRenderer = componentManager.getComponent<IMeshRendererData>(
    entityId,
    KnownComponentTypes.MESH_RENDERER,
  );

  // Extract component data with defaults
  const position: [number, number, number] = transform?.data?.position || [0, 0, 0];
  const rotation: [number, number, number] = transform?.data?.rotation || [0, 0, 0];
  const scale: [number, number, number] = transform?.data?.scale || [1, 1, 1];

  // Mesh ref and properties
  const meshRef = useRef<Mesh>(null);
  const [meshType, setMeshType] = useState<string>('Cube');
  const [entityColor, setEntityColor] = useState<string>('#3388ff');

  useThree(); // Required for some R3F functionality

  // Get mesh type and color from ComponentManager
  useEffect(() => {
    const meshData = componentManager.getComponent(entityId, 'mesh');
    const materialData = componentManager.getComponent(entityId, 'material');

    if (meshData?.data && typeof meshData.data === 'object' && meshData.data !== null) {
      const meshTypeValue = (meshData.data as any).meshType;
      if (meshTypeValue) {
        setMeshType(meshTypeValue || 'Cube');
      }
    }
    if (materialData?.data && typeof materialData.data === 'object' && materialData.data !== null) {
      const colorValue = (materialData.data as any).color;
      if (colorValue) {
        setEntityColor(colorValue || '#3388ff');
      }
    }
  }, [entityId, componentManager]);

  // Sync mesh transform from ComponentManager (single source of truth)
  useEffect(() => {
    if (meshRef.current && !isTransformingLocal && !isPlaying) {
      // Only sync when NOT transforming and NOT in physics mode
      meshRef.current.position.set(position[0], position[1], position[2]);
      meshRef.current.rotation.set(
        rotation[0] * (Math.PI / 180),
        rotation[1] * (Math.PI / 180),
        rotation[2] * (Math.PI / 180),
      );
      meshRef.current.scale.set(scale[0], scale[1], scale[2]);
    }
  }, [position, rotation, scale, isTransformingLocal, isPlaying]);

  // Calculate rotations in radians for physics system
  const rotationRadians: [number, number, number] = [
    rotation[0] * (Math.PI / 180),
    rotation[1] * (Math.PI / 180),
    rotation[2] * (Math.PI / 180),
  ];

  // Check if this entity should have physics
  const shouldHavePhysics = isPlaying && rigidBody?.data && rigidBody.data.enabled;

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

  // Get appropriate collider type
  const getColliderType = () => {
    if (meshCollider?.data && meshCollider.data.enabled) {
      switch (meshCollider.data.colliderType) {
        case 'box':
          return 'cuboid';
        case 'sphere':
          return 'ball';
        case 'capsule':
          return 'hull';
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

  // Calculate outline position (for selection) based on current transform
  const outlinePosition: [number, number, number] =
    isTransformingLocal && meshRef.current
      ? [meshRef.current.position.x, meshRef.current.position.y, meshRef.current.position.z]
      : position;

  const outlineRotation: [number, number, number] =
    isTransformingLocal && meshRef.current
      ? [meshRef.current.rotation.x, meshRef.current.rotation.y, meshRef.current.rotation.z]
      : rotationRadians;

  const outlineScale: [number, number, number] =
    isTransformingLocal && meshRef.current
      ? [
          meshRef.current.scale.x + 0.05,
          meshRef.current.scale.y + 0.05,
          meshRef.current.scale.z + 0.05,
        ]
      : [scale[0] + 0.05, scale[1] + 0.05, scale[2] + 0.05];

  // Create the mesh content that will be either wrapped with physics or not
  const meshContent = (
    <mesh
      ref={meshRef}
      castShadow={meshRenderer?.data?.castShadows ?? true}
      receiveShadow={meshRenderer?.data?.receiveShadows ?? true}
      userData={{ entityId }}
      visible={meshRenderer?.data?.enabled ?? true}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(entityId);
      }}
    >
      {getGeometry()}
      <meshStandardMaterial
        color={meshRenderer?.data?.material?.color ?? entityColor}
        metalness={meshRenderer?.data?.material?.metalness ?? 0}
        roughness={meshRenderer?.data?.material?.roughness ?? 0.5}
        emissive={meshRenderer?.data?.material?.emissive ?? '#000000'}
        emissiveIntensity={meshRenderer?.data?.material?.emissiveIntensity ?? 0}
      />
    </mesh>
  );

  return (
    <group>
      {shouldHavePhysics ? (
        <RigidBody
          type={rigidBody?.data?.bodyType as any}
          mass={rigidBody?.data?.mass ?? 1}
          friction={
            meshCollider?.data?.physicsMaterial?.friction ??
            rigidBody?.data?.material?.friction ??
            0.7
          }
          restitution={
            meshCollider?.data?.physicsMaterial?.restitution ??
            rigidBody?.data?.material?.restitution ??
            0.3
          }
          density={
            meshCollider?.data?.physicsMaterial?.density ?? rigidBody?.data?.material?.density ?? 1
          }
          gravityScale={rigidBody?.data?.gravityScale ?? 1}
          canSleep={rigidBody?.data?.canSleep ?? true}
          position={position}
          rotation={rotationRadians}
          scale={scale}
          colliders={meshCollider?.data ? false : getColliderType()}
        >
          {/* Custom Colliders based on MeshCollider settings */}
          {meshCollider?.data && meshCollider.data.enabled && (
            <>
              {meshCollider.data.colliderType === 'box' && (
                <CuboidCollider
                  args={[
                    (meshCollider.data.size?.width ?? 1) / 2,
                    (meshCollider.data.size?.height ?? 1) / 2,
                    (meshCollider.data.size?.depth ?? 1) / 2,
                  ]}
                  position={meshCollider.data.center ?? [0, 0, 0]}
                  sensor={meshCollider.data.isTrigger}
                />
              )}
              {meshCollider.data.colliderType === 'sphere' && (
                <BallCollider
                  args={[meshCollider.data.size?.radius ?? 0.5]}
                  position={meshCollider.data.center ?? [0, 0, 0]}
                  sensor={meshCollider.data.isTrigger}
                />
              )}
              {meshCollider.data.colliderType === 'capsule' && (
                <CuboidCollider
                  args={[
                    meshCollider.data.size?.capsuleRadius ?? 0.5,
                    (meshCollider.data.size?.capsuleHeight ?? 1) / 2,
                    meshCollider.data.size?.capsuleRadius ?? 0.5,
                  ]}
                  position={meshCollider.data.center ?? [0, 0, 0]}
                  sensor={meshCollider.data.isTrigger}
                />
              )}
              {(meshCollider.data.colliderType === 'convex' ||
                meshCollider.data.colliderType === 'mesh') && (
                <CuboidCollider
                  args={[0.5, 0.5, 0.5]}
                  position={meshCollider.data.center ?? [0, 0, 0]}
                  sensor={meshCollider.data.isTrigger}
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
            if (val) setDragTick((prev) => prev + 1);
          }}
        />
      )}

      {/* Selection outline (uses ComponentManager data) */}
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
            meshCollider={meshCollider?.data || null}
            visible={!shouldHavePhysics}
          />
        </group>
      )}
    </group>
  );
};
