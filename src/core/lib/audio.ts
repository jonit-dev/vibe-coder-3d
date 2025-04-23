import { Howl, HowlOptions } from 'howler';
import { useRef } from 'react';

const soundCache: Record<string, Howl> = {};

export function playSound(url: string, options?: HowlOptions): number {
  if (!soundCache[url]) {
    soundCache[url] = new Howl({ src: [url], ...options });
  }
  return soundCache[url].play();
}

export function stopSound(url: string) {
  if (soundCache[url]) {
    soundCache[url].stop();
  }
}

// React hook for triggering a sound effect
export function useSoundEffect(url: string, options?: HowlOptions) {
  const soundIdRef = useRef<number | null>(null);
  const play = () => {
    soundIdRef.current = playSound(url, options);
  };
  const stop = () => {
    if (soundIdRef.current !== null) {
      stopSound(url);
      soundIdRef.current = null;
    }
  };
  return { play, stop };
}
