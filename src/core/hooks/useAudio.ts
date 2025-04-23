import { Howler } from 'howler';
import { useEffect } from 'react';
import { create } from 'zustand';

interface IAudioState {
  muted: boolean;
  volume: number; // 0-1
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
}

export const useAudioStore = create<IAudioState>((set) => ({
  muted: false,
  volume: 1,
  setMuted: (muted) => set({ muted }),
  setVolume: (volume) => set({ volume }),
}));

export function useAudio() {
  const muted = useAudioStore((s) => s.muted);
  const volume = useAudioStore((s) => s.volume);

  useEffect(() => {
    Howler.mute(muted);
  }, [muted]);

  useEffect(() => {
    Howler.volume(volume);
  }, [volume]);

  return {
    muted,
    volume,
    setMuted: useAudioStore.getState().setMuted,
    setVolume: useAudioStore.getState().setVolume,
  };
}
