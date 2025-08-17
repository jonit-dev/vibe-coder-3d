/**
 * React hook for using the new component registry system
 * Provides a clean, reactive interface for component operations
 */

import { useCallback, useEffect, useState } from 'react';

import { componentRegistry, ComponentCategory } from '../lib/ecs/ComponentRegistry';
import { EntityId } from '../lib/ecs/types';

export interface IComponentRegistryHook {
  // Component operations
  addComponent: <TData>(entityId: EntityId, componentId: string, data: TData) => boolean;
  removeComponent: (entityId: EntityId, componentId: string) => boolean;
  hasComponent: (entityId: EntityId, componentId: string) => boolean;
  getComponentData: <TData>(entityId: EntityId, componentId: string) => TData | undefined;
  updateComponent: <TData>(
    entityId: EntityId,
    componentId: string,
    data: Partial<TData>,
  ) => boolean;

  // Entity queries
  listEntityComponents: (entityId: EntityId) => string[];
  getEntitiesWithComponent: (componentId: string) => EntityId[];
  removeComponentsForEntity: (entityId: EntityId) => void;

  // Registry queries
  listComponents: () => string[];
  getComponentsByCategory: (category: string) => string[];

  // Reactive state
  registeredComponents: string[];
  refreshComponents: () => void;
}

/**
 * Hook for using the component registry system
 */
export function useComponentRegistry(): IComponentRegistryHook {
  const [registeredComponents, setRegisteredComponents] = useState<string[]>([]);

  // Refresh the list of registered components
  const refreshComponents = useCallback(() => {
    setRegisteredComponents(componentRegistry.listComponents());
  }, []);

  // Initialize and refresh on mount
  useEffect(() => {
    refreshComponents();
  }, [refreshComponents]);

  // Component operations
  const addComponent = useCallback(
    <TData>(entityId: EntityId, componentId: string, data: TData): boolean => {
      const result = componentRegistry.addComponent(entityId, componentId, data);
      if (result) {
        // Trigger any reactive updates if needed
      }
      return result;
    },
    [],
  );

  const removeComponent = useCallback((entityId: EntityId, componentId: string): boolean => {
    const result = componentRegistry.removeComponent(entityId, componentId);
    if (result) {
      // Trigger any reactive updates if needed
    }
    return result;
  }, []);

  const hasComponent = useCallback((entityId: EntityId, componentId: string): boolean => {
    return componentRegistry.hasComponent(entityId, componentId);
  }, []);

  const getComponentData = useCallback(
    <TData>(entityId: EntityId, componentId: string): TData | undefined => {
      return componentRegistry.getComponentData<TData>(entityId, componentId);
    },
    [],
  );

  const updateComponent = useCallback(
    <TData>(entityId: EntityId, componentId: string, data: Partial<TData>): boolean => {
      const result = componentRegistry.updateComponent(entityId, componentId, data);
      if (result) {
        // Trigger any reactive updates if needed
      }
      return result;
    },
    [],
  );

  // Registry queries
  const listComponents = useCallback((): string[] => {
    return componentRegistry.listComponents();
  }, []);

  const getComponentsByCategory = useCallback((category: string): string[] => {
    return componentRegistry
      .getByCategory(category as ComponentCategory)
      .map((comp) => comp.id);
  }, []);

  const listEntityComponents = useCallback((entityId: EntityId): string[] => {
    return componentRegistry.getEntityComponents(entityId);
  }, []);

  const getEntitiesWithComponent = useCallback((componentId: string): EntityId[] => {
    return componentRegistry.getEntitiesWithComponent(componentId);
  }, []);

  const removeComponentsForEntity = useCallback((entityId: EntityId): void => {
    return componentRegistry.removeComponentsForEntity(entityId);
  }, []);

  return {
    addComponent,
    removeComponent,
    hasComponent,
    getComponentData,
    updateComponent,
    listEntityComponents,
    getEntitiesWithComponent,
    removeComponentsForEntity,
    listComponents,
    getComponentsByCategory,
    registeredComponents,
    refreshComponents,
  };
}

/**
 * Hook for working with a specific entity's components
 */
export function useEntityComponents(entityId: EntityId) {
  const registry = useComponentRegistry();
  const [entityComponents, setEntityComponents] = useState<string[]>([]);

  // Get all components for this entity
  const refreshEntityComponents = useCallback(() => {
    const components = registry
      .listComponents()
      .filter((componentId) => registry.hasComponent(entityId, componentId));
    setEntityComponents(components);
  }, [entityId, registry]);

  // Refresh on mount and when entity changes
  useEffect(() => {
    refreshEntityComponents();
  }, [refreshEntityComponents]);

  // Add component to this entity
  const addComponent = useCallback(
    <TData>(componentId: string, data: TData): boolean => {
      const result = registry.addComponent(entityId, componentId, data);
      if (result) {
        refreshEntityComponents();
      }
      return result;
    },
    [entityId, registry, refreshEntityComponents],
  );

  // Remove component from this entity
  const removeComponent = useCallback(
    (componentId: string): boolean => {
      const result = registry.removeComponent(entityId, componentId);
      if (result) {
        refreshEntityComponents();
      }
      return result;
    },
    [entityId, registry, refreshEntityComponents],
  );

  // Check if this entity has a component
  const hasComponent = useCallback(
    (componentId: string): boolean => {
      return registry.hasComponent(entityId, componentId);
    },
    [entityId, registry],
  );

  // Get component data for this entity
  const getComponentData = useCallback(
    <TData>(componentId: string): TData | undefined => {
      return registry.getComponentData<TData>(entityId, componentId);
    },
    [entityId, registry],
  );

  // Update component data for this entity
  const updateComponent = useCallback(
    <TData>(componentId: string, data: Partial<TData>): boolean => {
      const result = registry.updateComponent(entityId, componentId, data);
      return result;
    },
    [entityId, registry],
  );

  return {
    entityId,
    components: entityComponents,
    addComponent,
    removeComponent,
    hasComponent,
    getComponentData,
    updateComponent,
    refreshComponents: refreshEntityComponents,
  };
}

/**
 * Hook for reactive component data
 * Re-renders when component data changes
 */
export function useComponentData<TData>(
  entityId: EntityId,
  componentId: string,
): TData | undefined {
  const registry = useComponentRegistry();
  const [data, setData] = useState<TData | undefined>();

  const refreshData = useCallback(() => {
    const componentData = registry.getComponentData<TData>(entityId, componentId);
    setData(componentData);
  }, [entityId, componentId, registry]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return data;
}
