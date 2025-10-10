import { useEffect, useRef, useState } from 'react';

/**
 * Lightweight FPS counter hook
 * Only updates display once per second to minimize re-renders
 */
export const useFPS = () => {
  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const animationIdRef = useRef<number>();

  useEffect(() => {
    let frameCount = 0;
    let lastUpdateTime = performance.now();

    const measureFPS = () => {
      frameCount++;
      const now = performance.now();
      const elapsed = now - lastUpdateTime;

      // Update FPS display once per second
      if (elapsed >= 1000) {
        setFps(Math.round((frameCount * 1000) / elapsed));
        frameCount = 0;
        lastUpdateTime = now;
      }

      animationIdRef.current = requestAnimationFrame(measureFPS);
    };

    animationIdRef.current = requestAnimationFrame(measureFPS);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  return fps;
};
