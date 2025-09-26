/**
 * ComponentIndex - Maintains component membership sets per component type
 * Replaces O(n) component scans with O(1) membership checks and O(k) type-specific iteration
 */
export class ComponentIndex {
  private readonly membership = new Map<string, Set<number>>();

  /**
   * Add an entity to a component type's membership set
   */
  onAdd(componentType: string, entityId: number): void {
    let entitySet = this.membership.get(componentType);
    if (!entitySet) {
      entitySet = new Set<number>();
      this.membership.set(componentType, entitySet);
    }
    entitySet.add(entityId);
  }

  /**
   * Remove an entity from a component type's membership set
   */
  onRemove(componentType: string, entityId: number): void {
    const entitySet = this.membership.get(componentType);
    if (entitySet) {
      entitySet.delete(entityId);
      // Clean up empty sets
      if (entitySet.size === 0) {
        this.membership.delete(componentType);
      }
    }
  }

  /**
   * Get all entity IDs that have a specific component type
   */
  list(componentType: string): number[] {
    const entitySet = this.membership.get(componentType);
    return entitySet ? Array.from(entitySet) : [];
  }

  /**
   * Check if an entity has a specific component type
   */
  has(componentType: string, entityId: number): boolean {
    const entitySet = this.membership.get(componentType);
    return entitySet ? entitySet.has(entityId) : false;
  }

  /**
   * Get the count of entities that have a specific component type
   */
  getCount(componentType: string): number {
    const entitySet = this.membership.get(componentType);
    return entitySet ? entitySet.size : 0;
  }

  /**
   * Get all registered component types
   */
  getComponentTypes(): string[] {
    return Array.from(this.membership.keys());
  }

  /**
   * Remove an entity from all component type memberships
   * Called when an entity is deleted
   */
  removeEntity(entityId: number): void {
    this.membership.forEach((entitySet, componentType) => {
      if (entitySet.has(entityId)) {
        entitySet.delete(entityId);
        // Clean up empty sets
        if (entitySet.size === 0) {
          this.membership.delete(componentType);
        }
      }
    });
  }

  /**
   * Clear all component memberships
   */
  clear(): void {
    this.membership.clear();
  }

  /**
   * Get entities that have all of the specified component types
   * Uses set intersection for efficient multi-component queries
   * Optimized to start with the smallest set for better performance
   */
  listWithAllComponents(componentTypes: string[]): number[] {
    if (componentTypes.length === 0) return [];
    if (componentTypes.length === 1) return this.list(componentTypes[0]);

    // Sort component types by entity count (smallest first for faster intersection)
    const sortedTypes = [...componentTypes].sort((a, b) =>
      this.getCount(a) - this.getCount(b)
    );

    // Start with the smallest set
    const [first, ...rest] = sortedTypes;
    let result = new Set(this.list(first));

    // Early exit if smallest set is empty
    if (result.size === 0) return [];

    // Intersect with each subsequent component type
    for (const componentType of rest) {
      const componentEntities = this.membership.get(componentType);
      if (!componentEntities || componentEntities.size === 0) {
        return []; // Early exit if any component has no entities
      }

      // Efficient intersection using the smaller set
      if (componentEntities.size < result.size) {
        result = new Set([...componentEntities].filter(entityId => result.has(entityId)));
      } else {
        result = new Set([...result].filter(entityId => componentEntities.has(entityId)));
      }

      // Early exit if no entities match
      if (result.size === 0) break;
    }

    return Array.from(result);
  }

  /**
   * Get entities that have any of the specified component types
   * Uses set union for efficient multi-component queries
   */
  listWithAnyComponent(componentTypes: string[]): number[] {
    if (componentTypes.length === 0) return [];

    const result = new Set<number>();

    for (const componentType of componentTypes) {
      const entities = this.list(componentType);
      entities.forEach(entityId => result.add(entityId));
    }

    return Array.from(result);
  }

  /**
   * Get total count of all component instances across all types
   */
  getTotalComponentCount(): number {
    let total = 0;
    this.membership.forEach(entitySet => {
      total += entitySet.size;
    });
    return total;
  }
}