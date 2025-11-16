/**
 * Primitive entity creation handlers for agent actions
 */

import { KnownComponentTypes } from '@core/lib/ecs/IComponent';
import { MeshRendererData } from '@core/lib/ecs/components/definitions/MeshRendererComponent';
import { Logger } from '@core/lib/logger';
import type { IEntity } from '@core/lib/ecs/IEntity';

const logger = Logger.create('AgentActions:Primitives');

interface IEntityCreators {
  createCube: (name?: string) => IEntity;
  createSphere: (name?: string) => IEntity;
  createCylinder: (name?: string) => IEntity;
  createCone: (name?: string) => IEntity;
  createPlane: (name?: string) => IEntity;
  createDirectionalLight: (name?: string) => IEntity;
  createGeometryAssetEntity: (path: string, options?: { name?: string }) => IEntity;
}

type UpdateComponentFn = <TData>(
  entityId: number,
  componentType: string,
  data: Partial<TData>,
) => boolean;

export const createPrimitiveCreationHandlers = (
  entityCreators: IEntityCreators,
  updateComponent: UpdateComponentFn,
) => {
  const handleAddEntity = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { type, position, rotation, scale, name, material, _requestId } = customEvent.detail;

    logger.info('Agent requested entity add', {
      type,
      position,
      rotation,
      scale,
      name,
      material,
    });

    try {
      let entity: IEntity | undefined;
      switch (type) {
        case 'Cube':
          entity = entityCreators.createCube(name);
          break;
        case 'Sphere':
          entity = entityCreators.createSphere(name);
          break;
        case 'Cylinder':
          entity = entityCreators.createCylinder(name);
          break;
        case 'Cone':
          entity = entityCreators.createCone(name);
          break;
        case 'Plane':
          entity = entityCreators.createPlane(name);
          break;
        case 'Light':
          entity = entityCreators.createDirectionalLight(name);
          break;
        default:
          logger.warn('Unknown entity type requested by agent', { type });
          window.dispatchEvent(
            new CustomEvent('agent:add-entity-response', {
              detail: { _requestId, success: false, error: `Unknown entity type: ${type}` },
            }),
          );
          return;
      }

      if (entity && (position || rotation || scale)) {
        updateComponent(entity.id, KnownComponentTypes.TRANSFORM, {
          position: position ? [position.x, position.y, position.z] : [0, 0, 0],
          rotation: rotation ? [rotation.x, rotation.y, rotation.z] : [0, 0, 0],
          scale: scale ? [scale.x, scale.y, scale.z] : [1, 1, 1],
        });
      }

      if (entity && material) {
        const meshUpdate: Partial<MeshRendererData> = {};

        if (material.materialId) {
          meshUpdate.materialId = material.materialId;
        }

        if (
          material.color ||
          material.metalness !== undefined ||
          material.roughness !== undefined
        ) {
          meshUpdate.material = {
            shader: 'standard' as const,
            materialType: 'solid' as const,
            color: material.color || '#ffffff',
            metalness: material.metalness ?? 0,
            roughness: material.roughness ?? 0.7,
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
          updateComponent(entity.id, KnownComponentTypes.MESH_RENDERER, meshUpdate);
          logger.info('Applied material to entity', {
            entityId: entity.id,
            material: meshUpdate,
          });
        }
      }

      logger.info('Entity created by agent', {
        type,
        entityId: entity?.id,
        position,
        rotation,
        scale,
        material,
      });

      if (entity) {
        window.dispatchEvent(
          new CustomEvent('agent:add-entity-response', {
            detail: { _requestId, success: true, entityId: entity.id },
          }),
        );
      }
    } catch (error) {
      logger.error('Failed to create entity from agent request', { error, type });
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

  const handleCreateGeometryEntity = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { path, name } = customEvent.detail;

    logger.info('Agent requested geometry entity creation', { path, name });

    try {
      const entity = entityCreators.createGeometryAssetEntity(path, { name });
      logger.info('Geometry entity created', { path, entityId: entity.id });
    } catch (error) {
      logger.error('Failed to create geometry entity', { error, path });
    }
  };

  return {
    handleAddEntity,
    handleCreateGeometryEntity,
  };
};
