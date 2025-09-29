/**
 * CI Performance Check
 * Validates that performance optimizations don't introduce regressions
 * Can be run in CI/CD pipelines to gate deployments
 */

import { Profiler, ITimingEntry } from './Profiler';
import { runEventBenchmarks } from './benchmarks/eventBenchmarks';
import { runTransformBenchmarks } from './benchmarks/transformBenchmarks';

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  // Transform benchmarks
  transformTraditional_100entities_50iterations: 50,
  transformPooled_100entities_50iterations: 50,
  transformTraditional_1000entities_50iterations: 500,
  transformPooled_1000entities_50iterations: 500,
  memoryAllocation_traditional_10000: 100,
  memoryAllocation_pooled_10000: 100,

  // Event benchmarks
  mittEmission_1000events_10handlers: 20,
  batchedEmission_1000events_10handlers: 20,
  mittEmission_10000events_100handlers: 200,
  batchedEmission_10000events_100handlers: 200,
  batchedCoalescing_10000events: 20,
  mittHandlerRegistration_1000: 50,
  batchedHandlerRegistration_1000: 50,
  mixedEvents_3000: 50,
};

// Memory thresholds (in MB)
const MEMORY_THRESHOLDS = {
  maxMemoryUsage: 100,
  maxMemoryIncrease: 10, // Allow 10MB increase from baseline
};

interface IPerformanceCheckResult {
  passed: boolean;
  score: number;
  maxScore: number;
  failures: string[];
  warnings: string[];
  details: {
    timings: Record<string, number>;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

class PerformanceChecker {
  private currentTimings: Map<string, ITimingEntry> = new Map();

  constructor() {
    // In a real implementation, you would load baseline timings from a file or database
    // For now, we'll establish baseline on first run
  }

  async runPerformanceChecks(): Promise<IPerformanceCheckResult> {

    // Clear previous results
    Profiler.clear();

    // Run benchmarks
    await this.runBenchmarks();

    // Collect timing data
    this.collectTimings();

    // Check performance
    const result = this.validatePerformance();

    // Report results
    this.reportResults(result);

    return result;
  }

  private async runBenchmarks(): Promise<void> {
    // Run transform benchmarks
    runTransformBenchmarks();

    // Run event benchmarks
    runEventBenchmarks();

    // Wait a bit for all async operations to complete
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  private collectTimings(): void {
    const stats = Profiler.getStats();

    // Convert timing entries to our format
    for (const [name, entry] of stats.timings.entries()) {
      this.currentTimings.set(name, entry);
    }
  }

  private validatePerformance(): IPerformanceCheckResult {
    const failures: string[] = [];
    const warnings: string[] = [];
    let score = 0;
    const maxScore = Object.keys(PERFORMANCE_THRESHOLDS).length;

    // Check each performance threshold
    for (const [benchmarkName, threshold] of Object.entries(PERFORMANCE_THRESHOLDS)) {
      const timing = this.currentTimings.get(benchmarkName);

      if (!timing) {
        failures.push(`Missing benchmark result: ${benchmarkName}`);
        continue;
      }

      if (timing.averageTime > threshold) {
        failures.push(
          `Performance regression in ${benchmarkName}: ${timing.averageTime.toFixed(2)}ms > ${threshold}ms threshold`,
        );
      } else {
        score++;
      }
    }

    // Check memory usage
    const memoryUsage = this.getMemoryUsage();
    if (memoryUsage) {
      if (memoryUsage.used > MEMORY_THRESHOLDS.maxMemoryUsage) {
        failures.push(
          `Memory usage too high: ${memoryUsage.used}MB > ${MEMORY_THRESHOLDS.maxMemoryUsage}MB`,
        );
      } else if (
        memoryUsage.used >
        MEMORY_THRESHOLDS.maxMemoryUsage - MEMORY_THRESHOLDS.maxMemoryIncrease
      ) {
        warnings.push(
          `High memory usage: ${memoryUsage.used}MB (threshold: ${MEMORY_THRESHOLDS.maxMemoryUsage}MB)`,
        );
      }
    }

    const passed = failures.length === 0;

    return {
      passed,
      score,
      maxScore,
      failures,
      warnings,
      details: {
        timings: Object.fromEntries(
          Array.from(this.currentTimings.entries()).map(([name, entry]) => [
            name,
            entry.averageTime,
          ]),
        ),
        memory: memoryUsage || { used: 0, total: 0, percentage: 0 },
      },
    };
  }

  private getMemoryUsage(): { used: number; total: number; percentage: number } | null {
    // Check if performance.memory is available
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100),
      };
    }
    return null;
  }

  private reportResults(result: IPerformanceCheckResult): void {

    // Performance score: ${result.score}/${result.maxScore} (${((result.score / result.maxScore) * 100).toFixed(1)}%)

    if (result.warnings.length > 0) {
      console.warn('⚠️  Warnings:');
      result.warnings.forEach((warning: string) => console.warn(`  - ${warning}`));
    }

    if (result.failures.length > 0) {
      console.error('❌ Failures:');
      result.failures.forEach((failure: string) => console.error(`  - ${failure}`));
    }

    if (result.passed) {

    } else {

    }
  }

  // Save current results as baseline for future comparisons
  saveAsBaseline(): void {
    const baselineData = {
      timings: Array.from(this.currentTimings.entries()),
      timestamp: Date.now(),
      nodeVersion: process.version,
      platform: process.platform,
    };

    // In a real implementation, save to file or database

  }
}

// CLI interface for CI/CD
export async function runCIPerformanceCheck(): Promise<boolean> {
  const checker = new PerformanceChecker();
  const result = await checker.runPerformanceChecks();

  // Exit with error code if checks failed
  if (!result.passed) {
    process.exit(1);
  }

  return result.passed;
}

// Auto-run in CI environment
if (process.env.CI === 'true' || process.env.NODE_ENV === 'test') {
  runCIPerformanceCheck().catch((error) => {
    console.error('Performance check failed:', error);
    process.exit(1);
  });
}
