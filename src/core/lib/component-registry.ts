// Component registry functionality using unified ComponentManager
import { componentManager } from '../dynamic-components/init';

// Export the manager as ComponentRegistry for backwards compatibility
export const ComponentRegistry = componentManager;

// Create a default instance for legacy usage
export const componentRegistry = componentManager;
