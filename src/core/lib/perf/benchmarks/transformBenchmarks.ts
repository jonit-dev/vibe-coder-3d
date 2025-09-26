/**
 * Transform System Benchmarks
 * Tests performance of transform calculations with and without pooling
 */

import { Euler, Matrix4, Quaternion, Vector3 } from 'three';
import {
  acquireEuler,
  acquireMatrix4,
  acquireQuaternion,
  acquireVector3,
  arrayPool,
  releaseMatrix4,
  releaseQuaternion,
  releaseVector3,
} from '../MathPools';
import { Profiler } from '../Profiler';

const DEG_TO_RAD = Math.PI / 180;

interface MockTransformData {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  parentId?: number;
}

interface MockEntity {
  id: number;
  parentId?: number;
  children: number[];
  transformData: MockTransformData;
}

// Mock transform data for benchmarking
const mockTransformData = (id: number): MockTransformData => ({
  position: [id * 0.1, id * 0.2, id * 0.3],
  rotation: [id * 5, id * 3, id * 7],
  scale: [1 + id * 0.01, 1 + id * 0.02, 1 + id * 0.03],
});

// Create mock entity hierarchy
function createMockEntities(count: number): MockEntity[] {
  const entities: MockEntity[] = [];

  for (let i = 0; i < count; i++) {
    entities.push({
      id: i,
      parentId: i > 0 ? Math.floor((i - 1) / 4) : undefined, // Create hierarchy
      children: [],
      transformData: mockTransformData(i),
    });
  }

  // Set up parent-child relationships
  for (let i = 1; i < entities.length; i++) {
    const parentId = entities[i].parentId;
    if (parentId !== undefined && entities[parentId]) {
      entities[parentId].children.push(i);
    }
  }

  return entities;
}

// Traditional transform calculation (without pooling)
function computeTransformTraditional(data: MockTransformData): {
  position: Vector3;
  quaternion: Quaternion;
  scale: Vector3;
  matrix: Matrix4;
} {
  const position = new Vector3(data.position[0], data.position[1], data.position[2]);
  const scale = new Vector3(data.scale[0], data.scale[1], data.scale[2]);
  const euler = new Euler();
  const quaternion = new Quaternion();

  const rotRad = [
    data.rotation[0] * DEG_TO_RAD,
    data.rotation[1] * DEG_TO_RAD,
    data.rotation[2] * DEG_TO_RAD,
  ];

  euler.set(rotRad[0], rotRad[1], rotRad[2]);
  quaternion.setFromEuler(euler);

  const matrix = new Matrix4();
  matrix.compose(position, quaternion, scale);

  return { position, quaternion, scale, matrix };
}

// Pooled transform calculation
function computeTransformPooled(data: MockTransformData): {
  position: Vector3;
  quaternion: Quaternion;
  scale: Vector3;
  matrix: Matrix4;
} {
  const position = acquireVector3(data.position[0], data.position[1], data.position[2]);
  const scale = acquireVector3(data.scale[0], data.scale[1], data.scale[2]);
  const euler = acquireEuler();
  const quaternion = acquireQuaternion();
  const matrix = acquireMatrix4();

  const rotRad = arrayPool.acquire();
  try {
    rotRad[0] = data.rotation[0] * DEG_TO_RAD;
    rotRad[1] = data.rotation[1] * DEG_TO_RAD;
    rotRad[2] = data.rotation[2] * DEG_TO_RAD;

    euler.set(rotRad[0], rotRad[1], rotRad[2]);
    quaternion.setFromEuler(euler);
    matrix.compose(position, quaternion, scale);

    return { position, quaternion, scale, matrix };
  } finally {
    arrayPool.release(rotRad);
  }
}

// Benchmark traditional approach
export function benchmarkTransformTraditional(entityCount: number, iterations: number = 100): void {
  const entities = createMockEntities(entityCount);

  Profiler.time(`transformTraditional_${entityCount}entities_${iterations}iterations`, () => {
    for (let iter = 0; iter < iterations; iter++) {
      const results = entities.map((entity) => computeTransformTraditional(entity.transformData));

      // Clean up objects
      results.forEach((result) => {
        result.position = new Vector3(); // Simulate cleanup
        result.quaternion = new Quaternion();
        result.scale = new Vector3();
        result.matrix = new Matrix4();
      });
    }
  });
}

// Benchmark pooled approach
export function benchmarkTransformPooled(entityCount: number, iterations: number = 100): void {
  const entities = createMockEntities(entityCount);

  Profiler.time(`transformPooled_${entityCount}entities_${iterations}iterations`, () => {
    for (let iter = 0; iter < iterations; iter++) {
      const results = entities.map((entity) => computeTransformPooled(entity.transformData));

      // Clean up pooled objects
      results.forEach((result) => {
        releaseVector3(result.position);
        releaseQuaternion(result.quaternion);
        releaseVector3(result.scale);
        releaseMatrix4(result.matrix);
      });
    }
  });
}

// Memory allocation benchmark
export function benchmarkMemoryAllocations(): void {
  const iterations = 10000;

  // Traditional allocation
  Profiler.time(`memoryAllocation_traditional_${iterations}`, () => {
    for (let i = 0; i < iterations; i++) {
      const v1 = new Vector3(i, i, i);
      const v2 = new Vector3(i * 2, i * 2, i * 2);
      const result = v1.clone().add(v2);
      // Objects would be GC'd here
    }
  });

  // Pooled allocation
  Profiler.time(`memoryAllocation_pooled_${iterations}`, () => {
    for (let i = 0; i < iterations; i++) {
      const v1 = acquireVector3(i, i, i);
      const v2 = acquireVector3(i * 2, i * 2, i * 2);
      const result = acquireVector3().copy(v1).add(v2);

      releaseVector3(v1);
      releaseVector3(v2);
      releaseVector3(result);
    }
  });
}

// Run all transform benchmarks
export function runTransformBenchmarks(): void {
  console.log('🧪 Running Transform Benchmarks...');

  const testSizes = [10, 100, 1000];
  const iterations = 50;

  testSizes.forEach((size) => {
    benchmarkTransformTraditional(size, iterations);
    benchmarkTransformPooled(size, iterations);
  });

  benchmarkMemoryAllocations();

  console.log('✅ Transform benchmarks completed');
}

// Auto-run benchmarks in development
if (process.env.NODE_ENV === 'development') {
  // Delay to avoid blocking initial load
  setTimeout(() => {
    runTransformBenchmarks();
  }, 1000);
}
