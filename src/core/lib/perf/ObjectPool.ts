/**
 * Generic object pool for reducing garbage collection pressure
 * Provides acquire/release semantics with warmup and size limits
 */

export interface IObjectPool<T> {
  acquire(): T;
  release(item: T): void;
  warmup(count: number): void;
  size(): number;
  clear(): void;
}

export interface IResettable {
  reset?(): void;
}

export class ObjectPool<T> implements IObjectPool<T> {
  private available: T[] = [];
  private active: Set<T> = new Set();
  private factory: () => T;
  private reset?: (item: T) => void;
  private maxSize: number;
  private warmupCount: number = 0;

  constructor(
    factory: () => T,
    options: {
      reset?: (item: T) => void;
      initialSize?: number;
      maxSize?: number;
    } = {},
  ) {
    this.factory = factory;
    this.reset = options.reset;
    this.maxSize = options.maxSize ?? 1000; // Default max size
    this.warmupCount = options.initialSize ?? 0;

    if (this.warmupCount > 0) {
      this.warmup(this.warmupCount);
    }
  }

  acquire(): T {
    let item: T;

    if (this.available.length > 0) {
      item = this.available.pop()!;
    } else {
      item = this.factory();
    }

    this.active.add(item);
    return item;
  }

  release(item: T): void {
    if (!this.active.has(item)) {
      console.warn('ObjectPool: Attempting to release item that is not active');
      return;
    }

    // Reset the item if reset function is provided
    if (this.reset) {
      this.reset(item);
    }

    // Remove from active set
    this.active.delete(item);

    // Only keep in pool if under max size
    if (this.available.length < this.maxSize) {
      this.available.push(item);
    }
    // If pool is full, let the item be garbage collected
  }

  warmup(count: number): void {
    const targetSize = Math.min(count, this.maxSize);

    while (this.available.length < targetSize) {
      const item = this.factory();
      this.available.push(item);
    }

    this.warmupCount = targetSize;
  }

  size(): number {
    return this.available.length + this.active.size;
  }

  activeCount(): number {
    return this.active.size;
  }

  availableCount(): number {
    return this.available.length;
  }

  clear(): void {
    this.available.length = 0;
    this.active.clear();
  }

  // Debug method to detect leaks
  getActiveItems(): T[] {
    return Array.from(this.active);
  }

  // Get stats for monitoring
  getStats() {
    return {
      total: this.size(),
      active: this.activeCount(),
      available: this.availableCount(),
      maxSize: this.maxSize,
      warmupCount: this.warmupCount,
    };
  }
}
