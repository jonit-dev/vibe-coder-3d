import { useEffect, useMemo, useState } from 'react';

import {
  combinePhysicsContributions,
  combineRenderingContributions,
} from '@/core/lib/ecs/ComponentRegistry';

export interface IUseEntityMeshProps {
  entityComponents: Array<{ type: string; data: unknown }>;
  isPlaying: boolean;
}

export interface IRenderingContributions {
  castShadow: boolean;
  receiveShadow: boolean;
  visible: boolean;
  meshType: string | null;
  material?: {
    shader?: string;
    materialType?: string;
    color?: string;
    metalness?: number;
    roughness?: number;
    emissive?: string;
    emissiveIntensity?: number;
    normalScale?: number;
    occlusionStrength?: number;
    textureOffsetX?: number;
    textureOffsetY?: number;
    albedoTexture?: string;
    normalTexture?: string;
    metallicTexture?: string;
    roughnessTexture?: string;
    emissiveTexture?: string;
    occlusionTexture?: string;
  };
}

export interface IPhysicsContributions {
  enabled: boolean;
  rigidBodyProps: {
    type: string;
    mass: number;
    friction: number;
    restitution: number;
    density: number;
    gravityScale: number;
    canSleep: boolean;
  };
}

export interface IUseEntityMeshResult {
  meshType: string | null;
  entityColor: string;
  renderingContributions: IRenderingContributions;
  physicsContributions: IPhysicsContributions;
  shouldHavePhysics: boolean;
}

export const useEntityMesh = ({
  entityComponents,
  isPlaying,
}: IUseEntityMeshProps): IUseEntityMeshResult => {
  const [entityColor, setEntityColor] = useState<string>('#3388ff');

  // Combine contributions from all components
  const renderingContributions = useMemo<IRenderingContributions>(() => {
    return combineRenderingContributions(entityComponents) as unknown as IRenderingContributions;
  }, [entityComponents]);

  const physicsContributions = useMemo<IPhysicsContributions>(() => {
    return combinePhysicsContributions(entityComponents) as unknown as IPhysicsContributions;
  }, [entityComponents]);

  // Use meshType directly from renderingContributions (no state delay)
  const meshType = renderingContributions.meshType;

  // Update color from rendering contributions
  useEffect(() => {
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
