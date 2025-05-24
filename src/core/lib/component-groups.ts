import { ComponentCategory } from '../types/component-registry';

import { componentRegistry } from './component-registry';
import { dynamicComponentManager } from './dynamic-components';

// Component group interface
export interface IComponentGroup {
  id: string;
  name: string;
  description: string;
  category: ComponentCategory;
  icon: string;
  components: string[]; // Component IDs to add together
  defaultValues?: Record<string, any>; // Default values for each component
  order: number; // Display order in UI
}

// Component groups manager
export class ComponentGroupManager {
  private static groups: Map<string, IComponentGroup> = new Map();

  static registerGroup(group: IComponentGroup): void {
    if (this.groups.has(group.id)) {
      console.warn(`Component group '${group.id}' is already registered, skipping...`);
      return;
    }
    this.groups.set(group.id, group);
    console.log(`Component group '${group.name}' registered with id '${group.id}'`);
  }

  static getGroup(id: string): IComponentGroup | undefined {
    return this.groups.get(id);
  }

  static getAllGroups(): IComponentGroup[] {
    return Array.from(this.groups.values()).sort((a, b) => a.order - b.order);
  }

  static getGroupsByCategory(category: ComponentCategory): IComponentGroup[] {
    return Array.from(this.groups.values())
      .filter((group) => group.category === category)
      .sort((a, b) => a.order - b.order);
  }

  static async addGroupToEntity(
    entityId: number,
    groupId: string,
    overrides?: Record<string, any>,
  ): Promise<{ success: boolean; errors: string[] }> {
    const group = this.getGroup(groupId);
    if (!group) {
      return { success: false, errors: [`Group '${groupId}' not found`] };
    }

    const errors: string[] = [];
    let addedCount = 0;

    // Add each component in the group
    for (const componentId of group.components) {
      const defaultData = group.defaultValues?.[componentId];
      const overrideData = overrides?.[componentId];
      const componentData = overrideData || defaultData;

      try {
        const result = await dynamicComponentManager.addComponent(
          entityId,
          componentId,
          componentData,
        );
        if (result.valid) {
          addedCount++;
        } else {
          errors.push(`Failed to add ${componentId}: ${result.errors.join(', ')}`);
        }
      } catch (error) {
        errors.push(`Error adding ${componentId}: ${error}`);
      }
    }

    return {
      success: addedCount === group.components.length,
      errors,
    };
  }

  static canAddGroupToEntity(entityId: number, groupId: string): boolean {
    const group = this.getGroup(groupId);
    if (!group) return false;

    // Check if any components in the group are already present
    for (const componentId of group.components) {
      if (componentRegistry.hasEntityComponent(entityId, componentId)) {
        return false;
      }
    }

    return true;
  }

  static reset(): void {
    this.groups.clear();
  }
}

// Built-in component groups
export const BUILT_IN_COMPONENT_GROUPS: IComponentGroup[] = [
  {
    id: 'physics-group',
    name: 'Physics Package',
    description: 'Complete physics simulation with rigid body and collision detection',
    category: ComponentCategory.Physics,
    icon: 'FiZap',
    components: ['rigidBody', 'meshCollider'],
    defaultValues: {
      rigidBody: {
        enabled: true,
        bodyType: 'dynamic',
        mass: 1,
        gravityScale: 1,
        canSleep: true,
        linearDamping: 0.01,
        angularDamping: 0.01,
        material: {
          friction: 0.6,
          restitution: 0.3,
          density: 1,
        },
      },
      meshCollider: {
        enabled: true,
        colliderType: 'box',
        isTrigger: false,
        center: [0, 0, 0],
        size: {
          width: 1,
          height: 1,
          depth: 1,
        },
        physicsMaterial: {
          friction: 0.6,
          restitution: 0.3,
          density: 1,
        },
      },
    },
    order: 1,
  },
  {
    id: 'movement-group',
    name: 'Movement Package',
    description: 'Velocity-based movement and physics simulation',
    category: ComponentCategory.Physics,
    icon: 'FiTrendingUp',
    components: ['velocity', 'rigidBody', 'meshCollider'],
    defaultValues: {
      velocity: {
        linear: [0, 0, 0],
        angular: [0, 0, 0],
        linearDamping: 0.01,
        angularDamping: 0.01,
        priority: 1,
      },
      rigidBody: {
        enabled: true,
        bodyType: 'dynamic',
        mass: 1,
        gravityScale: 1,
        canSleep: true,
        linearDamping: 0.01,
        angularDamping: 0.01,
        material: {
          friction: 0.6,
          restitution: 0.3,
          density: 1,
        },
      },
      meshCollider: {
        enabled: true,
        colliderType: 'box',
        isTrigger: false,
        center: [0, 0, 0],
        size: {
          width: 1,
          height: 1,
          depth: 1,
        },
        physicsMaterial: {
          friction: 0.6,
          restitution: 0.3,
          density: 1,
        },
      },
    },
    order: 2,
  },
  {
    id: 'trigger-group',
    name: 'Trigger Package',
    description: 'Invisible trigger zone for collision detection',
    category: ComponentCategory.Physics,
    icon: 'FiSquare',
    components: ['meshCollider'],
    defaultValues: {
      meshCollider: {
        enabled: true,
        colliderType: 'box',
        isTrigger: true,
        center: [0, 0, 0],
        size: {
          width: 2,
          height: 2,
          depth: 2,
        },
        physicsMaterial: {
          friction: 0,
          restitution: 0,
          density: 0,
        },
      },
    },
    order: 3,
  },
  {
    id: 'rendering-group',
    name: 'Rendering Package',
    description: 'Complete rendering setup with materials and shadows',
    category: ComponentCategory.Rendering,
    icon: '🎨',
    components: ['meshRenderer'],
    defaultValues: {
      meshRenderer: {
        enabled: true,
        castShadows: true,
        receiveShadows: true,
        material: {
          color: '#ffffff',
          metalness: 0,
          roughness: 0.5,
          emissive: '#000000',
          emissiveIntensity: 0,
        },
      },
    },
    order: 4,
  },
];

// Register built-in component groups
export function registerBuiltInComponentGroups(): void {
  try {
    for (const group of BUILT_IN_COMPONENT_GROUPS) {
      ComponentGroupManager.registerGroup(group);
    }
    console.log('✅ All built-in component groups registered successfully');
  } catch (error) {
    console.error('❌ Failed to register built-in component groups:', error);
  }
}
