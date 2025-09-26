import React from 'react';
import { useEffect } from 'react';
import { useEntityManager } from '@/editor/hooks/useEntityManager';
import { useComponentManager } from '@/editor/hooks/useComponentManager';
import { KnownComponentTypes } from '@core';
import type {
  ComponentDataMap,
  SceneEntityData,
  SceneMetadata,
} from '@core';
import { validateSceneEntity } from '@core';

/**
 * Type-safe scene data interface
 */
interface ITypedSceneEntity {
  id: string | number; // Support both string and numeric IDs
  name: string;
  parentId?: string | number | null; // Support both formats for parent references
  components: {
    [K in KnownComponentTypes]?: ComponentDataMap[K];
  } & {
    [key: string]: unknown; // Allow additional components
  };
}

/**
 * Type-safe scene definition
 */
const entities: ITypedSceneEntity[] = [];

/**
 * Scene metadata
 */
export const metadata: SceneMetadata = {
  "name": "test123",
  "version": 1,
  "timestamp": "2025-09-26T18:13:08.642Z"
};

/**
 * test123
 * Generated: 2025-09-26T18:13:08.642Z
 * Version: 1
 */
export const Test123: React.FC = () => {
  const entityManager = useEntityManager();
  const componentManager = useComponentManager();

  useEffect(() => {
    // Validate scene data at runtime
    const validatedSceneData = entities.map(entity => validateSceneEntity(entity));

    // Clear existing entities
    entityManager.clearEntities();

    // Create entities and components with type safety
    validatedSceneData.forEach((entityData: ITypedSceneEntity) => {
      // Convert parentId to number if it's a string, EntityManager expects numeric IDs
      const parentId = entityData.parentId ?
        (typeof entityData.parentId === 'string' ? parseInt(entityData.parentId, 10) : entityData.parentId) :
        undefined;
      const entity = entityManager.createEntity(entityData.name, parentId);

      // Type-safe component addition
      Object.entries(entityData.components).forEach(([componentType, componentData]) => {
        if (componentData) {
          // Type assertion for known component types
          componentManager.addComponent(entity.id, componentType, componentData);
        }
      });
    });

    console.log(`[TsxScene] Loaded scene '${metadata?.name || 'Unknown'}' with ${validatedSceneData.length} entities`);
  }, [entityManager, componentManager]);

  return null; // Scene components don't render UI
};

export default Test123;
