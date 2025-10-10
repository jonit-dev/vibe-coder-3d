/**
 * Primitive Factory
 * Creates primitive entities (cube, sphere, plane, etc.) with ECS components
 */

import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import { EntityManager } from '@/core/lib/ecs/EntityManager';
import { Logger } from '@/core/lib/logger';
import { EntityId } from '@/core/lib/ecs/types';
import { PlaySessionTracker } from '../adapters/PlaySessionTracker';
import { IPrimitiveOptions, PrimitiveKind, PrimitiveOptionsSchema } from './crud.types';

const logger = Logger.create('PrimitiveFactory');

export interface IPrimitiveFactory {
  create(kind: PrimitiveKind, options?: IPrimitiveOptions): EntityId;
}

export function createPrimitiveFactory(): IPrimitiveFactory {
  const entityManager = EntityManager.getInstance();
  const playTracker = PlaySessionTracker.getInstance();

  return {
    create(kind: PrimitiveKind, options?: IPrimitiveOptions): EntityId {
      // Validate options with Zod
      const validatedOptions = options
        ? PrimitiveOptionsSchema.parse(options)
        : ({} as IPrimitiveOptions);

      logger.debug('Creating primitive', { kind, options: validatedOptions });

      // Create entity
      const name = validatedOptions.name || kind;
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

        // Add MeshRenderer component with primitive geometry
        const material = validatedOptions.material || {};
        componentRegistry.addComponent(entityId, 'MeshRenderer', {
          meshId: kind,
          materialId: 'default',
          enabled: true,
          castShadows: true,
          receiveShadows: true,
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
            if (physics.collider === 'box') {
              componentRegistry.addComponent(entityId, 'BoxCollider', {
                size: [1, 1, 1],
                center: [0, 0, 0],
                isTrigger: false,
              });
            } else if (physics.collider === 'sphere') {
              componentRegistry.addComponent(entityId, 'SphereCollider', {
                radius: 0.5,
                center: [0, 0, 0],
                isTrigger: false,
              });
            } else if (physics.collider === 'mesh') {
              // For mesh collider, use box as fallback with warning
              logger.warn('Mesh collider requested for primitive, falling back to box collider', {
                entityId,
                kind,
              });
              componentRegistry.addComponent(entityId, 'BoxCollider', {
                size: [1, 1, 1],
                center: [0, 0, 0],
                isTrigger: false,
              });
            }
          }
        }

        logger.info('Primitive created successfully', { entityId, kind, name });
        return entityId;
      } catch (error) {
        // If component addition fails, clean up the entity
        logger.error('Failed to create primitive, cleaning up', { entityId, kind, error });
        entityManager.deleteEntity(entityId);
        throw error;
      }
    },
  };
}
