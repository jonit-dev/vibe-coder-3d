/**
 * Scripts index
 * Register all game scripts
 */

import { registerPlayerControllerScript } from './PlayerController';

export { registerPlayerControllerScript };

// Register all scripts function
export function registerAllScripts(): void {
  registerPlayerControllerScript();

  console.log('[Scripts] All scripts registered');
}
