import React from 'react';

import { useUIStore } from '@core/stores/uiStore';

interface IBowlingUIProps {
  onReset?: () => void;
}

export const BowlingUI: React.FC<IBowlingUIProps> = ({ onReset }) => {
  const {
    instructionsVisible,
    instructionsTitle,
    instructions,
    score,
    actionMessage,
    hideInstructions,
  } = useUIStore();

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Instructions Panel */}
      {instructionsVisible && (
        <div className="absolute top-20 right-4 bg-black/80 text-white p-4 rounded-lg max-w-md">
          <h2 className="text-xl font-bold mb-3">{instructionsTitle}</h2>
          <ul className="space-y-2">
            {instructions.map((instruction) => (
              <li key={instruction.id} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{instruction.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Score Display */}
      <div className="absolute top-4 right-20 bg-black/80 text-white px-4 py-2 rounded-lg">
        <div className="text-xl font-bold">Score: {score}</div>
      </div>

      {/* Action Message */}
      {actionMessage && (
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-red-600/90 text-white px-6 py-3 rounded-lg text-lg font-semibold">
          {actionMessage}
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-4 right-4 pointer-events-auto flex gap-2">
        <button
          onClick={hideInstructions}
          className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
        >
          Hide Instructions
        </button>
        {onReset && (
          <button
            onClick={onReset}
            className="bg-red-800 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Reset Game
          </button>
        )}
      </div>

      {/* Power/Direction UI */}
      <div className="absolute bottom-4 left-4 bg-black/80 text-white p-3 rounded-lg">
        <div className="text-sm">
          <div>⬅️➡️ Move ball left/right</div>
          <div>⬆️⬇️ Adjust power</div>
          <div>SPACE to shoot</div>
        </div>
      </div>
    </div>
  );
};

export default BowlingUI;
