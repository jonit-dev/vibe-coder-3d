import React from 'react';

/**
 * Example Hud component
 *
 * NOTE: This is just a reference implementation. In real usage,
 * games should create their own HUD components in the game-specific code.
 * The engine core should not include game-specific UI elements.
 *
 * Example usage with game state:
 * ```
 * // In actual game code:
 * import { useGameState } from '@/game/state/gameState';
 *
 * export const GameHud: React.FC = () => {
 *   const score = useGameState((s) => s.score);
 *   const health = useGameState((s) => s.health);
 *   // ...render your game-specific HUD
 * };
 * ```
 */
export const Hud: React.FC = () => {
  // This is just a placeholder - in real usage,
  // this would use game-specific state from the game code
  const score = 0;
  const health = 100;

  return (
    <div className="fixed top-4 left-4 z-50 flex flex-col gap-2 text-white">
      <div className="bg-black bg-opacity-60 rounded px-4 py-2 shadow">
        <span className="font-bold">Score:</span> {score}
      </div>
      <div className="bg-black bg-opacity-60 rounded px-4 py-2 shadow flex items-center gap-2">
        <span className="font-bold">Health:</span>
        <div className="w-32 h-4 bg-gray-700 rounded overflow-hidden">
          <div
            className="h-full bg-green-400 transition-all"
            style={{ width: `${Math.max(0, Math.min(health, 100))}%` }}
          />
        </div>
        <span>{health}</span>
      </div>
    </div>
  );
};
