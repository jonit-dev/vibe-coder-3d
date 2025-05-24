// Component groups functionality using unified ComponentManager
import { componentManager } from '../dynamic-components/init';

// Re-export the manager as ComponentGroupManager for backwards compatibility
export { componentManager as ComponentGroupManager };

// Re-export the groups and registration function
export {
  BUILT_IN_COMPONENT_GROUPS,
  registerBuiltInComponentGroups,
} from '../dynamic-components/groups/BuiltInGroups';

export type { IComponentGroup } from '../types/component-registry';
