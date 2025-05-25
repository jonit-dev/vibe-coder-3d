import { useCallback, useEffect, useRef } from 'react';
import type { Mesh } from 'three';
import * as THREE from 'three';

import { useEditorStore } from '@/editor/store/editorStore';

interface IUseEntitySelectionProps {
  entityId: number;
  selected: boolean;
  meshRef: React.RefObject<Mesh | null>;
  isTransforming: boolean;
  position: [number, number, number];
  rotationRadians: [number, number, number];
  scale: [number, number, number];
}

export const useEntitySelection = ({
  entityId,
  selected,
  meshRef,
  isTransforming,
  position,
  rotationRadians,
  scale,
}: IUseEntitySelectionProps) => {
  const setSelectedId = useEditorStore((s) => s.setSelectedId);

  // Outline visualization refs
  const outlineGroupRef = useRef<THREE.Group | null>(null);
  const outlineMeshRef = useRef<THREE.Mesh | null>(null);

  // Memoized click handler
  const handleMeshClick = useCallback(
    (e: any) => {
      e.stopPropagation();
      setSelectedId(entityId);
    },
    [entityId, setSelectedId],
  );

  // Create a pure Three.js outline that updates without React
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
  }, [selected, meshRef]);

  // Handle transform updates - pure Three.js, no React
  useEffect(() => {
    if (!selected || !meshRef.current || !outlineMeshRef.current) return;

    const mesh = meshRef.current;
    const outline = outlineMeshRef.current;

    // During drag: direct Three.js updates via animation loop
    if (isTransforming) {
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
  }, [selected, isTransforming, position, rotationRadians, scale, meshRef]);

  return {
    outlineGroupRef,
    outlineMeshRef,
    handleMeshClick,
  };
};
