import { useEffect, useMemo, useState } from 'react';
import { useMaterialById } from '@/editor/store/materialsStore';
import type { MeshRendererData } from '@/core/lib/ecs/components/definitions/MeshRendererComponent';
import type { GeometryAssetData } from '@/core/lib/ecs/components/definitions';
import { Logger } from '@/core/lib/logger';

import {
  combinePhysicsContributions,
  combineRenderingContributions,
} from '@/core/lib/ecs/ComponentRegistry';

const logger = Logger.create('useEntityMesh');

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
    color?: string | { r: number; g: number; b: number };
    metalness?: number;
    roughness?: number;
    emissive?: string | { r: number; g: number; b: number };
    emissiveIntensity?: number;
    normalScale?: number;
    occlusionStrength?: number;
    textureOffsetX?: number;
    textureOffsetY?: number;
    textureRepeatX?: number;
    textureRepeatY?: number;
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

  // Combine contributions from components (geometry, visibility, overrides)
  const baseContributions = useMemo<IRenderingContributions>(() => {
    return combineRenderingContributions(entityComponents) as unknown as IRenderingContributions;
  }, [entityComponents]);

  const meshRenderer = useMemo(
    () =>
      entityComponents.find((c) => c.type === 'MeshRenderer')?.data as
        | MeshRendererData
        | undefined,
    [entityComponents],
  );

  const geometryAsset = useMemo(
    () =>
      entityComponents.find((c) => c.type === 'GeometryAsset')?.data as
        | GeometryAssetData
        | undefined,
    [entityComponents],
  );

  // Extract materialId first to use in atomic selector
  const materialId = useMemo(() => {
    if (geometryAsset?.materialId?.length) {
      return geometryAsset.materialId;
    }
    return meshRenderer?.materialId || 'default';
  }, [geometryAsset, meshRenderer]);

  // PERFORMANCE: Use atomic selector - only subscribes to THIS material, not all materials
  // This prevents re-renders when other materials change
  const baseDef = useMaterialById(materialId);

  // Merge base material asset (by materialId) with inline overrides for rendering
  const renderingContributions = useMemo<IRenderingContributions>(() => {
    // Read MeshRenderer data directly for overrides
    if (!baseDef && materialId !== 'default') {
      logger.warn(`Material not found in registry: ${materialId}`);
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
      textureRepeatX: baseDef?.textureRepeatX ?? 1,
      textureRepeatY: baseDef?.textureRepeatY ?? 1,
      albedoTexture: baseDef?.albedoTexture,
      normalTexture: baseDef?.normalTexture,
      metallicTexture: baseDef?.metallicTexture,
      roughnessTexture: baseDef?.roughnessTexture,
      emissiveTexture: baseDef?.emissiveTexture,
      occlusionTexture: baseDef?.occlusionTexture,
    } as IRenderingContributions['material'];

    // Apply only real overrides (not defaults) from MeshRenderer.material
    const overrides = meshRenderer?.material || {};

    // Filter out undefined values from overrides to prevent overwriting base values
    const filteredOverrides = Object.entries(overrides).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    return {
      ...baseContributions,
      material: {
        ...baseMaterial,
        ...filteredOverrides,
      },
    };
  }, [meshRenderer, baseContributions, baseDef]);

  const physicsContributions = useMemo<IPhysicsContributions>(() => {
    return combinePhysicsContributions(entityComponents) as unknown as IPhysicsContributions;
  }, [entityComponents]);

  // Use meshType directly from renderingContributions (no state delay)
  const meshType = renderingContributions.meshType;

  // Update color from effective material
  useEffect(() => {
    if (renderingContributions.material?.color) {
      const color = renderingContributions.material.color;
      // Convert object color to string format if needed
      if (typeof color === 'object') {
        const { r, g, b } = color;
        setEntityColor(`rgb(${r * 255}, ${g * 255}, ${b * 255})`);
      } else {
        setEntityColor(color);
      }
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
