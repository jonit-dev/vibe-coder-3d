/**
 * Game Scene definitions index
 * Register all game-specific scenes
 */

import { registerDefaultScene } from './defaultScene';
import { registerJSXExampleScene } from './jsxExampleScene';

export { registerDefaultScene, registerJSXExampleScene };

// Register all game scenes function
export function registerAllScenes(): void {
  registerDefaultScene();
  registerJSXExampleScene();

  console.log('[Game Scenes] All game scenes registered');
}
