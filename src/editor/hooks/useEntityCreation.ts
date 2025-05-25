import { useCallback } from 'react';

import { KnownComponentTypes } from '@/editor/lib/ecs/IComponent';
import { ITransformData } from '@/editor/lib/ecs/components/TransformComponent';
import { useEditorStore } from '@/editor/store/editorStore';

import { useComponentManager } from './useComponentManager';
import { useEntityData } from './useEntityData';
import { useEntityManager } from './useEntityManager';

export const useEntityCreation = () => {
  const entityManager = useEntityManager();
  const componentManager = useComponentManager();
  const setSelectedId = useEditorStore((state) => state.setSelectedId);
  const { getComponentData } = useEntityData();

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

  const addMeshRenderer = useCallback(
    (entityId: number, meshId: string) => {
      // Get color from old material component if it exists
      const materialData = getComponentData(entityId, 'material') as any;
      let color = '#3399ff'; // Default blue like old ECS system

      if (materialData?.color) {
        if (Array.isArray(materialData.color)) {
          // Convert RGB array to hex
          const [r, g, b] = materialData.color;
          color = `#${Math.round(r * 255)
            .toString(16)
            .padStart(2, '0')}${Math.round(g * 255)
            .toString(16)
            .padStart(2, '0')}${Math.round(b * 255)
            .toString(16)
            .padStart(2, '0')}`;
        } else if (typeof materialData.color === 'string') {
          color = materialData.color;
        }
      }

      // Add MeshRenderer component with proper material
      componentManager.addComponent(entityId, KnownComponentTypes.MESH_RENDERER, {
        meshId,
        materialId: 'default',
        enabled: true,
        material: {
          color,
          metalness: 0.0,
          roughness: 0.5,
          emissive: '#000000',
          emissiveIntensity: 0.0,
        },
      });
    },
    [componentManager, getComponentData],
  );

  const createCube = useCallback(
    (name = 'Cube', parentId?: number) => {
      const entity = createEntity(name, parentId);
      addMeshRenderer(entity.id, 'cube');
      return entity;
    },
    [createEntity, addMeshRenderer],
  );

  const createSphere = useCallback(
    (name = 'Sphere', parentId?: number) => {
      const entity = createEntity(name, parentId);
      addMeshRenderer(entity.id, 'sphere');
      return entity;
    },
    [createEntity, addMeshRenderer],
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
