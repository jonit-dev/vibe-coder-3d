import type { IPrefabDefinition, IPrefabVariant, IPrefabAssetMeta } from './Prefab.types';
import { PrefabDefinitionSchema, PrefabVariantSchema } from './Prefab.types';
import { Logger } from '@/core/lib/logger';
import { validatePrefab, detectCycle, generatePrefabHash } from './PrefabUtils';

const logger = Logger.create('PrefabRegistry');

export class PrefabRegistry {
  private static instance: PrefabRegistry | null = null;

  private idToDef = new Map<string, IPrefabDefinition>();
  private idToVariant = new Map<string, IPrefabVariant>();
  private hashCache = new Map<string, string>();

  static getInstance(): PrefabRegistry {
    if (!this.instance) {
      this.instance = new PrefabRegistry();
    }
    return this.instance;
  }

  /**
   * List all prefabs
   * NOTE: Preserves insertion order as JavaScript Maps maintain insertion order (ES2015+ spec)
   * This ensures prefabs are returned in the same order they were registered
   */
  list(): IPrefabDefinition[] {
    // IMPORTANT: Array.from(map.values()) preserves Map insertion order
    return Array.from(this.idToDef.values());
  }

  /**
   * Get prefab by ID
   */
  get(id: string): IPrefabDefinition | undefined {
    return this.idToDef.get(id);
  }

  /**
   * Upsert (insert or update) a prefab
   */
  upsert(def: IPrefabDefinition): void {
    // Validate schema
    try {
      PrefabDefinitionSchema.parse(def);
    } catch (error) {
      logger.error('Invalid prefab definition:', error);
      throw new Error(`Invalid prefab definition: ${error}`);
    }

    // Validate prefab structure
    const validation = validatePrefab(def);
    if (!validation.valid) {
      logger.error('Prefab validation failed:', validation.errors);
      throw new Error(`Prefab validation failed: ${validation.errors.join(', ')}`);
    }

    // Temporarily add to map for cycle detection
    const existing = this.idToDef.get(def.id);
    this.idToDef.set(def.id, def);

    // Check for cycles
    if (detectCycle(def.id, (id) => this.idToDef.get(id))) {
      // Restore original if cycle detected
      if (existing) {
        this.idToDef.set(def.id, existing);
      } else {
        this.idToDef.delete(def.id);
      }
      logger.error('Circular dependency detected in prefab:', def.id);
      throw new Error(`Circular dependency detected in prefab: ${def.id}`);
    }

    // Update hash cache
    this.hashCache.set(def.id, generatePrefabHash(def));
  }

  /**
   * Remove a prefab
   */
  remove(id: string): void {
    // Check if any other prefabs depend on this one
    const dependents = this.findDependents(id);
    if (dependents.length > 0) {
      logger.warn(`Prefab ${id} has dependents:`, dependents);
      throw new Error(
        `Cannot delete prefab ${id}: it is used by ${dependents.map((d) => d.name).join(', ')}`,
      );
    }

    this.idToDef.delete(id);
    this.hashCache.delete(id);
    logger.debug('Prefab removed:', id);
  }

  /**
   * Find prefabs that depend on the given prefab
   */
  findDependents(id: string): IPrefabDefinition[] {
    const dependents: IPrefabDefinition[] = [];

    for (const prefab of this.idToDef.values()) {
      if (prefab.dependencies?.includes(id)) {
        dependents.push(prefab);
      }
    }

    return dependents;
  }

  /**
   * Get prefab hash for change detection
   */
  getHash(id: string): string | undefined {
    return this.hashCache.get(id);
  }

  /**
   * Check if prefab has changed since last access
   */
  hasChanged(id: string, lastHash: string): boolean {
    const currentHash = this.hashCache.get(id);
    return currentHash !== lastHash;
  }

  /**
   * List all variants
   */
  listVariants(): IPrefabVariant[] {
    return Array.from(this.idToVariant.values());
  }

  /**
   * Get variant by ID
   */
  getVariant(id: string): IPrefabVariant | undefined {
    return this.idToVariant.get(id);
  }

  /**
   * Upsert variant
   */
  upsertVariant(variant: IPrefabVariant): void {
    // Validate schema
    try {
      PrefabVariantSchema.parse(variant);
    } catch (error) {
      logger.error('Invalid variant definition:', error);
      throw new Error(`Invalid variant definition: ${error}`);
    }

    // Check that base prefab exists
    if (!this.idToDef.has(variant.baseId)) {
      throw new Error(`Base prefab not found: ${variant.baseId}`);
    }

    this.idToVariant.set(variant.id, variant);
    logger.debug('Variant registered:', { id: variant.id, baseId: variant.baseId });
  }

  /**
   * Remove variant
   */
  removeVariant(id: string): void {
    this.idToVariant.delete(id);
    logger.debug('Variant removed:', id);
  }

  /**
   * Get all variants of a base prefab
   */
  getVariantsOf(baseId: string): IPrefabVariant[] {
    return this.listVariants().filter((v) => v.baseId === baseId);
  }

  /**
   * Get prefab metadata for UI
   */
  getMetadata(): IPrefabAssetMeta[] {
    return this.list().map((prefab) => ({
      id: prefab.id,
      name: prefab.name,
      path: `/assets/prefabs/${prefab.id}.prefab.json`,
      description: prefab.description,
      tags: prefab.tags,
    }));
  }

  /**
   * Search prefabs by name or tag
   */
  search(query: string): IPrefabDefinition[] {
    const lowerQuery = query.toLowerCase();

    return this.list().filter((prefab) => {
      // Search in name
      if (prefab.name.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Search in ID
      if (prefab.id.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Search in tags
      if (prefab.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))) {
        return true;
      }

      // Search in description
      if (prefab.description?.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      return false;
    });
  }

  /**
   * Filter by tags
   */
  filterByTags(tags: string[]): IPrefabDefinition[] {
    return this.list().filter((prefab) => {
      if (!prefab.tags || prefab.tags.length === 0) {
        return false;
      }

      return tags.some((tag) => prefab.tags?.includes(tag));
    });
  }

  /**
   * Clear all prefabs (for testing)
   */
  clear(): void {
    this.idToDef.clear();
    this.idToVariant.clear();
    this.hashCache.clear();
    logger.debug('Prefab registry cleared');
  }

  /**
   * Get statistics
   */
  getStats(): { prefabCount: number; variantCount: number; totalDependencies: number } {
    let totalDependencies = 0;

    for (const prefab of this.idToDef.values()) {
      totalDependencies += prefab.dependencies?.length || 0;
    }

    return {
      prefabCount: this.idToDef.size,
      variantCount: this.idToVariant.size,
      totalDependencies,
    };
  }
}

export const prefabRegistry = PrefabRegistry.getInstance();
