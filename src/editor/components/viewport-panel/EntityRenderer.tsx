import { TransformControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import React, { useEffect, useRef } from 'react';
import { Object3D } from 'three';

import { Transform } from '@/core/lib/ecs';

import { getEntityMeshType } from '../../../core/helpers/meshUtils';

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
  useThree(); // just to ensure we are inside Canvas

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
      meshRef.current.position.set(...position);
      meshRef.current.rotation.set(
        rotation[0] * (Math.PI / 180),
        rotation[1] * (Math.PI / 180),
        rotation[2] * (Math.PI / 180),
      );
      meshRef.current.scale.set(...scale);
    }
  });

  // Handle gizmo transform changes
  const handleObjectChange = () => {
    if (!meshRef.current) return;
    if (mode === 'translate') {
      Transform.position[entityId][0] = meshRef.current.position.x;
      Transform.position[entityId][1] = meshRef.current.position.y;
      Transform.position[entityId][2] = meshRef.current.position.z;
    } else if (mode === 'rotate') {
      // Convert radians to degrees
      Transform.rotation[entityId][0] = meshRef.current.rotation.x * (180 / Math.PI);
      Transform.rotation[entityId][1] = meshRef.current.rotation.y * (180 / Math.PI);
      Transform.rotation[entityId][2] = meshRef.current.rotation.z * (180 / Math.PI);
    } else if (mode === 'scale') {
      Transform.scale[entityId][0] = meshRef.current.scale.x;
      Transform.scale[entityId][1] = meshRef.current.scale.y;
      Transform.scale[entityId][2] = meshRef.current.scale.z;
    }
    Transform.needsUpdate[entityId] = 1;
    if (onTransformChange) {
      if (mode === 'translate') {
        onTransformChange([
          meshRef.current.position.x,
          meshRef.current.position.y,
          meshRef.current.position.z,
        ]);
      } else if (mode === 'rotate') {
        onTransformChange([
          meshRef.current.rotation.x * (180 / Math.PI),
          meshRef.current.rotation.y * (180 / Math.PI),
          meshRef.current.rotation.z * (180 / Math.PI),
        ]);
      } else if (mode === 'scale') {
        onTransformChange([
          meshRef.current.scale.x,
          meshRef.current.scale.y,
          meshRef.current.scale.z,
        ]);
      }
    }
  };

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
        <TransformControls
          ref={transformRef}
          object={meshRef.current}
          mode={mode}
          size={0.75}
          showX={true}
          showY={true}
          showZ={true}
          translationSnap={0.25}
          rotationSnap={Math.PI / 24}
          scaleSnap={0.1}
          onObjectChange={handleObjectChange}
          onMouseDown={() => setIsTransforming && setIsTransforming(true)}
          onMouseUp={() => setIsTransforming && setIsTransforming(false)}
          onUpdate={() => {
            // Force the gizmo to render above other objects
            const control = transformRef.current as any;
            if (control && control.children) {
              control.children.forEach((child: any) => {
                if (child.isTransformControlsGizmo) {
                  child.renderOrder = 999;
                  child.children.forEach((gizmoPart: any) => {
                    gizmoPart.renderOrder = 1000;
                  });
                }
              });
            }
          }}
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
