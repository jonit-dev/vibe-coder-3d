/**
 * Performance Benchmarks
 * Entry point for all benchmark suites
 */

// Export all benchmark suites
export * from './eventBenchmarks';
export * from './transformBenchmarks';

// Main function to run all benchmarks
export function runAllBenchmarks(): void {

  // Import and run benchmarks dynamically to avoid circular dependencies
  import('./transformBenchmarks').then(({ runTransformBenchmarks }) => {
    runTransformBenchmarks();
  });

  import('./eventBenchmarks').then(({ runEventBenchmarks }) => {
    runEventBenchmarks();
  });

}

// Performance regression detection
export interface IBenchmarkResult {
  name: string;
  duration: number;
  iterations: number;
  averageTime: number;
}

export function detectPerformanceRegressions(
  baseline: Map<string, IBenchmarkResult>,
  current: Map<string, IBenchmarkResult>,
  threshold: number = 0.1, // 10% threshold
): { regressions: string[]; improvements: string[] } {
  const regressions: string[] = [];
  const improvements: string[] = [];

  for (const [name, currentResult] of current.entries()) {
    const baselineResult = baseline.get(name);
    if (!baselineResult) continue;

    const ratio = currentResult.averageTime / baselineResult.averageTime;

    if (ratio > 1 + threshold) {
      regressions.push(
        `${name}: ${baselineResult.averageTime.toFixed(2)}ms → ${currentResult.averageTime.toFixed(2)}ms (${((ratio - 1) * 100).toFixed(1)}% slower)`,
      );
    } else if (ratio < 1 - threshold) {
      improvements.push(
        `${name}: ${baselineResult.averageTime.toFixed(2)}ms → ${currentResult.averageTime.toFixed(2)}ms (${((1 - ratio) * 100).toFixed(1)}% faster)`,
      );
    }
  }

  return { regressions, improvements };
}
