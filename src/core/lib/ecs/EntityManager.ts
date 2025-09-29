/* eslint-disable @typescript-eslint/no-explicit-any */
import { addComponent, addEntity, hasComponent, removeEntity } from 'bitecs';

import { Logger } from '../logger';
import { EntityMeta } from './BitECSComponents';
import { componentRegistry, ComponentRegistry } from './ComponentRegistry';
import {
  generatePersistentId,
  PersistentIdSchema,
  clearPersistentIdMaps,
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
  private queries: EntityQueries;
  private world: any; // BitECS world - using any for compatibility with bitecs
  private componentRegistry: ComponentRegistry;
  private logger = Logger.create('EntityManager');

  constructor(world?: any, componentManager?: ComponentRegistry) {
    if (world) {
      // Instance mode with injected world and optional component manager
      this.world = world;
      this.queries = new EntityQueries(world);
      this.componentRegistry = componentManager || componentRegistry;
    } else {
      // Singleton mode (backward compatibility)
      this.world = ECSWorld.getInstance().getWorld();
      this.queries = EntityQueries.getInstance();
      this.componentRegistry = componentRegistry;
    }
  }

  public static getInstance(): EntityManager {
    if (!EntityManager.instance) {
      EntityManager.instance = new EntityManager();
    }
    return EntityManager.instance;
  }

  public reset(): void {
    this.entityCache.clear();
    this.existingPersistentIds.clear();
    this.eventListeners = [];

    // Clear persistent ID mappings
    clearPersistentIdMaps();

    // Refresh world reference in case ECSWorld singleton was reset
    this.refreshWorld();

    // Reset EntityQueries to rebuild indices with new world state
    this.queries.reset();
  }

  /**
   * Refresh world reference from singleton (used after ECSWorld reset)
   */
  public refreshWorld(): void {
    // Always refresh for singleton instances (instance was created without injected world)
    // We can't reliably check if this.world === ECSWorld.getInstance().getWorld()
    // because the world may have been reset, so we check if we're a singleton instance
    const currentSingletonWorld = ECSWorld.getInstance().getWorld();

    // Force refresh the world reference to current singleton world
    this.world = currentSingletonWorld;
    // Also update queries with new world
    this.queries = EntityQueries.getInstance();

    // Clear cache and rebuild persistent ID tracking
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
      const persistentIdData = componentRegistry.getComponentData<{ id: string }>(
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
    const finalPersistentId = this.validateAndSetPersistentId(eid, persistentId);

    // Note: Transform component is now handled by the new ComponentRegistry system
    // The useEntityCreation hook will add it via componentManager.addComponent()

    const entity = this.buildEntityFromEid(eid)!;
    this.entityCache.set(eid, entity);

    // Update parent's children list if needed
    if (parentId && this.entityCache.has(parentId)) {
      const parent = this.entityCache.get(parentId)!;
      parent.children.push(eid);
      this.entityCache.set(parentId, parent);
      this.logger.debug(`Updated parent ${parentId} children list: ${parent.children}`);
    }

    this.logger.debug(
      `Created entity ${eid}: "${name}" with parentId: ${parentId}, PersistentId: ${finalPersistentId}`,
    );
    this.logger.debug(`Entity cache size: ${this.entityCache.size}`);

    // Emit event for reactive updates
    this.emitEvent({
      type: 'entity-created',
      entityId: eid,
      entity,
    });

    return entity;
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

    // Get all entity IDs - use scan as fallback if queries not ready
    let entityIds: number[];
    try {
      entityIds = this.queries.listAllEntities();

      // If queries return empty but we know entities exist, fall back to scan
      if (entityIds.length === 0) {
        // Quick check: do any entities actually exist?
        let hasAnyEntity = false;
        for (let eid = 0; eid < 100; eid++) {
          if (hasComponent(this.world, EntityMeta, eid)) {
            hasAnyEntity = true;
            break;
          }
        }

        if (hasAnyEntity) {
          // Fall back to scan
          entityIds = [];
          for (let eid = 0; eid < 10000; eid++) {
            if (hasComponent(this.world, EntityMeta, eid)) {
              entityIds.push(eid);
            }
          }
        }
      }
    } catch {
      // If queries not initialized, fall back to scan
      entityIds = [];
      for (let eid = 0; eid < 10000; eid++) {
        if (hasComponent(this.world, EntityMeta, eid)) {
          entityIds.push(eid);
        }
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

    // Build children relationships - use queries if available, otherwise scan
    try {
      const queriesAvailable = this.queries && this.queries.listAllEntities().length > 0;
      entities.forEach((entity) => {
        if (queriesAvailable) {
          entity.children = this.queries.getChildren(entity.id);
        } else {
          // Fall back to filtering
          entity.children = entities
            .filter((child) => child.parentId === entity.id)
            .map((child) => child.id);
        }
      });
    } catch {
      // Fall back to filtering
      entities.forEach((entity) => {
        entity.children = entities
          .filter((child) => child.parentId === entity.id)
          .map((child) => child.id);
      });
    }

    return entities;
  }

  deleteEntity(id: EntityId): boolean {
    if (!hasComponent(this.world, EntityMeta, id)) {
      return false;
    }

    const entity = this.getEntity(id);
    if (!entity) return false;

    // Remove persistent ID from tracking
    const persistentIdData = componentRegistry.getComponentData<{ id: string }>(id, 'PersistentId');
    if (persistentIdData && persistentIdData.id) {
      this.existingPersistentIds.delete(persistentIdData.id);
    }

    // Remove from parent's children list
    if (entity.parentId) {
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

    console.debug(`[EntityManager] Deleted entity ${id}: "${entity.name}"`);

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
    console.debug('[EntityManager] Cleared all entities and persistent ID cache');

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
    if (!entity?.parentId) return undefined;

    return this.getEntity(entity.parentId);
  }

  findEntitiesByName(name: string): IEntity[] {
    return this.getAllEntities().filter((entity) => entity.name === name);
  }

  getRootEntities(): IEntity[] {
    // Try to use efficient indexed query, fall back if queries not ready
    try {
      const rootEntityIds = this.queries.getRootEntities();

      // If result is empty, verify with fallback to avoid race conditions
      if (rootEntityIds.length === 0) {
        // Quick check if any entities exist
        for (let eid = 0; eid < 100; eid++) {
          if (hasComponent(this.world, EntityMeta, eid)) {
            // Entities exist, fall back to filtering all entities
            const allEntities = this.getAllEntities();
            return allEntities.filter((entity) => entity.parentId === undefined);
          }
        }
      }

      return rootEntityIds.map((id) => this.getEntity(id)).filter(Boolean) as IEntity[];
    } catch {
      // Fall back to filtering all entities if queries not available
      const allEntities = this.getAllEntities();
      return allEntities.filter((entity) => entity.parentId === undefined);
    }
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

  setParent(entityId: EntityId, newParentId?: EntityId): boolean {
    const entity = this.getEntity(entityId);
    if (!entity) return false;

    // Prevent circular parent-child relationships
    if (newParentId && this.wouldCreateCircularDependency(entityId, newParentId)) {
      return false;
    }

    // Remove from current parent
    if (entity.parentId) {
      const currentParent = this.getEntity(entity.parentId);
      if (currentParent) {
        currentParent.children = currentParent.children.filter((id) => id !== entityId);
        this.entityCache.set(entity.parentId, currentParent);
      }
    }

    // Add to new parent
    if (newParentId) {
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
    const persistentIdData = componentRegistry.getComponentData<{ id: string }>(
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
      const persistentIdData = componentRegistry.getComponentData<{ id: string }>(
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
