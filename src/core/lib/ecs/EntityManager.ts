/* eslint-disable @typescript-eslint/no-explicit-any */
import { addComponent, addEntity, hasComponent, removeEntity } from 'bitecs';

import { EntityMeta } from './BitECSComponents';
import { componentRegistry, ComponentRegistry } from './ComponentRegistry';
import {
  clearPersistentIdMaps,
  generatePersistentId,
  PersistentIdSchema,
} from './components/definitions/PersistentIdComponent';
import { getEntityName, getEntityParent, setEntityMeta } from './DataConversion';
import { IEntity } from './IEntity';
import { EntityQueries } from './queries/entityQueries';
import { EntityId } from './types';
import { ECSWorld } from './World';

type EntityEvent = {
  type: 'entity-created' | 'entity-deleted' | 'entity-updated' | 'entities-cleared';
  entityId?: EntityId;
  entity?: IEntity;
};

type EntityEventListener = (event: EntityEvent) => void;

export class EntityManager {
  private static instance: EntityManager;
  private eventListeners: EntityEventListener[] = [];
  private entityCache: Map<EntityId, IEntity> = new Map();
  private existingPersistentIds: Set<string> = new Set();
  private queries: EntityQueries | null = null;
  private world: any; // BitECS world - using any for compatibility with bitecs
  private componentRegistry: ComponentRegistry;
  private isInstanceMode = false;

  constructor(world?: any, componentManager?: ComponentRegistry) {
    if (world) {
      // Instance mode with injected world and optional component manager
      this.isInstanceMode = true;
      this.world = world;
      // Note: EntityQueries will be set later via setEntityQueries to avoid circular dependency
      this.componentRegistry = componentManager || componentRegistry;
    } else {
      // Singleton mode (backward compatibility)
      this.isInstanceMode = false;
      this.world = ECSWorld.getInstance().getWorld();
      this.queries = EntityQueries.getInstance();
      this.componentRegistry = componentRegistry;
    }
  }

  /**
   * Set the EntityQueries instance for this manager (used in instance mode to avoid circular dependency)
   */
  public setEntityQueries(queries: EntityQueries): void {
    this.queries = queries;
  }

  public static getInstance(): EntityManager {
    if (!EntityManager.instance) {
      EntityManager.instance = new EntityManager();
    }
    return EntityManager.instance;
  }

  public reset(newWorld?: any): void {
    this.entityCache.clear();
    this.existingPersistentIds.clear();
    // Note: We do NOT clear eventListeners here because external components
    // (like EntityQueries/IndexEventAdapter) need to stay attached to receive
    // events about new entities created after the reset.
    // this.eventListeners = [];

    // Clear persistent ID mappings
    clearPersistentIdMaps();

    if (this.isInstanceMode) {
      // For instance mode, optionally update world and rebuild indices
      if (newWorld) {
        this.world = newWorld;
      }
      this.queries?.reset();
      return;
    }

    // Singleton mode: refresh world reference and reset indices
    this.refreshWorld();
    this.queries?.reset();
  }

  /**
   * Refresh world reference from singleton (used after ECSWorld reset)
   */
  public refreshWorld(): void {
    if (this.isInstanceMode) {
      // In instance mode, world is managed externally by the factory; no-op here
      return;
    }

    const currentSingletonWorld = ECSWorld.getInstance().getWorld();
    this.world = currentSingletonWorld;
    this.queries = EntityQueries.getInstance();
    this.entityCache.clear();
    this.rebuildPersistentIdCache();
  }

  // Event system for reactive updates
  addEventListener(listener: EntityEventListener): () => void {
    this.eventListeners.push(listener);
    return () => {
      const index = this.eventListeners.indexOf(listener);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  private emitEvent(event: EntityEvent): void {
    this.eventListeners.forEach((listener) => listener(event));
  }

  private buildEntityFromEid(eid: EntityId): IEntity | undefined {
    if (!hasComponent(this.world, EntityMeta, eid)) {
      return undefined;
    }

    const name = getEntityName(eid);
    const parentId = getEntityParent(eid);

    // Find children by scanning all entities
    const children: EntityId[] = [];
    // Note: In a real implementation, you might want to maintain a more efficient
    // children lookup, but for compatibility we'll scan

    const entity: IEntity = {
      id: eid,
      name,
      children,
      parentId,
    };

    return entity;
  }

  private updateEntityCache(eid: EntityId): void {
    const entity = this.buildEntityFromEid(eid);
    if (entity) {
      this.entityCache.set(eid, entity);
    } else {
      this.entityCache.delete(eid);
    }
  }

  /**
   * Validate and set PersistentId for an entity
   * @param eid Entity ID
   * @param persistentId Optional persistent ID to use (auto-generated if not provided)
   * @returns The final persistent ID that was set
   * @throws Error if persistent ID is invalid or already exists
   */
  private validateAndSetPersistentId(eid: EntityId, persistentId?: string): string {
    let finalPersistentId: string;

    if (persistentId) {
      // Validate the provided persistent ID
      const validation = PersistentIdSchema.safeParse({ id: persistentId });
      if (!validation.success) {
        throw new Error(`Invalid PersistentId "${persistentId}": ${validation.error.message}`);
      }

      // Check for duplicates
      if (this.existingPersistentIds.has(persistentId)) {
        throw new Error(
          `Duplicate PersistentId "${persistentId}" - each entity must have a unique persistent ID`,
        );
      }

      finalPersistentId = persistentId;
    } else {
      // Generate a unique persistent ID
      finalPersistentId = this.generateUniquePersistentId();
    }

    // Add the persistent ID component
    this.componentRegistry.addComponent(eid, 'PersistentId', { id: finalPersistentId }, this.world);

    // Track the persistent ID to prevent duplicates
    this.existingPersistentIds.add(finalPersistentId);

    return finalPersistentId;
  }

  /**
   * Generate a unique persistent ID that doesn't already exist
   * @returns A unique persistent ID
   */
  private generateUniquePersistentId(): string {
    let attempts = 0;
    let persistentId: string;

    do {
      persistentId = generatePersistentId();
      attempts++;

      if (attempts > 100) {
        throw new Error('Failed to generate unique PersistentId after 100 attempts');
      }
    } while (this.existingPersistentIds.has(persistentId));

    return persistentId;
  }

  /**
   * Build persistent ID cache from existing entities
   */
  private rebuildPersistentIdCache(): void {
    this.existingPersistentIds.clear();

    const entities = this.getAllEntities();
    entities.forEach((entity) => {
      const persistentIdData = this.componentRegistry.getComponentData<{ id: string }>(
        entity.id,
        'PersistentId',
      );
      if (persistentIdData && persistentIdData.id) {
        this.existingPersistentIds.add(persistentIdData.id);
      }
    });
  }

  createEntity(name: string, parentId?: EntityId, persistentId?: string): IEntity {
    const eid = addEntity(this.world);

    // Add required components (only EntityMeta - Transform will be added by ComponentRegistry)
    addComponent(this.world, EntityMeta, eid);

    // Set entity metadata
    setEntityMeta(eid, name, parentId);

    // Validate and set PersistentId
    this.validateAndSetPersistentId(eid, persistentId);

    // Note: Transform component is now handled by the new ComponentRegistry system
    // The useEntityCreation hook will add it via componentManager.addComponent()

    const entity = this.buildEntityFromEid(eid)!;
    this.entityCache.set(eid, entity);

    // Update parent's children list if needed (support parentId === 0)
    if (parentId !== undefined && parentId !== null && this.entityCache.has(parentId)) {
      const parent = this.entityCache.get(parentId)!;
      parent.children.push(eid);
      this.entityCache.set(parentId, parent);
    }

    // Emit event for reactive updates
    this.emitEvent({
      type: 'entity-created',
      entityId: eid,
      entity,
    });

    return entity;
  }

  /**
   * Create entity for adapter interface (returns { id: number })
   */
  createEntityForAdapter(
    name: string,
    parentId?: number | null,
    persistentId?: string,
  ): { id: number } {
    const entity = this.createEntity(name, parentId ?? undefined, persistentId);
    return { id: entity.id };
  }

  getEntity(id: EntityId): IEntity | undefined {
    if (this.entityCache.has(id)) {
      return this.entityCache.get(id);
    }

    const entity = this.buildEntityFromEid(id);
    if (entity) {
      this.entityCache.set(id, entity);
    }
    return entity;
  }

  getAllEntities(): IEntity[] {
    // Rebuild cache from BitECS world using efficient indexed lookup
    this.entityCache.clear();

    // Return entities for adapter interface
    return this.getAllEntitiesForAdapter();
  }

  /**
   * Get all entities in adapter format (for SceneDeserializer compatibility)
   */
  private getAllEntitiesForAdapter(): IEntity[] {
    return this.getAllEntitiesInternal();
  }

  /**
   * Internal method to get all entities - index-first approach
   * No more fixed-range EID scans or O(N²) children filtering
   */
  private getAllEntitiesInternal(): IEntity[] {
    // Get all entity IDs from index - no fallback scans
    let entityIds: number[] = this.queries?.listAllEntities() || [];

    // If index returns empty but queries not initialized, trigger rebuild once
    if (entityIds.length === 0 && this.queries) {
      // Quick probe: check if any entities actually exist (cheap check)
      if (this.hasAnyEntityCheapProbe()) {
        this.queries.rebuildIndices();
        entityIds = this.queries.listAllEntities();
      }
    }

    const entities: IEntity[] = [];

    // Build entities only for IDs that actually exist
    entityIds.forEach((eid) => {
      if (hasComponent(this.world, EntityMeta, eid)) {
        const entity = this.buildEntityFromEid(eid);
        if (entity) {
          entities.push(entity);
          this.entityCache.set(eid, entity);
        }
      }
    });

    // Build children relationships via HierarchyIndex (no O(N²) filtering)
    entities.forEach((entity) => {
      try {
        entity.children = this.queries?.getChildren(entity.id) || [];
      } catch {
        entity.children = [];
      }
    });

    return entities;
  }

  /**
   * Cheap probe to check if any entities exist in the world
   * Checks first 100 EIDs only - this is acceptable as a one-time probe
   */
  private hasAnyEntityCheapProbe(): boolean {
    for (let eid = 0; eid < 100; eid++) {
      if (hasComponent(this.world, EntityMeta, eid)) {
        return true;
      }
    }
    return false;
  }

  deleteEntity(id: EntityId): boolean {
    if (!hasComponent(this.world, EntityMeta, id)) {
      return false;
    }

    const entity = this.getEntity(id);
    if (!entity) return false;

    // Remove persistent ID from tracking
    const persistentIdData = this.componentRegistry.getComponentData<{ id: string }>(
      id,
      'PersistentId',
    );
    if (persistentIdData && persistentIdData.id) {
      this.existingPersistentIds.delete(persistentIdData.id);
    }

    // Remove from parent's children list
    if (entity.parentId !== undefined && entity.parentId !== null) {
      const parent = this.getEntity(entity.parentId);
      if (parent) {
        parent.children = parent.children.filter((childId) => childId !== id);
        this.entityCache.set(entity.parentId, parent);
      }
    }

    // Recursively delete children
    const childrenToDelete = [...entity.children];
    childrenToDelete.forEach((childId) => {
      this.deleteEntity(childId);
    });

    // Remove from BitECS world
    removeEntity(this.world, id);
    this.entityCache.delete(id);

    // Emit event for reactive updates
    this.emitEvent({
      type: 'entity-deleted',
      entityId: id,
      entity,
    });

    return true;
  }

  clearEntities(): void {
    // Get all entities and delete them
    const entities = this.getAllEntities();
    entities.forEach((entity) => {
      removeEntity(this.world, entity.id);
    });

    this.entityCache.clear();
    this.existingPersistentIds.clear();

    // Emit event for reactive updates
    this.emitEvent({
      type: 'entities-cleared',
    });
  }

  getChildren(id: EntityId): IEntity[] {
    const entity = this.getEntity(id);
    if (!entity) return [];

    return entity.children.map((childId) => this.getEntity(childId)).filter(Boolean) as IEntity[];
  }

  getParent(id: EntityId): IEntity | undefined {
    const entity = this.getEntity(id);
    if (entity?.parentId === undefined || entity?.parentId === null) return undefined;

    return this.getEntity(entity.parentId);
  }

  findEntitiesByName(name: string): IEntity[] {
    return this.getAllEntities().filter((entity) => entity.name === name);
  }

  getRootEntities(): IEntity[] {
    // Use efficient indexed query - no fallback scans
    const rootEntityIds = this.queries?.getRootEntities() || [];

    // If result is empty but entities likely exist, rebuild indices once
    if (rootEntityIds.length === 0 && this.queries && this.hasAnyEntityCheapProbe()) {
      this.queries.rebuildIndices();
      const rebuiltRootIds = this.queries.getRootEntities();
      return rebuiltRootIds.map((id) => this.getEntity(id)).filter(Boolean) as IEntity[];
    }

    return rootEntityIds.map((id) => this.getEntity(id)).filter(Boolean) as IEntity[];
  }

  updateEntityName(id: EntityId, name: string): boolean {
    if (!hasComponent(this.world, EntityMeta, id)) {
      return false;
    }

    setEntityMeta(id, name, getEntityParent(id));
    this.updateEntityCache(id);

    const entity = this.getEntity(id);
    if (entity) {
      // Emit event for reactive updates
      this.emitEvent({
        type: 'entity-updated',
        entityId: id,
        entity,
      });
    }

    return true;
  }

  /**
   * Set parent for adapter interface (void return)
   */
  setParentForAdapter(childId: number, parentId?: number | null): void {
    this.setParent(childId, parentId ?? undefined);
  }

  setParent(entityId: EntityId, newParentId?: EntityId): boolean {
    const entity = this.getEntity(entityId);
    if (!entity) return false;

    // Prevent circular parent-child relationships
    if (
      newParentId !== undefined &&
      newParentId !== null &&
      this.wouldCreateCircularDependency(entityId, newParentId)
    ) {
      return false;
    }

    // Remove from current parent
    const hasCurrentParent = entity.parentId !== undefined && entity.parentId !== null;

    if (hasCurrentParent) {
      const currentParent = this.getEntity(entity.parentId as EntityId);
      if (currentParent) {
        currentParent.children = currentParent.children.filter((id) => id !== entityId);
        this.entityCache.set(entity.parentId as EntityId, currentParent);
      }
    }

    // Add to new parent
    if (newParentId !== undefined && newParentId !== null) {
      const newParent = this.getEntity(newParentId);
      if (newParent) {
        newParent.children.push(entityId);
        this.entityCache.set(newParentId, newParent);
        entity.parentId = newParentId;
      }
    } else {
      entity.parentId = undefined;
    }

    // Update BitECS metadata
    setEntityMeta(entityId, entity.name, newParentId);
    this.entityCache.set(entityId, entity);

    // Emit event for reactive updates
    this.emitEvent({
      type: 'entity-updated',
      entityId,
      entity,
    });

    return true;
  }

  /**
   * Clear entities for adapter interface
   */
  clearEntitiesForAdapter(): void {
    this.clearEntities();
  }

  private wouldCreateCircularDependency(entityId: EntityId, potentialParentId: EntityId): boolean {
    let currentId: EntityId | null = potentialParentId;

    // Walk up the parent chain to see if we encounter the entityId
    while (currentId !== null) {
      if (currentId === entityId) {
        return true; // This would create a circular dependency
      }

      const parent = this.getEntity(currentId);
      currentId = parent?.parentId ?? null;
    }

    return false;
  }

  getEntityCount(): number {
    return this.getAllEntities().length;
  }

  /**
   * Get the persistent ID for an entity
   * @param entityId Entity ID
   * @returns The persistent ID string, or undefined if not found
   */
  getEntityPersistentId(entityId: EntityId): string | undefined {
    const persistentIdData = this.componentRegistry.getComponentData<{ id: string }>(
      entityId,
      'PersistentId',
    );
    return persistentIdData?.id;
  }

  /**
   * Find entity by persistent ID
   * @param persistentId The persistent ID to search for
   * @returns The entity ID if found, undefined otherwise
   */
  findEntityByPersistentId(persistentId: string): EntityId | undefined {
    const entities = this.getAllEntities();
    for (const entity of entities) {
      const entityPersistentId = this.getEntityPersistentId(entity.id);
      if (entityPersistentId === persistentId) {
        return entity.id;
      }
    }
    return undefined;
  }

  /**
   * Validate that all entities have valid persistent IDs
   * @returns Array of validation errors (empty if all valid)
   */
  validateAllPersistentIds(): string[] {
    const errors: string[] = [];
    const seenIds = new Set<string>();
    const entities = this.getAllEntities();

    for (const entity of entities) {
      const persistentIdData = this.componentRegistry.getComponentData<{ id: string }>(
        entity.id,
        'PersistentId',
      );

      if (!persistentIdData || !persistentIdData.id) {
        errors.push(`Entity ${entity.id} ("${entity.name}") is missing PersistentId component`);
        continue;
      }

      const validation = PersistentIdSchema.safeParse({ id: persistentIdData.id });
      if (!validation.success) {
        errors.push(
          `Entity ${entity.id} ("${entity.name}") has invalid PersistentId "${persistentIdData.id}": ${validation.error.message}`,
        );
        continue;
      }

      if (seenIds.has(persistentIdData.id)) {
        errors.push(
          `Entity ${entity.id} ("${entity.name}") has duplicate PersistentId "${persistentIdData.id}"`,
        );
      }

      seenIds.add(persistentIdData.id);
    }

    return errors;
  }
}
