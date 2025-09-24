/**
 * Core Scene definitions index
 * Register core/editor scenes only
 */

import { registerDefaultScene } from './defaultScene';

export { registerDefaultScene };

// Register core scenes function
export function registerCoreScenes(): void {
  registerDefaultScene();

  console.log('[Core Scenes] Core scenes registered');
}
