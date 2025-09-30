# Scalability Improvements Plan

_Based on scalability-report.md analysis - System Grade: A-_

## Summary

The codebase demonstrates excellent scalability foundations with modern ECS architecture, comprehensive validation, and proper separation of concerns. This document outlines recommended improvements to achieve perfect scalability.

## High Priority Improvements

### 1. Complete Singleton Elimination ⚠️

**Current State:**

- `MaterialRegistry` still uses singleton pattern
- Some system instances use singleton patterns

**Target:**

- Migrate all singletons to dependency injection
- Use `Container` from `@core/lib/di/Container`

**Implementation Plan:**

```typescript
// BEFORE (Singleton)
const registry = MaterialRegistry.getInstance();

// AFTER (DI)
class MaterialSystem {
  constructor(private materialRegistry: MaterialRegistry) {}
}

// In container setup
container.register('MaterialRegistry', () => new MaterialRegistry());
container.register('MaterialSystem', (c) => new MaterialSystem(c.resolve('MaterialRegistry')));
```

**Impact:** Enables true multi-instance architecture for scenes
**Timeline:** 2 weeks
**Files to modify:**

- `src/core/materials/MaterialRegistry.ts`
- `src/core/systems/MaterialSystem.ts`
- All files calling `getInstance()`

### 2. Component Query Optimization 🔍

**Current State:**

- Manual entity scanning up to 1000 entities
- No spatial indexing for large scenes

**Target:**

- Implement spatial indexing for 10,000+ entity scenes
- Add query result caching with invalidation

**Implementation Plan:**

```typescript
// Add to ComponentRegistry
class SpatialIndex {
  private grid: Map<string, Set<number>>;

  querySpatial(bounds: IBounds): number[] {
    // Return entities in spatial region
  }

  updateEntity(eid: number, position: IVector3) {
    // Update spatial grid
  }
}

// Usage
const nearbyEntities = spatialIndex.querySpatial({
  min: { x: -10, y: -10, z: -10 },
  max: { x: 10, y: 10, z: 10 },
});
```

**Impact:** 10x performance improvement for large scenes
**Timeline:** 3 weeks

### 3. Memory Management Enhancements 💾

**Current State:**

- Basic cleanup with disposal patterns
- No object pooling

**Target:**

- Object pooling for frequently created/destroyed objects
- Component data compression for serialization
- Memory profiling utilities

**Implementation Plan:**

```typescript
// Object pool implementation
class ObjectPool<T> {
  private available: T[] = [];

  acquire(factory: () => T): T {
    return this.available.pop() || factory();
  }

  release(obj: T) {
    // Reset and return to pool
    this.available.push(obj);
  }
}

// Usage for temporary objects
const tempVectorPool = new ObjectPool<Vector3>();
const v = tempVectorPool.acquire(() => new Vector3());
// ...use v...
tempVectorPool.release(v);
```

**Impact:** Reduced GC pressure, smoother frame rates
**Timeline:** 2 weeks

## Medium Priority Improvements

### 4. Enhanced Validation Layer 📋

**Current State:**

- Excellent Zod-based validation
- No schema versioning

**Target:**

- Schema versioning for backward compatibility
- Validation result caching
- Custom validation rules

**Implementation:**

```typescript
// Schema versioning
export const MaterialSchemaV1 = z.object({
  /* v1 fields */
});
export const MaterialSchemaV2 = z.object({
  /* v2 fields */
});

export function migrateMaterialV1toV2(v1: MaterialV1): MaterialV2 {
  return { ...v1, newField: defaultValue };
}

// Cached validation
const validationCache = new Map<string, ValidationResult>();

export function validateWithCache(data: unknown, schema: Schema) {
  const key = hash(data);
  if (validationCache.has(key)) return validationCache.get(key);

  const result = schema.safeParse(data);
  validationCache.set(key, result);
  return result;
}
```

**Timeline:** 2 weeks

### 5. Performance Monitoring Dashboard 📊

**Current State:**

- Basic metrics collection in systems
- No centralized monitoring

**Target:**

- Performance monitoring dashboard
- Frame time tracking
- Entity count monitoring
- Memory usage tracking

**Implementation:**

```typescript
// Performance monitor singleton
class PerformanceMonitor {
  metrics = {
    frameTime: [] as number[],
    entityCount: 0,
    systemTimes: new Map<string, number>(),
  };

  recordFrame(deltaTime: number) {
    this.metrics.frameTime.push(deltaTime);
    if (this.metrics.frameTime.length > 60) {
      this.metrics.frameTime.shift();
    }
  }

  getAverageFrameTime() {
    return this.metrics.frameTime.reduce((a, b) => a + b, 0) / this.metrics.frameTime.length;
  }
}
```

**Timeline:** 1 week

## Low Priority Enhancements

### 6. Advanced Query System

- Add compound queries (AND, OR, NOT)
- Query builder API
- Query performance profiling

### 7. Asset Streaming

- Lazy loading for materials/textures
- Progressive scene loading
- Background asset fetching

### 8. Multi-threading Support

- Worker thread for physics
- Background serialization
- Parallel entity updates

## Implementation Sequence

**Phase 1 (Weeks 1-2):**

1. Complete singleton elimination
2. Add object pooling basics

**Phase 2 (Weeks 3-5):**

1. Implement spatial indexing
2. Add memory profiling
3. Schema versioning

**Phase 3 (Weeks 6-7):**

1. Performance monitoring dashboard
2. Query optimization

**Phase 4 (Future):**

1. Advanced query system
2. Asset streaming
3. Multi-threading

## Success Metrics

- ✅ Support 10,000+ entities at 60 FPS
- ✅ Memory usage under 500MB for typical scenes
- ✅ Scene load time under 1 second
- ✅ No memory leaks over 30-minute sessions
- ✅ 100% test coverage for critical systems

## Notes

Current system already handles:

- ✅ 1000+ entities efficiently
- ✅ Proper memory cleanup
- ✅ Schema validation
- ✅ Modern architecture patterns

These improvements will scale to:

- 10,000+ entities
- Complex multi-scene workflows
- Production-grade applications
