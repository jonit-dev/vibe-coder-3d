import { useEffect, useMemo, useState } from 'react';

import {
  combinePhysicsContributions,
  combineRenderingContributions,
} from '@/core/lib/ecs/ComponentRegistry';

interface IUseEntityMeshProps {
  entityComponents: any[];
  isPlaying: boolean;
}

export const useEntityMesh = ({ entityComponents, isPlaying }: IUseEntityMeshProps) => {
  const [meshType, setMeshType] = useState<string>('Cube');
  const [entityColor, setEntityColor] = useState<string>('#3388ff');

  // Combine contributions from all components
  const renderingContributions = useMemo(() => {
    return combineRenderingContributions(entityComponents);
  }, [entityComponents]);

  const physicsContributions = useMemo(() => {
    return combinePhysicsContributions(entityComponents);
  }, [entityComponents]);

  // Update mesh type and color from rendering contributions
  useEffect(() => {
    if (renderingContributions.meshType) {
      setMeshType(renderingContributions.meshType);
    }
    if (renderingContributions.material?.color) {
      setEntityColor(renderingContributions.material.color);
    }
  }, [renderingContributions]);

  // Check if this entity should have physics
  const shouldHavePhysics = useMemo(
    () => isPlaying && physicsContributions.enabled,
    [isPlaying, physicsContributions.enabled],
  );

  return {
    meshType,
    entityColor,
    renderingContributions,
    physicsContributions,
    shouldHavePhysics,
  };
};
