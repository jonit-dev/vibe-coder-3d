import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';

interface IPerformanceMetrics {
  averageFPS: number;
  frameTime: number;
  renderCount: number;
}

export const usePerformanceMonitor = (enabled: boolean = false) => {
  const metricsRef = useRef<IPerformanceMetrics>({
    averageFPS: 0,
    frameTime: 0,
    renderCount: 0,
  });

  const frameTimesRef = useRef<number[]>([]);
  const lastTimeRef = useRef<number>(performance.now());

  useFrame(() => {
    if (!enabled) return;

    const now = performance.now();
    const deltaTime = now - lastTimeRef.current;
    lastTimeRef.current = now;

    metricsRef.current.renderCount++;
    frameTimesRef.current.push(deltaTime);

    // Keep only last 60 frames for averaging
    if (frameTimesRef.current.length > 60) {
      frameTimesRef.current.shift();
    }

    // Calculate average FPS and frame time
    const avgFrameTime =
      frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
    metricsRef.current.averageFPS = 1000 / avgFrameTime;
    metricsRef.current.frameTime = avgFrameTime;
  });

  return {
    metrics: metricsRef.current,
  };
};
