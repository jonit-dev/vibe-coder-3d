/**
 * Factory function for creating a configured ComponentManager
 */

import { ComponentManager } from './ComponentManager';
import type { IComponentDescriptor } from './types/core';

export interface IComponentManagerConfig {
  getEditorStore?: () => any;
  components?: IComponentDescriptor[];
  enableDebugLogging?: boolean;
}

/**
 * Create a new ComponentManager with optional configuration
 */
export function createComponentManager(config: IComponentManagerConfig = {}): ComponentManager {
  const { getEditorStore, components = [], enableDebugLogging = false } = config;

  // Create the manager
  const manager = new ComponentManager(getEditorStore);

  // Register provided components
  for (const component of components) {
    manager.registerComponent(component);
  }

  // Configure debug logging if needed
  if (enableDebugLogging) {
    // Enable debug logging by setting console.debug to console.log
    const originalDebug = console.debug;
    console.debug = console.log;

    // Restore original debug on manager clear
    const originalClear = manager.clear.bind(manager);
    manager.clear = () => {
      console.debug = originalDebug;
      originalClear();
    };
  }

  return manager;
}

/**
 * Create a ComponentManager with editor store integration
 */
export function createComponentManagerWithEditor(getEditorStore: () => any): ComponentManager {
  return createComponentManager({ getEditorStore });
}

/**
 * Create a ComponentManager for testing (no editor store)
 */
export function createTestComponentManager(): ComponentManager {
  return createComponentManager({ enableDebugLogging: true });
}
