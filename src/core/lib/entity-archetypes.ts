import { z } from 'zod';

import { ComponentCategory } from '../types/component-registry';

import { componentRegistry } from './component-registry';
import { dynamicComponentManager } from './dynamic-components';
import { createEntity as createEntityLegacy, incrementWorldVersion, MeshTypeEnum } from './ecs';
import { frameEventBatch } from './ecs-events';

// Entity archetype interface
export interface IEntityArchetype {
  id: string;
  name: string;
  description?: string;
  components: string[]; // Component IDs that must be present
  defaultValues?: Record<string, any>; // Default component data
  validation?: (data: any) => boolean;
  category?: ComponentCategory;
  icon?: string; // For UI display
}

// Archetype validation schema
export const EntityArchetypeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  components: z.array(z.string()).min(1),
  defaultValues: z.record(z.any()).optional(),
  category: z.nativeEnum(ComponentCategory).optional(),
  icon: z.string().optional(),
});

export class ArchetypeManager {
  private static archetypes: Map<string, IEntityArchetype> = new Map();

  static registerArchetype(archetype: IEntityArchetype): void {
    if (this.archetypes.has(archetype.id)) {
      return;
    }

    // Validate the archetype
    EntityArchetypeSchema.parse(archetype);

    // Validate that all required components exist
    for (const componentId of archetype.components) {
      const component = componentRegistry.getComponent(componentId);
      if (!component) {
        return;
      }
    }

    this.archetypes.set(archetype.id, archetype);
  }

  static async createEntity(archetypeId: string, overrides?: Record<string, any>): Promise<number> {
    const archetype = this.archetypes.get(archetypeId);
    if (!archetype) {
      throw new Error(`Archetype '${archetypeId}' not found`);
    }

    console.log(
      `[ArchetypeManager] Creating entity from archetype '${archetypeId}' with overrides:`,
      overrides,
    );

    // Create basic entity using legacy system for now
    // This ensures all core components are properly initialized
    let entityId: number;

    if (archetype.components.includes('meshType') && overrides?.meshType?.type !== undefined) {
      entityId = createEntityLegacy(overrides.meshType.type);
    } else {
      entityId = createEntityLegacy(MeshTypeEnum.Cube);
    }

    console.log(`[ArchetypeManager] Created base entity with ID: ${entityId}`);

    // Add any additional components required by the archetype
    const coreComponents = ['transform', 'meshType', 'material']; // These are added by createEntity
    const additionalComponents = archetype.components.filter(
      (comp) => !coreComponents.includes(comp),
    );

    console.log(
      `[ArchetypeManager] Entity ${entityId} needs additional components:`,
      additionalComponents,
    );

    for (const componentId of additionalComponents) {
      const defaultData = archetype.defaultValues?.[componentId];
      const overrideData = overrides?.[componentId];
      const componentData = overrideData || defaultData;

      console.log(
        `[ArchetypeManager] Adding component '${componentId}' to entity ${entityId} with data:`,
        componentData,
      );

      try {
        const result = await dynamicComponentManager.addComponent(
          entityId,
          componentId,
          componentData,
        );
        if (!result.valid) {
          console.error(
            `[ArchetypeManager] ❌ Failed to add component '${componentId}' to entity ${entityId}:`,
            result.errors,
          );
        } else {
          console.log(
            `[ArchetypeManager] ✅ Successfully added component '${componentId}' to entity ${entityId}`,
          );
        }
      } catch (error) {
        console.error(
          `[ArchetypeManager] ❌ Exception adding component '${componentId}' to entity ${entityId}:`,
          error,
        );
      }
    }

    // Apply any overrides to core components
    if (overrides) {
      console.log(
        `[ArchetypeManager] Applying overrides to core components for entity ${entityId}:`,
        overrides,
      );
      for (const [componentId, data] of Object.entries(overrides)) {
        if (coreComponents.includes(componentId) && data) {
          try {
            console.log(
              `[ArchetypeManager] Setting data for core component '${componentId}' on entity ${entityId}:`,
              data,
            );
            const result = await dynamicComponentManager.setComponentData(
              entityId,
              componentId,
              data,
            );
            if (!result.valid) {
              console.warn(
                `[ArchetypeManager] Failed to set component data for '${componentId}' on entity ${entityId}:`,
                result.errors,
              );
            }
          } catch (error) {
            console.warn(
              `[ArchetypeManager] Error setting component data for '${componentId}':`,
              error,
            );
          }
        }
      }
    }

    // Apply archetype defaultValues for core components (this was missing!)
    if (archetype.defaultValues) {
      console.log(
        `[ArchetypeManager] Applying archetype defaultValues for core components on entity ${entityId}:`,
        archetype.defaultValues,
      );
      for (const [componentId, data] of Object.entries(archetype.defaultValues)) {
        if (coreComponents.includes(componentId) && data && !overrides?.[componentId]) {
          // Only apply if there's no override for this component
          try {
            console.log(
              `[ArchetypeManager] Setting archetype default data for core component '${componentId}' on entity ${entityId}:`,
              data,
            );
            const result = await dynamicComponentManager.setComponentData(
              entityId,
              componentId,
              data,
            );
            if (!result.valid) {
              console.warn(
                `[ArchetypeManager] Failed to set archetype default data for '${componentId}' on entity ${entityId}:`,
                result.errors,
              );
            } else {
              console.log(
                `[ArchetypeManager] ✅ Successfully applied archetype default for '${componentId}' on entity ${entityId}`,
              );
            }
          } catch (error) {
            console.warn(
              `[ArchetypeManager] Error setting archetype default data for '${componentId}':`,
              error,
            );
          }
        }
      }
    }

    // Force world version update to ensure entity is immediately visible to queries
    incrementWorldVersion();
    frameEventBatch.emit(); // Ensure all batched events (like transform updates) are flushed

    console.log(`✅ Created entity ${entityId} from archetype '${archetype.name}'`);
    return entityId;
  }

  static getArchetype(id: string): IEntityArchetype | undefined {
    return this.archetypes.get(id);
  }

  static listArchetypes(): IEntityArchetype[] {
    return Array.from(this.archetypes.values());
  }

  static getArchetypesByCategory(category: ComponentCategory): IEntityArchetype[] {
    return Array.from(this.archetypes.values()).filter(
      (archetype) => archetype.category === category,
    );
  }

  static validateEntityAgainstArchetype(entityId: number, archetypeId: string): boolean {
    const archetype = this.archetypes.get(archetypeId);
    if (!archetype) return false;

    const entityComponents = dynamicComponentManager.getEntityComponents(entityId);

    // Check if entity has all required components
    for (const requiredComponent of archetype.components) {
      if (!entityComponents.includes(requiredComponent)) {
        return false;
      }
    }

    return true;
  }

  static reset(): void {
    this.archetypes.clear();
  }
}

// Built-in archetypes
export const BUILT_IN_ARCHETYPES: IEntityArchetype[] = [
  {
    id: 'static-mesh',
    name: 'Static Mesh',
    description: 'A non-moving 3D object with basic rendering',
    category: ComponentCategory.Rendering,
    icon: '🎯',
    components: ['transform', 'meshType', 'material', 'meshRenderer'],
    defaultValues: {
      transform: {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
      meshRenderer: {
        enabled: true,
        castShadows: true,
        receiveShadows: true,
      },
    },
  },
  {
    id: 'physics-entity',
    name: 'Physics Entity',
    description:
      'A physics-enabled object with rigid body and collision detection (recommended default)',
    category: ComponentCategory.Physics,
    icon: '⚛️',
    components: ['transform', 'meshType', 'material', 'meshRenderer', 'rigidBody', 'meshCollider'],
    defaultValues: {
      transform: {
        position: [0, 1, 0], // Start slightly elevated
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
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
      meshRenderer: {
        enabled: true,
        castShadows: true,
        receiveShadows: true,
      },
    },
  },
  {
    id: 'dynamic-object',
    name: 'Dynamic Object',
    description: 'A moving object with velocity-based movement',
    category: ComponentCategory.Physics,
    icon: '⚡',
    components: ['transform', 'meshType', 'material', 'meshRenderer', 'velocity'],
    defaultValues: {
      transform: {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
      velocity: {
        linear: [0, 0, 0],
        angular: [0, 0, 0],
        linearDamping: 0.01,
        angularDamping: 0.01,
        priority: 1,
      },
      meshRenderer: {
        enabled: true,
        castShadows: true,
        receiveShadows: true,
      },
    },
  },
  {
    id: 'physics-body',
    name: 'Physics Body',
    description: 'A full-featured physics object with rigid body simulation and velocity control',
    category: ComponentCategory.Physics,
    icon: '🧿',
    components: [
      'transform',
      'meshType',
      'material',
      'meshRenderer',
      'velocity',
      'rigidBody',
      'meshCollider',
    ],
    defaultValues: {
      transform: {
        position: [0, 2, 0], // Start elevated to show physics
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
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
      meshRenderer: {
        enabled: true,
        castShadows: true,
        receiveShadows: true,
      },
    },
  },
  {
    id: 'trigger-zone',
    name: 'Trigger Zone',
    description: 'An invisible trigger area for detecting collisions',
    category: ComponentCategory.Physics,
    icon: '🚪',
    components: ['transform', 'meshType', 'meshCollider'],
    defaultValues: {
      transform: {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [2, 2, 2], // Larger trigger area
      },
      meshType: {
        type: MeshTypeEnum.Cube,
      },
      meshCollider: {
        enabled: true,
        colliderType: 'box',
        isTrigger: true, // This makes it a trigger
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
    validation: (data) => {
      // Ensure it's set as trigger
      return data?.meshCollider?.isTrigger === true;
    },
  },
  {
    id: 'basic-entity',
    name: 'Basic Entity',
    description: 'Minimal entity with just core components',
    category: ComponentCategory.Core,
    icon: '📦',
    components: ['transform', 'meshType', 'material'],
    defaultValues: {
      transform: {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
    },
  },
];

// Register built-in archetypes with retry mechanism
export function registerBuiltInArchetypes(): void {
  try {
    let successCount = 0;
    const failedArchetypes: string[] = [];

    for (const archetype of BUILT_IN_ARCHETYPES) {
      try {
        ArchetypeManager.registerArchetype(archetype);
        successCount++;
      } catch (error) {
        console.warn(`Failed to register archetype '${archetype.id}':`, error);
        failedArchetypes.push(archetype.id);
      }
    }

    if (failedArchetypes.length > 0) {
      console.warn(`Failed to register ${failedArchetypes.length} archetypes:`, failedArchetypes);

      // Retry failed archetypes after a short delay
      setTimeout(() => {
        console.log('Retrying failed archetype registrations...');
        let retrySuccessCount = 0;

        for (const archetypeId of failedArchetypes) {
          const archetype = BUILT_IN_ARCHETYPES.find((a) => a.id === archetypeId);
          if (archetype) {
            try {
              ArchetypeManager.registerArchetype(archetype);
              retrySuccessCount++;
              console.log(`✅ Retry successful for archetype '${archetypeId}'`);
            } catch (retryError) {
              console.error(`❌ Retry failed for archetype '${archetypeId}':`, retryError);
            }
          }
        }

        if (retrySuccessCount > 0) {
          console.log(`✅ Successfully registered ${retrySuccessCount} archetypes on retry`);
        }
      }, 100);
    }

    console.log(
      `✅ Initially registered ${successCount}/${BUILT_IN_ARCHETYPES.length} built-in archetypes`,
    );
  } catch (error) {
    console.error('❌ Failed to register built-in archetypes:', error);
    throw error;
  }
}

// Type exports
export type IEntityArchetypeInput = z.infer<typeof EntityArchetypeSchema>;
