/**
 * HierarchyIndex - Maintains parent/child relationships with bidirectional maps
 * Replaces O(n²) children array building with O(1) parent lookups and O(k) children iteration
 */
export class HierarchyIndex {
  private readonly parentToChildren = new Map<number, Set<number>>();
  private readonly childToParent = new Map<number, number>();

  /**
   * Set the parent of a child entity
   * Updates both parent->children and child->parent mappings
   */
  setParent(childId: number, parentId?: number): void {
    console.debug(`[HierarchyIndex] setParent(${childId}, ${parentId})`);
    console.debug(
      `[HierarchyIndex] Before: childToParent has ${childId}? ${this.childToParent.has(childId)}, parentToChildren has ${parentId}? ${parentId !== undefined ? this.parentToChildren.has(parentId) : 'N/A'}`,
    );

    // Remove from current parent's children list
    const currentParent = this.childToParent.get(childId);
    if (currentParent !== undefined) {
      const siblings = this.parentToChildren.get(currentParent);
      if (siblings) {
        siblings.delete(childId);
        // Clean up empty sets
        if (siblings.size === 0) {
          this.parentToChildren.delete(currentParent);
        }
      }
    }

    // Add to new parent's children list
    if (parentId !== undefined) {
      let children = this.parentToChildren.get(parentId);
      if (!children) {
        children = new Set<number>();
        this.parentToChildren.set(parentId, children);
      }
      children.add(childId);
      this.childToParent.set(childId, parentId);
    } else {
      // Remove parent relationship
      this.childToParent.delete(childId);
    }

    console.debug(
      `[HierarchyIndex] After: parentToChildren size: ${this.parentToChildren.size}, childToParent size: ${this.childToParent.size}`,
    );
    console.debug(
      `[HierarchyIndex] Parent ${parentId} has children: ${parentId !== undefined ? Array.from(this.parentToChildren.get(parentId) || []) : 'N/A'}`,
    );
  }

  /**
   * Get the parent ID of a child entity
   */
  getParent(childId: number): number | undefined {
    return this.childToParent.get(childId);
  }

  /**
   * Get all direct children of a parent entity as an array
   */
  getChildren(parentId: number): number[] {
    const children = this.parentToChildren.get(parentId);
    return children ? Array.from(children) : [];
  }

  /**
   * Check if an entity has any children
   */
  hasChildren(parentId: number): boolean {
    const children = this.parentToChildren.get(parentId);
    return children ? children.size > 0 : false;
  }

  /**
   * Get the number of direct children for a parent entity
   */
  getChildrenCount(parentId: number): number {
    const children = this.parentToChildren.get(parentId);
    return children ? children.size : 0;
  }

  /**
   * Remove all parent/child relationships for an entity
   * Called when an entity is deleted
   */
  removeEntity(entityId: number): void {
    // Remove as a parent (clear children)
    const children = this.parentToChildren.get(entityId);
    if (children) {
      // Remove parent reference from all children
      children.forEach((childId) => {
        this.childToParent.delete(childId);
      });
      this.parentToChildren.delete(entityId);
    }

    // Remove as a child
    this.setParent(entityId, undefined);
  }

  /**
   * Clear all hierarchy relationships
   */
  clear(): void {
    this.parentToChildren.clear();
    this.childToParent.clear();
  }

  /**
   * Get all root entities (entities with no parent)
   * Note: This requires a list of all entities to filter from
   */
  getRootEntities(allEntityIds: number[]): number[] {
    return allEntityIds.filter((entityId) => !this.childToParent.has(entityId));
  }

  /**
   * Get all descendants of an entity using breadth-first traversal
   */
  getDescendants(entityId: number): number[] {
    const result: number[] = [];
    const queue: number[] = [...this.getChildren(entityId)];

    while (queue.length > 0) {
      const next = queue.shift()!;
      result.push(next);
      queue.push(...this.getChildren(next));
    }

    return result;
  }

  /**
   * Check if setting a parent would create a circular dependency
   */
  wouldCreateCircularDependency(childId: number, potentialParentId: number): boolean {
    let currentId: number | undefined = potentialParentId;

    // Walk up the parent chain to see if we encounter the childId
    while (currentId !== undefined) {
      if (currentId === childId) {
        return true; // This would create a circular dependency
      }
      currentId = this.childToParent.get(currentId);
    }

    return false;
  }
}
