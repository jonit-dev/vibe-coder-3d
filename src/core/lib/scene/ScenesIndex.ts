/**
 * ScenesIndex - In-memory index and optional persistence for scene management
 * Provides fast lookups and metadata caching for scenes from multiple providers
 */

import { z } from 'zod';

export const SceneIndexEntrySchema = z.object({
  id: z.string(),
  providerId: z.string(),
  descriptor: z.object({
    id: z.string(),
    guid: z.string(),
    name: z.string(),
    source: z.enum(['code', 'file', 'remote']),
    path: z.string().optional(),
    tags: z.array(z.string()).optional(),
    updatedAt: z.string().optional(),
    metadata: z
      .object({
        author: z.string().optional(),
        description: z.string().optional(),
        version: z.string().optional(),
        previewImage: z.string().optional(),
      })
      .optional(),
  }),
  lastAccessed: z.string().optional(),
  isActive: z.boolean().default(false),
});

export const ScenesIndexSchema = z.object({
  entries: z.array(SceneIndexEntrySchema),
  activeSceneId: z.string().optional(),
  lastUpdated: z.string(),
  version: z.string().default('1.0'),
});

export type SceneIndexEntry = z.infer<typeof SceneIndexEntrySchema>;
export type ScenesIndexData = z.infer<typeof ScenesIndexSchema>;

export interface ISceneFilter {
  source?: 'code' | 'file' | 'remote';
  tags?: string[];
  search?: string;
  providerId?: string;
}

/**
 * In-memory scene index for fast lookups and caching
 */
export class ScenesIndex {
  private entries: Map<string, SceneIndexEntry> = new Map();
  private activeSceneId: string | undefined;
  private lastUpdated: Date = new Date();
  private listeners: ((index: ScenesIndex) => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Add or update a scene in the index
   */
  addOrUpdate(entry: Omit<SceneIndexEntry, 'lastAccessed'>): void {
    const fullEntry: SceneIndexEntry = {
      ...entry,
      lastAccessed: new Date().toISOString(),
    };

    this.entries.set(entry.id, fullEntry);
    this.lastUpdated = new Date();
    this.notifyListeners();
    this.saveToStorage();
  }

  /**
   * Remove a scene from the index
   */
  remove(sceneId: string): boolean {
    const removed = this.entries.delete(sceneId);
    if (removed) {
      if (this.activeSceneId === sceneId) {
        this.activeSceneId = undefined;
      }
      this.lastUpdated = new Date();
      this.notifyListeners();
      this.saveToStorage();
    }
    return removed;
  }

  /**
   * Get a scene entry by ID
   */
  get(sceneId: string): SceneIndexEntry | undefined {
    return this.entries.get(sceneId);
  }

  /**
   * List all scenes with optional filtering
   */
  list(filter?: ISceneFilter): SceneIndexEntry[] {
    let entries = Array.from(this.entries.values());

    if (filter) {
      if (filter.source) {
        entries = entries.filter((entry) => entry.descriptor.source === filter.source);
      }

      if (filter.providerId) {
        entries = entries.filter((entry) => entry.providerId === filter.providerId);
      }

      if (filter.tags && filter.tags.length > 0) {
        entries = entries.filter((entry) =>
          filter.tags!.some((tag) => entry.descriptor.tags?.includes(tag))
        );
      }

      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        entries = entries.filter(
          (entry) =>
            entry.descriptor.name.toLowerCase().includes(searchLower) ||
            entry.descriptor.metadata?.description?.toLowerCase().includes(searchLower) ||
            entry.descriptor.metadata?.author?.toLowerCase().includes(searchLower)
        );
      }
    }

    // Sort by last accessed (most recent first), then by name
    entries.sort((a, b) => {
      if (a.lastAccessed && b.lastAccessed) {
        return new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime();
      }
      if (a.lastAccessed && !b.lastAccessed) return -1;
      if (!a.lastAccessed && b.lastAccessed) return 1;
      return a.descriptor.name.localeCompare(b.descriptor.name);
    });

    return entries;
  }

  /**
   * Set the active scene
   */
  setActiveScene(sceneId: string | undefined): void {
    // Clear previous active scene
    if (this.activeSceneId) {
      const prevEntry = this.entries.get(this.activeSceneId);
      if (prevEntry) {
        this.entries.set(this.activeSceneId, { ...prevEntry, isActive: false });
      }
    }

    // Set new active scene
    if (sceneId && this.entries.has(sceneId)) {
      const entry = this.entries.get(sceneId)!;
      this.entries.set(sceneId, {
        ...entry,
        isActive: true,
        lastAccessed: new Date().toISOString(),
      });
      this.activeSceneId = sceneId;
    } else {
      this.activeSceneId = undefined;
    }

    this.lastUpdated = new Date();
    this.notifyListeners();
    this.saveToStorage();
  }

  /**
   * Get the current active scene
   */
  getActiveScene(): SceneIndexEntry | undefined {
    return this.activeSceneId ? this.entries.get(this.activeSceneId) : undefined;
  }

  /**
   * Update last accessed time for a scene
   */
  touch(sceneId: string): void {
    const entry = this.entries.get(sceneId);
    if (entry) {
      this.entries.set(sceneId, {
        ...entry,
        lastAccessed: new Date().toISOString(),
      });
      this.lastUpdated = new Date();
      this.saveToStorage();
    }
  }

  /**
   * Get scenes grouped by provider
   */
  getByProvider(): Map<string, SceneIndexEntry[]> {
    const byProvider = new Map<string, SceneIndexEntry[]>();

    for (const entry of this.entries.values()) {
      if (!byProvider.has(entry.providerId)) {
        byProvider.set(entry.providerId, []);
      }
      byProvider.get(entry.providerId)!.push(entry);
    }

    return byProvider;
  }

  /**
   * Get unique tags from all scenes
   */
  getAllTags(): string[] {
    const tagSet = new Set<string>();

    for (const entry of this.entries.values()) {
      if (entry.descriptor.tags) {
        entry.descriptor.tags.forEach((tag) => tagSet.add(tag));
      }
    }

    return Array.from(tagSet).sort();
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries.clear();
    this.activeSceneId = undefined;
    this.lastUpdated = new Date();
    this.notifyListeners();
    this.saveToStorage();
  }

  /**
   * Get index statistics
   */
  getStats() {
    const bySource = new Map<string, number>();
    const byProvider = new Map<string, number>();

    for (const entry of this.entries.values()) {
      bySource.set(entry.descriptor.source, (bySource.get(entry.descriptor.source) || 0) + 1);
      byProvider.set(entry.providerId, (byProvider.get(entry.providerId) || 0) + 1);
    }

    return {
      totalScenes: this.entries.size,
      activeSceneId: this.activeSceneId,
      lastUpdated: this.lastUpdated.toISOString(),
      bySource: Object.fromEntries(bySource),
      byProvider: Object.fromEntries(byProvider),
    };
  }

  /**
   * Subscribe to index changes
   */
  subscribe(listener: (index: ScenesIndex) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Export index data for persistence
   */
  export(): ScenesIndexData {
    return {
      entries: Array.from(this.entries.values()),
      activeSceneId: this.activeSceneId,
      lastUpdated: this.lastUpdated.toISOString(),
      version: '1.0',
    };
  }

  /**
   * Import index data from persistence
   */
  import(data: ScenesIndexData): void {
    try {
      const validated = ScenesIndexSchema.parse(data);

      this.entries.clear();
      validated.entries.forEach((entry) => {
        this.entries.set(entry.id, entry);
      });

      this.activeSceneId = validated.activeSceneId;
      this.lastUpdated = new Date(validated.lastUpdated);

      this.notifyListeners();
    } catch (error) {
      console.error('[ScenesIndex] Failed to import data:', error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this);
      } catch (error) {
        console.error('[ScenesIndex] Listener error:', error);
      }
    });
  }

  private saveToStorage(): void {
    try {
      const data = this.export();
      localStorage.setItem('vibe-coder-scenes-index', JSON.stringify(data));
    } catch (error) {
      console.warn('[ScenesIndex] Failed to save to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('vibe-coder-scenes-index');
      if (stored) {
        const data = JSON.parse(stored);
        this.import(data);
      }
    } catch (error) {
      console.warn('[ScenesIndex] Failed to load from storage:', error);
    }
  }
}

// Export default instance
export const scenesIndex = new ScenesIndex();