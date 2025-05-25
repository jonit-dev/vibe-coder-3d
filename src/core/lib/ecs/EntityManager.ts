import { IEntity } from './IEntity';
import { EntityId } from './types';

type EntityEvent = {
  type: 'entity-created' | 'entity-deleted' | 'entity-updated' | 'entities-cleared';
  entityId?: EntityId;
  entity?: IEntity;
};

type EntityEventListener = (event: EntityEvent) => void;

export class EntityManager {
  private static instance: EntityManager;
  private entities: Map<EntityId, IEntity> = new Map();
  private nextEntityId: EntityId = 1;
  private eventListeners: EntityEventListener[] = [];

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

  createEntity(name: string, parentId?: EntityId): IEntity {
    const id = this.nextEntityId++;
    const entity: IEntity = { id, name, children: [], parentId };
    this.entities.set(id, entity);

    if (parentId && this.entities.has(parentId)) {
      this.entities.get(parentId)!.children.push(id);
    }

    console.debug(`[EntityManager] Created entity ${id}: "${name}"`);

    // Emit event for reactive updates
    this.emitEvent({
      type: 'entity-created',
      entityId: id,
      entity,
    });

    return entity;
  }

  getEntity(id: EntityId): IEntity | undefined {
    return this.entities.get(id);
  }

  getAllEntities(): IEntity[] {
    return Array.from(this.entities.values());
  }

  deleteEntity(id: EntityId): boolean {
    const entity = this.entities.get(id);
    if (!entity) return false;

    // Remove from parent's children list
    if (entity.parentId) {
      const parent = this.entities.get(entity.parentId);
      if (parent) {
        parent.children = parent.children.filter((childId) => childId !== id);
      }
    }

    // Recursively delete children
    const childrenToDelete = [...entity.children];
    childrenToDelete.forEach((childId) => {
      this.deleteEntity(childId);
    });

    this.entities.delete(id);
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
    this.entities.clear();
    this.nextEntityId = 1;
    console.debug('[EntityManager] Cleared all entities');

    // Emit event for reactive updates
    this.emitEvent({
      type: 'entities-cleared',
    });
  }

  getChildren(id: EntityId): IEntity[] {
    const entity = this.entities.get(id);
    if (!entity) return [];

    return entity.children
      .map((childId) => this.entities.get(childId))
      .filter(Boolean) as IEntity[];
  }

  getParent(id: EntityId): IEntity | undefined {
    const entity = this.entities.get(id);
    if (!entity?.parentId) return undefined;

    return this.entities.get(entity.parentId);
  }

  findEntitiesByName(name: string): IEntity[] {
    return Array.from(this.entities.values()).filter((entity) => entity.name === name);
  }

  getRootEntities(): IEntity[] {
    return Array.from(this.entities.values()).filter((entity) => !entity.parentId);
  }

  updateEntityName(id: EntityId, name: string): boolean {
    const entity = this.entities.get(id);
    if (!entity) return false;

    entity.name = name;

    // Emit event for reactive updates
    this.emitEvent({
      type: 'entity-updated',
      entityId: id,
      entity,
    });

    return true;
  }

  setParent(entityId: EntityId, newParentId?: EntityId): boolean {
    const entity = this.entities.get(entityId);
    if (!entity) return false;

    // Remove from current parent
    if (entity.parentId && this.entities.has(entity.parentId)) {
      const currentParent = this.entities.get(entity.parentId)!;
      currentParent.children = currentParent.children.filter((id) => id !== entityId);
    }

    // Add to new parent
    if (newParentId && this.entities.has(newParentId)) {
      const newParent = this.entities.get(newParentId)!;
      newParent.children.push(entityId);
      entity.parentId = newParentId;
    } else {
      entity.parentId = undefined;
    }

    // Emit event for reactive updates
    this.emitEvent({
      type: 'entity-updated',
      entityId,
      entity,
    });

    return true;
  }

  getEntityCount(): number {
    return this.entities.size;
  }
}
