import { useEffect, useMemo, useState } from 'react';
import { useMaterialsStore } from '@/editor/store/materialsStore';
import type { MeshRendererData } from '@/core/lib/ecs/components/definitions/MeshRendererComponent';

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

  // Get materials from store for reactivity
  const materials = useMaterialsStore((state) => state.materials);

  // Combine contributions from components (geometry, visibility, overrides)
  const baseContributions = useMemo<IRenderingContributions>(() => {
    return combineRenderingContributions(entityComponents) as unknown as IRenderingContributions;
  }, [entityComponents]);

  // Merge base material asset (by materialId) with inline overrides for rendering
  const renderingContributions = useMemo<IRenderingContributions>(() => {
    // Read MeshRenderer data directly for materialId and overrides
    const meshRenderer = entityComponents.find((c) => c.type === 'MeshRenderer')?.data as
      | MeshRendererData
      | undefined;
    const materialId = meshRenderer?.materialId || 'default';

    // Get the material definition from the reactive materials list
    const baseDef = materials.find((m) => m.id === materialId);

    if (!baseDef && materialId !== 'default') {
      console.warn(`Material not found in registry: ${materialId}`, {
        availableMaterials: materials.map((m) => m.id),
      });
    }

    // Build base material from asset (fallbacks ensure stability)
    const baseMaterial = {
      shader: baseDef?.shader ?? 'standard',
      materialType: baseDef?.materialType ?? 'solid',
      color: baseDef?.color ?? '#cccccc',
      normalScale: baseDef?.normalScale ?? 1,
      metalness: baseDef?.metalness ?? 0,
      roughness: baseDef?.roughness ?? 0.7,
      emissive: baseDef?.emissive ?? '#000000',
      emissiveIntensity: baseDef?.emissiveIntensity ?? 0,
      occlusionStrength: baseDef?.occlusionStrength ?? 1,
      textureOffsetX: baseDef?.textureOffsetX ?? 0,
      textureOffsetY: baseDef?.textureOffsetY ?? 0,
      albedoTexture: baseDef?.albedoTexture,
      normalTexture: baseDef?.normalTexture,
      metallicTexture: baseDef?.metallicTexture,
      roughnessTexture: baseDef?.roughnessTexture,
      emissiveTexture: baseDef?.emissiveTexture,
      occlusionTexture: baseDef?.occlusionTexture,
    } as IRenderingContributions['material'];

    // Apply only real overrides (not defaults) from MeshRenderer.material
    const overrides = meshRenderer?.material || {};

    return {
      ...baseContributions,
      material: {
        ...baseMaterial,
        ...overrides,
      },
    };
  }, [entityComponents, baseContributions, materials]);

  const physicsContributions = useMemo<IPhysicsContributions>(() => {
    return combinePhysicsContributions(entityComponents) as unknown as IPhysicsContributions;
  }, [entityComponents]);

  // Use meshType directly from renderingContributions (no state delay)
  const meshType = renderingContributions.meshType;

  // Update color from effective material
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
