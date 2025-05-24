import { ComponentCategory, IComponentDescriptor } from '../types';

/**
 * Efficient component mapping and indexing system
 */
export class ComponentMap {
  private componentsById = new Map<string, IComponentDescriptor>();
  private componentsByCategory = new Map<ComponentCategory, Set<string>>();
  private componentsByTag = new Map<string, Set<string>>();

  register(descriptor: IComponentDescriptor): void {
    const { id, category } = descriptor;

    // Store by ID
    this.componentsById.set(id, descriptor);

    // Index by category
    if (!this.componentsByCategory.has(category)) {
      this.componentsByCategory.set(category, new Set());
    }
    this.componentsByCategory.get(category)!.add(id);

    // Index by tags if present
    if (descriptor.metadata?.tags) {
      for (const tag of descriptor.metadata.tags) {
        if (!this.componentsByTag.has(tag)) {
          this.componentsByTag.set(tag, new Set());
        }
        this.componentsByTag.get(tag)!.add(id);
      }
    }
  }

  unregister(id: string): boolean {
    const descriptor = this.componentsById.get(id);
    if (!descriptor) return false;

    // Remove from main map
    this.componentsById.delete(id);

    // Remove from category index
    const categorySet = this.componentsByCategory.get(descriptor.category);
    if (categorySet) {
      categorySet.delete(id);
      if (categorySet.size === 0) {
        this.componentsByCategory.delete(descriptor.category);
      }
    }

    // Remove from tag indices
    if (descriptor.metadata?.tags) {
      for (const tag of descriptor.metadata.tags) {
        const tagSet = this.componentsByTag.get(tag);
        if (tagSet) {
          tagSet.delete(id);
          if (tagSet.size === 0) {
            this.componentsByTag.delete(tag);
          }
        }
      }
    }

    return true;
  }

  get(id: string): IComponentDescriptor | undefined {
    return this.componentsById.get(id);
  }

  getAll(): IComponentDescriptor[] {
    return Array.from(this.componentsById.values());
  }

  getByCategory(category: ComponentCategory): IComponentDescriptor[] {
    const ids = this.componentsByCategory.get(category);
    if (!ids) return [];

    return Array.from(ids)
      .map((id) => this.componentsById.get(id)!)
      .filter(Boolean);
  }

  getByTag(tag: string): IComponentDescriptor[] {
    const ids = this.componentsByTag.get(tag);
    if (!ids) return [];

    return Array.from(ids)
      .map((id) => this.componentsById.get(id)!)
      .filter(Boolean);
  }

  search(query: string): IComponentDescriptor[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter((descriptor) => {
      return (
        descriptor.name.toLowerCase().includes(lowerQuery) ||
        descriptor.id.toLowerCase().includes(lowerQuery) ||
        descriptor.metadata?.description?.toLowerCase().includes(lowerQuery) ||
        descriptor.metadata?.tags?.some((tag: string) => tag.toLowerCase().includes(lowerQuery))
      );
    });
  }

  has(id: string): boolean {
    return this.componentsById.has(id);
  }

  size(): number {
    return this.componentsById.size;
  }

  getCategories(): ComponentCategory[] {
    return Array.from(this.componentsByCategory.keys());
  }

  getTags(): string[] {
    return Array.from(this.componentsByTag.keys());
  }

  clear(): void {
    this.componentsById.clear();
    this.componentsByCategory.clear();
    this.componentsByTag.clear();
  }
}
