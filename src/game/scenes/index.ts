/**
 * Game Scene definitions index
 * Register all game-specific scenes
 */

import { sceneRegistry, EntityManager, componentRegistry, SceneLoader } from '@core/index';
import ExampleMultiFileScene from './ExampleMultiFile';

// Register all game scenes function
export function registerAllScenes(): void {
  // Register ExampleMultiFile scene (single-file format with global asset references)
  sceneRegistry.defineScene(
    'example-multi-file',
    async () => {
      const sceneLoader = new SceneLoader();
      const entityManager = EntityManager.getInstance();
      const registry = componentRegistry;

      await sceneLoader.load(ExampleMultiFileScene.data, entityManager, registry, {
        refreshMaterials: () => {
          // Materials already loaded, no store refresh needed in game runtime
        },
        refreshPrefabs: () => {
          // Prefabs already loaded, no store refresh needed in game runtime
        },
      });
    },
    {
      name: ExampleMultiFileScene.metadata.name,
      description: ExampleMultiFileScene.metadata.description || 'Example single-file scene',
    },
  );
}
