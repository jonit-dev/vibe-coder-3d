import { useUIStore } from '@core/stores/uiStore';

export const GameUI = () => {
  const { instructionsVisible, instructionsTitle, instructions, score, actionMessage } =
    useUIStore();

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Instructions Panel */}
      {instructionsVisible && (
        <div className="absolute top-4 left-4 bg-black/80 text-white p-4 rounded-lg max-w-md">
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
      <div className="absolute top-4 right-4 bg-black/80 text-white px-4 py-2 rounded-lg">
        <div className="text-xl font-bold">Score: {score}</div>
      </div>

      {/* Action Message */}
      {actionMessage && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-red-600/90 text-white px-6 py-3 rounded-lg text-lg font-semibold">
          {actionMessage}
        </div>
      )}
    </div>
  );
};

export const GameUIControls = () => {
  const { hideInstructions } = useUIStore();

  return (
    <div className="absolute bottom-4 right-4 pointer-events-auto">
      <button
        onClick={hideInstructions}
        className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
      >
        Hide Instructions
      </button>
    </div>
  );
};

export const GameUIContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative w-full h-full">
      {children}
      <GameUI />
      <GameUIControls />
    </div>
  );
};
