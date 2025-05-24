import { ComponentCategory, IComponentGroup } from '@/core/types/component-registry';

/**
 * Efficient component group mapping and indexing system
 */
export class ComponentGroupMap {
  private groupsById = new Map<string, IComponentGroup>();
  private groupsByCategory = new Map<ComponentCategory, Set<string>>();

  register(group: IComponentGroup): void {
    const { id, category } = group;

    // Store by ID
    this.groupsById.set(id, group);

    // Index by category
    if (!this.groupsByCategory.has(category)) {
      this.groupsByCategory.set(category, new Set());
    }
    this.groupsByCategory.get(category)!.add(id);
  }

  unregister(id: string): boolean {
    const group = this.groupsById.get(id);
    if (!group) return false;

    // Remove from main map
    this.groupsById.delete(id);

    // Remove from category index
    const categorySet = this.groupsByCategory.get(group.category);
    if (categorySet) {
      categorySet.delete(id);
      if (categorySet.size === 0) {
        this.groupsByCategory.delete(group.category);
      }
    }

    return true;
  }

  get(id: string): IComponentGroup | undefined {
    return this.groupsById.get(id);
  }

  getAll(): IComponentGroup[] {
    return Array.from(this.groupsById.values()).sort((a, b) => a.order - b.order);
  }

  getByCategory(category: ComponentCategory): IComponentGroup[] {
    const ids = this.groupsByCategory.get(category);
    if (!ids) return [];

    return Array.from(ids)
      .map((id) => this.groupsById.get(id)!)
      .filter(Boolean)
      .sort((a, b) => a.order - b.order);
  }

  search(query: string): IComponentGroup[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter((group) => {
      return (
        group.name.toLowerCase().includes(lowerQuery) ||
        group.description.toLowerCase().includes(lowerQuery) ||
        group.components.some((componentId) => componentId.toLowerCase().includes(lowerQuery))
      );
    });
  }

  has(id: string): boolean {
    return this.groupsById.has(id);
  }

  size(): number {
    return this.groupsById.size;
  }

  getCategories(): ComponentCategory[] {
    return Array.from(this.groupsByCategory.keys());
  }

  clear(): void {
    this.groupsById.clear();
    this.groupsByCategory.clear();
  }
}
