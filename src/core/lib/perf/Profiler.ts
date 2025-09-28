/**
 * Performance profiler for measuring execution time and memory usage
 * Provides timing utilities and performance marks for system analysis
 */

export interface IProfiler {
  time<T>(name: string, fn: () => T): T;
  timeAsync<T>(name: string, fn: () => Promise<T>): Promise<T>;
  mark(name: string): void;
  measure(name: string, startMark?: string, endMark?: string): number;
  getStats(): IProfilerStats;
  clear(): void;
  enableConsoleReporting(interval?: number): void;
  disableConsoleReporting(): void;
}

export interface ITimingEntry {
  name: string;
  duration: number;
  count: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  lastTime: number;
}

export interface IProfilerStats {
  timings: Map<string, ITimingEntry>;
  marks: Map<string, number>;
  totalMeasurements: number;
  memoryUsage?: {
    used: number;
    total: number;
    percentage: number;
  };
}

class ProfilerImpl implements IProfiler {
  private timings = new Map<string, ITimingEntry>();
  private marks = new Map<string, number>();
  private consoleReportingInterval: number | null = null;
  private frameCount = 0;
  private readonly CONSOLE_REPORT_INTERVAL = 60; // Report every 60 frames

  time<T>(name: string, fn: () => T): T {
    const startTime = performance.now();
    try {
      const result = fn();
      const endTime = performance.now();
      this.recordTiming(name, endTime - startTime);
      return result;
    } catch (error) {
      const endTime = performance.now();
      this.recordTiming(name, endTime - startTime);
      throw error;
    }
  }

  async timeAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const endTime = performance.now();
      this.recordTiming(name, endTime - startTime);
      return result;
    } catch (error) {
      const endTime = performance.now();
      this.recordTiming(name, endTime - startTime);
      throw error;
    }
  }

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark?: string, endMark?: string): number {
    const startTime = startMark ? this.marks.get(startMark) : this.marks.get(`${name}:start`);
    const endTime = endMark ? this.marks.get(endMark) : this.marks.get(`${name}:end`);

    if (startTime === undefined || endTime === undefined) {
      throw new Error(`Performance marks not found for measurement: ${name}`);
    }

    const duration = endTime - startTime;
    this.recordTiming(name, duration);
    return duration;
  }

  private recordTiming(name: string, duration: number): void {
    const existing = this.timings.get(name);

    if (existing) {
      existing.count++;
      existing.totalTime += duration;
      existing.averageTime = existing.totalTime / existing.count;
      existing.minTime = Math.min(existing.minTime, duration);
      existing.maxTime = Math.max(existing.maxTime, duration);
      existing.lastTime = duration;
    } else {
      this.timings.set(name, {
        name,
        duration,
        count: 1,
        totalTime: duration,
        averageTime: duration,
        minTime: duration,
        maxTime: duration,
        lastTime: duration,
      });
    }

    // Periodic console reporting in development
    this.frameCount++;
    if (this.shouldReportToConsole()) {
      this.reportToConsole();
    }
  }

  private shouldReportToConsole(): boolean {
    return (
      process.env.NODE_ENV === 'development' &&
      this.consoleReportingInterval !== null &&
      this.frameCount % this.CONSOLE_REPORT_INTERVAL === 0
    );
  }

  private reportToConsole(): void {
    if (this.timings.size === 0) return;

    const stats = this.getStats();
    console.group('🚀 Performance Report');
    console.log(`Total measurements: ${stats.totalMeasurements}`);

    // Sort by total time descending
    const sortedTimings = Array.from(stats.timings.values()).sort(
      (a, b) => b.totalTime - a.totalTime,
    );

    for (const timing of sortedTimings) {
      console.log(
        `${timing.name}: ${timing.averageTime.toFixed(2)}ms avg (${timing.count} calls, ${timing.totalTime.toFixed(2)}ms total)`,
      );
    }

    if (stats.memoryUsage) {
      console.log(
        `Memory: ${stats.memoryUsage.used}MB / ${stats.memoryUsage.total}MB (${stats.memoryUsage.percentage.toFixed(1)}%)`,
      );
    }

    console.groupEnd();
  }

  getStats(): IProfilerStats {
    const memoryUsage = this.getMemoryUsage();

    return {
      timings: new Map(this.timings),
      marks: new Map(this.marks),
      totalMeasurements: Array.from(this.timings.values()).reduce(
        (sum, timing) => sum + timing.count,
        0,
      ),
      memoryUsage,
    };
  }

  private getMemoryUsage() {
    // Check if performance.memory is available (Chrome/Edge)
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100),
      };
    }
    return undefined;
  }

  clear(): void {
    this.timings.clear();
    this.marks.clear();
    this.frameCount = 0;
  }

  enableConsoleReporting(interval: number = this.CONSOLE_REPORT_INTERVAL): void {
    this.consoleReportingInterval = interval;
  }

  disableConsoleReporting(): void {
    this.consoleReportingInterval = null;
  }

  // Utility method to wrap a function with timing
  wrap<T extends (...args: any[]) => any>(name: string, fn: T): T {
    return ((...args: Parameters<T>) => {
      return this.time(name, () => fn(...args));
    }) as T;
  }

  // Utility method to wrap an async function with timing
  wrapAsync<T extends (...args: any[]) => Promise<any>>(name: string, fn: T): T {
    return ((...args: Parameters<T>) => {
      return this.timeAsync(name, () => fn(...args));
    }) as T;
  }

  // Get the most expensive operations
  getTopOperations(limit: number = 10): ITimingEntry[] {
    return Array.from(this.timings.values())
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, limit);
  }

  // Export data for external analysis
  exportData() {
    return {
      timings: Array.from(this.timings.entries()),
      marks: Array.from(this.marks.entries()),
      frameCount: this.frameCount,
      timestamp: Date.now(),
    };
  }
}

// Export the class for advanced usage
export { ProfilerImpl as ProfilerClass };

// Global profiler instance
export const Profiler = new ProfilerImpl();

// Console reporting disabled by default
// Uncomment to enable: Profiler.enableConsoleReporting();

// Convenience functions for global usage
export function time<T>(name: string, fn: () => T): T {
  return Profiler.time(name, fn);
}

export function timeAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return Profiler.timeAsync(name, fn);
}

export function mark(name: string): void {
  Profiler.mark(name);
}

export function measure(name: string, startMark?: string, endMark?: string): number {
  return Profiler.measure(name, startMark, endMark);
}
