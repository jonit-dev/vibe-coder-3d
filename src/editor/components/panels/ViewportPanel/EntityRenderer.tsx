import { useFrame, useThree } from '@react-three/fiber';
import React, { useEffect, useRef, useState } from 'react';
import { Object3D } from 'three';

import { Transform } from '@/core/lib/ecs';
import { getEntityMeshType } from '@core/helpers/meshUtils';

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
  const meshType = getEntityMeshType(entityId);
  const meshRef = useRef<Object3D>(null);
  const [isTransformingLocal, setIsTransformingLocal] = useState(false);
  const [dragTick, setDragTick] = useState(0);
  useThree();

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

  // Read transform from ECS
  const position: [number, number, number] = [
    Transform.position[entityId][0],
    Transform.position[entityId][1],
    Transform.position[entityId][2],
  ];
  const rotation: [number, number, number] = [
    Transform.rotation[entityId][0],
    Transform.rotation[entityId][1],
    Transform.rotation[entityId][2],
  ];
  const scale: [number, number, number] = [
    Transform.scale[entityId][0],
    Transform.scale[entityId][1],
    Transform.scale[entityId][2],
  ];

  // Sync mesh transform from ECS
  useFrame(() => {
    if (isTransformingLocal) {
      setDragTick((tick) => tick + 1);
    }
    if (meshRef.current && !isTransformingLocal) {
      meshRef.current.position.set(position[0], position[1], position[2]);
      meshRef.current.rotation.set(
        rotation[0] * (Math.PI / 180),
        rotation[1] * (Math.PI / 180),
        rotation[2] * (Math.PI / 180),
      );
      meshRef.current.scale.set(scale[0], scale[1], scale[2]);
    }
  });

  // Geometry selection
  let geometry = <boxGeometry args={[1, 1, 1]} />;
  if (meshType === 'Sphere') {
    geometry = <sphereGeometry args={[0.5, 32, 32]} />;
  }

  // Compute outline transform: live during drag, ECS otherwise
  let outlinePosition: [number, number, number] = position;
  let outlineRotation: [number, number, number] = [
    rotation[0] * (Math.PI / 180),
    rotation[1] * (Math.PI / 180),
    rotation[2] * (Math.PI / 180),
  ];
  let outlineScale: [number, number, number] = scale.map((s) => s + 0.05) as [
    number,
    number,
    number,
  ];
  if (isTransformingLocal && meshRef.current) {
    outlinePosition = [
      meshRef.current.position.x,
      meshRef.current.position.y,
      meshRef.current.position.z,
    ];
    outlineRotation = [
      meshRef.current.rotation.x,
      meshRef.current.rotation.y,
      meshRef.current.rotation.z,
    ];
    outlineScale = [
      meshRef.current.scale.x + 0.05,
      meshRef.current.scale.y + 0.05,
      meshRef.current.scale.z + 0.05,
    ];
  }

  return (
    <group>
      <mesh ref={meshRef} castShadow receiveShadow userData={{ entityId }}>
        {geometry}
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {selected && (
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

      {/* Selection outline when selected */}
      {selected && (
        <SelectionOutline
          geometry={geometry}
          position={outlinePosition}
          rotation={outlineRotation}
          scale={outlineScale}
          key={dragTick}
        />
      )}
    </group>
  );
};
