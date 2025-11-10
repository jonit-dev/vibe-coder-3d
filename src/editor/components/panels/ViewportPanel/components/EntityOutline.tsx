import { Edges } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import React, { useLayoutEffect, useMemo, useState, useRef } from 'react';
import * as THREE from 'three';

interface IEntityOutlineProps {
  selected: boolean;
  meshType: string | null;
  outlineGroupRef: React.RefObject<THREE.Group | null>;
  outlineMeshRef: React.RefObject<THREE.Mesh | null>;
  isPlaying: boolean;
  targetRef?: React.RefObject<THREE.Group | THREE.Mesh | THREE.Object3D | null>;
  entityComponents?: Array<{ type: string; data: unknown }>;
}

export const EntityOutline: React.FC<IEntityOutlineProps> = React.memo(
  ({
    selected,
    meshType,
    outlineGroupRef,
    outlineMeshRef,
    isPlaying,
    targetRef,
    entityComponents = [],
  }) => {
    // Extract modelPath from entityComponents to detect when models finish loading
    const meshRendererComponent = entityComponents.find((c) => c.type === 'MeshRenderer');
    const modelPath =
      meshRendererComponent?.data &&
      typeof meshRendererComponent.data === 'object' &&
      'modelPath' in meshRendererComponent.data
        ? (meshRendererComponent.data.modelPath as string)
        : undefined;

    // Don't render at all when not selected or no mesh type
    if (!selected || !meshType) return null;

    // Don't show selection outline when playing
    if (isPlaying) return null;

    // Special handling for camera entities - no outline for cameras
    if (meshType === 'Camera') {
      return null; // Cameras don't need selection outlines
    }

    // Compute custom model bounds when available
    const [customSize, setCustomSize] = useState<[number, number, number] | null>(null);
    const lastModelPathRef = useRef<string | undefined>(undefined);
    const boundsUpdateScheduledRef = useRef(false);

    // Main effect to calculate bounds when dependencies change
    useLayoutEffect(() => {
      if (!targetRef?.current) return;
      const obj = targetRef.current as THREE.Object3D;

      // Prefer precomputed bounds from userData, else compute on the fly
      const preset = (obj.userData && obj.userData.boundsSize) as
        | [number, number, number]
        | undefined;
      if (preset && Array.isArray(preset) && preset.length === 3) {
        setCustomSize([
          Math.max(preset[0], 1e-6),
          Math.max(preset[1], 1e-6),
          Math.max(preset[2], 1e-6),
        ]);
        return;
      }

      const box = new THREE.Box3().setFromObject(obj);
      const v = new THREE.Vector3();
      box.getSize(v);
      if (Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z)) {
        setCustomSize([Math.max(v.x, 1e-6), Math.max(v.y, 1e-6), Math.max(v.z, 1e-6)]);
      }
    }, [targetRef, meshType, selected, modelPath]);

    // Schedule a bounds update on the next frame when modelPath changes (for async model loading)
    useLayoutEffect(() => {
      // Check if modelPath changed from a loading placeholder to a real path
      const isLoadingPlaceholder = lastModelPathRef.current?.startsWith('__loading__:');
      const isRealModel = modelPath && !modelPath.startsWith('__loading__:');

      if (isLoadingPlaceholder && isRealModel && !boundsUpdateScheduledRef.current) {
        boundsUpdateScheduledRef.current = true;
      }

      lastModelPathRef.current = modelPath;
    }, [modelPath]);

    // Use frame callback to retry bounds calculation after model has loaded
    useFrame(() => {
      if (!boundsUpdateScheduledRef.current || !targetRef?.current) return;

      const obj = targetRef.current as THREE.Object3D;
      const preset = (obj.userData && obj.userData.boundsSize) as
        | [number, number, number]
        | undefined;

      // If userData.boundsSize is now available, update and clear the schedule
      if (preset && Array.isArray(preset) && preset.length === 3) {
        setCustomSize([
          Math.max(preset[0], 1e-6),
          Math.max(preset[1], 1e-6),
          Math.max(preset[2], 1e-6),
        ]);
        boundsUpdateScheduledRef.current = false;
      }
    });

    // Memoized geometry for outline
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
        case 'Camera':
          return null; // Special case - uses CameraGeometry component
        case 'custom':
          // Fit to the target mesh's bounding box
          return <boxGeometry args={customSize ?? [1, 1, 1]} />;
        default: // Fallback for unknown types
          return <boxGeometry args={[1, 1, 1]} />;
      }
    }, [meshType, customSize]);

    return (
      <group ref={outlineGroupRef}>
        <mesh ref={outlineMeshRef}>
          {geometry}
          <meshBasicMaterial visible={false} />
          <Edges color="#ff6b35" lineWidth={2} />
        </mesh>
      </group>
    );
  },
);

EntityOutline.displayName = 'EntityOutline';
