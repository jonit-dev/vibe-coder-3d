/**
 * Scene Registry - Central registry for code-defined scenes
 * Enables both runtime and editor to load scenes from the same source
 */

import { componentRegistry } from '../ecs/ComponentRegistry';
import { EntityManager } from '../ecs/EntityManager';
import { ECSWorld } from '../ecs/World';
import {
  getRegisteredScenes,
  getScene as getExtensionScene,
} from '../extension/GameExtensionPoints';
import { Logger } from '../logger';
import type {
  CameraData,
  LightData,
  MeshColliderData,
  MeshRendererData,
  RigidBodyData,
  ScriptData,
  SoundData,
  TerrainData,
  TransformData,
} from '../ecs/components/definitions';
import { EntityId } from '../ecs/types';

// Strongly-typed component data map for compile-time validation in scene builders
type ComponentDataMap = {
  Transform: TransformData;
  MeshRenderer: MeshRendererData;
  RigidBody: RigidBodyData;
  MeshCollider: MeshColliderData;
  Camera: CameraData;
  Light: LightData;
  Script: ScriptData;
  Sound: SoundData;
  Terrain: TerrainData;
};

export interface ISceneContext {
  world: unknown;
  entityManager: EntityManager;
  componentRegistry: typeof componentRegistry;
  createEntity: (name: string, parentId?: EntityId) => EntityId;
  addComponent: <K extends keyof ComponentDataMap>(
    entityId: EntityId,
    componentId: K,
    data: ComponentDataMap[K],
  ) => void;
}

export type SceneBuilder = (ctx: ISceneContext) => void | Promise<void>;

export interface ISceneDefinition {
  id: string;
  name: string;
  description?: string;
  builder: SceneBuilder;
  metadata?: {
    author?: string;
    tags?: string[];
    previewImage?: string;
  };
}

class SceneRegistryClass {
  private static instance: SceneRegistryClass;
  private scenes = new Map<string, ISceneDefinition>();
  private currentSceneId: string | null = null;
  private logger = Logger.create('SceneRegistry');

  private constructor() {}

  static getInstance(): SceneRegistryClass {
    if (!SceneRegistryClass.instance) {
      SceneRegistryClass.instance = new SceneRegistryClass();
    }
    return SceneRegistryClass.instance;
  }

  /**
   * Define a new scene
   */
  defineScene(
    id: string,
    builder: SceneBuilder,
    options?: {
      name?: string;
      description?: string;
      metadata?: ISceneDefinition['metadata'];
    },
  ): void {
    const definition: ISceneDefinition = {
      id,
      name: options?.name || id,
      description: options?.description,
      builder,
      metadata: options?.metadata,
    };

    this.scenes.set(id, definition);

  }

  /**
   * Load a scene into the world
   * First checks local scenes, then extension scenes
   */
  async loadScene(id: string, clearExisting: boolean = true): Promise<void> {
    const stepTracker = this.logger.createStepTracker(`Load Scene: ${id}`);

    stepTracker.step('Scene Definition Lookup');
    let definition = this.scenes.get(id);

    // If not found in local registry, check extension scenes
    if (!definition) {
      stepTracker.step('Extension Scene Lookup');
      const extensionScene = getExtensionScene(id);
      if (extensionScene) {
        // Convert extension scene descriptor to our format
        definition = {
          id,
          name: id,
          description: `Extension scene: ${id}`,
          builder: async () => {
            // Call the extension scene load function
            await extensionScene.load();
          },
        };
      }
    }

    if (!definition) {
      stepTracker.complete();
      throw new Error(`Scene not found: ${id}`);
    }

    stepTracker.step('ECS System Setup');
    const entityManager = EntityManager.getInstance();
    const world = ECSWorld.getInstance().getWorld();

    // Clear existing entities if requested
    if (clearExisting) {
      stepTracker.step('Clearing Existing Entities');
      entityManager.clearEntities();
    }

    stepTracker.step('Context Creation');
    // Create context with helper functions
    const context: ISceneContext = {
      world,
      entityManager,
      componentRegistry,

      // Helper to create entity and return just the ID
      createEntity: (name: string, parentId?: EntityId): EntityId => {
        const entity = entityManager.createEntity(name, parentId);
        return entity.id;
      },

      // Helper to add component with compile-time schema typing for scenes
      addComponent: (entityId, componentId, data) => {
        componentRegistry.addComponent(entityId, componentId as string, data as any);
      },
    };

    stepTracker.step('Scene Builder Execution');
    // Execute the scene builder
    await definition.builder(context);

    stepTracker.step('Scene Load Complete');
    this.currentSceneId = id;
    stepTracker.complete();
  }

  /**
   * Get scene definition
   */
  getScene(id: string): ISceneDefinition | undefined {
    return this.scenes.get(id);
  }

  /**
   * List all registered scenes (local and extension scenes)
   */
  listScenes(): ISceneDefinition[] {
    const localScenes = Array.from(this.scenes.values());
    const extensionScenes = Array.from(getRegisteredScenes().values()).map((scene) => ({
      id: scene.id,
      name: scene.id,
      description: `Extension scene: ${scene.id}`,
      builder: async () => {
        await scene.load();
      },
      metadata: {
        tags: ['game', 'extension'],
      },
    }));

    return [...localScenes, ...extensionScenes];
  }

  /**
   * Get current scene ID
   */
  getCurrentSceneId(): string | null {
    return this.currentSceneId;
  }

  /**
   * Clear all scenes (useful for testing)
   */
  clearScenes(): void {
    this.scenes.clear();
    this.currentSceneId = null;
  }
}

// Export singleton instance and types
export const sceneRegistry = SceneRegistryClass.getInstance();

// Convenience function for defining scenes
export function defineScene(
  id: string,
  builder: SceneBuilder,
  options?: Parameters<typeof sceneRegistry.defineScene>[2],
): void {
  sceneRegistry.defineScene(id, builder, options);
}

// Convenience function for loading scenes
export function loadScene(id: string, clearExisting: boolean = true): Promise<void> {
  return sceneRegistry.loadScene(id, clearExisting);
}
