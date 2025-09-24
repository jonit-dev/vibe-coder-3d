/**
 * Scene definitions index
 * Register all available scenes
 */

import { registerDefaultScene } from './defaultScene';
import { registerJSXExampleScene } from './jsxExampleScene';
import { registerSampleScene } from './sampleScene';

export { registerDefaultScene, registerSampleScene, registerJSXExampleScene };

// Register all scenes function
export function registerAllScenes(): void {
  registerDefaultScene();
  registerSampleScene();
  registerJSXExampleScene();

  console.log('[Scenes] All scenes registered');
}
