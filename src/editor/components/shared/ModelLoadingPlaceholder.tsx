import React, { useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh, Group } from 'three';
import { Logger } from '@core/lib/logger';

const logger = Logger.create('ModelLoadingPlaceholder');

interface IModelLoadingPlaceholderProps {
  entityId: number;
  modelName?: string;
  meshInstanceRef?: React.Ref<Group | Mesh | null>;
}

/**
 * A spinning wireframe box that appears while a custom model is being ingested and optimized.
 * Shows a visual loading indicator in the 3D scene.
 */
export const ModelLoadingPlaceholder: React.FC<IModelLoadingPlaceholderProps> = ({
  entityId,
  modelName,
  meshInstanceRef,
}) => {
  const localMeshRef = useRef<Mesh>(null);
  const groupRef = useRef<Group | null>(null);

  // Combined ref callback to handle both local and external refs
  const groupRefCallback = useCallback(
    (node: Group | null) => {
      logger.debug('Ref callback called', {
        entityId,
        hasNode: !!node,
        hasParent: node?.parent ? true : false,
        nodeType: node?.type,
      });

      groupRef.current = node;

      if (typeof meshInstanceRef === 'function') {
        meshInstanceRef(node);
      } else if (meshInstanceRef && 'current' in meshInstanceRef) {
        (meshInstanceRef as React.MutableRefObject<Group | Mesh | null>).current = node;
      }
    },
    [meshInstanceRef, entityId],
  );

  // Rotate the box on all axes for a nice loading effect
  useFrame((_, delta) => {
    if (localMeshRef.current) {
      localMeshRef.current.rotation.x += delta * 1.5;
      localMeshRef.current.rotation.y += delta * 2.0;
      localMeshRef.current.rotation.z += delta * 0.5;
    }
  });

  return (
    <group userData={{ entityId }} ref={groupRefCallback}>
      <mesh ref={localMeshRef} castShadow={false} receiveShadow={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#4a9eff"
          wireframe
          opacity={0.8}
          transparent
          emissive="#4a9eff"
          emissiveIntensity={0.5}
        />
      </mesh>
      {modelName && (
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial color="#4a9eff" />
        </mesh>
      )}
    </group>
  );
};
