/**
 * Game Scene definitions index
 * Register all game-specific scenes
 */

import { sceneRegistry, EntityManager, componentRegistry, SceneLoader } from '@core/index';
import TestScene from './Test';

// Register all game scenes function
export function registerAllScenes(): void {
  // Register Test scene using new data-based format
  sceneRegistry.defineScene(
    'test',
    async () => {
      const sceneLoader = new SceneLoader();
      const entityManager = EntityManager.getInstance();
      const registry = componentRegistry;

      await sceneLoader.load(TestScene.data, entityManager, registry, {
        refreshMaterials: () => {
          // Materials already loaded, no store refresh needed in game runtime
        },
        refreshPrefabs: () => {
          // Prefabs already loaded, no store refresh needed in game runtime
        },
      });
    },
    {
      name: TestScene.metadata.name,
      description: 'Test scene with camera, lights, and trees',
    },
  );
}
