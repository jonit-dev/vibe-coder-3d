/**
 * Hook to handle agent actions via custom events
 * Listens for agent tool calls and executes corresponding editor actions
 */

import { useEffect } from 'react';
import { Logger } from '@core/lib/logger';
import { useComponentRegistry } from '@core/hooks/useComponentRegistry';
import { KnownComponentTypes } from '@core/lib/ecs/IComponent';
import { MeshRendererData } from '@core/lib/ecs/components/definitions/MeshRendererComponent';
import { useEntityCreation } from './useEntityCreation';
import { PrefabManager } from '@core/prefabs/PrefabManager';
import { usePrefabsStore } from '@editor/store/prefabsStore';
import { useEditorStore } from '@editor/store/editorStore';
import { EntityManager } from '@core/lib/ecs/EntityManager';
import { componentRegistry } from '@core/lib/ecs/ComponentRegistry';

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
  const { _refreshPrefabs } = usePrefabsStore();

  useEffect(() => {
    const handleAddEntity = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { type, position, name, _requestId } = customEvent.detail;

      logger.info('Agent requested entity add', { type, position, name });

      try {
        let entity;
        switch (type) {
          case 'Cube':
            entity = createCube(name);
            break;
          case 'Sphere':
            entity = createSphere(name);
            break;
          case 'Cylinder':
            entity = createCylinder(name);
            break;
          case 'Cone':
            entity = createCone(name);
            break;
          case 'Plane':
            entity = createPlane(name);
            break;
          case 'Light':
            entity = createDirectionalLight(name);
            break;
          default:
            logger.warn('Unknown entity type requested by agent', { type });
            // Dispatch error response
            window.dispatchEvent(
              new CustomEvent('agent:add-entity-response', {
                detail: { _requestId, success: false, error: `Unknown entity type: ${type}` },
              }),
            );
            return;
        }

        // Set position if provided
        if (entity && position) {
          updateComponent(entity.id, KnownComponentTypes.TRANSFORM, {
            position: [position.x, position.y, position.z],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          });
        }

        logger.info('Entity created by agent', { type, entityId: entity?.id, position });

        // Dispatch success response with entity ID
        if (entity) {
          window.dispatchEvent(
            new CustomEvent('agent:add-entity-response', {
              detail: { _requestId, success: true, entityId: entity.id },
            }),
          );
        }
      } catch (error) {
        logger.error('Failed to create entity from agent request', { error, type });
        // Dispatch error response
        window.dispatchEvent(
          new CustomEvent('agent:add-entity-response', {
            detail: {
              _requestId,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          }),
        );
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
        const entityManager = EntityManager.getInstance();

        // Create container entity for all primitives
        const container = entityManager.createEntity(name);
        const containerId = container.id;

        // Create each primitive and parent to container
        for (const spec of primitives) {
          let childEntity;
          const childName = spec.name || spec.type;

          // Create primitive based on type
          switch (spec.type) {
            case 'Cube':
              childEntity = createCube(childName);
              break;
            case 'Sphere':
              childEntity = createSphere(childName);
              break;
            case 'Cylinder':
              childEntity = createCylinder(childName);
              break;
            case 'Cone':
              childEntity = createCone(childName);
              break;
            case 'Plane':
              childEntity = createPlane(childName);
              break;
            case 'Light':
              childEntity = createDirectionalLight(childName);
              break;
            default:
              logger.warn('Unknown primitive type in prefab spec', { type: spec.type });
              continue;
          }

          if (!childEntity) continue;

          // Parent to container FIRST (so transforms become relative to container)
          entityManager.setParent(childEntity.id, containerId);

          // Then set transform (now relative to container at 0,0,0)
          // This ensures the prefab has correct relative transforms
          if (spec.position || spec.rotation || spec.scale) {
            updateComponent(childEntity.id, KnownComponentTypes.TRANSFORM, {
              position: spec.position
                ? [spec.position.x, spec.position.y, spec.position.z]
                : [0, 0, 0],
              rotation: spec.rotation
                ? [spec.rotation.x, spec.rotation.y, spec.rotation.z]
                : [0, 0, 0],
              scale: spec.scale ? [spec.scale.x, spec.scale.y, spec.scale.z] : [1, 1, 1],
            });
          }

          // Apply material if provided
          if (spec.material) {
            // MeshRenderer expects a nested 'material' object for overrides
            const meshUpdate: Partial<MeshRendererData> = {};

            if (spec.material.materialId) {
              // If materialId is provided, set it at the top level
              meshUpdate.materialId = spec.material.materialId;
            }

            if (spec.material.color) {
              // Color goes inside the nested material object
              meshUpdate.material = {
                color: spec.material.color,
                shader: 'standard' as const,
                materialType: 'solid' as const,
                metalness: 0,
                roughness: 0.7,
                emissive: '#000000',
                emissiveIntensity: 0,
                normalScale: 1,
                occlusionStrength: 1,
                textureOffsetX: 0,
                textureOffsetY: 0,
                textureRepeatX: 1,
                textureRepeatY: 1,
              };
            }

            if (Object.keys(meshUpdate).length > 0) {
              updateComponent(childEntity.id, KnownComponentTypes.MESH_RENDERER, meshUpdate);
              logger.info('Applied material to primitive', {
                entityId: childEntity.id,
                material: meshUpdate,
              });
            }
          }
        }

        // Create prefab from container
        const prefabId = name.toLowerCase().replace(/\s+/g, '-');
        prefabManager.createFromEntity(containerId, name, prefabId);
        _refreshPrefabs();

        // Clean up: unparent children and delete container
        const containerEntity = entityManager.getEntity(containerId);
        const children = [...(containerEntity?.children || [])];
        for (const childId of children) {
          entityManager.setParent(childId, undefined);
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

    const handleCreatePrefab = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { name } = customEvent.detail;

      logger.info('Agent requested prefab creation from selection', { name });

      try {
        const { selectedIds } = useEditorStore.getState();

        if (selectedIds.length === 0) {
          logger.warn('No entities selected for prefab creation', { name });
          return;
        }

        const entityManager = EntityManager.getInstance();
        let entityId: number;

        if (selectedIds.length === 1) {
          entityId = selectedIds[0];
        } else {
          // Create temporary container for multiple entities
          const container = entityManager.createEntity(name);
          entityId = container.id;

          for (const id of selectedIds) {
            entityManager.setParent(id, entityId);
          }
        }

        const prefabId = name.toLowerCase().replace(/\s+/g, '-');
        prefabManager.createFromEntity(entityId, name, prefabId);
        _refreshPrefabs();

        // Clean up temporary container if created
        if (selectedIds.length > 1) {
          const containerEntity = entityManager.getEntity(entityId);
          const children = [...(containerEntity?.children || [])];
          for (const childId of children) {
            entityManager.setParent(childId, undefined);
          }
          entityManager.deleteEntity(entityId);
        }

        logger.info('Prefab created from selection', { prefabId, name });
      } catch (error) {
        logger.error('Failed to create prefab', { error, name });
      }
    };

    const handleInstantiatePrefab = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { prefabId, position } = customEvent.detail;

      logger.info('Agent requested prefab instantiation', { prefabId, position });

      try {
        const options: Record<string, unknown> = {};
        if (position) {
          options.position = position;
        }

        const entityId = prefabManager.instantiate(prefabId, options);

        if (entityId === -1) {
          logger.error('Failed to instantiate prefab', { prefabId });
          return;
        }

        logger.info('Prefab instantiated', { prefabId, entityId, position });
      } catch (error) {
        logger.error('Failed to instantiate prefab', { error, prefabId });
      }
    };

    const handleListPrefabs = () => {
      logger.info('Agent requested prefab list');

      try {
        const prefabs = prefabManager.getAll();
        const prefabList = prefabs.map((p) => ({
          id: p.id,
          name: p.name,
          tags: p.tags || [],
        }));

        logger.info('Prefab list retrieved', {
          count: prefabs.length,
          prefabs: prefabList,
        });

        // Dispatch result back via custom event for AI to receive
        window.dispatchEvent(
          new CustomEvent('agent:prefab-list-result', {
            detail: { prefabs: prefabList },
          }),
        );
      } catch (error) {
        logger.error('Failed to list prefabs', { error });
      }
    };

    const handleCreateVariant = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { baseId, name } = customEvent.detail;

      logger.info('Agent requested prefab variant creation', { baseId, name });

      try {
        const { registry } = usePrefabsStore.getState();
        const basePrefab = registry.get(baseId);

        if (!basePrefab) {
          logger.error('Base prefab not found', { baseId });
          return;
        }

        const variantId = `${name.toLowerCase().replace(/\s+/g, '-')}-variant`;

        registry.upsertVariant({
          id: variantId,
          baseId,
          name,
          version: 1,
          patch: {},
        });

        _refreshPrefabs();
        logger.info('Variant created', { variantId, baseId, name });
      } catch (error) {
        logger.error('Failed to create prefab variant', { error, baseId, name });
      }
    };

    const handleUnpackPrefab = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { entityId } = customEvent.detail;

      logger.info('Agent requested prefab unpack', { entityId });

      try {
        if (componentRegistry.hasComponent(entityId, 'PrefabInstance')) {
          componentRegistry.removeComponent(entityId, 'PrefabInstance');
          logger.info('Prefab instance unpacked', { entityId });
        } else {
          logger.warn('Entity is not a prefab instance', { entityId });
        }
      } catch (error) {
        logger.error('Failed to unpack prefab', { error, entityId });
      }
    };

    const handleSetPosition = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { entityId, position } = customEvent.detail;

      logger.info('Agent requested position change', { entityId, position });

      try {
        updateComponent(entityId, KnownComponentTypes.TRANSFORM, {
          position: [position.x, position.y, position.z],
        });
        logger.info('Entity position updated', { entityId, position });
      } catch (error) {
        logger.error('Failed to set position', { error, entityId });
      }
    };

    const handleSetRotation = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { entityId, rotation } = customEvent.detail;

      logger.info('Agent requested rotation change', { entityId, rotation });

      try {
        updateComponent(entityId, KnownComponentTypes.TRANSFORM, {
          rotation: [rotation.x, rotation.y, rotation.z],
        });
        logger.info('Entity rotation updated', { entityId, rotation });
      } catch (error) {
        logger.error('Failed to set rotation', { error, entityId });
      }
    };

    const handleSetScale = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { entityId, scale } = customEvent.detail;

      logger.info('Agent requested scale change', { entityId, scale });

      try {
        updateComponent(entityId, KnownComponentTypes.TRANSFORM, {
          scale: [scale.x, scale.y, scale.z],
        });
        logger.info('Entity scale updated', { entityId, scale });
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
        componentRegistry.addComponent(entityId, componentType, {});
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

    window.addEventListener('agent:add-entity', handleAddEntity);
    window.addEventListener('agent:save-geometry', handleSaveGeometry);
    window.addEventListener('agent:create-geometry-entity', handleCreateGeometryEntity);
    window.addEventListener(
      'agent:create-prefab-from-primitives',
      handleCreatePrefabFromPrimitives,
    );
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

    return () => {
      window.removeEventListener('agent:add-entity', handleAddEntity);
      window.removeEventListener('agent:save-geometry', handleSaveGeometry);
      window.removeEventListener('agent:create-geometry-entity', handleCreateGeometryEntity);
      window.removeEventListener(
        'agent:create-prefab-from-primitives',
        handleCreatePrefabFromPrimitives,
      );
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
