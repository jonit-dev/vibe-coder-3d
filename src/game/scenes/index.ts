/* eslint-disable import/no-restricted-paths */
import { sceneRegistry } from '@core/lib/scene/SceneRegistry';
import { SceneLoader } from '@core/lib/serialization/SceneLoader';
import { EntityManager } from '@core/lib/ecs/EntityManager';
import { componentRegistry } from '@core/lib/ecs/ComponentRegistry';
import TestPhysicsScene from './testphysics';
import ExampleMultiFileScene from './examplemultifile';
import FmlScene from './fml';
import ForestScene from './forest';

export function registerAllScenes(): void {
  // Register testphysics scene
  sceneRegistry.defineScene(
    'testphysics',
    async () => {
      const sceneLoader = new SceneLoader();
      const entityManager = EntityManager.getInstance();
      const componentManager = componentRegistry;

      await sceneLoader.load(TestPhysicsScene.data, entityManager, componentManager, {
        refreshMaterials: () => {},
        refreshPrefabs: () => {},
      });
    },
    {
      name: TestPhysicsScene.metadata.name,
      description: TestPhysicsScene.metadata.description || 'Physics test scene',
    },
  );

  // Register examplemultifile scene
  sceneRegistry.defineScene(
    'examplemultifile',
    async () => {
      const sceneLoader = new SceneLoader();
      const entityManager = EntityManager.getInstance();
      const componentManager = componentRegistry;

      await sceneLoader.load(ExampleMultiFileScene.data, entityManager, componentManager, {
        refreshMaterials: () => {},
        refreshPrefabs: () => {},
      });
    },
    {
      name: ExampleMultiFileScene.metadata.name,
      description: ExampleMultiFileScene.metadata.description || 'Example multi-file scene',
    },
  );

  // Register fml scene
  sceneRegistry.defineScene(
    'fml',
    async () => {
      const sceneLoader = new SceneLoader();
      const entityManager = EntityManager.getInstance();
      const componentManager = componentRegistry;

      await sceneLoader.load(FmlScene.data, entityManager, componentManager, {
        refreshMaterials: () => {},
        refreshPrefabs: () => {},
      });
    },
    {
      name: FmlScene.metadata.name,
      description: FmlScene.metadata.description || 'FML scene',
    },
  );

  // Register forest scene
  sceneRegistry.defineScene(
    'forest',
    async () => {
      const sceneLoader = new SceneLoader();
      const entityManager = EntityManager.getInstance();
      const componentManager = componentRegistry;

      await sceneLoader.load(ForestScene.data, entityManager, componentManager, {
        refreshMaterials: () => {},
        refreshPrefabs: () => {},
      });
    },
    {
      name: ForestScene.metadata.name,
      description: ForestScene.metadata.description || 'Peaceful forest scene',
    },
  );
}
