import { useCallback } from 'react';

import { KnownComponentTypes } from '@/editor/lib/ecs/IComponent';
import { ITransformData } from '@/editor/lib/ecs/components/TransformComponent';
import { useEditorStore } from '@/editor/store/editorStore';

import { useComponentManager } from './useComponentManager';
import { useEntityManager } from './useEntityManager';

export const useEntityCreation = () => {
  const entityManager = useEntityManager();
  const componentManager = useComponentManager();
  const setSelectedId = useEditorStore((state) => state.setSelectedId);

  const createEntity = useCallback(
    (name: string, parentId?: number) => {
      // Create entity through ECS system
      const entity = entityManager.createEntity(name, parentId);

      // Add default Transform component
      const defaultTransform: ITransformData = {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      };

      componentManager.addComponent(entity.id, KnownComponentTypes.TRANSFORM, defaultTransform);

      // Select the newly created entity
      setSelectedId(entity.id);

      return entity;
    },
    [entityManager, componentManager, setSelectedId],
  );

  const createCube = useCallback(
    (name = 'Cube', parentId?: number) => {
      const entity = createEntity(name, parentId);

      // Add MeshRenderer component for cube
      componentManager.addComponent(entity.id, KnownComponentTypes.MESH_RENDERER, {
        meshId: 'cube',
        materialId: 'default',
      });

      return entity;
    },
    [createEntity, componentManager],
  );

  const createSphere = useCallback(
    (name = 'Sphere', parentId?: number) => {
      const entity = createEntity(name, parentId);

      // Add MeshRenderer component for sphere
      componentManager.addComponent(entity.id, KnownComponentTypes.MESH_RENDERER, {
        meshId: 'sphere',
        materialId: 'default',
      });

      return entity;
    },
    [createEntity, componentManager],
  );

  const deleteEntity = useCallback(
    (entityId: number) => {
      // Remove all components first
      componentManager.removeComponentsForEntity(entityId);

      // Delete entity
      entityManager.deleteEntity(entityId);

      // Clear selection if this entity was selected
      const selectedId = useEditorStore.getState().selectedId;
      if (selectedId === entityId) {
        setSelectedId(null);
      }
    },
    [entityManager, componentManager, setSelectedId],
  );

  return {
    createEntity,
    createCube,
    createSphere,
    deleteEntity,
  };
};
