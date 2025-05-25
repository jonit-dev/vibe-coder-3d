import { addComponent, addEntity, hasComponent, removeEntity } from 'bitecs';

import { EntityMeta, Transform } from './BitECSComponents';
import { getEntityName, getEntityParent, setEntityMeta } from './DataConversion';
import { IEntity } from './IEntity';
import { ECSWorld } from './World';
import { EntityId } from './types';

type EntityEvent = {
  type: 'entity-created' | 'entity-deleted' | 'entity-updated' | 'entities-cleared';
  entityId?: EntityId;
  entity?: IEntity;
};

type EntityEventListener = (event: EntityEvent) => void;

export class EntityManager {
  private static instance: EntityManager;
  private world = ECSWorld.getInstance().getWorld();
  private eventListeners: EntityEventListener[] = [];
  private entityCache: Map<EntityId, IEntity> = new Map();
  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): EntityManager {
    if (!EntityManager.instance) {
      EntityManager.instance = new EntityManager();
    }
    return EntityManager.instance;
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

  createEntity(name: string, parentId?: EntityId): IEntity {
    const eid = addEntity(this.world);

    // Add required components
    addComponent(this.world, EntityMeta, eid);
    addComponent(this.world, Transform, eid);

    // Set entity metadata
    setEntityMeta(eid, name, parentId);

    // Initialize transform with default values
    Transform.positionX[eid] = 0;
    Transform.positionY[eid] = 0;
    Transform.positionZ[eid] = 0;
    Transform.rotationX[eid] = 0;
    Transform.rotationY[eid] = 0;
    Transform.rotationZ[eid] = 0;
    Transform.scaleX[eid] = 1;
    Transform.scaleY[eid] = 1;
    Transform.scaleZ[eid] = 1;

    const entity = this.buildEntityFromEid(eid)!;
    this.entityCache.set(eid, entity);

    // Update parent's children list if needed
    if (parentId && this.entityCache.has(parentId)) {
      const parent = this.entityCache.get(parentId)!;
      parent.children.push(eid);
      this.entityCache.set(parentId, parent);
    }

    console.debug(`[EntityManager] Created entity ${eid}: "${name}"`);
    console.debug(`[EntityManager] Entity cache size: ${this.entityCache.size}`);
    console.debug(
      `[EntityManager] Can find entity immediately: ${this.getEntity(eid) !== undefined}`,
    );

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
    // Rebuild cache from BitECS world
    this.entityCache.clear();

    // Get all entities that have EntityMeta component
    const entities: IEntity[] = [];

    // Note: BitECS doesn't provide a direct way to iterate all entities,
    // so we'll maintain our cache and scan when needed
    for (let eid = 0; eid < 10000; eid++) {
      // Reasonable upper bound, starting from 0 since BitECS uses 0-based IDs
      if (hasComponent(this.world, EntityMeta, eid)) {
        const entity = this.buildEntityFromEid(eid);
        if (entity) {
          entities.push(entity);
          this.entityCache.set(eid, entity);
        }
      }
    }

    // Build children relationships
    entities.forEach((entity) => {
      entity.children = entities
        .filter((child) => child.parentId === entity.id)
        .map((child) => child.id);
    });

    return entities;
  }

  deleteEntity(id: EntityId): boolean {
    if (!hasComponent(this.world, EntityMeta, id)) {
      return false;
    }

    const entity = this.getEntity(id);
    if (!entity) return false;

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
    console.debug('[EntityManager] Cleared all entities');

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
    return this.getAllEntities().filter((entity) => !entity.parentId);
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

  getEntityCount(): number {
    return this.getAllEntities().length;
  }
}
