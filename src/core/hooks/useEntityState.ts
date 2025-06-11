import { useCallback, useEffect, useState } from 'react';

import { EntityId } from '../lib/ecs/types';
import {
  TransformData,
  MeshRendererData,
  CameraData,
  RigidBodyData,
  MeshColliderData,
} from '../lib/ecs/components/definitions';
import { useComponentRegistry } from './useComponentRegistry';
import { useEvent } from './useEvent';

/**
 * Hook for easy entity state management with reactive updates
 * Provides simple methods to interact with entity components
 */
export const useEntityState = (entityId: EntityId | null) => {
  const {
    addComponent,
    removeComponent,
    hasComponent,
    getComponentData,
    updateComponent,
    listEntityComponents,
  } = useComponentRegistry();

  const [componentList, setComponentList] = useState<string[]>([]);

  // Update component list when entity changes or components are modified
  const updateComponentList = useCallback(() => {
    if (entityId !== null) {
      const components = listEntityComponents(entityId);
      setComponentList(components);
    } else {
      setComponentList([]);
    }
  }, [entityId, listEntityComponents]);

  // Listen for component events to update reactively
  useEvent('component:added', (event) => {
    if (event.entityId === entityId) {
      updateComponentList();
    }
  });

  useEvent('component:removed', (event) => {
    if (event.entityId === entityId) {
      updateComponentList();
    }
  });

  useEvent('component:updated', (event) => {
    if (event.entityId === entityId) {
      updateComponentList();
    }
  });

  // Update component list when entity changes
  useEffect(() => {
    updateComponentList();
  }, [updateComponentList]);

  // Easy-to-use methods
  const addComponentToEntity = useCallback(
    <T>(componentId: string, data: T) => {
      if (entityId === null) return false;
      return addComponent(entityId, componentId, data);
    },
    [entityId, addComponent],
  );

  const removeComponentFromEntity = useCallback(
    (componentId: string) => {
      if (entityId === null) return false;
      return removeComponent(entityId, componentId);
    },
    [entityId, removeComponent],
  );

  const hasComponentOnEntity = useCallback(
    (componentId: string) => {
      if (entityId === null) return false;
      return hasComponent(entityId, componentId);
    },
    [entityId, hasComponent],
  );

  const getEntityComponentData = useCallback(
    <T>(componentId: string): T | undefined => {
      if (entityId === null) return undefined;
      return getComponentData<T>(entityId, componentId);
    },
    [entityId, getComponentData],
  );

  const updateEntityComponent = useCallback(
    <T>(componentId: string, data: Partial<T>) => {
      if (entityId === null) return false;
      return updateComponent(entityId, componentId, data);
    },
    [entityId, updateComponent],
  );

  // Convenience methods for common components
  const getTransform = useCallback(() => {
    return getEntityComponentData('Transform');
  }, [getEntityComponentData]);

  const updateTransform = useCallback(
    (data: Partial<TransformData>) => {
      return updateEntityComponent('Transform', data);
    },
    [updateEntityComponent],
  );

  const getMeshRenderer = useCallback(() => {
    return getEntityComponentData('MeshRenderer');
  }, [getEntityComponentData]);

  const updateMeshRenderer = useCallback(
    (data: Partial<MeshRendererData>) => {
      return updateEntityComponent('MeshRenderer', data);
    },
    [updateEntityComponent],
  );

  const getCamera = useCallback(() => {
    return getEntityComponentData('Camera');
  }, [getEntityComponentData]);

  const updateCamera = useCallback(
    (data: Partial<CameraData>) => {
      return updateEntityComponent('Camera', data);
    },
    [updateEntityComponent],
  );

  const getRigidBody = useCallback(() => {
    return getEntityComponentData('RigidBody');
  }, [getEntityComponentData]);

  const updateRigidBody = useCallback(
    (data: Partial<RigidBodyData>) => {
      return updateEntityComponent('RigidBody', data);
    },
    [updateEntityComponent],
  );

  const getMeshCollider = useCallback(() => {
    return getEntityComponentData('MeshCollider');
  }, [getEntityComponentData]);

  const updateMeshCollider = useCallback(
    (data: Partial<MeshColliderData>) => {
      return updateEntityComponent('MeshCollider', data);
    },
    [updateEntityComponent],
  );

  return {
    // Entity info
    entityId,
    componentList,

    // Generic component methods
    addComponent: addComponentToEntity,
    removeComponent: removeComponentFromEntity,
    hasComponent: hasComponentOnEntity,
    getComponentData: getEntityComponentData,
    updateComponent: updateEntityComponent,

    // Convenience methods for common components
    getTransform,
    updateTransform,
    getMeshRenderer,
    updateMeshRenderer,
    getCamera,
    updateCamera,
    getRigidBody,
    updateRigidBody,
    getMeshCollider,
    updateMeshCollider,
  };
};
