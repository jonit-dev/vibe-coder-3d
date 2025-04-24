import { create } from 'zustand';

// Basic scoring interfaces
export interface IScoreEvent {
  type: string;
  points: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface IScoreMultiplier {
  id: string;
  factor: number;
  duration: number; // in milliseconds, 0 for permanent
  startTime: number;
}

// Scoring system state interface
interface IScoringState {
  // Basic scoring
  score: number;
  highScore: number;
  scoreHistory: IScoreEvent[];

  // Multipliers
  multipliers: IScoreMultiplier[];

  // Combo system
  comboCount: number;
  comboTimer: number | null;
  comboTimeWindow: number; // in milliseconds

  // Actions
  addPoints: (points: number, eventType: string, metadata?: Record<string, any>) => number;
  addMultiplier: (id: string, factor: number, duration: number) => void;
  removeMultiplier: (id: string) => void;
  resetCombo: () => void;
  resetScore: () => void;
  resetAll: () => void;
}

// Create the store
export const useScoringStore = create<IScoringState>((set, get) => ({
  // Initial state
  score: 0,
  highScore: 0,
  scoreHistory: [],
  multipliers: [],
  comboCount: 0,
  comboTimer: null,
  comboTimeWindow: 5000, // Default: 5 seconds

  // Add points with multipliers applied
  addPoints: (points, eventType, metadata = {}) => {
    const state = get();
    const now = Date.now();

    // Apply multipliers
    let totalMultiplier = 1;
    const activeMultipliers = state.multipliers.filter(
      (m) => m.duration === 0 || now < m.startTime + m.duration,
    );

    // Calculate total multiplier from all active multipliers
    activeMultipliers.forEach((m) => {
      totalMultiplier *= m.factor;
    });

    // Calculate combo bonus
    const comboBonus = Math.max(1, Math.min(2, 1 + state.comboCount * 0.1));

    // Calculate final points
    const finalPoints = Math.floor(points * totalMultiplier * comboBonus);
    const newScore = state.score + finalPoints;
    const newHighScore = Math.max(state.highScore, newScore);

    // Create score event
    const scoreEvent: IScoreEvent = {
      type: eventType,
      points: finalPoints,
      timestamp: now,
      metadata: {
        ...metadata,
        basePoints: points,
        multiplier: totalMultiplier,
        comboBonus,
      },
    };

    // Update combo
    const newComboCount = state.comboCount + 1;

    // Clear any existing combo timer
    if (state.comboTimer !== null) {
      window.clearTimeout(state.comboTimer);
    }

    // Set a new combo timer
    const comboTimer = window.setTimeout(() => {
      set({ comboCount: 0, comboTimer: null });
    }, state.comboTimeWindow);

    // Update state
    set({
      score: newScore,
      highScore: newHighScore,
      scoreHistory: [...state.scoreHistory, scoreEvent],
      comboCount: newComboCount,
      comboTimer,
      multipliers: activeMultipliers, // Keep only active multipliers
    });

    return finalPoints;
  },

  // Add a score multiplier
  addMultiplier: (id, factor, duration) => {
    set((state) => {
      // Remove any existing multiplier with the same ID
      const filteredMultipliers = state.multipliers.filter((m) => m.id !== id);

      // Add the new multiplier
      const newMultiplier: IScoreMultiplier = {
        id,
        factor,
        duration,
        startTime: Date.now(),
      };

      return {
        multipliers: [...filteredMultipliers, newMultiplier],
      };
    });
  },

  // Remove a specific multiplier
  removeMultiplier: (id) => {
    set((state) => ({
      multipliers: state.multipliers.filter((m) => m.id !== id),
    }));
  },

  // Reset combo
  resetCombo: () => {
    set((state) => {
      if (state.comboTimer !== null) {
        window.clearTimeout(state.comboTimer);
      }
      return { comboCount: 0, comboTimer: null };
    });
  },

  // Reset score only
  resetScore: () => {
    set((_state) => ({
      score: 0,
      scoreHistory: [],
    }));
  },

  // Reset everything
  resetAll: () => {
    set((state) => {
      if (state.comboTimer !== null) {
        window.clearTimeout(state.comboTimer);
      }
      return {
        score: 0,
        scoreHistory: [],
        multipliers: [],
        comboCount: 0,
        comboTimer: null,
      };
    });
  },
}));

// Score calculation utilities
export const scoreUtils = {
  // Calculate time-based score degradation
  calculateTimeBasedScore: (baseScore: number, timeMs: number, maxTimeMs: number): number => {
    const timeRatio = Math.max(0, Math.min(1, 1 - timeMs / maxTimeMs));
    return Math.floor(baseScore * timeRatio);
  },

  // Calculate distance-based score degradation
  calculateDistanceBasedScore: (
    baseScore: number,
    distance: number,
    maxDistance: number,
  ): number => {
    const distanceRatio = Math.max(0, Math.min(1, 1 - distance / maxDistance));
    return Math.floor(baseScore * distanceRatio);
  },

  // Calculate streak bonus
  calculateStreakBonus: (baseScore: number, streak: number, cap: number = 10): number => {
    const streakMultiplier = 1 + Math.min(streak, cap) * 0.1;
    return Math.floor(baseScore * streakMultiplier);
  },

  // Format score with commas for display
  formatScore: (score: number): string => {
    return score.toLocaleString();
  },
};
