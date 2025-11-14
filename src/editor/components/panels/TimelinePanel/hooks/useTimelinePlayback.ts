import { useEffect, useRef } from 'react';
import { useTimelineStore } from '@editor/store/timelineStore';
import { animationApi } from '@core/systems/AnimationSystem';

export function useTimelinePlayback() {
  const { playing, loop, currentTime, setCurrentTime, pause, activeClip, activeEntityId } =
    useTimelineStore();

  const lastTimeRef = useRef(Date.now());
  const currentTimeRef = useRef(currentTime);

  // Keep a ref in sync with currentTime so the RAF loop can read it without
  // re-subscribing on every state change.
  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  // Drive the playhead when the timeline is in "playing" mode.
  useEffect(() => {
    if (!playing || !activeClip) return;

    let animationFrameId: number;

    const tick = () => {
      const now = Date.now();
      const deltaTime = (now - lastTimeRef.current) / 1000; // Convert to seconds
      lastTimeRef.current = now;

      const newTime = currentTimeRef.current + deltaTime * (activeClip.timeScale || 1);

      if (newTime >= activeClip.duration) {
        if (loop) {
          setCurrentTime(newTime % activeClip.duration);
          currentTimeRef.current = newTime % activeClip.duration;
        } else {
          setCurrentTime(activeClip.duration);
          currentTimeRef.current = activeClip.duration;
          pause();
          return;
        }
      } else {
        setCurrentTime(newTime);
        currentTimeRef.current = newTime;
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
  }, [playing, loop, activeClip, setCurrentTime, pause]);

  // Whenever the timeline time changes, push it into the runtime animation
  // system so the viewport updates during scrubbing or playback.
  useEffect(() => {
    if (!activeClip || activeEntityId == null) return;

    animationApi.setTime(activeEntityId, currentTimeRef.current);
  }, [activeClip, activeEntityId, currentTime]);
}
