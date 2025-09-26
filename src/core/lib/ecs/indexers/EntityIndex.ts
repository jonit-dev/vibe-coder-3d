/**
 * EntityIndex - Tracks existing entity IDs using a Set for efficient sparse iteration
 * Replaces O(n) scans of 0..10000 range with O(1) membership checks and O(k) iteration
 */
export class EntityIndex {
  private readonly present = new Set<number>();

  /**
   * Add an entity ID to the index
   */
  add(entityId: number): void {
    this.present.add(entityId);
  }

  /**
   * Remove an entity ID from the index
   */
  delete(entityId: number): void {
    this.present.delete(entityId);
  }

  /**
   * Check if an entity ID exists in the index
   */
  has(entityId: number): boolean {
    return this.present.has(entityId);
  }

  /**
   * Get all entity IDs as an array
   * Returns only entities that actually exist
   */
  list(): number[] {
    return Array.from(this.present);
  }

  /**
   * Get all entity IDs as an iterator for memory-efficient traversal
   * Avoids array allocation for large entity sets
   */
  *iterate(): IterableIterator<number> {
    yield* this.present;
  }

  /**
   * Get the count of existing entities
   */
  size(): number {
    return this.present.size;
  }

  /**
   * Clear all entity IDs from the index
   */
  clear(): void {
    this.present.clear();
  }
}