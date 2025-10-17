import { create } from 'zustand';

interface IEngineState {
  // Rendering settings
  fps: number;
  shadows: boolean;
  quality: 'low' | 'medium' | 'high';
  bvhCulling: boolean;

  // Debug settings
  debug: boolean;
  showFps: boolean;

  // Methods
  setFps: (fps: number) => void;
  setShadows: (enabled: boolean) => void;
  setQuality: (quality: 'low' | 'medium' | 'high') => void;
  setBvhCulling: (enabled: boolean) => void;
  setDebug: (enabled: boolean) => void;
  setShowFps: (enabled: boolean) => void;
}

export const useEngineStore = create<IEngineState>((set) => ({
  // Default settings
  fps: 60,
  shadows: true,
  quality: 'medium',
  bvhCulling: true, // Enabled by default - uses layers system to preserve physics simulation
  debug: false,
  showFps: false,

  // Methods
  setFps: (fps) => set({ fps }),
  setShadows: (shadows) => set({ shadows }),
  setQuality: (quality) => set({ quality }),
  setBvhCulling: (bvhCulling) => set({ bvhCulling }),
  setDebug: (debug) => set({ debug }),
  setShowFps: (showFps) => set({ showFps }),
}));
