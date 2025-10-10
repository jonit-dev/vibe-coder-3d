/**
 * Model Factory
 * Creates model entities from GLB/GLTF files with ECS components
 */

import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import { EntityManager } from '@/core/lib/ecs/EntityManager';
import { Logger } from '@/core/lib/logger';
import { EntityId } from '@/core/lib/ecs/types';
import { PlaySessionTracker } from '../adapters/PlaySessionTracker';
import { IModelOptions, ModelOptionsSchema } from './crud.types';

const logger = Logger.create('ModelFactory');

export interface IModelFactory {
  create(modelPathOrAssetId: string, options?: IModelOptions): EntityId;
}

export function createModelFactory(): IModelFactory {
  const entityManager = EntityManager.getInstance();
  const playTracker = PlaySessionTracker.getInstance();

  return {
    create(modelPathOrAssetId: string, options?: IModelOptions): EntityId {
      // Validate options with Zod
      const validatedOptions = options ? ModelOptionsSchema.parse(options) : ({} as IModelOptions);

      logger.debug('Creating model', { model: modelPathOrAssetId, options: validatedOptions });

      // Validate model path/asset ID
      if (!modelPathOrAssetId || modelPathOrAssetId.trim() === '') {
        throw new Error('Model path or asset ID cannot be empty');
      }

      // Create entity
      const name = validatedOptions.name || 'Model';
      const parentId = validatedOptions.parent;
      const entity = entityManager.createEntity(name, parentId);
      const entityId = entity.id;

      // Track if in play mode
      if (playTracker.isInPlayMode()) {
        playTracker.markCreated(entityId);
      }

      try {
        // Add Transform component
        const transform = validatedOptions.transform || {};
        const position = transform.position || [0, 0, 0];
        const rotation = transform.rotation || [0, 0, 0];

        // Handle uniform or per-axis scale
        let scale: [number, number, number];
        if (typeof transform.scale === 'number') {
          scale = [transform.scale, transform.scale, transform.scale];
        } else {
          scale = transform.scale || [1, 1, 1];
        }

        componentRegistry.addComponent(entityId, 'Transform', {
          position,
          rotation,
          scale,
        });

        // Add MeshRenderer component with model reference
        const material = validatedOptions.material || {};
        componentRegistry.addComponent(entityId, 'MeshRenderer', {
          meshId: 'model',
          materialId: 'default',
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          modelPath: modelPathOrAssetId,
          material: {
            shader: 'standard',
            materialType: 'solid',
            color: material.color || '#cccccc',
            metalness: material.metalness ?? 0,
            roughness: material.roughness ?? 0.7,
            emissive: '#000000',
            emissiveIntensity: 0,
          },
        });

        // Add physics components if requested
        if (validatedOptions.physics) {
          const physics = validatedOptions.physics;

          // Add RigidBody if body type specified
          if (physics.body) {
            componentRegistry.addComponent(entityId, 'RigidBody', {
              bodyType: physics.body,
              mass: physics.mass ?? 1,
              gravityScale: 1,
              canSleep: true,
              enabled: true,
              material: {
                friction: 0.5,
                restitution: 0.3,
                density: 1.0,
              },
            });
          }

          // Add collider if specified
          if (physics.collider) {
            if (physics.collider === 'mesh') {
              // For mesh collider on models, we'll use MeshCollider
              // Note: This may require the model to be loaded first
              logger.debug('Adding mesh collider to model', {
                entityId,
                model: modelPathOrAssetId,
              });
              componentRegistry.addComponent(entityId, 'MeshCollider', {
                enabled: true,
                isTrigger: false,
                convex: true, // Use convex hull for dynamic bodies
              });
            } else if (physics.collider === 'box') {
              // Fallback to box collider
              componentRegistry.addComponent(entityId, 'BoxCollider', {
                size: [1, 1, 1],
                center: [0, 0, 0],
                isTrigger: false,
              });
            }
          }
        }

        logger.info('Model created successfully', {
          entityId,
          model: modelPathOrAssetId,
          name,
        });
        return entityId;
      } catch (error) {
        // If component addition fails, clean up the entity
        logger.error('Failed to create model, cleaning up', {
          entityId,
          model: modelPathOrAssetId,
          error,
        });
        entityManager.deleteEntity(entityId);
        throw error;
      }
    },
  };
}
