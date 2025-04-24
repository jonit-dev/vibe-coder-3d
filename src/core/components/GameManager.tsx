import { ReactNode, useCallback, useEffect, useState } from 'react';

import { useUIStore } from '@core/stores/uiStore';

export type GameState =
  | 'idle'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'scoring'
  | 'resetting'
  | 'gameOver';

export interface IGameInstruction {
  id: string;
  text: string;
}

export interface IGameManagerProps {
  children: (props: {
    gameState: GameState;
    score: number;
    updateGameState: (newState: GameState) => void;
    updateScore: (scoreChange: number) => void;
    resetGame: () => void;
  }) => ReactNode;
  initialScore?: number;
  initialState?: GameState;
  gameName?: string;
  instructions?: IGameInstruction[];
  onReset?: () => void;
}

/**
 * Generic Game Manager Component
 *
 * A reusable foundation for game state management that can be extended
 * for different game types. Handles common functionality like:
 * - Game state transitions
 * - Score tracking
 * - Instructions display
 * - Basic reset functionality
 */
const GameManager = ({
  children,
  initialScore = 0,
  initialState = 'ready',
  gameName = 'GAME',
  instructions = [],
  onReset,
}: IGameManagerProps) => {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [score, setScore] = useState(initialScore);

  // Get UI store functions
  const { setScore: uiSetScore, showInstructions } = useUIStore();

  // Setup game instructions
  useEffect(() => {
    if (instructions.length > 0) {
      showInstructions(gameName, instructions);
    }
  }, [showInstructions, gameName, instructions]);

  // Update score both internally and in the UI
  const updateScore = useCallback(
    (scoreChange: number) => {
      setScore((prevScore) => {
        const newScore = prevScore + scoreChange;
        uiSetScore(newScore);
        return newScore;
      });
    },
    [uiSetScore],
  );

  // Update game state with callback
  const updateGameState = useCallback((newState: GameState) => {
    setGameState(newState);
  }, []);

  // Reset game state
  const resetGame = useCallback(() => {
    setScore(initialScore);
    uiSetScore(initialScore);
    setGameState(initialState);
    if (onReset) onReset();
  }, [initialScore, initialState, uiSetScore, onReset]);

  // Setup reset key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        resetGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetGame]);

  return children({
    gameState,
    score,
    updateGameState,
    updateScore,
    resetGame,
  });
};

export default GameManager;
