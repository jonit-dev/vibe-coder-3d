// Core Engine Exports
// This file exports all the core components, hooks, and utilities from the engine

// Components
export { EngineLoop } from './components/EngineLoop';
export { EntityMesh } from './components/EntityMesh';
export { GameEngine } from './components/GameEngine';

// Hooks
export { useGameEngine } from './hooks/useGameEngine';
export type { GameEngineControls } from './hooks/useGameEngine';

// State
export { useGameLoop } from './lib/gameLoop';

// ECS
export {
  Transform,
  createEntity,
  destroyEntity,
  entityToObject,
  markAllTransformsForUpdate,
  objectToEntity,
  resetWorld,
  transformQuery,
  world,
} from './lib/ecs';

// Systems
export { transformSystem } from './systems/transformSystem';
