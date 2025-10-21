/**
 * Performance instrumentation helpers for script system
 * Provides utilities for marking and measuring script compilation and execution performance
 */

/**
 * Mark a performance point
 */
export const perfMark = (name: string): void => {
  performance.mark(name);
};

/**
 * Measure duration between two marks
 * Returns the duration in milliseconds
 */
export const perfMeasure = (name: string, start: string, end: string): number => {
  performance.measure(name, start, end);
  const entries = performance.getEntriesByName(name);
  return entries[entries.length - 1]?.duration ?? 0;
};

/**
 * Clear a specific mark
 */
export const perfClearMark = (name: string): void => {
  performance.clearMarks(name);
};

/**
 * Clear a specific measure
 */
export const perfClearMeasure = (name: string): void => {
  performance.clearMeasures(name);
};

/**
 * Clear all marks and measures
 */
export const perfClearAll = (): void => {
  performance.clearMarks();
  performance.clearMeasures();
};

/**
 * Get all performance entries by type
 */
export const perfGetEntries = (type?: 'mark' | 'measure'): PerformanceEntry[] => {
  if (type) {
    return performance.getEntriesByType(type);
  }
  return performance.getEntries();
};

/**
 * Get the current high-resolution timestamp in milliseconds
 */
export const perfNow = (): number => {
  return performance.now();
};
