/**
 * Performance optimization utilities
 * Exports all performance-related modules for easy importing
 */

// Object pooling
export { ObjectPool, type IObjectPool, type IResettable } from './ObjectPool';

// Math object pools
export {
  acquireEuler,
  acquireFloat32Array,
  acquireMatrix4,
  acquireQuaternion,
  acquireVector3,
  arrayPool,
  eulerPool,
  float32ArrayPool,
  matrix4Pool,
  quaternionPool,
  releaseEuler,
  releaseFloat32Array,
  releaseMatrix4,
  releaseMultiple,
  releaseQuaternion,
  releaseVector3,
  vector3Pool,
} from './MathPools';

// Event batching
export {
  BatchedEventEmitter,
  type IBatchedEventEmitterOptions,
  type IBatchedEventEmitter,
} from './BatchedEventEmitter';

// Profiling - Temporarily commented out (Profiler removed in b5a8e1c)
// export {
//   Profiler,
//   ProfilerClass,
//   mark,
//   measure,
//   time,
//   timeAsync,
//   type IProfiler,
//   type IProfilerStats,
//   type ITimingEntry,
// } from './Profiler';

// Benchmarks - Temporarily commented out (depends on Profiler)
// export * from './benchmarks';

// CI Performance Check - Temporarily commented out (depends on Profiler)
// export { runCIPerformanceCheck } from './ci-performance-check';
