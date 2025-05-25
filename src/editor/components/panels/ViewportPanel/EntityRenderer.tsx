import { Edges } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { BallCollider, CuboidCollider, RigidBody } from '@react-three/rapier';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Mesh } from 'three';

import type { IMeshColliderData } from '@/editor/components/panels/InspectorPanel/MeshCollider/MeshColliderSection';
import { useComponentManager } from '@/editor/hooks/useComponentManager';
import {
  combinePhysicsContributions,
  combineRenderingContributions,
} from '@/editor/lib/ecs/ComponentRegistry';
import { KnownComponentTypes } from '@/editor/lib/ecs/IComponent';
import { ITransformData } from '@/editor/lib/ecs/components/TransformComponent';
import { useEditorStore } from '@/editor/store/editorStore';

import { ColliderVisualization } from './ColliderVisualization';
import { GizmoControls } from './GizmoControls';

type GizmoMode = 'translate' | 'rotate' | 'scale';

export interface IEntityRendererProps {
  entityId: number;
  selected: boolean;
  mode: GizmoMode;
  onTransformChange?: (values: [number, number, number]) => void;
  setGizmoMode?: (mode: GizmoMode) => void;
  setIsTransforming?: (isTransforming: boolean) => void;
}

export const EntityRenderer: React.FC<IEntityRendererProps> = React.memo(
  ({ entityId, selected, mode, onTransformChange, setGizmoMode, setIsTransforming }) => {
    const [isTransformingLocal, setIsTransformingLocal] = useState(false);
    const [dragTick, setDragTick] = useState(0);
    const [updateCounter, setUpdateCounter] = useState(0);

    // Use new ECS system
    const componentManager = useComponentManager();
    const isPlaying = useEditorStore((s) => s.isPlaying);
    const setSelectedId = useEditorStore((s) => s.setSelectedId);

    // Only listen for component changes that actually affect rendering
    useEffect(() => {
      const handleComponentChange = (event: any) => {
        // Only force update if this event affects our entity for specific component types
        if (event.entityId === entityId) {
          // Only update for rendering-related components
          const relevantComponents = [
            KnownComponentTypes.TRANSFORM,
            KnownComponentTypes.MESH_RENDERER,
            KnownComponentTypes.MESH_COLLIDER,
            KnownComponentTypes.RIGID_BODY,
          ];

          if (relevantComponents.includes(event.componentType)) {
            const entityExists = componentManager.getComponent(
              entityId,
              KnownComponentTypes.TRANSFORM,
            );
            if (entityExists) {
              // Remove the debug log to reduce console spam during dragging
              setUpdateCounter((prev) => prev + 1);
            }
          }
        }
      };

      const unsubscribe = componentManager.addEventListener(handleComponentChange);
      return unsubscribe;
    }, [entityId, componentManager]);

    // Get transform component (required for positioning)
    const transform = componentManager.getComponent<ITransformData>(
      entityId,
      KnownComponentTypes.TRANSFORM,
    );

    // Get all components for this entity dynamically - stable reference
    const entityComponents = useMemo(() => {
      const components = componentManager.getComponentsForEntity(entityId);
      return components;
    }, [componentManager, entityId, updateCounter]); // updateCounter ensures fresh data after component events

    // Get individual component data when needed for specific logic
    const meshCollider = componentManager.getComponent(entityId, KnownComponentTypes.MESH_COLLIDER);

    // Use the registry to combine contributions from all components
    const renderingContributions = useMemo(() => {
      const contributions = combineRenderingContributions(entityComponents);
      return contributions;
    }, [entityComponents]);

    const physicsContributions = useMemo(() => {
      const contributions = combinePhysicsContributions(entityComponents);
      return contributions;
    }, [entityComponents]);

    // Safety check: Don't render if entity doesn't have a transform (likely deleted)
    if (!transform?.data) {
      return null;
    }

    // Extract component data with defaults - direct access for real-time updates
    const position: [number, number, number] = transform.data.position || [0, 0, 0];
    const rotation: [number, number, number] = transform.data.rotation || [0, 0, 0];
    const scale: [number, number, number] = transform.data.scale || [1, 1, 1];

    // Mesh ref and properties
    const meshRef = useRef<Mesh>(null);
    const [meshType, setMeshType] = useState<string>('Cube');
    const [entityColor, setEntityColor] = useState<string>('#3388ff');

    useThree(); // Required for some R3F functionality

    // Update mesh type and color from rendering contributions
    useEffect(() => {
      if (renderingContributions.meshType) {
        setMeshType(renderingContributions.meshType);
      }
      if (renderingContributions.material?.color) {
        setEntityColor(renderingContributions.material.color);
      }
    }, [renderingContributions, entityId]);

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

    // Memoized rotation calculations in radians for physics system
    const rotationRadians = useMemo(
      (): [number, number, number] => [
        rotation[0] * (Math.PI / 180),
        rotation[1] * (Math.PI / 180),
        rotation[2] * (Math.PI / 180),
      ],
      [rotation],
    );

    // Check if this entity should have physics
    const shouldHavePhysics = useMemo(
      () => isPlaying && physicsContributions.enabled,
      [isPlaying, physicsContributions.enabled],
    );

    // Memoized click handler
    const handleMeshClick = useCallback(
      (e: any) => {
        e.stopPropagation();
        setSelectedId(entityId);
      },
      [entityId, setSelectedId],
    );

    // Memoized keyboard shortcuts handler
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

    // Memoized geometry selection based on mesh type
    const geometry = useMemo(() => {
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
    }, [meshType]);

    // Memoized collider type calculation
    const colliderType = useMemo(() => {
      const meshColliderData = meshCollider?.data as IMeshColliderData | undefined;
      if (meshColliderData && meshColliderData.enabled) {
        switch (meshColliderData.colliderType) {
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
    }, [meshCollider?.data, meshType]);

    // Create a pure Three.js outline that updates without React
    const outlineGroupRef = useRef<THREE.Group>(null);
    const outlineMeshRef = useRef<THREE.Mesh>(null);

    // Initialize outline mesh once - no React updates after this
    useEffect(() => {
      if (!outlineGroupRef.current || !selected) return;

      // Create outline mesh once
      if (!outlineMeshRef.current) {
        const outlineMesh = new THREE.Mesh();
        outlineMeshRef.current = outlineMesh;
        outlineGroupRef.current.add(outlineMesh);

        // Set up outline material and geometry
        const edges = new THREE.EdgesGeometry();
        const lineMaterial = new THREE.LineBasicMaterial({ color: '#ff6b35', linewidth: 2 });
        const lineSegments = new THREE.LineSegments(edges, lineMaterial);
        outlineMesh.add(lineSegments);
      }

      // Initial position sync
      const mesh = meshRef.current;
      const outline = outlineMeshRef.current;
      if (mesh && outline) {
        outline.position.copy(mesh.position);
        outline.rotation.copy(mesh.rotation);
        outline.scale.copy(mesh.scale);
        outline.scale.addScalar(0.05);
      }
    }, [selected]);

    // Handle transform updates - pure Three.js, no React
    useEffect(() => {
      if (!selected || !meshRef.current || !outlineMeshRef.current) return;

      const mesh = meshRef.current;
      const outline = outlineMeshRef.current;

      // During drag: direct Three.js updates via animation loop
      if (isTransformingLocal) {
        let animationId: number;

        const updateOutline = () => {
          if (mesh && outline) {
            outline.position.copy(mesh.position);
            outline.rotation.copy(mesh.rotation);
            outline.scale.copy(mesh.scale);
            outline.scale.addScalar(0.05);
          }
          animationId = requestAnimationFrame(updateOutline);
        };

        animationId = requestAnimationFrame(updateOutline);

        return () => {
          if (animationId) cancelAnimationFrame(animationId);
        };
      } else {
        // When not dragging: sync with ComponentManager data once
        outline.position.set(position[0], position[1], position[2]);
        outline.rotation.set(rotationRadians[0], rotationRadians[1], rotationRadians[2]);
        outline.scale.set(scale[0] + 0.05, scale[1] + 0.05, scale[2] + 0.05);
      }
    }, [selected, isTransformingLocal, position, rotationRadians, scale]);

    // Memoized transform changing handler
    const handleSetIsTransforming = useCallback(
      (val: boolean) => {
        setIsTransformingLocal(val);
        if (setIsTransforming) setIsTransforming(val);
        if (val) setDragTick((prev) => prev + 1);
      },
      [setIsTransforming],
    );

    // Mesh content without aggressive memoization to allow for reactive updates
    const meshContent = (
      <mesh
        ref={meshRef}
        castShadow={renderingContributions.castShadow}
        receiveShadow={renderingContributions.receiveShadow}
        userData={{ entityId }}
        visible={renderingContributions.visible}
        onClick={handleMeshClick}
      >
        {geometry}
        <meshStandardMaterial
          color={renderingContributions.material?.color ?? entityColor}
          metalness={renderingContributions.material?.metalness ?? 0}
          roughness={renderingContributions.material?.roughness ?? 0.5}
          emissive={renderingContributions.material?.emissive ?? '#000000'}
          emissiveIntensity={renderingContributions.material?.emissiveIntensity ?? 0}
        />
      </mesh>
    );

    // Memoized colliders based on MeshCollider settings
    const customColliders = useMemo(() => {
      const meshColliderData = meshCollider?.data as IMeshColliderData | undefined;
      if (!meshColliderData || !meshColliderData.enabled) {
        return null;
      }

      return (
        <>
          {meshColliderData.colliderType === 'box' && (
            <CuboidCollider
              args={[
                (meshColliderData.size?.width ?? 1) / 2,
                (meshColliderData.size?.height ?? 1) / 2,
                (meshColliderData.size?.depth ?? 1) / 2,
              ]}
              position={meshColliderData.center ?? [0, 0, 0]}
              sensor={meshColliderData.isTrigger}
            />
          )}
          {meshColliderData.colliderType === 'sphere' && (
            <BallCollider
              args={[meshColliderData.size?.radius ?? 0.5]}
              position={meshColliderData.center ?? [0, 0, 0]}
              sensor={meshColliderData.isTrigger}
            />
          )}
          {meshColliderData.colliderType === 'capsule' && (
            <CuboidCollider
              args={[
                meshColliderData.size?.capsuleRadius ?? 0.5,
                (meshColliderData.size?.capsuleHeight ?? 1) / 2,
                meshColliderData.size?.capsuleRadius ?? 0.5,
              ]}
              position={meshColliderData.center ?? [0, 0, 0]}
              sensor={meshColliderData.isTrigger}
            />
          )}
          {(meshColliderData.colliderType === 'convex' ||
            meshColliderData.colliderType === 'mesh') && (
            <CuboidCollider
              args={[0.5, 0.5, 0.5]}
              position={meshColliderData.center ?? [0, 0, 0]}
              sensor={meshColliderData.isTrigger}
            />
          )}
        </>
      );
    }, [meshCollider?.data]);

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
            colliders={meshCollider?.data ? false : colliderType}
          >
            {/* Custom Colliders based on MeshCollider settings */}
            {customColliders}
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
            setIsTransforming={handleSetIsTransforming}
          />
        )}

        {/* Selection outline with smooth real-time updates */}
        <group ref={outlineGroupRef}>
          <mesh ref={outlineMeshRef}>
            {geometry}
            <meshBasicMaterial visible={false} />
            <Edges color="#ff6b35" lineWidth={2} />
          </mesh>
        </group>

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
