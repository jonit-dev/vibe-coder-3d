/**
 * ECS System Initialization
 * Sets up the new component registry and registers all core components
 */

import {
  registerCoreComponents,
  registerExampleComponents,
} from './components/ComponentDefinitions';
import { Logger } from '@core/lib/logger';

// Create logger for ECS timing
const ecsLogger = Logger.create('ECS:Init');

/**
 * Initialize the ECS system with all components
 * Call this once during application startup
 */
export function initializeECS(): void {
  const stepTracker = ecsLogger.createStepTracker('ECS Initialization');

  // Register core components (Transform, MeshRenderer, etc.)
  stepTracker.step('Core Components Registration');
  registerCoreComponents();

  // Register example components (Health, Velocity, etc.)
  stepTracker.step('Example Components Registration');
  registerExampleComponents();

  stepTracker.complete();
  ecsLogger.milestone('ECS Ready');
}

/**
 * Initialize only core components (minimal setup)
 */
export function initializeCoreECS(): void {

  registerCoreComponents();

}
