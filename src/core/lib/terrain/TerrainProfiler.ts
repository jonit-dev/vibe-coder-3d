export interface IPerformanceMetrics {
  generationTime: number;
  memoryUsage: number;
  frameRate: number;
  vertexCount: number;
  triangleCount: number;
  textureMemory?: number;
}

export interface IFrameData {
  timestamp: number;
  fps: number;
  memory: number;
  cpuTime: number;
}

class TerrainProfiler {
  private metrics = new Map<string, number>();
  private frameData: IFrameData[] = [];
  private lastFrameTime = 0;
  private frameCount = 0;
  private isEnabled = false;

  // Enable/disable profiling (useful for dev vs production)
  enable() {
    this.isEnabled = true;
    this.lastFrameTime = performance.now();
  }

  disable() {
    this.isEnabled = false;
    this.frameData = [];
  }

  startProfile(label: string) {
    if (!this.isEnabled) return;
    this.metrics.set(`${label}_start`, performance.now());
  }

  endProfile(label: string) {
    if (!this.isEnabled) return;
    const start = this.metrics.get(`${label}_start`);
    if (start !== undefined) {
      const duration = performance.now() - start;
      this.metrics.set(label, duration);
      this.metrics.delete(`${label}_start`);
    }
  }

  recordFrame() {
    if (!this.isEnabled) return;

    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;
    const fps = deltaTime > 0 ? 1000 / deltaTime : 0;

    // Get memory usage if available
    const memory = this.getMemoryUsage();

    this.frameData.push({
      timestamp: now,
      fps,
      memory,
      cpuTime: deltaTime,
    });

    // Keep only last 3 seconds of frame data (assuming 60fps)
    const maxFrames = 180;
    if (this.frameData.length > maxFrames) {
      this.frameData = this.frameData.slice(-maxFrames);
    }

    this.lastFrameTime = now;
    this.frameCount++;
  }

  private getMemoryUsage(): number {
    // Modern browsers support performance.memory
    const memory = (performance as any).memory;
    return memory ? memory.usedJSHeapSize / 1024 / 1024 : 0; // MB
  }

  getMetric(label: string): number {
    return this.metrics.get(label) || 0;
  }

  setMetric(label: string, value: number) {
    if (this.isEnabled) {
      this.metrics.set(label, value);
    }
  }

  getAverageFPS(timeWindow = 1000): number {
    if (this.frameData.length === 0) return 0;

    const now = performance.now();
    const cutoff = now - timeWindow;
    const recentFrames = this.frameData.filter((frame) => frame.timestamp > cutoff);

    if (recentFrames.length === 0) return 0;

    const totalFPS = recentFrames.reduce((sum, frame) => sum + frame.fps, 0);
    return totalFPS / recentFrames.length;
  }

  getMemoryTrend(): 'stable' | 'increasing' | 'decreasing' {
    if (this.frameData.length < 60) return 'stable'; // Need at least 1 second of data

    const recent = this.frameData.slice(-30);
    const older = this.frameData.slice(-60, -30);

    const recentAvg = recent.reduce((sum, frame) => sum + frame.memory, 0) / recent.length;
    const olderAvg = older.reduce((sum, frame) => sum + frame.memory, 0) / older.length;

    const diff = recentAvg - olderAvg;
    const threshold = 5; // 5MB threshold

    if (diff > threshold) return 'increasing';
    if (diff < -threshold) return 'decreasing';
    return 'stable';
  }

  getPerformanceReport(): IPerformanceMetrics & {
    averageFPS: number;
    memoryTrend: 'stable' | 'increasing' | 'decreasing';
    isPerformant: boolean;
    warnings: string[];
  } {
    const averageFPS = this.getAverageFPS();
    const memoryTrend = this.getMemoryTrend();
    const currentMemory = this.getMemoryUsage();

    const warnings: string[] = [];

    // Performance analysis
    if (averageFPS < 30) {
      warnings.push('Low frame rate detected - consider reducing terrain complexity');
    }

    if (currentMemory > 500) {
      warnings.push('High memory usage - check for memory leaks');
    }

    if (memoryTrend === 'increasing') {
      warnings.push('Memory usage is increasing - potential memory leak');
    }

    const generationTime = this.getMetric('terrain_generation');
    if (generationTime > 50) {
      warnings.push('Terrain generation is slow - consider using web worker');
    }

    const isPerformant =
      averageFPS >= 30 &&
      currentMemory < 300 &&
      memoryTrend !== 'increasing' &&
      generationTime < 50;

    return {
      generationTime,
      memoryUsage: currentMemory,
      frameRate: averageFPS,
      vertexCount: this.getMetric('vertex_count'),
      triangleCount: this.getMetric('triangle_count'),
      textureMemory: this.getMetric('texture_memory'),
      averageFPS,
      memoryTrend,
      isPerformant,
      warnings,
    };
  }

  // Get detailed frame timing data for debugging
  getFrameTimings(count = 60): IFrameData[] {
    return this.frameData.slice(-count);
  }

  // Reset all metrics and frame data
  reset() {
    this.metrics.clear();
    this.frameData = [];
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
  }

  // Log performance summary to console
  logPerformance() {
    if (!this.isEnabled) return;

    // Performance report: this.getPerformanceReport();

    // Terrain performance report tracked internally
  }
}

// Singleton instance
export const terrainProfiler = new TerrainProfiler();

// Auto-enable in development
if (process.env.NODE_ENV === 'development') {
  terrainProfiler.enable();
}
