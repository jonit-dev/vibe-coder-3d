import { z } from 'zod';
import { create } from 'zustand';
import { EntityIndex } from '../indexers/EntityIndex';
import { HierarchyIndex } from '../indexers/HierarchyIndex';
import { ComponentIndex } from '../indexers/ComponentIndex';
import { IndexEventAdapter } from '../adapters/IndexEventAdapter';

// Lazy import to avoid circular dependency
let ConsistencyChecker: any = null;
const getConsistencyChecker = async () => {
  if (!ConsistencyChecker) {
    const module = await import('../utils/consistencyChecker');
    ConsistencyChecker = module.ConsistencyChecker;
  }
  return ConsistencyChecker;
};

export interface IConsistencyReport {
  isConsistent: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    entitiesInWorld: number;
    entitiesInIndex: number;
    componentTypes: number;
    totalComponents: number;
    hierarchyRelationships: number;
  };
}

// Zod schemas for validation
export const EntityQueryConfigSchema = z.object({
  enableValidation: z.boolean().default(true),
  enableConsistencyChecks: z.boolean().default(false),
});

export const ComponentQuerySchema = z.object({
  componentTypes: z.array(z.string()).min(1),
  operation: z.enum(['all', 'any']).default('all'),
});

export interface IEntityQueryConfig {
  enableValidation: boolean;
  enableConsistencyChecks: boolean;
}

export interface IComponentQuery {
  componentTypes: string[];
  operation: 'all' | 'any';
}

export interface IEntityQueriesState {
  // Index instances
  entityIndex: EntityIndex;
  hierarchyIndex: HierarchyIndex;
  componentIndex: ComponentIndex;
  adapter: IndexEventAdapter;

  // Configuration
  config: IEntityQueryConfig;

  // Query methods
  listAllEntities: () => number[];
  listEntitiesWithComponent: (componentType: string) => number[];
  listEntitiesWithComponents: (componentTypes: string[]) => number[];
  listEntitiesWithAnyComponent: (componentTypes: string[]) => number[];
  getRootEntities: () => number[];
  getDescendants: (entityId: number) => number[];
  getAncestors: (entityId: number) => number[];

  // Hierarchy queries
  getParent: (entityId: number) => number | undefined;
  getChildren: (entityId: number) => number[];
  hasChildren: (entityId: number) => boolean;
  getDepth: (entityId: number) => number;

  // Component queries
  hasComponent: (entityId: number, componentType: string) => boolean;
  getComponentTypes: () => string[];
  getComponentCount: (componentType: string) => number;

  // Management methods
  initialize: () => void;
  destroy: () => void;
  rebuildIndices: () => void;
  validateIndices: () => string[];

  // Performance and consistency
  checkConsistency: () => Promise<IConsistencyReport>;
  assertConsistency: () => Promise<void>;
  startPeriodicChecks: (intervalMs?: number) => Promise<() => void>;

  // Configuration
  setConfig: (config: Partial<IEntityQueryConfig>) => void;
}

// Validation helpers
export const validateComponentQuery = (query: unknown): IComponentQuery =>
  ComponentQuerySchema.parse(query);

export const safeValidateComponentQuery = (query: unknown) => ComponentQuerySchema.safeParse(query);

/**
 * EntityQueries Store - Provides efficient entity and component queries using indices
 * Replaces O(n) and O(n²) scans with indexed lookups for scalable entity traversal
 */
export const useEntityQueries = create<IEntityQueriesState>((set, get) => {
  // Initialize indices
  const entityIndex = new EntityIndex();
  const hierarchyIndex = new HierarchyIndex();
  const componentIndex = new ComponentIndex();
  const adapter = new IndexEventAdapter(entityIndex, hierarchyIndex, componentIndex);

  return {
    // Index instances
    entityIndex,
    hierarchyIndex,
    componentIndex,
    adapter,

    // Configuration
    config: EntityQueryConfigSchema.parse({}),

    // Basic entity queries
    listAllEntities: () => {
      const state = get();
      return state.entityIndex.list();
    },

    listEntitiesWithComponent: (componentType: string) => {
      const state = get();
      if (state.config.enableValidation && typeof componentType !== 'string') {
        console.error('[EntityQueries] Invalid component type:', componentType);
        return [];
      }
      return state.componentIndex.list(componentType);
    },

    listEntitiesWithComponents: (componentTypes: string[]) => {
      const state = get();
      if (state.config.enableValidation) {
        try {
          validateComponentQuery({ componentTypes, operation: 'all' });
        } catch (error) {
          console.error('[EntityQueries] Invalid component types:', error);
          return [];
        }
      }
      return state.componentIndex.listWithAllComponents(componentTypes);
    },

    listEntitiesWithAnyComponent: (componentTypes: string[]) => {
      const state = get();
      if (state.config.enableValidation) {
        try {
          validateComponentQuery({ componentTypes, operation: 'any' });
        } catch (error) {
          console.error('[EntityQueries] Invalid component types:', error);
          return [];
        }
      }
      return state.componentIndex.listWithAnyComponent(componentTypes);
    },

    getRootEntities: () => {
      const state = get();
      const allEntities = state.entityIndex.list();
      return state.hierarchyIndex.getRootEntities(allEntities);
    },

    getDescendants: (entityId: number) => {
      const state = get();
      if (state.config.enableValidation && typeof entityId !== 'number') {
        console.error('[EntityQueries] Invalid entity ID:', entityId);
        return [];
      }
      return state.hierarchyIndex.getDescendants(entityId);
    },

    getAncestors: (entityId: number) => {
      const state = get();
      if (state.config.enableValidation && typeof entityId !== 'number') {
        console.error('[EntityQueries] Invalid entity ID:', entityId);
        return [];
      }

      const ancestors: number[] = [];
      let currentParent = state.hierarchyIndex.getParent(entityId);

      while (currentParent !== undefined) {
        ancestors.push(currentParent);
        currentParent = state.hierarchyIndex.getParent(currentParent);
      }

      return ancestors;
    },

    // Hierarchy queries
    getParent: (entityId: number) => {
      const state = get();
      return state.hierarchyIndex.getParent(entityId);
    },

    getChildren: (entityId: number) => {
      const state = get();
      return state.hierarchyIndex.getChildren(entityId);
    },

    hasChildren: (entityId: number) => {
      const state = get();
      return state.hierarchyIndex.hasChildren(entityId);
    },

    getDepth: (entityId: number) => {
      const state = get();
      return get().getAncestors(entityId).length;
    },

    // Component queries
    hasComponent: (entityId: number, componentType: string) => {
      const state = get();
      return state.componentIndex.has(componentType, entityId);
    },

    getComponentTypes: () => {
      const state = get();
      return state.componentIndex.getComponentTypes();
    },

    getComponentCount: (componentType: string) => {
      const state = get();
      return state.componentIndex.getCount(componentType);
    },

    // Management methods
    initialize: () => {
      const state = get();
      console.debug('[EntityQueries] Starting initialization...');
      state.adapter.attach();
      console.debug('[EntityQueries] Adapter attached');
      console.debug('[EntityQueries] Rebuilding indices...');

      // Try immediate rebuild, with fallback handling in adapters
      try {
        state.adapter.rebuildIndices();
        console.debug('[EntityQueries] Index rebuild complete');
      } catch (error) {
        console.debug('[EntityQueries] Index rebuild failed, will rebuild on first query:', error);
      }

      // Log final state
      const entities = state.listAllEntities();
      const roots = state.getRootEntities();
      console.debug(
        `[EntityQueries] Post-init: ${entities.length} entities, ${roots.length} roots`,
      );
    },

    destroy: () => {
      const state = get();
      state.adapter.detach();
      state.entityIndex.clear();
      state.hierarchyIndex.clear();
      state.componentIndex.clear();
      console.debug('[EntityQueries] Destroyed and detached from ECS events');
    },

    rebuildIndices: () => {
      const state = get();
      state.adapter.rebuildIndices();
      console.debug('[EntityQueries] Rebuilt indices from current ECS state');
    },

    validateIndices: () => {
      const state = get();
      return state.adapter.validateIndices();
    },

    // Performance and consistency methods
    checkConsistency: async () => {
      const checker = await getConsistencyChecker();
      return checker.check();
    },

    assertConsistency: async () => {
      const checker = await getConsistencyChecker();
      checker.assert();
    },

    startPeriodicChecks: async (intervalMs: number = 30000) => {
      const checker = await getConsistencyChecker();
      return checker.startPeriodicChecks(intervalMs);
    },

    setConfig: (newConfig: Partial<IEntityQueryConfig>) => {
      const state = get();
      try {
        const updatedConfig = EntityQueryConfigSchema.parse({
          ...state.config,
          ...newConfig,
        });
        set({ config: updatedConfig });
        console.debug('[EntityQueries] Updated configuration:', updatedConfig);
      } catch (error) {
        console.error('[EntityQueries] Invalid configuration:', error);
      }
    },
  };
});

// Singleton pattern for global access (compatible with existing EntityManager pattern)
let globalQueryInstance: ReturnType<typeof useEntityQueries.getState> | null = null;

export class EntityQueries {
  private static instance: EntityQueries;
  private queryStore: ReturnType<typeof useEntityQueries.getState>;

  constructor(world?: any) {
    // BitECS world - using any for compatibility
    if (world) {
      // Instance mode with injected world - create new store
      this.queryStore = useEntityQueries.getState();
      // TODO: Initialize with specific world when store supports it
      this.queryStore.initialize();
    } else {
      // Singleton mode (backward compatibility)
      if (!globalQueryInstance) {
        globalQueryInstance = useEntityQueries.getState();
        globalQueryInstance.initialize();
      }
      this.queryStore = globalQueryInstance;
    }
  }

  public static getInstance(): EntityQueries {
    if (!EntityQueries.instance) {
      EntityQueries.instance = new EntityQueries();
    }
    return EntityQueries.instance;
  }

  // Delegate methods to store
  listAllEntities(): number[] {
    if (!this.queryStore) {
      console.warn('[EntityQueries] Instance not initialized, returning empty array');
      return [];
    }
    return this.queryStore.listAllEntities();
  }

  listEntitiesWithComponent(componentType: string): number[] {
    if (!this.queryStore) {
      console.warn('[EntityQueries] Instance not initialized, returning empty array');
      return [];
    }
    return this.queryStore.listEntitiesWithComponent(componentType);
  }

  listEntitiesWithComponents(componentTypes: string[]): number[] {
    if (!this.queryStore) {
      console.warn('[EntityQueries] Instance not initialized, returning empty array');
      return [];
    }
    return this.queryStore.listEntitiesWithComponents(componentTypes);
  }

  listEntitiesWithAnyComponent(componentTypes: string[]): number[] {
    if (!this.queryStore) {
      console.warn('[EntityQueries] Instance not initialized, returning empty array');
      return [];
    }
    return this.queryStore.listEntitiesWithAnyComponent(componentTypes);
  }

  getRootEntities(): number[] {
    if (!this.queryStore) {
      console.warn('[EntityQueries] Instance not initialized, returning empty array');
      return [];
    }
    return this.queryStore.getRootEntities();
  }

  getDescendants(entityId: number): number[] {
    if (!this.queryStore) {
      console.warn('[EntityQueries] Instance not initialized, returning empty array');
      return [];
    }
    return this.queryStore.getDescendants(entityId);
  }

  getAncestors(entityId: number): number[] {
    if (!this.queryStore) return [];
    return this.queryStore.getAncestors(entityId);
  }

  getParent(entityId: number): number | undefined {
    if (!this.queryStore) return undefined;
    return this.queryStore.getParent(entityId);
  }

  getChildren(entityId: number): number[] {
    if (!this.queryStore) return [];
    return this.queryStore.getChildren(entityId);
  }

  hasChildren(entityId: number): boolean {
    if (!this.queryStore) return false;
    return this.queryStore.hasChildren(entityId);
  }

  getDepth(entityId: number): number {
    if (!this.queryStore) return 0;
    return this.queryStore.getDepth(entityId);
  }

  hasComponent(entityId: number, componentType: string): boolean {
    if (!this.queryStore) return false;
    return this.queryStore.hasComponent(entityId, componentType);
  }

  getComponentTypes(): string[] {
    if (!this.queryStore) return [];
    return this.queryStore.getComponentTypes();
  }

  getComponentCount(componentType: string): number {
    if (!this.queryStore) return 0;
    return this.queryStore.getComponentCount(componentType);
  }

  rebuildIndices(): void {
    if (!this.queryStore) return;
    this.queryStore.rebuildIndices();
  }

  validateIndices(): string[] {
    if (!this.queryStore) return [];
    return this.queryStore.validateIndices();
  }

  async checkConsistency(): Promise<IConsistencyReport> {
    if (!this.queryStore) {
      return {
        isConsistent: false,
        errors: ['EntityQueries not initialized'],
        warnings: [],
        stats: {
          entitiesInWorld: 0,
          entitiesInIndex: 0,
          componentTypes: 0,
          totalComponents: 0,
          hierarchyRelationships: 0,
        },
      };
    }
    return await this.queryStore.checkConsistency();
  }

  async assertConsistency(): Promise<void> {
    if (!this.queryStore) return;
    await this.queryStore.assertConsistency();
  }

  async startPeriodicChecks(intervalMs?: number): Promise<() => void> {
    if (!this.queryStore) return () => {};
    return await this.queryStore.startPeriodicChecks(intervalMs);
  }

  destroy(): void {
    if (!this.queryStore) return;
    this.queryStore.destroy();
    globalQueryInstance = null;
  }

  reset(): void {
    if (this.queryStore) {
      this.queryStore.destroy();
    }
    globalQueryInstance = useEntityQueries.getState();
    globalQueryInstance.initialize();
    this.queryStore = globalQueryInstance;
  }

  refreshWorld(): void {
    // For now, refreshWorld behaves the same as reset since we reinitialize everything
    this.reset();
  }

  // Debug method to dump current state
  debugState(): void {
    if (!this.queryStore) {
      console.log('[EntityQueries] Not initialized');
      return;
    }

    const entities = this.queryStore.listAllEntities();
    const roots = this.queryStore.getRootEntities();

    console.log('=== EntityQueries Debug State ===');
    console.log('Total entities:', entities.length);
    console.log('Entity IDs:', entities);
    console.log('Root entities:', roots.length);
    console.log('Root IDs:', roots);

    // Show hierarchy relationships
    console.log('\nHierarchy relationships:');
    entities.forEach((id) => {
      const parent = this.queryStore.getParent(id);
      const children = this.queryStore.getChildren(id);
      if (parent !== undefined || children.length > 0) {
        console.log(`  Entity ${id}: parent=${parent}, children=[${children.join(', ')}]`);
      }
    });

    // Show components
    const componentTypes = this.queryStore.getComponentTypes();
    console.log('\nComponent types:', componentTypes.length);
    componentTypes.forEach((type) => {
      const count = this.queryStore.getComponentCount(type);
      console.log(`  ${type}: ${count} entities`);
    });

    console.log('=== End Debug State ===');
  }
}
