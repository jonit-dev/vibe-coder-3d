// Core ECS implementation for Vibe Coder 3D
import {
  addComponent,
  addEntity,
  createWorld,
  defineComponent,
  defineQuery,
  removeComponent,
  removeEntity,
  Types,
} from 'bitecs';
import type { Object3D } from 'three';

// Create a world instance
export const world = createWorld();

// Maps to link ECS entities with Three.js objects
export const entityToObject = new Map<number, Object3D>();
export const objectToEntity = new Map<Object3D, number>();

// Basic component definitions
export const Transform = defineComponent({
  // Position
  position: [Types.f32, 3],
  // Rotation (as quaternion)
  rotation: [Types.f32, 4],
  // Scale
  scale: [Types.f32, 3],
  // Flag to mark when the transform needs to be applied to the Three.js object
  needsUpdate: Types.ui8,
});

// Velocity component for movement
export const Velocity = defineComponent({
  // Linear velocity (x, y, z)
  linear: [Types.f32, 3],
  // Angular velocity (around x, y, z axes)
  angular: [Types.f32, 3],
  // Damping factor for linear velocity (0-1)
  linearDamping: Types.f32,
  // Damping factor for angular velocity (0-1)
  angularDamping: Types.f32,
});

// Define queries
export const transformQuery = defineQuery([Transform]);
export const velocityQuery = defineQuery([Transform, Velocity]);

// Core entity functions
export function createEntity() {
  const entity = addEntity(world);

  // Initialize default transform values
  addComponent(world, Transform, entity);

  // Set default values
  Transform.position[entity][0] = 0;
  Transform.position[entity][1] = 0;
  Transform.position[entity][2] = 0;

  Transform.rotation[entity][0] = 0;
  Transform.rotation[entity][1] = 0;
  Transform.rotation[entity][2] = 0;
  Transform.rotation[entity][3] = 1; // w component of quaternion

  Transform.scale[entity][0] = 1;
  Transform.scale[entity][1] = 1;
  Transform.scale[entity][2] = 1;

  Transform.needsUpdate[entity] = 1; // Mark for update

  return entity;
}

// Add velocity to an entity with default values
export function addVelocity(
  entity: number,
  options?: {
    linear?: [number, number, number];
    angular?: [number, number, number];
    linearDamping?: number;
    angularDamping?: number;
  },
) {
  addComponent(world, Velocity, entity);

  // Set default or provided values
  Velocity.linear[entity][0] = options?.linear?.[0] || 0;
  Velocity.linear[entity][1] = options?.linear?.[1] || 0;
  Velocity.linear[entity][2] = options?.linear?.[2] || 0;

  Velocity.angular[entity][0] = options?.angular?.[0] || 0;
  Velocity.angular[entity][1] = options?.angular?.[1] || 0;
  Velocity.angular[entity][2] = options?.angular?.[2] || 0;

  Velocity.linearDamping[entity] =
    options?.linearDamping !== undefined ? options.linearDamping : 0.01;
  Velocity.angularDamping[entity] =
    options?.angularDamping !== undefined ? options.angularDamping : 0.01;

  return entity;
}

export function destroyEntity(entity: number) {
  // Remove from maps if associated with an object
  const object = entityToObject.get(entity);
  if (object) {
    entityToObject.delete(entity);
    objectToEntity.delete(object);
  }

  // Remove from ECS world
  removeComponent(world, Transform, entity);
  removeEntity(world, entity);
}

export function resetWorld() {
  // Clear all maps
  entityToObject.clear();
  objectToEntity.clear();

  // Create a new world (bitECS doesn't have a built-in reset)
  const newWorld = createWorld();
  Object.assign(world, newWorld);
}

// Helper to mark all transforms for update
export function markAllTransformsForUpdate() {
  // Use the transform query to find all entities with a Transform component
  const entities = transformQuery(world);

  // Mark each entity's transform for update
  entities.forEach((entity: number) => {
    Transform.needsUpdate[entity] = 1;
  });

  return entities.length;
}
