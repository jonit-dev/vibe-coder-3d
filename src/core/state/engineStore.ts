import { create } from 'zustand';

interface EngineState {
  // Rendering settings
  fps: number;
  shadows: boolean;
  quality: 'low' | 'medium' | 'high';

  // Debug settings
  debug: boolean;
  showFps: boolean;

  // Methods
  setFps: (fps: number) => void;
  setShadows: (enabled: boolean) => void;
  setQuality: (quality: 'low' | 'medium' | 'high') => void;
  setDebug: (enabled: boolean) => void;
  setShowFps: (enabled: boolean) => void;
}

export const useEngineStore = create<EngineState>(set => ({
  // Default settings
  fps: 60,
  shadows: true,
  quality: 'medium',
  debug: false,
  showFps: false,

  // Methods
  setFps: fps => set({ fps }),
  setShadows: shadows => set({ shadows }),
  setQuality: quality => set({ quality }),
  setDebug: debug => set({ debug }),
  setShowFps: showFps => set({ showFps }),
}));
