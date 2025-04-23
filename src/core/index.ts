// Core Engine Exports
// This file exports all the core components, hooks, and utilities from the engine

// Components
export { EngineLoop } from './components/EngineLoop';
export { Entity } from './components/Entity';
export type { EntityProps } from './components/Entity';
export { EntityMesh } from './components/EntityMesh';
export { GameEngine } from './components/GameEngine';
export type { GameEngineProps } from './components/GameEngine';

// Physics Components
export { PhysicsBox } from './components/physics/PhysicsBox';
export { PhysicsJoint } from './components/physics/PhysicsJoint';
export { PhysicsObject } from './components/physics/PhysicsObject';
export { PhysicsSphere } from './components/physics/PhysicsSphere';
export { PhysicsSystem } from './components/physics/PhysicsSystem';
export { PhysicsTrigger } from './components/physics/PhysicsTrigger';

// Hooks
export { useEntity, useEntityQuery } from './hooks/useEntity';
export { useGameEngine } from './hooks/useGameEngine';
export type { GameEngineControls } from './hooks/useGameEngine';

// State
export { useGameLoop } from './lib/gameLoop';

// ECS
export {
  addVelocity,
  createEntity,
  destroyEntity,
  entityToObject,
  markAllTransformsForUpdate,
  objectToEntity,
  resetWorld,
  Transform,
  transformQuery,
  Velocity,
  velocityQuery,
  world,
} from './lib/ecs';

// Systems
export {
  PhysicsBodyRef,
  registerPhysicsBody,
  unregisterPhysicsBody,
} from './systems/PhysicsSyncSystem';
export { transformSystem } from './systems/transformSystem';
export { runVelocitySystem } from './systems/VelocitySystem';
