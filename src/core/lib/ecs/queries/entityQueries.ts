/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import { create } from 'zustand';
import { EntityIndex } from '../indexers/EntityIndex';
import { HierarchyIndex } from '../indexers/HierarchyIndex';
import { ComponentIndex } from '../indexers/ComponentIndex';
import { SpatialIndex } from '../indexers/SpatialIndex';
import type { IVector3, IBounds } from '../indexers/SpatialIndex';
import { IndexEventAdapter } from '../adapters/IndexEventAdapter';
import { Vector3Pool } from '../../pooling/PooledVector3';
import type { IObjectPoolStats } from '../../pooling/ObjectPool';

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
  spatialIndex: SpatialIndex;
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

  // Spatial queries
  querySpatialBounds: (bounds: IBounds) => number[];
  querySpatialRadius: (center: IVector3, radius: number) => number[];
  updateEntityPosition: (entityId: number, position: IVector3) => void;

  // Object pooling
  getPoolStats: () => IObjectPoolStats;

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

// Export spatial types for convenience
export type { IVector3, IBounds } from '../indexers/SpatialIndex';

/**
 * EntityQueries Store - Provides efficient entity and component queries using indices
 * Replaces O(n) and O(n²) scans with indexed lookups for scalable entity traversal
 */
export const useEntityQueries = create<IEntityQueriesState>((set, get) => {
  // Initialize indices
  const entityIndex = new EntityIndex();
  const hierarchyIndex = new HierarchyIndex();
  const componentIndex = new ComponentIndex();
  const spatialIndex = new SpatialIndex({ cellSize: 10 });

  // Import singletons for shared store (lazy imports to avoid circular dependencies)
  const getEntityManager = () =>
    import('../EntityManager').then((m) => m.EntityManager.getInstance());
  const getComponentRegistry = () =>
    import('../ComponentRegistry').then((m) => m.ComponentRegistry.getInstance());

  // Create a placeholder adapter that will be replaced during initialize
  // This is necessary because managers might not be available during store creation
  const placeholderAdapter: IndexEventAdapter = {
    attach: () => {},
    detach: () => {},
    rebuildIndices: () => {},
    validateIndices: () => [],
    getIsAttached: () => false,
  } as unknown as IndexEventAdapter;

  return {
    // Index instances
    entityIndex,
    hierarchyIndex,
    componentIndex,
    spatialIndex,
    adapter: placeholderAdapter,

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

    // Spatial queries
    querySpatialBounds: (bounds: IBounds) => {
      const state = get();
      return state.spatialIndex.queryBounds(bounds);
    },

    querySpatialRadius: (center: IVector3, radius: number) => {
      const state = get();
      return state.spatialIndex.queryRadius(center, radius);
    },

    updateEntityPosition: (entityId: number, position: IVector3) => {
      const state = get();
      state.spatialIndex.updateEntity(entityId, position);
    },

    // Management methods
    initialize: () => {
      const state = get();
      console.debug('[EntityQueries] Starting initialization...');

      // Create real adapter with singleton managers (async import)
      Promise.all([getEntityManager(), getComponentRegistry()]).then(
        ([entityManager, componentRegistry]) => {
          const realAdapter = new IndexEventAdapter(
            entityIndex,
            hierarchyIndex,
            componentIndex,
            entityManager,
            componentRegistry,
          );

          // Replace placeholder with real adapter
          set({ adapter: realAdapter });

          realAdapter.attach();
          console.debug('[EntityQueries] Adapter attached');
          console.debug('[EntityQueries] Rebuilding indices...');

          // Try immediate rebuild, with fallback handling in adapters
          try {
            realAdapter.rebuildIndices();
            console.debug('[EntityQueries] Index rebuild complete');
          } catch (error) {
            console.debug(
              '[EntityQueries] Index rebuild failed, will rebuild on first query:',
              error,
            );
          }

          // Log final state
          const entities = state.listAllEntities();
          const roots = state.getRootEntities();
          console.debug(
            `[EntityQueries] Post-init: ${entities.length} entities, ${roots.length} roots`,
          );
        },
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

    getPoolStats: () => {
      return Vector3Pool.getStats();
    },
  };
});

// Singleton pattern for global access (compatible with existing EntityManager pattern)
let globalQueryInstance: ReturnType<typeof useEntityQueries.getState> | null = null;

export class EntityQueries {
  private static instance: EntityQueries;
  private queryStore: ReturnType<typeof useEntityQueries.getState> | null = null;
  // Instance-specific indices (when not using shared store)
  private entityIndex?: EntityIndex;
  private hierarchyIndex?: HierarchyIndex;
  private componentIndex?: ComponentIndex;
  private spatialIdx?: SpatialIndex;
  private adapter?: IndexEventAdapter;
  private isInstanceMode = false;

  constructor(
    world?: any,
    entityManager?: import('../EntityManager').EntityManager,
    componentRegistry?: import('../ComponentRegistry').ComponentRegistry,
  ) {
    // BitECS world - using any for compatibility
    if (world && entityManager && componentRegistry) {
      // Instance mode with injected dependencies - create isolated indices
      this.isInstanceMode = true;
      this.entityIndex = new EntityIndex();
      this.hierarchyIndex = new HierarchyIndex();
      this.componentIndex = new ComponentIndex();
      this.spatialIdx = new SpatialIndex({ cellSize: 10 });
      this.adapter = new IndexEventAdapter(
        this.entityIndex,
        this.hierarchyIndex,
        this.componentIndex,
        entityManager,
        componentRegistry,
      );
      this.adapter.attach();
      this.adapter.rebuildIndices();
    } else if (world) {
      // Legacy: world provided but no managers - use global store
      this.queryStore = useEntityQueries.getState();
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

  // Delegate methods to store or instance indices
  listAllEntities(): number[] {
    if (this.isInstanceMode && this.entityIndex) {
      return this.entityIndex.list();
    }
    if (!this.queryStore) {
      console.warn('[EntityQueries] Instance not initialized, returning empty array');
      return [];
    }
    return this.queryStore.listAllEntities();
  }

  listEntitiesWithComponent(componentType: string): number[] {
    if (this.isInstanceMode && this.componentIndex) {
      return this.componentIndex.list(componentType);
    }
    if (!this.queryStore) {
      console.warn('[EntityQueries] Instance not initialized, returning empty array');
      return [];
    }
    return this.queryStore.listEntitiesWithComponent(componentType);
  }

  listEntitiesWithComponents(componentTypes: string[]): number[] {
    if (this.isInstanceMode && this.componentIndex) {
      return this.componentIndex.listWithAllComponents(componentTypes);
    }
    if (!this.queryStore) {
      console.warn('[EntityQueries] Instance not initialized, returning empty array');
      return [];
    }
    return this.queryStore.listEntitiesWithComponents(componentTypes);
  }

  listEntitiesWithAnyComponent(componentTypes: string[]): number[] {
    if (this.isInstanceMode && this.componentIndex) {
      return this.componentIndex.listWithAnyComponent(componentTypes);
    }
    if (!this.queryStore) {
      console.warn('[EntityQueries] Instance not initialized, returning empty array');
      return [];
    }
    return this.queryStore.listEntitiesWithAnyComponent(componentTypes);
  }

  getRootEntities(): number[] {
    if (this.isInstanceMode && this.entityIndex && this.hierarchyIndex) {
      const allEntities = this.entityIndex.list();
      return this.hierarchyIndex.getRootEntities(allEntities);
    }
    if (!this.queryStore) {
      console.warn('[EntityQueries] Instance not initialized, returning empty array');
      return [];
    }
    return this.queryStore.getRootEntities();
  }

  getDescendants(entityId: number): number[] {
    if (this.isInstanceMode && this.hierarchyIndex) {
      return this.hierarchyIndex.getDescendants(entityId);
    }
    if (!this.queryStore) {
      console.warn('[EntityQueries] Instance not initialized, returning empty array');
      return [];
    }
    return this.queryStore.getDescendants(entityId);
  }

  getAncestors(entityId: number): number[] {
    if (this.isInstanceMode && this.hierarchyIndex) {
      return this.hierarchyIndex.getAncestors(entityId);
    }
    if (!this.queryStore) return [];
    return this.queryStore.getAncestors(entityId);
  }

  getParent(entityId: number): number | undefined {
    if (this.isInstanceMode && this.hierarchyIndex) {
      return this.hierarchyIndex.getParent(entityId);
    }
    if (!this.queryStore) return undefined;
    return this.queryStore.getParent(entityId);
  }

  getChildren(entityId: number): number[] {
    if (this.isInstanceMode && this.hierarchyIndex) {
      return this.hierarchyIndex.getChildren(entityId);
    }
    if (!this.queryStore) return [];
    return this.queryStore.getChildren(entityId);
  }

  hasChildren(entityId: number): boolean {
    if (this.isInstanceMode && this.hierarchyIndex) {
      return this.hierarchyIndex.getChildren(entityId).length > 0;
    }
    if (!this.queryStore) return false;
    return this.queryStore.hasChildren(entityId);
  }

  getDepth(entityId: number): number {
    if (this.isInstanceMode && this.hierarchyIndex) {
      return this.hierarchyIndex.getDepth(entityId);
    }
    if (!this.queryStore) return 0;
    return this.queryStore.getDepth(entityId);
  }

  hasComponent(entityId: number, componentType: string): boolean {
    if (this.isInstanceMode && this.componentIndex) {
      return this.componentIndex.has(componentType, entityId);
    }
    if (!this.queryStore) return false;
    return this.queryStore.hasComponent(entityId, componentType);
  }

  getComponentTypes(): string[] {
    if (this.isInstanceMode && this.componentIndex) {
      return this.componentIndex.getComponentTypes();
    }
    if (!this.queryStore) return [];
    return this.queryStore.getComponentTypes();
  }

  getComponentCount(componentType: string): number {
    if (this.isInstanceMode && this.componentIndex) {
      return this.componentIndex.count(componentType);
    }
    if (!this.queryStore) return 0;
    return this.queryStore.getComponentCount(componentType);
  }

  // Spatial query methods
  querySpatialBounds(bounds: IBounds): number[] {
    if (this.isInstanceMode && this.spatialIdx) {
      return this.spatialIdx.queryBounds(bounds);
    }
    if (!this.queryStore) return [];
    return this.queryStore.querySpatialBounds(bounds);
  }

  querySpatialRadius(center: IVector3, radius: number): number[] {
    if (this.isInstanceMode && this.spatialIdx) {
      return this.spatialIdx.queryRadius(center, radius);
    }
    if (!this.queryStore) return [];
    return this.queryStore.querySpatialRadius(center, radius);
  }

  updateEntityPosition(entityId: number, position: IVector3): void {
    if (this.isInstanceMode && this.spatialIdx) {
      this.spatialIdx.update(entityId, position);
      return;
    }
    if (!this.queryStore) return;
    this.queryStore.updateEntityPosition(entityId, position);
  }

  // Access to spatial index for advanced usage
  get spatialIndex() {
    if (this.isInstanceMode) {
      return this.spatialIdx;
    }
    return this.queryStore?.spatialIndex;
  }

  rebuildIndices(): void {
    if (this.isInstanceMode && this.adapter) {
      this.adapter.rebuildIndices();
      return;
    }
    if (!this.queryStore) return;
    this.queryStore.rebuildIndices();
  }

  validateIndices(): string[] {
    if (this.isInstanceMode && this.adapter) {
      return this.adapter.validateIndices();
    }
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
    if (this.isInstanceMode && this.adapter) {
      this.adapter.detach();
      this.entityIndex?.clear();
      this.hierarchyIndex?.clear();
      this.componentIndex?.clear();
      this.spatialIdx?.clear();
      return;
    }
    if (!this.queryStore) return;
    this.queryStore.destroy();
    globalQueryInstance = null;
  }

  reset(): void {
    if (this.isInstanceMode && this.adapter) {
      this.adapter.rebuildIndices();
      return;
    }
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

  getPoolStats(): IObjectPoolStats {
    if (!this.queryStore) {
      return {
        totalCreated: 0,
        totalAcquired: 0,
        totalReleased: 0,
        currentSize: 0,
        activeCount: 0,
        hitRate: 0,
      };
    }
    return this.queryStore.getPoolStats();
  }

  // Debug method to dump current state
  debugState(): void {
    if (!this.queryStore) {
      return;
    }

    const entities = this.queryStore.listAllEntities();

    // Show hierarchy relationships

    entities.forEach((id) => {
      const parent = this.queryStore.getParent(id);
      const children = this.queryStore.getChildren(id);
      if (parent !== undefined || children.length > 0) {
        // Entity hierarchy: parent and children relationships
      }
    });

    // Show components
    const componentTypes = this.queryStore.getComponentTypes();

    componentTypes.forEach(() => {});
  }
}
