import { create } from 'zustand';
import { Logger } from '@core/lib/logger';

const logger = Logger.create('LODStore');

export type LODQuality = 'original' | 'high_fidelity' | 'low_fidelity';

export interface ILODDistanceThresholds {
  high: number;
  low: number;
}

interface ILODState {
  // State
  quality: LODQuality;
  autoSwitch: boolean;
  distanceThresholds: ILODDistanceThresholds;

  // Actions
  setQuality: (quality: LODQuality) => void;
  setAutoSwitch: (enabled: boolean) => void;
  setDistanceThresholds: (thresholds: ILODDistanceThresholds) => void;

  // Computed
  getQualityForDistance: (distance: number) => LODQuality;
}

export const useLODStore = create<ILODState>((set, get) => ({
  // Default state
  quality: 'original',
  autoSwitch: true,
  distanceThresholds: {
    high: 50,
    low: 100,
  },

  // Actions
  setQuality: (quality) => {
    logger.info('Quality changed', { from: get().quality, to: quality });
    set({ quality, autoSwitch: false }); // Disable auto-switch when manually setting quality
  },

  setAutoSwitch: (autoSwitch) => {
    logger.info('Auto-switch changed', { enabled: autoSwitch });
    set({ autoSwitch });
  },

  setDistanceThresholds: (distanceThresholds) => {
    logger.debug('Distance thresholds updated', distanceThresholds);
    set({ distanceThresholds });
  },

  // Computed
  getQualityForDistance: (distance) => {
    const state = get();

    if (!state.autoSwitch) {
      return state.quality;
    }

    const { high, low } = state.distanceThresholds;

    if (distance < high) {
      return 'original';
    } else if (distance < low) {
      return 'high_fidelity';
    } else {
      return 'low_fidelity';
    }
  },
}));
