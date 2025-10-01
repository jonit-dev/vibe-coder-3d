/**
 * Game Scene definitions index
 * Register all game-specific scenes
 */

import { sceneRegistry } from '@core/lib/scene/SceneRegistry';
import { SceneLoader } from '@core/lib/serialization/SceneLoader';
import { EntityManager } from '@core/lib/ecs/EntityManager';
import { ComponentManager } from '@core/lib/ecs/ComponentManager';
import { MaterialRegistry } from '@core/materials/MaterialRegistry';
import TestScene from './Test';

// Register all game scenes function
export function registerAllScenes(): void {
  // Register Test scene using new data-based format
  sceneRegistry.defineScene(
    'test',
    async () => {
      const sceneLoader = new SceneLoader();
      const entityManager = EntityManager.getInstance();
      const componentManager = ComponentManager.getInstance();

      await sceneLoader.load(
        TestScene.data,
        entityManager,
        componentManager,
        {
          refreshMaterials: () => {
            // Materials already loaded, no store refresh needed in game runtime
          },
          refreshPrefabs: () => {
            // Prefabs already loaded, no store refresh needed in game runtime
          }
        }
      );
    },
    {
      name: TestScene.metadata.name,
      description: 'Test scene with camera, lights, and trees'
    }
  );
}
