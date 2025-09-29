import { IGameProjectConfig } from '@core';
// Note: initializeGameProject is called automatically by the project store
import gameConfig from './config/game.config.json';
import { registerAllScenes } from './scenes';
import { registerAllScripts } from './scripts';

// Guard to prevent double registration in React StrictMode
let extensionsRegistered = false;

// Import and register game components, systems, scripts, prefabs, and scenes
// This function will be called by the editor/runtime at initialization
export function registerGameExtensions(): void {
  if (extensionsRegistered) {
    return;
  }

  // Register all scenes using the traditional SceneRegistry approach
  registerAllScenes();

  // Register all scripts using extension points
  registerAllScripts();

  // TODO: Register game components using extension points
  // registerComponent({ ... });

  // TODO: Register game systems using extension points
  // registerSystem({ ... });

  // TODO: Register game prefabs using extension points
  // registerPrefab({ ... });

  extensionsRegistered = true;
}

export const gameProjectConfig: IGameProjectConfig = {
  name: gameConfig.name,
  version: gameConfig.version,
  assetBasePath: gameConfig.assetBasePath,
  startupScene: gameConfig.startupScene,
};
