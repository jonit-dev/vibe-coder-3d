/**
 * Game Scene definitions index
 * Register all game-specific scenes
 */

// Export scene files for dynamic import
export { default as Anna } from './Anna';
export { default as CollisionEXAMPLE } from './CollisionEXAMPLE';

// Register all game scenes function
export function registerAllScenes(): void {
  console.log('[Game Scenes] Scene files available for dynamic import');
}
