import { Profiler, type TimingEntry } from '@/core/lib/perf/Profiler';
import { useEffect, useRef, useState } from 'react';

interface IPerformanceMetrics {
  averageFPS: number;
  frameTime: number;
  renderCount: number;
}

interface IEnhancedPerformanceMetrics extends IPerformanceMetrics {
  profilerStats: {
    totalMeasurements: number;
    topOperations: TimingEntry[];
    memoryUsage?: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

export const usePerformanceMonitor = (enabled: boolean = false) => {
  const metricsRef = useRef<IPerformanceMetrics>({
    averageFPS: 0,
    frameTime: 0,
    renderCount: 0,
  });

  const frameTimesRef = useRef<number[]>([]);
  const lastTimeRef = useRef<number>(performance.now());
  const animationIdRef = useRef<number | undefined>(undefined);

  const [profilerStats, setProfilerStats] = useState({
    totalMeasurements: 0,
    topOperations: [] as TimingEntry[],
    memoryUsage: undefined as IEnhancedPerformanceMetrics['profilerStats']['memoryUsage'],
  });

  useEffect(() => {
    if (!enabled) return;

    const updateMetrics = () => {
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

      // Update profiler stats every 60 frames
      if (metricsRef.current.renderCount % 60 === 0) {
        const stats = Profiler.getStats();
        const topOperations = Profiler.getTopOperations(3); // Top 3 operations

        setProfilerStats({
          totalMeasurements: stats.totalMeasurements,
          topOperations,
          memoryUsage: stats.memoryUsage,
        });
      }

      animationIdRef.current = requestAnimationFrame(updateMetrics);
    };

    animationIdRef.current = requestAnimationFrame(updateMetrics);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [enabled]);

  return {
    metrics: metricsRef.current,
    profilerStats,
  };
};
