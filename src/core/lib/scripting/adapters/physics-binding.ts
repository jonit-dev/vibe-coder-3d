/**
 * Physics Binding - Bridges ECS data <-> Rapier runtime operations
 * Processes queued physics mutations (forces, velocities) and applies them to Rapier world
 */

import type { RigidBody as RapierRigidBody, World as RapierWorld } from '@dimforge/rapier3d-compat';
import { Logger } from '@/core/lib/logger';
import type { ComponentMutationBuffer } from '@/core/lib/ecs/mutations/ComponentMutationBuffer';
import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';

const logger = Logger.create('PhysicsBinding');

/**
 * Registry mapping entity IDs to Rapier rigid bodies
 * This should be populated by the physics rendering system (e.g., @react-three/rapier components)
 */
export const entityToRigidBodyMap = new Map<number, RapierRigidBody>();

/**
 * Process physics mutations from the mutation buffer and apply to Rapier world
 * Should be called after mutation buffer flush but before render
 */
export function processPhysicsMutations(
  buffer: ComponentMutationBuffer,
  world?: RapierWorld,
): void {
  if (!world) {
    logger.warn('Physics world not available, skipping physics binding');
    return;
  }

  // Get all queued mutations
  const mutations = buffer.getMutations();

  for (const { entityId, componentId, field, value } of mutations) {
    if (componentId !== 'RigidBody') continue;

    // Get the Rapier rigid body for this entity
    const rigidBody = entityToRigidBodyMap.get(entityId);
    if (!rigidBody) {
      // Entity doesn't have a rigid body in Rapier yet, skip
      continue;
    }

    // Process physics-specific mutations (prefixed with __)
    try {
      switch (field) {
        case '__applyForce': {
          const { force, point } = value as {
            force: [number, number, number];
            point?: [number, number, number];
          };
          if (point) {
            rigidBody.addForceAtPoint(
              { x: force[0], y: force[1], z: force[2] },
              { x: point[0], y: point[1], z: point[2] },
              true,
            );
          } else {
            rigidBody.addForce({ x: force[0], y: force[1], z: force[2] }, true);
          }
          break;
        }

        case '__applyImpulse': {
          const { impulse, point } = value as {
            impulse: [number, number, number];
            point?: [number, number, number];
          };
          if (point) {
            rigidBody.applyImpulseAtPoint(
              { x: impulse[0], y: impulse[1], z: impulse[2] },
              { x: point[0], y: point[1], z: point[2] },
              true,
            );
          } else {
            rigidBody.applyImpulse({ x: impulse[0], y: impulse[1], z: impulse[2] }, true);
          }
          break;
        }

        case '__setLinearVelocity': {
          const vel = value as [number, number, number];
          rigidBody.setLinvel({ x: vel[0], y: vel[1], z: vel[2] }, true);
          break;
        }

        case '__setAngularVelocity': {
          const vel = value as [number, number, number];
          rigidBody.setAngvel({ x: vel[0], y: vel[1], z: vel[2] }, true);
          break;
        }

        default:
          // Not a physics operation, skip
          break;
      }
    } catch (error) {
      logger.error(`Failed to process physics mutation for entity ${entityId}:`, error);
    }
  }
}

/**
 * Sync velocity data from Rapier back to ECS component data
 * This allows getLinearVelocity/getAngularVelocity to return current values
 * Should be called after physics step
 */
export function syncVelocitiesFromRapier(): void {
  for (const [entityId, rigidBody] of entityToRigidBodyMap.entries()) {
    try {
      const linvel = rigidBody.linvel();
      const angvel = rigidBody.angvel();

      // Store velocities in component data for script access
      // Using updateComponent to bypass mutation buffer since this is a read-only sync
      const currentData = componentRegistry.getComponentData(entityId, 'RigidBody') as Record<
        string,
        unknown
      >;
      if (currentData) {
        // Directly update internal state (this is a special case for physics sync)
        (currentData as { __linearVelocity?: [number, number, number] }).__linearVelocity = [
          linvel.x,
          linvel.y,
          linvel.z,
        ];
        (currentData as { __angularVelocity?: [number, number, number] }).__angularVelocity = [
          angvel.x,
          angvel.y,
          angvel.z,
        ];
      }
    } catch (error) {
      logger.warn(`Failed to sync velocities for entity ${entityId}:`, error);
    }
  }
}

/**
 * Register a Rapier rigid body for an entity
 * Should be called by physics rendering components when bodies are created
 */
export function registerRigidBody(entityId: number, rigidBody: RapierRigidBody): void {
  entityToRigidBodyMap.set(entityId, rigidBody);
  logger.debug(`Registered rigid body for entity ${entityId}`);
}

/**
 * Unregister a Rapier rigid body for an entity
 * Should be called when entities are destroyed or bodies are removed
 */
export function unregisterRigidBody(entityId: number): void {
  entityToRigidBodyMap.delete(entityId);
  logger.debug(`Unregistered rigid body for entity ${entityId}`);
}

/**
 * Get the Rapier rigid body for an entity
 * Used by advanced physics queries
 */
export function getRigidBody(entityId: number): RapierRigidBody | undefined {
  return entityToRigidBodyMap.get(entityId);
}
