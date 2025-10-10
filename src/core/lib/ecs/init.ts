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
  registerCoreComponents();
  registerExampleComponents();
}

/**
 * Initialize only core components (minimal setup)
 */
export function initializeCoreECS(): void {
  registerCoreComponents();
}
