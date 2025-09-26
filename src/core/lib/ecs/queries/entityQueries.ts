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

export const safeValidateComponentQuery = (query: unknown) =>
  ComponentQuerySchema.safeParse(query);

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
      console.debug(`[EntityQueries] Post-init: ${entities.length} entities, ${roots.length} roots`);
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

  private constructor() {
    if (!globalQueryInstance) {
      globalQueryInstance = useEntityQueries.getState();
      globalQueryInstance.initialize();
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
    if (!globalQueryInstance) {
      console.warn('[EntityQueries] Instance not initialized, returning empty array');
      return [];
    }
    return globalQueryInstance.listAllEntities();
  }

  listEntitiesWithComponent(componentType: string): number[] {
    if (!globalQueryInstance) {
      console.warn('[EntityQueries] Instance not initialized, returning empty array');
      return [];
    }
    return globalQueryInstance.listEntitiesWithComponent(componentType);
  }

  listEntitiesWithComponents(componentTypes: string[]): number[] {
    if (!globalQueryInstance) {
      console.warn('[EntityQueries] Instance not initialized, returning empty array');
      return [];
    }
    return globalQueryInstance.listEntitiesWithComponents(componentTypes);
  }

  listEntitiesWithAnyComponent(componentTypes: string[]): number[] {
    if (!globalQueryInstance) {
      console.warn('[EntityQueries] Instance not initialized, returning empty array');
      return [];
    }
    return globalQueryInstance.listEntitiesWithAnyComponent(componentTypes);
  }

  getRootEntities(): number[] {
    if (!globalQueryInstance) {
      console.warn('[EntityQueries] Instance not initialized, returning empty array');
      return [];
    }
    return globalQueryInstance.getRootEntities();
  }

  getDescendants(entityId: number): number[] {
    if (!globalQueryInstance) {
      console.warn('[EntityQueries] Instance not initialized, returning empty array');
      return [];
    }
    return globalQueryInstance.getDescendants(entityId);
  }

  getAncestors(entityId: number): number[] {
    if (!globalQueryInstance) return [];
    return globalQueryInstance.getAncestors(entityId);
  }

  getParent(entityId: number): number | undefined {
    if (!globalQueryInstance) return undefined;
    return globalQueryInstance.getParent(entityId);
  }

  getChildren(entityId: number): number[] {
    if (!globalQueryInstance) return [];
    return globalQueryInstance.getChildren(entityId);
  }

  hasChildren(entityId: number): boolean {
    if (!globalQueryInstance) return false;
    return globalQueryInstance.hasChildren(entityId);
  }

  getDepth(entityId: number): number {
    if (!globalQueryInstance) return 0;
    return globalQueryInstance.getDepth(entityId);
  }

  hasComponent(entityId: number, componentType: string): boolean {
    if (!globalQueryInstance) return false;
    return globalQueryInstance.hasComponent(entityId, componentType);
  }

  getComponentTypes(): string[] {
    if (!globalQueryInstance) return [];
    return globalQueryInstance.getComponentTypes();
  }

  getComponentCount(componentType: string): number {
    if (!globalQueryInstance) return 0;
    return globalQueryInstance.getComponentCount(componentType);
  }

  rebuildIndices(): void {
    if (!globalQueryInstance) return;
    globalQueryInstance.rebuildIndices();
  }

  validateIndices(): string[] {
    if (!globalQueryInstance) return [];
    return globalQueryInstance.validateIndices();
  }

  async checkConsistency(): Promise<IConsistencyReport> {
    if (!globalQueryInstance) {
      return { isConsistent: false, errors: ['EntityQueries not initialized'], warnings: [], stats: { entitiesInWorld: 0, entitiesInIndex: 0, componentTypes: 0, totalComponents: 0, hierarchyRelationships: 0 } };
    }
    return await globalQueryInstance.checkConsistency();
  }

  async assertConsistency(): Promise<void> {
    if (!globalQueryInstance) return;
    await globalQueryInstance.assertConsistency();
  }

  async startPeriodicChecks(intervalMs?: number): Promise<() => void> {
    if (!globalQueryInstance) return () => {};
    return await globalQueryInstance.startPeriodicChecks(intervalMs);
  }

  destroy(): void {
    if (!globalQueryInstance) return;
    globalQueryInstance.destroy();
    globalQueryInstance = null;
  }

  // Debug method to dump current state
  debugState(): void {
    if (!globalQueryInstance) {
      console.log('[EntityQueries] Not initialized');
      return;
    }

    const entities = globalQueryInstance.listAllEntities();
    const roots = globalQueryInstance.getRootEntities();

    console.log('=== EntityQueries Debug State ===');
    console.log('Total entities:', entities.length);
    console.log('Entity IDs:', entities);
    console.log('Root entities:', roots.length);
    console.log('Root IDs:', roots);

    // Show hierarchy relationships
    console.log('\nHierarchy relationships:');
    entities.forEach(id => {
      const parent = globalQueryInstance.getParent(id);
      const children = globalQueryInstance.getChildren(id);
      if (parent !== undefined || children.length > 0) {
        console.log(`  Entity ${id}: parent=${parent}, children=[${children.join(', ')}]`);
      }
    });

    // Show components
    const componentTypes = globalQueryInstance.getComponentTypes();
    console.log('\nComponent types:', componentTypes.length);
    componentTypes.forEach(type => {
      const count = globalQueryInstance.getComponentCount(type);
      console.log(`  ${type}: ${count} entities`);
    });

    console.log('=== End Debug State ===');
  }
}