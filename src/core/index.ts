// Core Engine Exports
// This file exports all the core components, hooks, and utilities from the engine

// Components
export { EngineLoop } from './components/EngineLoop';
export { Entity } from './components/Entity';
export type { IEntityProps as EntityProps } from './components/Entity';
export { EntityMesh } from './components/EntityMesh';
export { GameEngine } from './components/GameEngine';
export type { IGameEngineProps as GameEngineProps } from './components/GameEngine';

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
export type { IGameEngineControls as GameEngineControls } from './hooks/useGameEngine';

// State
export { useGameLoop } from './lib/gameLoop';
export { useEngineStore } from './state/engineStore';

// ECS
export {
  Transform,
  Velocity,
  addVelocity,
  createEntity,
  destroyEntity,
  entityToObject,
  markAllTransformsForUpdate,
  objectToEntity,
  resetWorld,
  transformQuery,
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

// New Sprint 4 core abstractions
export { CharacterController } from '@/core/components/CharacterController';
export { Hud } from '@/core/components/ui';
export { useAudio } from '@/core/hooks/useAudio';
export { useEvent } from '@/core/hooks/useEvent';
