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
    const currentAutoSwitch = get().autoSwitch;
    logger.info('Quality changed', {
      from: get().quality,
      to: quality,
      autoSwitch: currentAutoSwitch,
      action: currentAutoSwitch ? 'keeping auto-switch ON' : 'auto-switch already OFF',
    });
    // Only update quality, preserve auto-switch state
    set({ quality });
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

    // Simple threshold-based quality determination
    // Note: Smoothing is handled in EntityMesh.tsx via distance smoothing (0.8/0.2)
    // and change threshold (0.5 units), so no hysteresis needed here
    let quality: LODQuality;

    if (distance < high) {
      quality = 'original';
    } else if (distance < low) {
      quality = 'high_fidelity';
    } else {
      quality = 'low_fidelity';
    }

    return quality;
  },
}));
