import { useCallback, useEffect, useState } from 'react';

import { IComponent, KnownComponentTypes } from '@/editor/lib/ecs/IComponent';
import { ComponentType, EntityId } from '@/editor/lib/ecs/types';

import { useComponentManager } from './useComponentManager';

/**
 * Hook for managing components on an entity - enables customization of entity behavior
 */
export const useEntityComponents = (entityId: EntityId | null) => {
  const componentManager = useComponentManager();
  const [components, setComponents] = useState<IComponent<any>[]>([]);

  // Refresh components when entity changes
  useEffect(() => {
    if (entityId === null) {
      setComponents([]);
      return;
    }

    const updateComponents = () => {
      const entityComponents = componentManager.getComponentsForEntity(entityId);
      setComponents(entityComponents);
    };

    updateComponents();

    // TODO: Add event listener when ECS system supports it
    // For now, we'll rely on parent components to trigger updates
  }, [entityId, componentManager]);

  const addComponent = useCallback(
    <TData>(type: ComponentType, data: TData): IComponent<TData> | null => {
      if (entityId === null) return null;

      return componentManager.addComponent(entityId, type, data);
    },
    [entityId, componentManager],
  );

  const updateComponent = useCallback(
    <TData>(type: ComponentType, data: Partial<TData>): boolean => {
      if (entityId === null) return false;

      return componentManager.updateComponent(entityId, type, data);
    },
    [entityId, componentManager],
  );

  const removeComponent = useCallback(
    (type: ComponentType): boolean => {
      if (entityId === null) return false;

      return componentManager.removeComponent(entityId, type);
    },
    [entityId, componentManager],
  );

  const hasComponent = useCallback(
    (type: ComponentType): boolean => {
      if (entityId === null) return false;

      return componentManager.hasComponent(entityId, type);
    },
    [entityId, componentManager],
  );

  const getComponent = useCallback(
    <TData>(type: ComponentType): IComponent<TData> | undefined => {
      if (entityId === null) return undefined;

      return componentManager.getComponent<TData>(entityId, type);
    },
    [entityId, componentManager],
  );

  // Convenience methods for known component types
  const hasTransform = hasComponent(KnownComponentTypes.TRANSFORM);
  const hasMeshRenderer = hasComponent(KnownComponentTypes.MESH_RENDERER);
  const hasRigidBody = hasComponent(KnownComponentTypes.RIGID_BODY);
  const hasMeshCollider = hasComponent(KnownComponentTypes.MESH_COLLIDER);

  const getTransform = () => componentManager.getTransformComponent(entityId!);
  const getMeshRenderer = () => componentManager.getMeshRendererComponent(entityId!);
  const getRigidBody = () => componentManager.getRigidBodyComponent(entityId!);
  const getMeshCollider = () => componentManager.getMeshColliderComponent(entityId!);

  return {
    components,
    addComponent,
    updateComponent,
    removeComponent,
    hasComponent,
    getComponent,
    // Convenience accessors
    hasTransform,
    hasMeshRenderer,
    hasRigidBody,
    hasMeshCollider,
    getTransform,
    getMeshRenderer,
    getRigidBody,
    getMeshCollider,
  };
};
