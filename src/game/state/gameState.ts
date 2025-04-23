import { create } from 'zustand';

/**
 * Example game-specific state
 * This is NOT part of the engine, but rather an example of how a game would implement its own state
 */
interface IGameState {
  // Game-specific state
  score: number;
  health: number;
  level: number;
  playerName: string;
  inventory: string[];
  gamePhase: 'menu' | 'playing' | 'paused' | 'gameOver';

  // Game-specific methods
  setScore: (score: number) => void;
  addScore: (amount: number) => void;
  setHealth: (health: number) => void;
  damage: (amount: number) => void;
  heal: (amount: number) => void;
  setLevel: (level: number) => void;
  setPlayerName: (name: string) => void;
  addInventoryItem: (item: string) => void;
  removeInventoryItem: (item: string) => void;
  setGamePhase: (phase: 'menu' | 'playing' | 'paused' | 'gameOver') => void;
}

/**
 * Example implementation - actual games would customize this based on their needs
 */
export const useGameState = create<IGameState>((set) => ({
  // Default values
  score: 0,
  health: 100,
  level: 1,
  playerName: 'Player',
  inventory: [],
  gamePhase: 'menu',

  // Methods
  setScore: (score) => set({ score }),
  addScore: (amount) => set((state) => ({ score: state.score + amount })),
  setHealth: (health) => set({ health }),
  damage: (amount) => set((state) => ({ health: Math.max(0, state.health - amount) })),
  heal: (amount) => set((state) => ({ health: Math.min(100, state.health + amount) })),
  setLevel: (level) => set({ level }),
  setPlayerName: (playerName) => set({ playerName }),
  addInventoryItem: (item) => set((state) => ({ inventory: [...state.inventory, item] })),
  removeInventoryItem: (item) =>
    set((state) => ({
      inventory: state.inventory.filter((i) => i !== item),
    })),
  setGamePhase: (gamePhase) => set({ gamePhase }),
}));
