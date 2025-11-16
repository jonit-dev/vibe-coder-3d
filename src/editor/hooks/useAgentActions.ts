/**
 * Hook to handle agent actions via custom events
 * Listens for agent tool calls and executes corresponding editor actions
 */

import { useComponentRegistry } from '@core/hooks/useComponentRegistry';
import { componentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { EntityManager } from '@core/lib/ecs/EntityManager';
import { KnownComponentTypes } from '@core/lib/ecs/IComponent';
import { Logger } from '@core/lib/logger';
import { getComponentDefaults } from '@core/lib/serialization/defaults/ComponentDefaults';
import { PrefabManager } from '@core/prefabs/PrefabManager';
import { AgentEntityService } from '@editor/services/agent/AgentEntityService';
import { AgentEventResponse } from '@editor/services/agent/AgentEventResponse';
import { AgentMaterialService } from '@editor/services/agent/AgentMaterialService';
import { AgentPrefabService } from '@editor/services/agent/AgentPrefabService';
import { AgentTransformService } from '@editor/services/agent/AgentTransformService';
import { useEditorStore } from '@editor/store/editorStore';
import { usePrefabsStore } from '@editor/store/prefabsStore';
import { useEffect, useMemo } from 'react';
import { useEntityCreation } from './useEntityCreation';

const logger = Logger.create('useAgentActions');

export const useAgentActions = () => {
  const {
    createCube,
    createSphere,
    createCylinder,
    createCone,
    createPlane,
    createDirectionalLight,
    createGeometryAssetEntity,
  } = useEntityCreation();
  const { updateComponent } = useComponentRegistry();
  const prefabManager = PrefabManager.getInstance();
  const entityManager = EntityManager.getInstance();
  const { _refreshPrefabs } = usePrefabsStore();

  // Initialize services with dependencies
  const services = useMemo(
    () => ({
      entity: new AgentEntityService({
        createCube,
        createSphere,
        createCylinder,
        createCone,
        createPlane,
        createDirectionalLight,
      }),
      material: new AgentMaterialService(),
      transform: new AgentTransformService(),
      prefab: new AgentPrefabService(
        prefabManager,
        entityManager,
        componentRegistry,
        _refreshPrefabs,
      ),
    }),
    [
      createCube,
      createSphere,
      createCylinder,
      createCone,
      createPlane,
      createDirectionalLight,
      updateComponent,
      _refreshPrefabs,
    ],
  );

  useEffect(() => {
    const handleAddEntity = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { type, position, rotation, scale, name, material, _requestId } = customEvent.detail;

      logger.info('Agent requested entity add', { type, name });

      try {
        const entity = services.entity.createPrimitive(type, name);

        if (!entity) {
          AgentEventResponse.dispatchError(
            'agent:add-entity-response',
            _requestId,
            `Unknown entity type: ${type}`,
          );
          return;
        }

        // Apply transform if provided
        if (position || rotation || scale) {
          services.transform.applyTransform(entity.id, position, rotation, scale);
        }

        // Apply material if provided
        if (material) {
          const meshUpdate = services.material.buildMeshUpdate(material);
          if (Object.keys(meshUpdate).length > 0) {
            updateComponent(entity.id, KnownComponentTypes.MESH_RENDERER, meshUpdate);
            logger.info('Material applied to entity', { entityId: entity.id });
          }
        }

        logger.info('Entity created by agent', { type, entityId: entity.id });
        AgentEventResponse.dispatchSuccess('agent:add-entity-response', {
          _requestId,
          entityId: entity.id,
        });
      } catch (error) {
        logger.error('Failed to create entity from agent request', { error, type });
        AgentEventResponse.dispatchError('agent:add-entity-response', _requestId, error);
      }
    };

    const handleSaveGeometry = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { filepath, content } = customEvent.detail;

      logger.info('Agent requested geometry save', { filepath });

      try {
        // Save geometry file using fetch to the scene API
        const response = await fetch('/api/save-geometry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filepath, content }),
        });

        if (!response.ok) {
          throw new Error(`Failed to save geometry: ${response.statusText}`);
        }

        logger.info('Geometry saved successfully', { filepath });
      } catch (error) {
        logger.error('Failed to save geometry', { error, filepath });
      }
    };

    const handleCreateGeometryEntity = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { path, name } = customEvent.detail;

      logger.info('Agent requested geometry entity creation', { path, name });

      try {
        const entity = createGeometryAssetEntity(path, { name });
        logger.info('Geometry entity created', { path, entityId: entity.id });
      } catch (error) {
        logger.error('Failed to create geometry entity', { error, path });
      }
    };

    const handleCreatePrefabFromPrimitives = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { name, primitives } = customEvent.detail;

      logger.info('Agent requested prefab creation from primitives', { name, primitives });

      try {
        const container = entityManager.createEntity(name);
        const containerId = container.id;

        // Create each primitive and parent to container
        for (const spec of primitives) {
          const childName = spec.name || spec.type;
          const childEntity = services.entity.createPrimitive(spec.type, childName);

          if (!childEntity) continue;

          // Parent to container first (transforms become relative)
          entityManager.setParent(childEntity.id, containerId);

          // Set transform (relative to container)
          if (spec.position || spec.rotation || spec.scale) {
            services.transform.applyTransform(
              childEntity.id,
              spec.position,
              spec.rotation,
              spec.scale,
            );
          }

          // Apply material if provided
          if (spec.material) {
            const meshUpdate = services.material.buildMeshUpdate(spec.material);
            if (Object.keys(meshUpdate).length > 0) {
              updateComponent(childEntity.id, KnownComponentTypes.MESH_RENDERER, meshUpdate);
              logger.info('Material applied to primitive', { entityId: childEntity.id });
            }
          }
        }

        // Create prefab from container
        const prefabId = name.toLowerCase().replace(/\s+/g, '-');
        prefabManager.createFromEntity(containerId, name, prefabId);
        _refreshPrefabs();

        // Clean up: delete container and children
        const containerEntity = entityManager.getEntity(containerId);
        const children = [...(containerEntity?.children || [])];

        for (const childId of children) {
          entityManager.deleteEntity(childId);
        }
        entityManager.deleteEntity(containerId);

        logger.info('Prefab created from primitives', {
          prefabId,
          name,
          primitiveCount: primitives.length,
        });
      } catch (error) {
        logger.error('Failed to create prefab from primitives', { error, name });
      }
    };

    const handleCreateAndInstantiatePrefab = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { name, primitives, instance_positions } = customEvent.detail;

      logger.info('Agent requested prefab creation and instantiation from primitives', {
        name,
        primitives,
        instanceCount: instance_positions?.length || 1
      });

      try {
        const container = entityManager.createEntity(name);
        const containerId = container.id;

        // Create each primitive and parent to container
        for (const spec of primitives) {
          const childName = spec.name || spec.type;
          const childEntity = services.entity.createPrimitive(spec.type, childName);

          if (!childEntity) continue;

          // Parent to container first (transforms become relative)
          entityManager.setParent(childEntity.id, containerId);

          // Set transform (relative to container)
          if (spec.position || spec.rotation || spec.scale) {
            services.transform.applyTransform(
              childEntity.id,
              spec.position,
              spec.rotation,
              spec.scale,
            );
          }

          // Apply material if provided
          if (spec.material) {
            const meshUpdate = services.material.buildMeshUpdate(spec.material);
            if (Object.keys(meshUpdate).length > 0) {
              updateComponent(childEntity.id, KnownComponentTypes.MESH_RENDERER, meshUpdate);
              logger.info('Material applied to primitive', { entityId: childEntity.id });
            }
          }
        }

        // Create prefab from container
        const prefabId = name.toLowerCase().replace(/\s+/g, '-');
        prefabManager.createFromEntity(containerId, name, prefabId);
        _refreshPrefabs();

        // Keep the original container as the first instance (at origin/creation position)
        // Don't delete it - this is the key optimization!

        // Create additional instances at specified positions
        if (instance_positions && instance_positions.length > 0) {
          for (const position of instance_positions) {
            const posTuple = Array.isArray(position)
              ? position
              : [position.x, position.y, position.z];
            services.prefab.instantiate(prefabId, posTuple as [number, number, number]);
          }
        }

        logger.info('Prefab created and instantiated from primitives', {
          prefabId,
          name,
          primitiveCount: primitives.length,
          instanceCount: (instance_positions?.length || 0) + 1, // +1 for the original container
        });
      } catch (error) {
        logger.error('Failed to create and instantiate prefab from primitives', { error, name });
      }
    };

    const handleCreatePrefab = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { name } = customEvent.detail;

      logger.info('Agent requested prefab creation from selection', { name });

      const { selectedIds } = useEditorStore.getState();
      services.prefab.createFromSelection({ name, selectedIds });
    };

    const handleInstantiatePrefab = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { prefabId, position } = customEvent.detail;

      logger.info('Agent requested prefab instantiation', { prefabId, position });
      services.prefab.instantiate(prefabId, position);
    };

    const handleListPrefabs = () => {
      logger.info('Agent requested prefab list');

      const prefabList = services.prefab.list();
      AgentEventResponse.dispatchResult('agent:prefab-list-result', { prefabs: prefabList });
    };

    const handleCreateVariant = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { baseId, name } = customEvent.detail;

      logger.info('Agent requested prefab variant creation', { baseId, name });

      const { registry } = usePrefabsStore.getState();
      services.prefab.createVariant(baseId, name, registry);
    };

    const handleUnpackPrefab = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { entityId } = customEvent.detail;

      logger.info('Agent requested prefab unpack', { entityId });
      services.prefab.unpack(entityId);
    };

    const handleSetPosition = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { entityId, position } = customEvent.detail;

      logger.info('Agent requested position change', { entityId, position });

      try {
        services.transform.setPosition(entityId, position);
      } catch (error) {
        logger.error('Failed to set position', { error, entityId });
      }
    };

    const handleSetRotation = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { entityId, rotation } = customEvent.detail;

      logger.info('Agent requested rotation change', { entityId, rotation });

      try {
        services.transform.setRotation(entityId, rotation);
      } catch (error) {
        logger.error('Failed to set rotation', { error, entityId });
      }
    };

    const handleSetScale = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { entityId, scale } = customEvent.detail;

      logger.info('Agent requested scale change', { entityId, scale });

      try {
        services.transform.setScale(entityId, scale);
      } catch (error) {
        logger.error('Failed to set scale', { error, entityId });
      }
    };

    const handleRenameEntity = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { entityId, name } = customEvent.detail;

      logger.info('Agent requested entity rename', { entityId, name });

      try {
        const entityManager = EntityManager.getInstance();
        const entity = entityManager.getEntity(entityId);
        if (entity) {
          entity.name = name;
          logger.info('Entity renamed', { entityId, name });
        } else {
          logger.warn('Entity not found for rename', { entityId });
        }
      } catch (error) {
        logger.error('Failed to rename entity', { error, entityId });
      }
    };

    const handleDeleteEntity = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { entityId } = customEvent.detail;

      logger.info('Agent requested entity deletion', { entityId });

      try {
        const entityManager = EntityManager.getInstance();
        entityManager.deleteEntity(entityId);
        logger.info('Entity deleted', { entityId });
      } catch (error) {
        logger.error('Failed to delete entity', { error, entityId });
      }
    };

    const handleAddComponent = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { entityId, componentType } = customEvent.detail;

      logger.info('Agent requested add component', { entityId, componentType });

      try {
        // Get default values for the component type
        const defaults = getComponentDefaults(componentType);
        const componentData = defaults ? { ...defaults } : {};

        componentRegistry.addComponent(entityId, componentType, componentData);
        logger.info('Component added', { entityId, componentType });
      } catch (error) {
        logger.error('Failed to add component', { error, entityId, componentType });
      }
    };

    const handleRemoveComponent = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { entityId, componentType } = customEvent.detail;

      logger.info('Agent requested remove component', { entityId, componentType });

      try {
        componentRegistry.removeComponent(entityId, componentType);
        logger.info('Component removed', { entityId, componentType });
      } catch (error) {
        logger.error('Failed to remove component', { error, entityId, componentType });
      }
    };

    const handleSetComponentProperty = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { entityId, componentType, propertyName, propertyValue } = customEvent.detail;

      logger.info('Agent requested set component property', {
        entityId,
        componentType,
        propertyName,
        propertyValue,
      });

      try {
        updateComponent(entityId, componentType, {
          [propertyName]: propertyValue,
        });
        logger.info('Component property updated', {
          entityId,
          componentType,
          propertyName,
          propertyValue,
        });
      } catch (error) {
        logger.error('Failed to set component property', {
          error,
          entityId,
          componentType,
          propertyName,
        });
      }
    };

    const handleGetComponent = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { entityId, componentType } = customEvent.detail;

      logger.info('Agent requested get component', { entityId, componentType });

      try {
        const data = componentRegistry.getComponentData(entityId, componentType);
        logger.info('Component data retrieved', { entityId, componentType, data });
      } catch (error) {
        logger.error('Failed to get component', { error, entityId, componentType });
      }
    };

    const handleDuplicateEntity = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { entityId } = customEvent.detail;

      logger.info('Agent requested entity duplication', { entityId });

      try {
        const entityManager = EntityManager.getInstance();
        const entity = entityManager.getEntity(entityId);
        if (!entity) {
          logger.warn('Entity not found for duplication', { entityId });
          return;
        }

        // Create new entity with same name + " (Copy)"
        const newEntity = entityManager.createEntity(`${entity.name} (Copy)`);

        // Copy all components from original entity
        const components = componentRegistry.getEntityComponents(entityId);
        for (const [componentType, componentData] of Object.entries(components)) {
          componentRegistry.addComponent(newEntity.id, componentType, componentData);
        }

        // Copy parent relationship
        if (entity.parentId !== undefined) {
          entityManager.setParent(newEntity.id, entity.parentId);
        }

        logger.info('Entity duplicated', { originalId: entityId, newId: newEntity.id });
      } catch (error) {
        logger.error('Failed to duplicate entity', { error, entityId });
      }
    };

    const handleSetParent = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { entityId, parentId } = customEvent.detail;

      logger.info('Agent requested set parent', { entityId, parentId });

      try {
        const entityManager = EntityManager.getInstance();
        entityManager.setParent(entityId, parentId);
        logger.info('Entity parent updated', { entityId, parentId });
      } catch (error) {
        logger.error('Failed to set parent', { error, entityId, parentId });
      }
    };

    const handleSetEnabled = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { entityId, enabled } = customEvent.detail;

      logger.info('Agent requested set enabled', { entityId, enabled });

      try {
        // Check if entity has an Enabled component, if not add it
        if (!componentRegistry.hasComponent(entityId, 'Enabled')) {
          componentRegistry.addComponent(entityId, 'Enabled', { enabled });
        } else {
          updateComponent(entityId, 'Enabled', { enabled });
        }
        logger.info('Entity enabled state updated', { entityId, enabled });
      } catch (error) {
        logger.error('Failed to set enabled state', { error, entityId, enabled });
      }
    };

    window.addEventListener('agent:add-entity', handleAddEntity);
    window.addEventListener('agent:save-geometry', handleSaveGeometry);
    window.addEventListener('agent:create-geometry-entity', handleCreateGeometryEntity);
    window.addEventListener(
      'agent:create-prefab-from-primitives',
      handleCreatePrefabFromPrimitives,
    );
    window.addEventListener('agent:create-and-instantiate-prefab', handleCreateAndInstantiatePrefab);
    window.addEventListener('agent:create-prefab', handleCreatePrefab);
    window.addEventListener('agent:instantiate-prefab', handleInstantiatePrefab);
    window.addEventListener('agent:list-prefabs', handleListPrefabs);
    window.addEventListener('agent:create-variant', handleCreateVariant);
    window.addEventListener('agent:unpack-prefab', handleUnpackPrefab);
    window.addEventListener('agent:set-position', handleSetPosition);
    window.addEventListener('agent:set-rotation', handleSetRotation);
    window.addEventListener('agent:set-scale', handleSetScale);
    window.addEventListener('agent:rename-entity', handleRenameEntity);
    window.addEventListener('agent:delete-entity', handleDeleteEntity);
    window.addEventListener('agent:add-component', handleAddComponent);
    window.addEventListener('agent:remove-component', handleRemoveComponent);
    window.addEventListener('agent:set-component-property', handleSetComponentProperty);
    window.addEventListener('agent:get-component', handleGetComponent);
    window.addEventListener('agent:duplicate-entity', handleDuplicateEntity);
    window.addEventListener('agent:set-parent', handleSetParent);
    window.addEventListener('agent:set-enabled', handleSetEnabled);

    return () => {
      window.removeEventListener('agent:add-entity', handleAddEntity);
      window.removeEventListener('agent:save-geometry', handleSaveGeometry);
      window.removeEventListener('agent:create-geometry-entity', handleCreateGeometryEntity);
      window.removeEventListener(
        'agent:create-prefab-from-primitives',
        handleCreatePrefabFromPrimitives,
      );
      window.removeEventListener('agent:create-and-instantiate-prefab', handleCreateAndInstantiatePrefab);
      window.removeEventListener('agent:create-prefab', handleCreatePrefab);
      window.removeEventListener('agent:instantiate-prefab', handleInstantiatePrefab);
      window.removeEventListener('agent:list-prefabs', handleListPrefabs);
      window.removeEventListener('agent:create-variant', handleCreateVariant);
      window.removeEventListener('agent:unpack-prefab', handleUnpackPrefab);
      window.removeEventListener('agent:set-position', handleSetPosition);
      window.removeEventListener('agent:set-rotation', handleSetRotation);
      window.removeEventListener('agent:set-scale', handleSetScale);
      window.removeEventListener('agent:rename-entity', handleRenameEntity);
      window.removeEventListener('agent:delete-entity', handleDeleteEntity);
      window.removeEventListener('agent:add-component', handleAddComponent);
      window.removeEventListener('agent:remove-component', handleRemoveComponent);
      window.removeEventListener('agent:set-component-property', handleSetComponentProperty);
      window.removeEventListener('agent:get-component', handleGetComponent);
      window.removeEventListener('agent:duplicate-entity', handleDuplicateEntity);
      window.removeEventListener('agent:set-parent', handleSetParent);
      window.removeEventListener('agent:set-enabled', handleSetEnabled);
    };
  }, [
    createCube,
    createSphere,
    createCylinder,
    createCone,
    createPlane,
    createDirectionalLight,
    createGeometryAssetEntity,
    updateComponent,
  ]);
};
