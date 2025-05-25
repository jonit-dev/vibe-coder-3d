// Core ECS implementation for Vibe Coder 3D
import {
  addComponent,
  addEntity,
  createWorld,
  defineComponent,
  defineQuery,
  hasComponent,
  removeComponent,
  removeEntity,
  Types,
} from 'bitecs';
import type { Object3D } from 'three';

import { Camera } from './ecs/BitECSComponents';
import { ECSWorld } from './ecs/World';

// Use the singleton world instance
export const world = ECSWorld.getInstance().getWorld();

// Maps to link ECS entities with Three.js objects
export const entityToObject = new Map<number, Object3D>();
export const objectToEntity = new Map<Object3D, number>();

// Force update flag to help components detect changes
export let worldVersion = 0;
export function incrementWorldVersion() {
  worldVersion++;
  return worldVersion;
}

// Basic component definitions
export const Transform = defineComponent({
  // Position
  position: [Types.f32, 3],
  // Rotation (as Euler angles)
  rotation: [Types.f32, 3],
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
  // Priority for velocity updates (higher values update more frequently)
  priority: Types.ui8,
});

// Mesh type enum and ECS component
export enum MeshTypeEnum {
  Cube = 0,
  Sphere = 1,
  Cylinder = 2,
  Cone = 3,
  Torus = 4,
  Plane = 5,
}
export const MeshType = defineComponent({
  type: Types.ui8, // 0=Cube, 1=Sphere, 2=Cylinder, 3=Cone, 4=Torus, 5=Plane
});

// Name component for entity naming
export const Name = defineComponent({
  value: [Types.ui8, 32], // 32 chars max, UTF-8 bytes
});

// Material component for entity appearance
export const Material = defineComponent({
  // Color as RGB values (0-1)
  color: [Types.f32, 3],
  // Flag to mark when the material needs to be applied to the Three.js object
  needsUpdate: Types.ui8,
});

// Define queries
export const transformQuery = defineQuery([Transform]);
export const velocityQuery = defineQuery([Transform, Velocity]);
export const materialQuery = defineQuery([Material]);
export const cameraQuery = defineQuery([Camera]);

// Core entity functions
export function createEntity(meshType: MeshTypeEnum = MeshTypeEnum.Cube) {
  const entity = addEntity(world);

  // Initialize default transform values
  addComponent(world, Transform, entity);
  addComponent(world, MeshType, entity);
  addComponent(world, Material, entity);
  MeshType.type[entity] = meshType;

  // Set default values
  Transform.position[entity][0] = 0;
  Transform.position[entity][1] = 0;
  Transform.position[entity][2] = 0;

  Transform.rotation[entity][0] = 0;
  Transform.rotation[entity][1] = 0;
  Transform.rotation[entity][2] = 0;

  Transform.scale[entity][0] = 1;
  Transform.scale[entity][1] = 1;
  Transform.scale[entity][2] = 1;

  Transform.needsUpdate[entity] = 1; // Mark for update

  // Set default material color (blue)
  Material.color[entity][0] = 0.2; // Red
  Material.color[entity][1] = 0.6; // Green
  Material.color[entity][2] = 1.0; // Blue
  Material.needsUpdate[entity] = 1; // Mark for update

  // Force world version update to notify queries
  incrementWorldVersion();

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
    priority?: number;
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

  // Set update priority (higher = more frequent updates)
  Velocity.priority[entity] = options?.priority !== undefined ? options.priority : 1;

  incrementWorldVersion();
  return entity;
}

export function destroyEntity(entity: number) {
  // Remove from maps if associated with an object
  const object = entityToObject.get(entity);
  if (object) {
    entityToObject.delete(entity);
    objectToEntity.delete(object);
  }

  // Remove all components but keep entity in the world
  if (hasComponent(world, Transform, entity)) {
    removeComponent(world, Transform, entity);
  }

  if (hasComponent(world, MeshType, entity)) {
    removeComponent(world, MeshType, entity);
  }

  if (hasComponent(world, Material, entity)) {
    removeComponent(world, Material, entity);
  }

  if (hasComponent(world, Velocity, entity)) {
    removeComponent(world, Velocity, entity);
  }

  // Finally remove the entity
  removeEntity(world, entity);
  incrementWorldVersion();
}

export function resetWorld() {
  // Clear all maps
  entityToObject.clear();
  objectToEntity.clear();

  // Create a new world (bitECS doesn't have a built-in reset)
  const newWorld = createWorld();
  Object.assign(world, newWorld);
  incrementWorldVersion();
}

// Helper to mark all transforms for update
export function markAllTransformsForUpdate() {
  // Use the transform query to find all entities with a Transform component
  const entities = transformQuery(world);

  // Mark each entity's transform for update
  entities.forEach((entity: number) => {
    Transform.needsUpdate[entity] = 1;
  });

  incrementWorldVersion();
  return entities.length;
}

// Add this new function to safely update mesh type
export function updateMeshType(entity: number, meshType: MeshTypeEnum) {
  // Ensure entity has MeshType component
  if (!hasComponent(world, MeshType, entity)) {
    addComponent(world, MeshType, entity);
  }

  // Update the mesh type
  MeshType.type[entity] = meshType;

  // If there's a transform, mark it for update
  if (hasComponent(world, Transform, entity)) {
    Transform.needsUpdate[entity] = 1;
  }

  incrementWorldVersion();
  return entity;
}

// Helper to set/get name as string
export function setEntityName(entity: number, name: string) {
  // Ensure Name component exists
  if (!hasComponent(world, Name, entity)) {
    addComponent(world, Name, entity);
  }
  // Encode string to UTF-8 bytes, truncate to 32
  const encoder = new TextEncoder();
  const bytes = encoder.encode(name.slice(0, 32));
  Name.value[entity].fill(0);
  for (let i = 0; i < bytes.length; i++) {
    Name.value[entity][i] = bytes[i];
  }
  incrementWorldVersion();
}

export function getEntityName(entity: number): string {
  if (!hasComponent(world, Name, entity)) return '';
  // Decode UTF-8 bytes to string
  const bytes = Name.value[entity];
  const end = bytes.findIndex((b) => b === 0);
  const slice = end === -1 ? bytes : bytes.slice(0, end);
  return new TextDecoder().decode(slice);
}

// Helper functions for entity materials
export function setEntityColor(entity: number, color: string) {
  // Ensure Material component exists
  if (!hasComponent(world, Material, entity)) {
    addComponent(world, Material, entity);
  }

  // Convert hex color to RGB values (0-1)
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  Material.color[entity][0] = r;
  Material.color[entity][1] = g;
  Material.color[entity][2] = b;
  Material.needsUpdate[entity] = 1;

  incrementWorldVersion();
}

export function getEntityColor(entity: number): string {
  if (!hasComponent(world, Material, entity)) {
    return '#3399ff'; // Default blue color
  }

  // Convert RGB values (0-1) to hex color
  const r = Math.round(Material.color[entity][0] * 255);
  const g = Math.round(Material.color[entity][1] * 255);
  const b = Math.round(Material.color[entity][2] * 255);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
