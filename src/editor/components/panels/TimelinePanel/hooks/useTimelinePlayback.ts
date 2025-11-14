import { useEffect, useRef } from 'react';
import { useTimelineStore } from '@editor/store/timelineStore';

export function useTimelinePlayback() {
  const { playing, loop, currentTime, setCurrentTime, pause, activeClip } =
    useTimelineStore();

  const lastTimeRef = useRef(Date.now());

  useEffect(() => {
    if (!playing || !activeClip) return;

    let animationFrameId: number;

    const tick = () => {
      const now = Date.now();
      const deltaTime = (now - lastTimeRef.current) / 1000; // Convert to seconds
      lastTimeRef.current = now;

      const newTime = currentTime + deltaTime * (activeClip.timeScale || 1);

      if (newTime >= activeClip.duration) {
        if (loop) {
          setCurrentTime(newTime % activeClip.duration);
        } else {
          setCurrentTime(activeClip.duration);
          pause();
        }
      } else {
        setCurrentTime(newTime);
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    lastTimeRef.current = Date.now();
    animationFrameId = requestAnimationFrame(tick);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [playing, loop, currentTime, activeClip, setCurrentTime, pause]);
}
