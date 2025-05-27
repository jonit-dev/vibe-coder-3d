/**
 * ECS System Initialization
 * Sets up the new component registry and registers all core components
 */

import {
  registerCoreComponents,
  registerExampleComponents,
} from './components/ComponentDefinitions';

/**
 * Initialize the ECS system with all components
 * Call this once during application startup
 */
export function initializeECS(): void {
  console.log('Initializing ECS system...');

  // Register core components (Transform, MeshRenderer, etc.)
  registerCoreComponents();

  // Register example components (Health, Velocity, etc.)
  registerExampleComponents();

  console.log('ECS system initialized successfully');
}

/**
 * Initialize only core components (minimal setup)
 */
export function initializeCoreECS(): void {
  console.log('Initializing core ECS components...');

  registerCoreComponents();

  console.log('Core ECS components initialized successfully');
}
