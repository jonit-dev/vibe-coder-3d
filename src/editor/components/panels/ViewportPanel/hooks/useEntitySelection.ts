import { useCallback, useEffect, useRef } from 'react';
import type { Mesh } from 'three';
import * as THREE from 'three';

import { useEditorStore } from '@/editor/store/editorStore';
import { useGroupSelection } from '@/editor/hooks/useGroupSelection';

interface IUseEntitySelectionProps {
  entityId: number;
  selected: boolean;
  meshRef: React.RefObject<Mesh | null>;
  isTransforming: boolean;
  position: [number, number, number];
  rotationRadians: [number, number, number];
  scale: [number, number, number];
}

interface IUseEntitySelectionPropsWithAllEntities extends IUseEntitySelectionProps {
  allEntityIds?: number[];
}

export const useEntitySelection = ({
  entityId,
  selected,
  meshRef,
  isTransforming,
  position,
  rotationRadians,
  scale,
  allEntityIds = [],
}: IUseEntitySelectionPropsWithAllEntities) => {
  const setSelectedId = useEditorStore((s) => s.setSelectedId);
  const groupSelection = useGroupSelection();

  // Outline visualization refs
  const outlineGroupRef = useRef<THREE.Group | null>(null);
  const outlineMeshRef = useRef<THREE.Mesh | null>(null);

  // Memoized click handler with group selection support
  const handleMeshClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      console.log(
        `[useEntitySelection] Entity ${entityId} clicked, ctrl=${e.ctrlKey}, shift=${e.shiftKey}`,
      );

      // Check if this entity is already part of a group selection
      const isPartOfGroup =
        groupSelection.selectedIds.length > 1 && groupSelection.isSelected(entityId);

      if (isPartOfGroup && !e.ctrlKey && !e.shiftKey) {
        // If clicking on an entity that's part of a group without modifiers,
        // keep the group selection (don't break the group)
        console.log(
          `[useEntitySelection] Entity ${entityId} is part of group, maintaining group selection`,
        );
        // Don't change selection - let the group stay selected
        return;
      }

      // Use group selection for viewport clicks
      groupSelection.handleHierarchySelection(entityId, {
        ctrlKey: e.ctrlKey || false,
        shiftKey: e.shiftKey || false,
        selectChildren: false, // Don't auto-select children on viewport clicks (only hierarchy does that)
        allEntityIds, // Pass entity IDs for range selection
      });

      // Note: setSelectedId is managed by the group selection system now
    },
    [entityId, setSelectedId, groupSelection, allEntityIds],
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
