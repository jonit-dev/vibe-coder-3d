import { Logger } from '@/core/lib/logger';

const logger = Logger.create('TagManager');

/**
 * TagManager - Manage entity tags for categorization and querying
 *
 * Features:
 * - Dual-index structure for O(1) lookups
 * - Tag normalization (lowercase, dash-separated)
 * - AND/OR queries
 * - Serialization support
 */
export class TagManager {
  private static instance: TagManager | null = null;

  private entityTags: Map<number, Set<string>>;
  private tagEntities: Map<string, Set<number>>;

  private constructor() {
    this.entityTags = new Map();
    this.tagEntities = new Map();
  }

  public static getInstance(): TagManager {
    if (!TagManager.instance) {
      TagManager.instance = new TagManager();
    }
    return TagManager.instance;
  }

  /**
   * Add a tag to an entity
   */
  public addTag(entityId: number, tag: string): void {
    const normalized = this.normalizeTag(tag);

    if (!normalized) {
      logger.warn(`Invalid tag: "${tag}"`);
      return;
    }

    // Add to entity → tags map
    if (!this.entityTags.has(entityId)) {
      this.entityTags.set(entityId, new Set());
    }
    this.entityTags.get(entityId)!.add(normalized);

    // Add to tag → entities map
    if (!this.tagEntities.has(normalized)) {
      this.tagEntities.set(normalized, new Set());
    }
    this.tagEntities.get(normalized)!.add(entityId);

    logger.debug(`Added tag "${normalized}" to entity ${entityId}`);
  }

  /**
   * Remove a tag from an entity
   */
  public removeTag(entityId: number, tag: string): void {
    const normalized = this.normalizeTag(tag);

    // Remove from entity → tags map
    const entityTagSet = this.entityTags.get(entityId);
    if (entityTagSet) {
      entityTagSet.delete(normalized);

      // Clean up empty sets
      if (entityTagSet.size === 0) {
        this.entityTags.delete(entityId);
      }
    }

    // Remove from tag → entities map
    const tagEntitySet = this.tagEntities.get(normalized);
    if (tagEntitySet) {
      tagEntitySet.delete(entityId);

      // Clean up empty sets
      if (tagEntitySet.size === 0) {
        this.tagEntities.delete(normalized);
      }
    }

    logger.debug(`Removed tag "${normalized}" from entity ${entityId}`);
  }

  /**
   * Check if entity has tag
   */
  public hasTag(entityId: number, tag: string): boolean {
    const normalized = this.normalizeTag(tag);
    const tags = this.entityTags.get(entityId);
    return tags ? tags.has(normalized) : false;
  }

  /**
   * Get all tags for an entity
   */
  public getTags(entityId: number): string[] {
    const tags = this.entityTags.get(entityId);
    return tags ? Array.from(tags) : [];
  }

  /**
   * Clear all tags for an entity
   */
  public clearTags(entityId: number): void {
    const tags = this.entityTags.get(entityId);
    if (!tags) return;

    // Remove entity from all tag → entities maps
    for (const tag of tags) {
      const tagEntitySet = this.tagEntities.get(tag);
      if (tagEntitySet) {
        tagEntitySet.delete(entityId);
        if (tagEntitySet.size === 0) {
          this.tagEntities.delete(tag);
        }
      }
    }

    // Remove entity from entity → tags map
    this.entityTags.delete(entityId);

    logger.debug(`Cleared all tags for entity ${entityId}`);
  }

  /**
   * Set tags for entity (replaces existing tags)
   */
  public setTags(entityId: number, tags: string[]): void {
    this.clearTags(entityId);
    this.addTags(entityId, tags);
  }

  /**
   * Add multiple tags to entity
   */
  public addTags(entityId: number, tags: string[]): void {
    for (const tag of tags) {
      this.addTag(entityId, tag);
    }
  }

  /**
   * Remove multiple tags from entity
   */
  public removeTags(entityId: number, tags: string[]): void {
    for (const tag of tags) {
      this.removeTag(entityId, tag);
    }
  }

  /**
   * Find all entities with a specific tag
   */
  public findByTag(tag: string): number[] {
    const normalized = this.normalizeTag(tag);
    const entities = this.tagEntities.get(normalized);
    return entities ? Array.from(entities) : [];
  }

  /**
   * Find entities with ALL specified tags (AND query)
   */
  public findByAllTags(tags: string[]): number[] {
    if (tags.length === 0) return [];

    const normalized = tags.map((t) => this.normalizeTag(t));

    // Start with entities having first tag
    const firstTagEntities = this.tagEntities.get(normalized[0]);
    if (!firstTagEntities) return [];

    // Filter to only entities having all other tags
    return Array.from(firstTagEntities).filter((entityId) => {
      return normalized.every((tag) => this.hasTag(entityId, tag));
    });
  }

  /**
   * Find entities with ANY of the specified tags (OR query)
   */
  public findByAnyTag(tags: string[]): number[] {
    if (tags.length === 0) return [];

    const normalized = tags.map((t) => this.normalizeTag(t));
    const entitySet = new Set<number>();

    for (const tag of normalized) {
      const entities = this.tagEntities.get(tag);
      if (entities) {
        entities.forEach((id) => entitySet.add(id));
      }
    }

    return Array.from(entitySet);
  }

  /**
   * Get all unique tags in the scene
   */
  public getAllTags(): string[] {
    return Array.from(this.tagEntities.keys());
  }

  /**
   * Get count of entities with a tag
   */
  public getEntityCount(tag: string): number {
    const normalized = this.normalizeTag(tag);
    const entities = this.tagEntities.get(normalized);
    return entities ? entities.size : 0;
  }

  /**
   * Rename a tag globally
   */
  public renameTag(oldTag: string, newTag: string): void {
    const oldNormalized = this.normalizeTag(oldTag);
    const newNormalized = this.normalizeTag(newTag);

    if (oldNormalized === newNormalized) return;

    const entities = this.tagEntities.get(oldNormalized);
    if (!entities) return;

    // Add new tag to all entities
    for (const entityId of entities) {
      this.addTag(entityId, newNormalized);
      this.removeTag(entityId, oldNormalized);
    }

    logger.info(`Renamed tag "${oldTag}" to "${newTag}"`);
  }

  /**
   * Clean up tags when entity is destroyed
   */
  public destroyEntity(entityId: number): void {
    this.clearTags(entityId);
  }

  /**
   * Clear all tags (for scene reset)
   */
  public clear(): void {
    this.entityTags.clear();
    this.tagEntities.clear();
    logger.info('Cleared all tags');
  }

  /**
   * Serialize tags for scene saving
   */
  public serialize(): Record<number, string[]> {
    const data: Record<number, string[]> = {};

    for (const [entityId, tags] of this.entityTags.entries()) {
      data[entityId] = Array.from(tags);
    }

    return data;
  }

  /**
   * Deserialize tags from scene loading
   */
  public deserialize(data: Record<number, string[]>): void {
    this.clear();

    for (const [entityIdStr, tags] of Object.entries(data)) {
      const entityId = parseInt(entityIdStr, 10);
      this.addTags(entityId, tags);
    }

    logger.info(`Deserialized tags for ${Object.keys(data).length} entities`);
  }

  /**
   * Normalize tag (lowercase, trim, replace spaces with dashes)
   */
  private normalizeTag(tag: string): string {
    return tag.trim().toLowerCase().replace(/\s+/g, '-');
  }
}
