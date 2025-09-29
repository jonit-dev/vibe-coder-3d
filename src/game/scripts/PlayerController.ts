/**
 * Player Controller Script
 * Demonstrates Unity-like behavior script for player movement
 */

import { registerScript } from '@core';

export const registerPlayerControllerScript = () => {
  registerScript({
    id: 'game.player-controller',
    onInit: (_entityId: number) => {

      // Initialize player state
      // In a real implementation, this would set up component references
      // and initialize any script-specific data
    },

    onUpdate: (_entityId: number, _deltaTime: number) => {
      // Player movement logic would go here
      // This is a simplified example

      // Example: Basic WASD movement (would need input system integration)
      // const transform = getComponent(entityId, 'Transform');
      // if (input.isKeyDown('w')) transform.position[2] += deltaTime * moveSpeed;
      // if (input.isKeyDown('s')) transform.position[2] -= deltaTime * moveSpeed;
      // if (input.isKeyDown('a')) transform.position[0] -= deltaTime * moveSpeed;
      // if (input.isKeyDown('d')) transform.position[0] += deltaTime * moveSpeed;

      // For now, just log occasionally
      // PlayerController update logic
    },

    onDestroy: (_entityId: number) => {

      // Cleanup any resources or references
      // Remove event listeners, clear timers, etc.
    },
  });
};
