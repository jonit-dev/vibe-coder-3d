/**
 * Complex prefab creation handler for building prefabs from primitive specs
 */

import { EntityManager } from '@core/lib/ecs/EntityManager';
import { componentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { KnownComponentTypes } from '@core/lib/ecs/IComponent';
import { MeshRendererData } from '@core/lib/ecs/components/definitions/MeshRendererComponent';
import { PrefabManager } from '@core/prefabs/PrefabManager';
import { Logger } from '@core/lib/logger';
import type { IEntity } from '@core/lib/ecs/IEntity';

const logger = Logger.create('AgentActions:PrefabFromPrimitives');

interface IPrimitiveSpec {
  type: string;
  name?: string;
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
  material?: {
    materialId?: string;
    color?: string;
  };
}

interface IEntityCreators {
  createCube: (name?: string) => IEntity;
  createSphere: (name?: string) => IEntity;
  createCylinder: (name?: string) => IEntity;
  createCone: (name?: string) => IEntity;
  createPlane: (name?: string) => IEntity;
  createDirectionalLight: (name?: string) => IEntity;
}

type UpdateComponentFn = <TData>(
  entityId: number,
  componentType: string,
  data: Partial<TData>,
) => boolean;

export const createPrefabFromPrimitivesHandler = (
  entityCreators: IEntityCreators,
  updateComponent: UpdateComponentFn,
  refreshPrefabs: () => void,
) => {
  const createPrimitiveEntity = (spec: IPrimitiveSpec): IEntity | null => {
    const childName = spec.name || spec.type;
    let childEntity: IEntity | undefined;

    switch (spec.type) {
      case 'Cube':
        childEntity = entityCreators.createCube(childName);
        break;
      case 'Sphere':
        childEntity = entityCreators.createSphere(childName);
        break;
      case 'Cylinder':
        childEntity = entityCreators.createCylinder(childName);
        break;
      case 'Cone':
        childEntity = entityCreators.createCone(childName);
        break;
      case 'Plane':
        childEntity = entityCreators.createPlane(childName);
        break;
      case 'Light':
        childEntity = entityCreators.createDirectionalLight(childName);
        break;
      default:
        logger.warn('Unknown primitive type in prefab spec', { type: spec.type });
        return null;
    }

    return childEntity || null;
  };

  const applyTransform = (entityId: number, spec: IPrimitiveSpec) => {
    if (spec.position || spec.rotation || spec.scale) {
      updateComponent(entityId, KnownComponentTypes.TRANSFORM, {
        position: spec.position ? [spec.position.x, spec.position.y, spec.position.z] : [0, 0, 0],
        rotation: spec.rotation ? [spec.rotation.x, spec.rotation.y, spec.rotation.z] : [0, 0, 0],
        scale: spec.scale ? [spec.scale.x, spec.scale.y, spec.scale.z] : [1, 1, 1],
      });
    }
  };

  const applyMaterial = (entityId: number, spec: IPrimitiveSpec) => {
    if (!spec.material) return;

    const meshUpdate: Partial<MeshRendererData> = {};

    if (spec.material.materialId) {
      meshUpdate.materialId = spec.material.materialId;
    }

    if (spec.material.color) {
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
      updateComponent(entityId, KnownComponentTypes.MESH_RENDERER, meshUpdate);
      logger.info('Applied material to primitive', {
        entityId,
        material: meshUpdate,
      });
    }
  };

  const handleCreatePrefabFromPrimitives = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { name, primitives } = customEvent.detail;

    logger.info('Agent requested prefab creation from primitives', { name, primitives });

    try {
      const entityManager = EntityManager.getInstance();
      const prefabManager = PrefabManager.getInstance();

      const container = entityManager.createEntity(name);
      const containerId = container.id;

      if (!componentRegistry.hasComponent(containerId, 'Transform')) {
        componentRegistry.addComponent(containerId, 'Transform', {
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        });
      }

      for (const spec of primitives) {
        const childEntity = createPrimitiveEntity(spec);
        if (!childEntity) continue;

        entityManager.setParent(childEntity.id, containerId);
        applyTransform(childEntity.id, spec);
        applyMaterial(childEntity.id, spec);
      }

      const entitiesBeforePrefab = entityManager.getAllEntities();
      logger.info('Entities before creating prefab', {
        count: entitiesBeforePrefab.length,
        ids: entitiesBeforePrefab.map((e) => e.id),
      });

      const prefabId = name.toLowerCase().replace(/\s+/g, '-');
      prefabManager.createFromEntity(containerId, name, prefabId);
      refreshPrefabs();

      logger.info('Entities after creating prefab', {
        count: entityManager.getAllEntities().length,
        ids: entityManager.getAllEntities().map((e) => e.id),
      });

      const containerEntity = entityManager.getEntity(containerId);
      const children = [...(containerEntity?.children || [])];

      logger.info('About to delete container and children', {
        containerId,
        children,
        childrenCount: children.length,
      });

      for (const childId of children) {
        logger.info('Deleting child entity', { childId });
        entityManager.deleteEntity(childId);
      }

      logger.info('Deleting container entity', { containerId });
      entityManager.deleteEntity(containerId);

      logger.info('Entities after deletion', {
        count: entityManager.getAllEntities().length,
        ids: entityManager.getAllEntities().map((e) => e.id),
      });

      logger.info('Prefab created from primitives - ready for instantiation', {
        prefabId,
        name,
        primitiveCount: primitives.length,
      });
    } catch (error) {
      logger.error('Failed to create prefab from primitives', { error, name });
    }
  };

  return { handleCreatePrefabFromPrimitives };
};
