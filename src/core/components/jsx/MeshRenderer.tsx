/**
 * MeshRenderer JSX Component - Maps React props to ECS MeshRenderer component
 * Provides R3F-style mesh and material properties that sync with ECS system
 */

import { DEFAULT_MATERIAL_COLOR } from '@/core/materials/constants';
import React, { useEffect } from 'react';

import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import type { MeshRendererData } from '@/core/lib/ecs/components/definitions/MeshRendererComponent';

import { useEntityContext } from './EntityContext';

// Material properties interface matching ECS MeshRenderer schema
export interface IMaterialProps {
  shader?: 'standard' | 'unlit';
  materialType?: 'solid' | 'texture';
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
}

export interface IMeshRendererProps {
  /** Mesh geometry type */
  meshId: string;
  /** Material ID (optional, defaults to 'default') */
  materialId?: string;
  /** Whether the mesh is enabled/visible */
  enabled?: boolean;
  /** Whether the mesh casts shadows */
  castShadows?: boolean;
  /** Whether the mesh receives shadows */
  receiveShadows?: boolean;
  /** Custom model path (for external models) */
  modelPath?: string;
  /** Material properties */
  material?: IMaterialProps;
}

export const MeshRenderer: React.FC<IMeshRendererProps> = ({
  meshId,
  materialId = 'default',
  enabled = true,
  castShadows = true,
  receiveShadows = true,
  modelPath,
  material,
}) => {
  const { entityId } = useEntityContext();

  useEffect(() => {
    // Build complete material object with defaults
    const completeMaterial = material
      ? {
        shader: 'standard' as const,
        materialType: 'solid' as const,
        color: DEFAULT_MATERIAL_COLOR,
        normalScale: 1,
        metalness: 0,
        roughness: 0.7,
        emissive: '#000000',
        emissiveIntensity: 0,
        occlusionStrength: 1,
        textureOffsetX: 0,
        textureOffsetY: 0,
        textureRepeatX: 1,
        textureRepeatY: 1,
        ...material, // Override with provided material props
      }
      : undefined;

    const meshRendererData: MeshRendererData = {
      meshId,
      materialId,
      enabled,
      castShadows,
      receiveShadows,
      modelPath,
      material: completeMaterial,
    };

    if (componentRegistry.hasComponent(entityId, 'MeshRenderer')) {
      // Update existing mesh renderer
      componentRegistry.updateComponent(entityId, 'MeshRenderer', meshRendererData);
    } else {
      // Add new mesh renderer component
      componentRegistry.addComponent(entityId, 'MeshRenderer', meshRendererData);
    }
  }, [entityId, meshId, materialId, enabled, castShadows, receiveShadows, modelPath, material]);

  // This component doesn't render anything - it just manages ECS data
  return null;
};

// Convenience components for common shapes
export const Cube: React.FC<Omit<IMeshRendererProps, 'meshId'>> = (props) => (
  <MeshRenderer {...props} meshId="cube" />
);

export const Sphere: React.FC<Omit<IMeshRendererProps, 'meshId'>> = (props) => (
  <MeshRenderer {...props} meshId="sphere" />
);

export const Cylinder: React.FC<Omit<IMeshRendererProps, 'meshId'>> = (props) => (
  <MeshRenderer {...props} meshId="cylinder" />
);

export const Plane: React.FC<Omit<IMeshRendererProps, 'meshId'>> = (props) => (
  <MeshRenderer {...props} meshId="plane" />
);
