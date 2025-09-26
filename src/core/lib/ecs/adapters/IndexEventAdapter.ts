import { EntityManager } from '../EntityManager';
import { ComponentManager } from '../ComponentManager';
import { EntityIndex } from '../indexers/EntityIndex';
import { HierarchyIndex } from '../indexers/HierarchyIndex';
import { ComponentIndex } from '../indexers/ComponentIndex';

/**
 * IndexEventAdapter - Wires EntityManager and ComponentManager events to maintain indices
 * Ensures indices stay synchronized with ECS world state through event-driven updates
 */
export class IndexEventAdapter {
  private entityUnsubscribe?: () => void;
  private componentUnsubscribe?: () => void;
  private isAttached = false;

  constructor(
    private readonly entities: EntityIndex,
    private readonly hierarchy: HierarchyIndex,
    private readonly components: ComponentIndex,
  ) {}

  /**
   * Attach event listeners to EntityManager and ComponentManager
   * Starts synchronizing indices with ECS world events
   */
  attach(): void {
    if (this.isAttached) {
      console.warn('[IndexEventAdapter] Already attached, skipping');
      return;
    }

    const entityManager = EntityManager.getInstance();
    const componentManager = ComponentManager.getInstance();

    // Subscribe to entity events
    this.entityUnsubscribe = entityManager.addEventListener((event) => {
      switch (event.type) {
        case 'entity-created':
          if (event.entityId !== undefined && event.entity) {
            this.entities.add(event.entityId);
            this.hierarchy.setParent(event.entityId, event.entity.parentId);
          }
          break;

        case 'entity-deleted':
          if (event.entityId !== undefined) {
            this.entities.delete(event.entityId);
            this.hierarchy.removeEntity(event.entityId);
            this.components.removeEntity(event.entityId);
          }
          break;

        case 'entity-updated':
          if (event.entityId !== undefined && event.entity) {
            // Update parent relationship if it changed
            this.hierarchy.setParent(event.entityId, event.entity.parentId);
          }
          break;

        case 'entities-cleared':
          this.entities.clear();
          this.hierarchy.clear();
          this.components.clear();
          break;
      }
    });

    // Subscribe to component events
    this.componentUnsubscribe = componentManager.addEventListener((event) => {
      switch (event.type) {
        case 'component-added':
          this.components.onAdd(event.componentType, event.entityId);
          break;

        case 'component-removed':
          this.components.onRemove(event.componentType, event.entityId);
          break;

        case 'component-updated':
          // Component updates don't affect membership, so no index update needed
          break;
      }
    });

    this.isAttached = true;
    console.debug('[IndexEventAdapter] Attached to EntityManager and ComponentManager events');
  }

  /**
   * Detach event listeners and stop synchronizing indices
   */
  detach(): void {
    if (!this.isAttached) {
      console.warn('[IndexEventAdapter] Not attached, skipping detach');
      return;
    }

    if (this.entityUnsubscribe) {
      this.entityUnsubscribe();
      this.entityUnsubscribe = undefined;
    }

    if (this.componentUnsubscribe) {
      this.componentUnsubscribe();
      this.componentUnsubscribe = undefined;
    }

    this.isAttached = false;
    console.debug('[IndexEventAdapter] Detached from EntityManager and ComponentManager events');
  }

  /**
   * Check if the adapter is currently attached
   */
  getIsAttached(): boolean {
    return this.isAttached;
  }

  /**
   * Rebuild indices from current ECS world state
   * Useful for initializing indices when entities/components already exist
   */
  rebuildIndices(): void {
    console.debug('[IndexEventAdapter] Rebuilding indices from current ECS state');

    // Clear existing indices
    this.entities.clear();
    this.hierarchy.clear();
    this.components.clear();

    const entityManager = EntityManager.getInstance();
    const componentManager = ComponentManager.getInstance();

    // Rebuild entity and hierarchy indices
    const allEntities = entityManager.getAllEntities();
    console.debug(`[IndexEventAdapter] Found ${allEntities.length} entities in world`);

    allEntities.forEach((entity) => {
      this.entities.add(entity.id);
      this.hierarchy.setParent(entity.id, entity.parentId);
      if (entity.parentId !== undefined) {
        console.debug(`[IndexEventAdapter] Setting parent: entity ${entity.id} -> parent ${entity.parentId}`);
      }
    });

    // Rebuild component indices
    const componentTypes = componentManager.getRegisteredComponentTypes();
    console.debug(`[IndexEventAdapter] Found ${componentTypes.length} component types`);

    componentTypes.forEach((componentType) => {
      const entitiesWithComponent = componentManager.getEntitiesWithComponent(componentType);
      entitiesWithComponent.forEach((entityId) => {
        this.components.onAdd(componentType, entityId);
      });
      console.debug(`[IndexEventAdapter] Added ${entitiesWithComponent.length} entities for component ${componentType}`);
    });

    console.debug('[IndexEventAdapter] Index rebuild complete');
    console.debug(`[IndexEventAdapter] Final: Entities: ${this.entities.size()}, Component types: ${this.components.getComponentTypes().length}`);

    // Log hierarchy state
    const entityIds = this.entities.list();
    const hierarchyInfo = entityIds.map(id => ({
      id,
      parent: this.hierarchy.getParent(id),
      children: this.hierarchy.getChildren(id)
    })).filter(info => info.parent !== undefined || info.children.length > 0);

    if (hierarchyInfo.length > 0) {
      console.debug('[IndexEventAdapter] Hierarchy relationships:', hierarchyInfo);
    } else {
      console.debug('[IndexEventAdapter] No hierarchy relationships found');
    }
  }

  /**
   * Validate index consistency against current ECS world state
   * Returns array of validation errors (empty if consistent)
   */
  validateIndices(): string[] {
    const errors: string[] = [];
    const entityManager = EntityManager.getInstance();
    const componentManager = ComponentManager.getInstance();

    // Validate entity index
    const allEntities = entityManager.getAllEntities();
    const indexedEntities = new Set(this.entities.list());

    allEntities.forEach((entity) => {
      if (!indexedEntities.has(entity.id)) {
        errors.push(`Entity ${entity.id} exists in world but not in EntityIndex`);
      }
    });

    indexedEntities.forEach((entityId) => {
      const entity = entityManager.getEntity(entityId);
      if (!entity) {
        errors.push(`Entity ${entityId} exists in EntityIndex but not in world`);
      }
    });

    // Validate hierarchy index
    allEntities.forEach((entity) => {
      const indexedParent = this.hierarchy.getParent(entity.id);
      if (indexedParent !== entity.parentId) {
        errors.push(`Entity ${entity.id} parent mismatch: world=${entity.parentId}, index=${indexedParent}`);
      }

      const indexedChildren = new Set(this.hierarchy.getChildren(entity.id));
      const actualChildren = new Set(entity.children);

      if (indexedChildren.size !== actualChildren.size ||
          ![...indexedChildren].every(child => actualChildren.has(child))) {
        errors.push(`Entity ${entity.id} children mismatch: world=[${Array.from(actualChildren)}], index=[${Array.from(indexedChildren)}]`);
      }
    });

    // Validate component index
    const componentTypes = componentManager.getRegisteredComponentTypes();
    componentTypes.forEach((componentType) => {
      const worldEntities = new Set(componentManager.getEntitiesWithComponent(componentType));
      const indexEntities = new Set(this.components.list(componentType));

      worldEntities.forEach((entityId) => {
        if (!indexEntities.has(entityId)) {
          errors.push(`Entity ${entityId} has component ${componentType} in world but not in ComponentIndex`);
        }
      });

      indexEntities.forEach((entityId) => {
        if (!worldEntities.has(entityId)) {
          errors.push(`Entity ${entityId} has component ${componentType} in ComponentIndex but not in world`);
        }
      });
    });

    return errors;
  }
}