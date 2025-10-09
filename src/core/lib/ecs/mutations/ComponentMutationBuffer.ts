/**
 * ComponentMutationBuffer - Batches component field updates for efficient ECS writes
 * Coalesces multiple updates to the same field within a frame to avoid redundant work
 */

export type ComponentFieldKey = `${number}:${string}:${string}`; // entityId:componentId:field

/**
 * Batches component mutations and flushes them efficiently
 * Last-write-wins semantics for multiple updates to the same field
 */
export class ComponentMutationBuffer {
  private pending = new Map<ComponentFieldKey, unknown>();

  /**
   * Queue a component field update
   * If the same field is updated multiple times, only the last value is kept
   */
  queue(entityId: number, componentId: string, field: string, value: unknown): void {
    const key: ComponentFieldKey = `${entityId}:${componentId}:${field}`;
    this.pending.set(key, value);
  }

  /**
   * Flush all pending mutations by applying them via the provided callback
   * Clears the buffer after flushing
   */
  flush(
    apply: (entityId: number, componentId: string, field: string, value: unknown) => void,
  ): void {
    for (const [key, value] of this.pending) {
      const [eidStr, componentId, field] = key.split(':');
      apply(Number(eidStr), componentId, field, value);
    }
    this.pending.clear();
  }

  /**
   * Get the number of pending mutations
   */
  get size(): number {
    return this.pending.size;
  }

  /**
   * Clear all pending mutations without applying them
   */
  clear(): void {
    this.pending.clear();
  }

  /**
   * Check if there are any pending mutations
   */
  get hasPending(): boolean {
    return this.pending.size > 0;
  }
}
