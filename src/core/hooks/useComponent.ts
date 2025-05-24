import { useCallback, useEffect, useState } from 'react';

import { componentRegistry } from '../lib/component-registry';
import { dynamicComponentManager } from '../lib/dynamic-components';
import { IComponentChangeEvent, IValidationResult } from '../types/component-registry';

// Hook to check if an entity has a component
export function useHasComponent(entityId: number | null, componentId: string): boolean {
  const [hasComponent, setHasComponent] = useState(false);

  useEffect(() => {
    if (entityId === null) {
      setHasComponent(false);
      return;
    }

    const checkComponent = () => {
      setHasComponent(dynamicComponentManager.hasComponent(entityId, componentId));
    };

    // Initial check
    checkComponent();

    // Listen for component changes
    const handleComponentChange = (event: IComponentChangeEvent) => {
      if (event.entityId === entityId && event.componentId === componentId) {
        checkComponent();
      }
    };

    componentRegistry.addEventListener(handleComponentChange);

    return () => {
      componentRegistry.removeEventListener(handleComponentChange);
    };
  }, [entityId, componentId]);

  return hasComponent;
}

// Hook to get component data
export function useComponentData<T = any>(
  entityId: number | null,
  componentId: string,
): T | undefined {
  const [data, setData] = useState<T | undefined>(undefined);

  useEffect(() => {
    if (entityId === null) {
      setData(undefined);
      return;
    }

    const updateData = () => {
      const componentData = dynamicComponentManager.getComponentData(entityId, componentId);
      setData(componentData);
    };

    // Initial load
    updateData();

    // Listen for component changes
    const handleComponentChange = (event: IComponentChangeEvent) => {
      if (event.entityId === entityId && event.componentId === componentId) {
        updateData();
      }
    };

    componentRegistry.addEventListener(handleComponentChange);

    return () => {
      componentRegistry.removeEventListener(handleComponentChange);
    };
  }, [entityId, componentId]);

  return data;
}

// Hook to manage component addition/removal and data updates
export function useComponentManager(entityId: number | null, componentId: string) {
  const hasComponent = useHasComponent(entityId, componentId);
  const data = useComponentData(entityId, componentId);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<IValidationResult | null>(null);

  const addComponent = useCallback(
    async (initialData?: any): Promise<IValidationResult> => {
      if (entityId === null) {
        const errorResult = {
          valid: false,
          errors: ['No entity selected'],
          warnings: [],
        };
        setLastResult(errorResult);
        return errorResult;
      }

      setIsLoading(true);
      try {
        const result = await dynamicComponentManager.addComponent(
          entityId,
          componentId,
          initialData,
        );
        setLastResult(result);
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [entityId, componentId],
  );

  const removeComponent = useCallback(async (): Promise<IValidationResult> => {
    if (entityId === null) {
      const errorResult = {
        valid: false,
        errors: ['No entity selected'],
        warnings: [],
      };
      setLastResult(errorResult);
      return errorResult;
    }

    setIsLoading(true);
    try {
      const result = await dynamicComponentManager.removeComponent(entityId, componentId);
      setLastResult(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [entityId, componentId]);

  const updateData = useCallback(
    (newData: any): IValidationResult => {
      if (entityId === null) {
        const errorResult = {
          valid: false,
          errors: ['No entity selected'],
          warnings: [],
        };
        setLastResult(errorResult);
        return errorResult;
      }

      const result = dynamicComponentManager.setComponentData(entityId, componentId, newData);
      setLastResult(result);
      return result;
    },
    [entityId, componentId],
  );

  const validateAddition = useCallback((): IValidationResult => {
    if (entityId === null) {
      return {
        valid: false,
        errors: ['No entity selected'],
        warnings: [],
      };
    }

    return dynamicComponentManager.validateComponentAddition(entityId, componentId);
  }, [entityId, componentId]);

  return {
    hasComponent,
    data,
    isLoading,
    lastResult,
    addComponent,
    removeComponent,
    updateData,
    validateAddition,
  };
}

// Hook to get all components of an entity
export function useEntityComponents(entityId: number | null): string[] {
  const [components, setComponents] = useState<string[]>([]);

  useEffect(() => {
    if (entityId === null) {
      setComponents([]);
      return;
    }

    const updateComponents = () => {
      const entityComponents = dynamicComponentManager.getEntityComponents(entityId);
      setComponents(entityComponents);
    };

    // Initial load
    updateComponents();

    // Listen for any component changes on this entity
    const handleComponentChange = (event: IComponentChangeEvent) => {
      if (event.entityId === entityId) {
        updateComponents();
      }
    };

    componentRegistry.addEventListener(handleComponentChange);

    return () => {
      componentRegistry.removeEventListener(handleComponentChange);
    };
  }, [entityId]);

  return components;
}

// Hook to get available components that can be added to an entity
export function useAvailableComponents(entityId: number | null) {
  const entityComponents = useEntityComponents(entityId);
  const [availableComponents, setAvailableComponents] = useState<
    Array<{ id: string; name: string; category: string; description?: string }>
  >([]);

  useEffect(() => {
    const allComponents = componentRegistry.getAllComponents();
    const available = allComponents
      .filter((component) => !entityComponents.includes(component.id))
      .filter((component) => !component.required) // Don't show required components
      .map((component) => ({
        id: component.id,
        name: component.name,
        category: component.category,
        description: component.metadata?.description,
      }));

    setAvailableComponents(available);
  }, [entityComponents]);

  return availableComponents;
}
