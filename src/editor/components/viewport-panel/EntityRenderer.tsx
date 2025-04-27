import { Edges, TransformControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import React, { useEffect, useRef, useState } from 'react';

import { MeshType, MeshTypeEnum, Transform } from '@core/lib/ecs';

type GizmoMode = 'translate' | 'rotate' | 'scale';

interface IEntityRendererProps {
  entityId: number;
  selected: boolean;
  mode: GizmoMode;
  onTransformChange?: (values: [number, number, number]) => void;
  setIsTransforming?: (dragging: boolean) => void;
}

const EntityRenderer: React.FC<IEntityRendererProps> = ({
  entityId,
  selected,
  mode,
  onTransformChange,
  setIsTransforming,
}) => {
  const [version, setVersion] = useState(0);
  const meshRef = useRef<any>(null);
  const transformRef = useRef<any>(null);

  // Listen for dragging-changed event
  useEffect(() => {
    if (!selected || !setIsTransforming) return;
    const controls = transformRef.current;
    if (!controls) return;
    const callback = (event: any) => setIsTransforming(event.value);
    controls.addEventListener('dragging-changed', callback);
    return () => controls.removeEventListener('dragging-changed', callback);
  }, [selected, setIsTransforming]);

  // Force re-render on every frame to reflect ECS changes
  useFrame(() => {
    setVersion((v) => v + 1);
  });

  // Safety check - if position/rotation/scale arrays are undefined, return null
  if (
    !Transform.position[entityId] ||
    !Transform.rotation[entityId] ||
    !Transform.scale[entityId]
  ) {
    return null;
  }

  // Extract transform from ECS
  const position = [
    Transform.position[entityId][0],
    Transform.position[entityId][1],
    Transform.position[entityId][2],
  ];

  const rotation = [
    Transform.rotation[entityId][0],
    Transform.rotation[entityId][1],
    Transform.rotation[entityId][2],
  ];

  const scale = [
    Transform.scale[entityId][0],
    Transform.scale[entityId][1],
    Transform.scale[entityId][2],
  ];

  // Safety check - if MeshType is undefined, default to cube
  const meshType =
    MeshType.type[entityId] !== undefined ? MeshType.type[entityId] : MeshTypeEnum.Cube;

  // Handler for transform changes from TransformControls
  const handleObjectChange = () => {
    if (meshRef.current && onTransformChange) {
      if (mode === 'translate') {
        const pos = meshRef.current.position;
        onTransformChange([pos.x, pos.y, pos.z]);
      } else if (mode === 'rotate') {
        const rot = meshRef.current.rotation;
        onTransformChange([rot.x, rot.y, rot.z]);
      } else if (mode === 'scale') {
        const scl = meshRef.current.scale;
        onTransformChange([scl.x, scl.y, scl.z]);
      }
    }
  };

  const mesh = (
    <mesh
      ref={meshRef}
      position={position as [number, number, number]}
      rotation={rotation as [number, number, number]}
      scale={scale as [number, number, number]}
      castShadow
    >
      {meshType === MeshTypeEnum.Cube ? (
        <>
          <boxGeometry args={[1, 1, 1]} />
          {selected && <Edges scale={1.05} color="orange" threshold={15} />}
        </>
      ) : meshType === MeshTypeEnum.Sphere ? (
        <>
          <sphereGeometry args={[0.5, 32, 32]} />
          {selected && <Edges scale={1.05} color="orange" threshold={15} />}
        </>
      ) : (
        <>
          <boxGeometry args={[1, 1, 1]} />
          {selected && <Edges scale={1.05} color="orange" threshold={15} />}
        </>
      )}
      <meshStandardMaterial color="#3399ff" />
    </mesh>
  );

  // Only wrap in TransformControls if selected
  if (selected) {
    return (
      <TransformControls
        ref={transformRef}
        mode={mode}
        showX
        showY
        showZ
        onObjectChange={handleObjectChange}
      >
        {mesh}
      </TransformControls>
    );
  }
  return mesh;
};

export default EntityRenderer;
