import { useEffect, useRef } from 'react';
import { Mesh } from 'three';

import { entityToObject, getEntityColor, objectToEntity, Transform } from '@/core/lib/ecs';
import { getEntityMeshType } from '@core/helpers/meshUtils';

export const useEntityMesh = (entityId: number) => {
  const meshRef = useRef<Mesh>(null);
  const meshType = getEntityMeshType(entityId);
  const entityColor = getEntityColor(entityId);

  // Link mesh to ECS entity and set initial position
  useEffect(() => {
    if (meshRef.current) {
      entityToObject.set(entityId, meshRef.current);
      objectToEntity.set(meshRef.current, entityId);

      // Set initial mesh transform immediately
      meshRef.current.position.set(
        Transform.position[entityId][0],
        Transform.position[entityId][1],
        Transform.position[entityId][2],
      );
      meshRef.current.rotation.set(
        Transform.rotation[entityId][0] * (Math.PI / 180),
        Transform.rotation[entityId][1] * (Math.PI / 180),
        Transform.rotation[entityId][2] * (Math.PI / 180),
      );
      meshRef.current.scale.set(
        Transform.scale[entityId][0],
        Transform.scale[entityId][1],
        Transform.scale[entityId][2],
      );
    }

    return () => {
      if (meshRef.current) {
        entityToObject.delete(entityId);
        objectToEntity.delete(meshRef.current);
      }
    };
  }, [entityId]);

  return {
    meshRef,
    meshType,
    entityColor,
  };
};
