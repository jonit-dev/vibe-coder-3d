import { useFrame, useThree } from '@react-three/fiber';
import React, { useEffect, useRef } from 'react';
import { Object3D } from 'three';

import { Transform } from '@/core/lib/ecs';

import { getEntityMeshType } from '../../../core/helpers/meshUtils';

import { GizmoControls } from './GizmoControls';

type GizmoMode = 'translate' | 'rotate' | 'scale';

export interface IEntityRendererProps {
  entityId: number;
  selected: boolean;
  mode: GizmoMode;
  onTransformChange?: (values: [number, number, number]) => void;
  setIsTransforming?: (isTransforming: boolean) => void;
  setGizmoMode?: (mode: GizmoMode) => void;
}

const EntityRenderer: React.FC<IEntityRendererProps> = ({
  entityId,
  selected,
  mode,
  onTransformChange,
  setIsTransforming,
  setGizmoMode,
}) => {
  const meshType = getEntityMeshType(entityId);
  const meshRef = useRef<Object3D>(null);
  const transformRef = useRef<any>(null);
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
    if (meshRef.current) {
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

  return (
    <group>
      <mesh ref={meshRef} castShadow receiveShadow userData={{ entityId }}>
        {geometry}
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {selected && meshRef.current && (
        <GizmoControls
          meshRef={meshRef}
          mode={mode}
          entityId={entityId}
          onTransformChange={onTransformChange}
          setIsTransforming={setIsTransforming}
        />
      )}

      {/* Selection outline when selected */}
      {selected && (
        <mesh position={position} scale={scale.map((s) => s + 0.05) as [number, number, number]}>
          {geometry}
          <meshBasicMaterial color="#4488ff" wireframe transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
};

export default EntityRenderer;
