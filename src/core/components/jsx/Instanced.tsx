/**
 * Instanced JSX Component
 * Provides declarative API for creating instanced meshes in the ECS
 */

import React, { useEffect } from 'react';

import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import type {
  InstancedComponentData,
  InstanceData,
} from '@/core/lib/ecs/components/definitions/InstancedComponent';

import { useEntityContext } from './EntityContext';

export interface IInstancedProps {
  /** Base mesh ID (cube, sphere, cylinder, etc.) */
  baseMeshId: string;
  /** Base material ID */
  baseMaterialId: string;
  /** Array of instance transforms */
  instances: InstanceData[];
  /** Maximum number of instances (default: 100) */
  capacity?: number;
  /** Whether the instanced mesh is enabled/visible */
  enabled?: boolean;
  /** Whether instances cast shadows */
  castShadows?: boolean;
  /** Whether instances receive shadows */
  receiveShadows?: boolean;
  /** Whether to use frustum culling */
  frustumCulled?: boolean;
}

export const Instanced: React.FC<IInstancedProps> = ({
  baseMeshId,
  baseMaterialId,
  instances,
  capacity = 100,
  enabled = true,
  castShadows = true,
  receiveShadows = true,
  frustumCulled = true,
}) => {
  const { entityId } = useEntityContext();

  useEffect(() => {
    const instancedData: InstancedComponentData = {
      enabled,
      capacity,
      baseMeshId,
      baseMaterialId,
      instances,
      castShadows,
      receiveShadows,
      frustumCulled,
    };

    if (componentRegistry.hasComponent(entityId, 'Instanced')) {
      // Update existing instanced component
      componentRegistry.updateComponent(entityId, 'Instanced', instancedData);
    } else {
      // Add new instanced component
      componentRegistry.addComponent(entityId, 'Instanced', instancedData);
    }
  }, [
    entityId,
    baseMeshId,
    baseMaterialId,
    instances,
    capacity,
    enabled,
    castShadows,
    receiveShadows,
    frustumCulled,
  ]);

  // This component doesn't render anything - it just manages ECS data
  return null;
};
