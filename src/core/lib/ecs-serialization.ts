// Enhanced ECS Serialization System with Event Integration
import { hasComponent } from 'bitecs';
import { z } from 'zod';

import {
  Material,
  MeshType,
  MeshTypeEnum,
  Name,
  resetWorld,
  Transform,
  transformQuery,
  Velocity,
  world,
} from './ecs';
import { batchECSEvents } from './ecs-events';
import { ecsManager, IEntityCreateOptions } from './ecs-manager';

export const SCENE_VERSION = 2;

// Legacy version 1 interfaces for migration
interface ILegacyTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

interface ILegacySceneObject {
  id: string;
  name: string;
  shape: string;
  components: {
    Transform: ILegacyTransform;
    Mesh: string;
    Material: string;
  };
}

interface ILegacySerializedScene {
  version: number;
  entities: ILegacySceneObject[];
}

export interface ISerializedComponent {
  name: string;
  data: any;
}

export interface ISerializedEntity {
  id: number;
  name?: string;
  components: ISerializedComponent[];
}

export interface ISerializedScene {
  version: number;
  entities: ISerializedEntity[];
  metadata?: {
    created: string;
    modified: string;
    description?: string;
  };
}

// Enhanced component registry with better type safety
interface IComponentDescriptor<T = any> {
  name: string;
  component: any;
  serialize: (entityId: number) => T | undefined;
  deserialize: (entityId: number, data: T) => void;
  schema: z.ZodSchema<T>;
}

// Schema definitions
const TransformSchema = z.object({
  position: z.tuple([z.number(), z.number(), z.number()]),
  rotation: z.tuple([z.number(), z.number(), z.number()]),
  scale: z.tuple([z.number(), z.number(), z.number()]),
});

const VelocitySchema = z.object({
  linear: z.tuple([z.number(), z.number(), z.number()]),
  angular: z.tuple([z.number(), z.number(), z.number()]),
  linearDamping: z.number(),
  angularDamping: z.number(),
  priority: z.number(),
});

const MaterialSchema = z.object({
  color: z.tuple([z.number(), z.number(), z.number()]),
});

const MeshTypeSchema = z.nativeEnum(MeshTypeEnum);

const NameSchema = z.string();

// Component registry with type safety
const componentRegistry: IComponentDescriptor[] = [
  {
    name: 'transform',
    component: Transform,
    schema: TransformSchema,
    serialize: (entityId: number) => {
      if (!hasComponent(world, Transform, entityId)) return undefined;
      return {
        position: [
          Transform.position[entityId][0],
          Transform.position[entityId][1],
          Transform.position[entityId][2],
        ] as [number, number, number],
        rotation: [
          Transform.rotation[entityId][0],
          Transform.rotation[entityId][1],
          Transform.rotation[entityId][2],
        ] as [number, number, number],
        scale: [
          Transform.scale[entityId][0],
          Transform.scale[entityId][1],
          Transform.scale[entityId][2],
        ] as [number, number, number],
      };
    },
    deserialize: (entityId: number, data: any) => {
      ecsManager.updateTransform(entityId, {
        position: data.position,
        rotation: data.rotation,
        scale: data.scale,
      });
    },
  },
  {
    name: 'meshType',
    component: MeshType,
    schema: MeshTypeSchema,
    serialize: (entityId: number) => {
      if (!hasComponent(world, MeshType, entityId)) return undefined;
      return MeshType.type[entityId] as MeshTypeEnum;
    },
    deserialize: (entityId: number, data: MeshTypeEnum) => {
      MeshType.type[entityId] = data;
    },
  },
  {
    name: 'material',
    component: Material,
    schema: MaterialSchema,
    serialize: (entityId: number) => {
      if (!hasComponent(world, Material, entityId)) return undefined;
      return {
        color: [
          Material.color[entityId][0],
          Material.color[entityId][1],
          Material.color[entityId][2],
        ] as [number, number, number],
      };
    },
    deserialize: (entityId: number, data: any) => {
      ecsManager.updateMaterialColor(entityId, data.color);
    },
  },
  {
    name: 'velocity',
    component: Velocity,
    schema: VelocitySchema,
    serialize: (entityId: number) => {
      if (!hasComponent(world, Velocity, entityId)) return undefined;
      return {
        linear: [
          Velocity.linear[entityId][0],
          Velocity.linear[entityId][1],
          Velocity.linear[entityId][2],
        ] as [number, number, number],
        angular: [
          Velocity.angular[entityId][0],
          Velocity.angular[entityId][1],
          Velocity.angular[entityId][2],
        ] as [number, number, number],
        linearDamping: Velocity.linearDamping[entityId],
        angularDamping: Velocity.angularDamping[entityId],
        priority: Velocity.priority[entityId],
      };
    },
    deserialize: (entityId: number, data: any) => {
      ecsManager.addVelocity(entityId, {
        linear: data.linear,
        angular: data.angular,
        linearDamping: data.linearDamping,
        angularDamping: data.angularDamping,
        priority: data.priority,
      });
    },
  },
  {
    name: 'name',
    component: Name,
    schema: NameSchema,
    serialize: (entityId: number) => {
      if (!hasComponent(world, Name, entityId)) return undefined;
      return ecsManager.getEntityName(entityId);
    },
    deserialize: (entityId: number, data: string) => {
      ecsManager.setEntityName(entityId, data);
    },
  },
];

// Validation schemas
const SerializedComponentSchema = z.object({
  name: z.string(),
  data: z.any(),
});

const SerializedEntitySchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  components: z.array(SerializedComponentSchema),
});

const SceneMetadataSchema = z.object({
  created: z.string(),
  modified: z.string(),
  description: z.string().optional(),
});

const SerializedSceneSchema = z.object({
  version: z.number(),
  entities: z.array(SerializedEntitySchema),
  metadata: SceneMetadataSchema.optional(),
});

/**
 * Enhanced ECS Serialization Manager
 * Integrates with the event system and provides better error handling
 */
export class ECSSerializationManager {
  private static instance: ECSSerializationManager;
  private autoSaveEnabled = false;
  private autoSaveInterval: NodeJS.Timeout | null = null;

  static getInstance(): ECSSerializationManager {
    if (!ECSSerializationManager.instance) {
      ECSSerializationManager.instance = new ECSSerializationManager();
    }
    return ECSSerializationManager.instance;
  }

  /**
   * Export the current scene to a serializable format
   */
  exportScene(metadata?: Partial<ISerializedScene['metadata']>): ISerializedScene {
    const entities: ISerializedEntity[] = [];
    const validEntities = transformQuery(world);

    for (const entityId of validEntities) {
      const serializedComponents: ISerializedComponent[] = [];

      // Serialize all components
      for (const descriptor of componentRegistry) {
        const componentData = descriptor.serialize(entityId);
        if (componentData !== undefined) {
          // Validate the data against the schema
          const validationResult = descriptor.schema.safeParse(componentData);
          if (validationResult.success) {
            serializedComponents.push({
              name: descriptor.name,
              data: validationResult.data,
            });
          } else {
            // Optionally keep this warning, or gate it behind a debug flag
          }
        }
      }

      entities.push({
        id: entityId,
        name: ecsManager.getEntityName(entityId),
        components: serializedComponents,
      });
    }

    const now = new Date().toISOString();
    return {
      version: SCENE_VERSION,
      entities,
      metadata: {
        created: metadata?.created || now,
        modified: now,
        description: metadata?.description,
      },
    };
  }

  /**
   * Import a scene from serialized data
   */
  importScene(sceneData: any, options: { clearExisting?: boolean } = {}): void {
    // Check if this is legacy version 1 data and migrate it
    let migratedSceneData = sceneData;
    if (sceneData.version === 1) {
      console.log('Migrating version 1 scene data to version 2...', sceneData);
      migratedSceneData = this.migrateV1ToV2(sceneData);
      console.log('Migration complete:', migratedSceneData);
    }

    // Validate the scene data
    const validationResult = SerializedSceneSchema.safeParse(migratedSceneData);
    if (!validationResult.success) {
      throw new Error(
        `Invalid scene data: ${JSON.stringify(validationResult.error.format(), null, 2)}`,
      );
    }

    const scene = validationResult.data;

    // Check version compatibility
    if (scene.version > SCENE_VERSION) {
      console.warn(
        `Scene version ${scene.version} is newer than current version ${SCENE_VERSION}. Some features may not work correctly.`,
      );
    }

    // Batch all operations for performance
    batchECSEvents(() => {
      // Clear existing entities if requested
      if (options.clearExisting) {
        this.clearScene();
      }

      // Create entities and components
      for (const entityData of scene.entities) {
        // Extract creation options from components
        const createOptions: IEntityCreateOptions = {};

        for (const component of entityData.components) {
          if (component.name === 'meshType') {
            createOptions.meshType = component.data;
          } else if (component.name === 'transform') {
            createOptions.position = component.data.position;
            createOptions.rotation = component.data.rotation;
            createOptions.scale = component.data.scale;
          } else if (component.name === 'material') {
            createOptions.color = component.data.color;
          } else if (component.name === 'name') {
            createOptions.name = component.data;
          }
        }

        // Create the entity
        const newEntityId = ecsManager.createEntity(createOptions);

        // Apply remaining components
        for (const component of entityData.components) {
          const descriptor = componentRegistry.find((d) => d.name === component.name);
          if (
            descriptor &&
            !['meshType', 'transform', 'material', 'name'].includes(component.name)
          ) {
            console.log(
              `Applying component ${component.name} to entity ${newEntityId}:`,
              component.data,
            );
            descriptor.deserialize(newEntityId, component.data);
          }
        }
      }
    });
  }

  /**
   * Clear the current scene
   */
  clearScene(): void {
    batchECSEvents(() => {
      resetWorld();
    });
  }

  /**
   * Migrate version 1 scene data to version 2 format
   */
  private migrateV1ToV2(v1Data: ILegacySerializedScene): ISerializedScene {
    console.log('Migrating scene from version 1 to version 2...');
    console.log('Input v1Data:', JSON.stringify(v1Data, null, 2));

    const migratedEntities: ISerializedEntity[] = [];

    for (const legacyEntity of v1Data.entities) {
      console.log('Processing legacy entity:', legacyEntity);

      // Convert legacy entity to new format
      const components: ISerializedComponent[] = [];

      // Add transform component
      if (legacyEntity.components && legacyEntity.components.Transform) {
        const transformData = {
          position: legacyEntity.components.Transform.position,
          rotation: legacyEntity.components.Transform.rotation,
          scale: legacyEntity.components.Transform.scale,
        };
        console.log('Adding transform component:', transformData);
        components.push({
          name: 'transform',
          data: transformData,
        });
      } else {
        console.warn('No Transform component found in legacy entity:', legacyEntity);
      }

      // Add mesh type component based on shape
      let meshType = MeshTypeEnum.Cube; // default
      switch (legacyEntity.shape) {
        case 'Sphere':
          meshType = MeshTypeEnum.Sphere;
          break;
        case 'Cylinder':
          meshType = MeshTypeEnum.Cylinder;
          break;
        case 'Cone':
          meshType = MeshTypeEnum.Cone;
          break;
        case 'Torus':
          meshType = MeshTypeEnum.Torus;
          break;
        case 'Plane':
          meshType = MeshTypeEnum.Plane;
          break;
        case 'Cube':
        default:
          meshType = MeshTypeEnum.Cube;
          break;
      }

      components.push({
        name: 'meshType',
        data: meshType,
      });

      // Add material component with default color
      components.push({
        name: 'material',
        data: {
          color: [0.2, 0.6, 1.0], // Default blue color
        },
      });

      // Add name component
      components.push({
        name: 'name',
        data: legacyEntity.name,
      });

      migratedEntities.push({
        id: parseInt(legacyEntity.id),
        name: legacyEntity.name,
        components,
      });
    }

    return {
      version: SCENE_VERSION,
      entities: migratedEntities,
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        description: 'Migrated from version 1',
      },
    };
  }

  /**
   * Save scene to local storage with key
   */
  saveToLocalStorage(key: string, metadata?: Partial<ISerializedScene['metadata']>): void {
    try {
      const scene = this.exportScene(metadata);
      localStorage.setItem(key, JSON.stringify(scene));
      console.log(`Scene saved to localStorage with key: ${key}`);
    } catch (error) {
      console.error('Failed to save scene to localStorage:', error);
      throw error;
    }
  }

  /**
   * Load scene from local storage
   */
  loadFromLocalStorage(key: string, options?: { clearExisting?: boolean }): void {
    try {
      const sceneData = localStorage.getItem(key);
      if (!sceneData) {
        throw new Error(`No scene found with key: ${key}`);
      }

      const scene = JSON.parse(sceneData);
      this.importScene(scene, options);
      console.log(`Scene loaded from localStorage with key: ${key}`);
    } catch (error) {
      console.error('Failed to load scene from localStorage:', error);
      throw error;
    }
  }

  /**
   * Enable auto-save functionality
   */
  enableAutoSave(intervalMs: number = 30000, key: string = 'autosave'): void {
    this.disableAutoSave(); // Clear any existing interval

    this.autoSaveInterval = setInterval(() => {
      try {
        this.saveToLocalStorage(key, { description: 'Auto-saved scene' });
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, intervalMs);

    this.autoSaveEnabled = true;
    console.log(`Auto-save enabled with ${intervalMs}ms interval`);
  }

  /**
   * Disable auto-save functionality
   */
  disableAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
    this.autoSaveEnabled = false;
  }

  /**
   * Get auto-save status
   */
  isAutoSaveEnabled(): boolean {
    return this.autoSaveEnabled;
  }

  /**
   * Register a new component for serialization
   */
  registerComponent<T>(descriptor: IComponentDescriptor<T>): void {
    const existingIndex = componentRegistry.findIndex((d) => d.name === descriptor.name);
    if (existingIndex >= 0) {
      componentRegistry[existingIndex] = descriptor;
      console.log(`Updated component registration: ${descriptor.name}`);
    } else {
      componentRegistry.push(descriptor);
      console.log(`Registered new component: ${descriptor.name}`);
    }
  }

  /**
   * Get list of registered components
   */
  getRegisteredComponents(): string[] {
    return componentRegistry.map((d) => d.name);
  }
}

// Export singleton instance
export const ecsSerializer = ECSSerializationManager.getInstance();

// Hook for React components
export function useECSSceneSerialization() {
  return {
    exportScene: (metadata?: Partial<ISerializedScene['metadata']>) =>
      ecsSerializer.exportScene(metadata),
    importScene: (sceneData: any, options?: { clearExisting?: boolean }) =>
      ecsSerializer.importScene(sceneData, options),
    clearScene: () => ecsSerializer.clearScene(),
    saveToLocalStorage: (key: string, metadata?: Partial<ISerializedScene['metadata']>) =>
      ecsSerializer.saveToLocalStorage(key, metadata),
    loadFromLocalStorage: (key: string, options?: { clearExisting?: boolean }) =>
      ecsSerializer.loadFromLocalStorage(key, options),
    enableAutoSave: (intervalMs?: number, key?: string) =>
      ecsSerializer.enableAutoSave(intervalMs, key),
    disableAutoSave: () => ecsSerializer.disableAutoSave(),
    isAutoSaveEnabled: () => ecsSerializer.isAutoSaveEnabled(),
  };
}
