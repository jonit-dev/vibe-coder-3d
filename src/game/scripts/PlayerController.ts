/**
 * Player Controller Script
 * Demonstrates Unity-like behavior script for player movement
 */

import { registerScript } from '@core';

export const registerPlayerControllerScript = () => {
  registerScript({
    id: 'game.player-controller',
    onInit: (entityId: number) => {
      console.log(`[PlayerController] Initializing for entity ${entityId}`);

      // Initialize player state
      // In a real implementation, this would set up component references
      // and initialize any script-specific data
    },

    onUpdate: (entityId: number, deltaTime: number) => {
      // Player movement logic would go here
      // This is a simplified example

      // Example: Basic WASD movement (would need input system integration)
      // const transform = getComponent(entityId, 'Transform');
      // if (input.isKeyDown('w')) transform.position[2] += deltaTime * moveSpeed;
      // if (input.isKeyDown('s')) transform.position[2] -= deltaTime * moveSpeed;
      // if (input.isKeyDown('a')) transform.position[0] -= deltaTime * moveSpeed;
      // if (input.isKeyDown('d')) transform.position[0] += deltaTime * moveSpeed;

      // For now, just log occasionally
      if (Math.random() < 0.001) {
        // Very rare logging to avoid spam
        console.log(
          `[PlayerController] Update for entity ${entityId}, deltaTime: ${deltaTime.toFixed(3)}`,
        );
      }
    },

    onDestroy: (entityId: number) => {
      console.log(`[PlayerController] Destroying for entity ${entityId}`);

      // Cleanup any resources or references
      // Remove event listeners, clear timers, etc.
    },
  });
};
