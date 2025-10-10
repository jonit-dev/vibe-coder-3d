import type { ComponentRegistry } from '../ComponentRegistry';
import type { EntityManager } from '../EntityManager';
import { ComponentIndex } from '../indexers/ComponentIndex';
import { EntityIndex } from '../indexers/EntityIndex';
import { HierarchyIndex } from '../indexers/HierarchyIndex';
import { on } from '../../events';
import { hasComponent } from 'bitecs';
import { EntityMeta } from '../BitECSComponents';

/**
 * IndexEventAdapter - Wires EntityManager and ComponentRegistry events to maintain indices
 * Ensures indices stay synchronized with ECS world state through event-driven updates
 */
export class IndexEventAdapter {
  private entityUnsubscribe?: () => void;
  private componentAddedUnsub?: () => void;
  private componentRemovedUnsub?: () => void;
  private isAttached = false;

  constructor(
    private readonly entities: EntityIndex,
    private readonly hierarchy: HierarchyIndex,
    private readonly components: ComponentIndex,
    private readonly entityManager: EntityManager,
    private readonly componentRegistry: ComponentRegistry,
  ) {}

  /**
   * Attach event listeners to EntityManager and ComponentRegistry
   * Starts synchronizing indices with ECS world events
   */
  attach(): void {
    if (this.isAttached) {
      console.warn('[IndexEventAdapter] Already attached, skipping');
      return;
    }

    // Note: ComponentRegistry uses global event system (emit/on) instead of addEventListener
    // Component index updates handled by global event listeners if needed

    // Subscribe to entity events
    this.entityUnsubscribe = this.entityManager.addEventListener((event) => {
      switch (event.type) {
        case 'entity-created':
          if (event.entityId !== undefined && event.entity) {
            console.debug(
              `[IndexEventAdapter] Adding entity ${event.entityId} to indices, parentId: ${event.entity.parentId}`,
            );
            this.entities.add(event.entityId);
            this.hierarchy.setParent(event.entityId, event.entity.parentId);
            console.debug(
              `[IndexEventAdapter] Hierarchy after adding entity ${event.entityId}: parent=${this.hierarchy.getParent(event.entityId)}, children of parent=${this.hierarchy.getChildren(event.entity.parentId || 0)}`,
            );
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

    // Subscribe to component events via global event system (ComponentRegistry uses emit())
    // ComponentRegistry emits 'component:added', 'component:removed', 'component:updated'
    this.componentAddedUnsub = on('component:added', ({ entityId, componentId }) => {
      this.components.onAdd(componentId, entityId);
    });

    this.componentRemovedUnsub = on('component:removed', ({ entityId, componentId }) => {
      this.components.onRemove(componentId, entityId);
    });

    this.isAttached = true;
    console.debug('[IndexEventAdapter] Attached to EntityManager and ComponentRegistry events');
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

    if (this.componentAddedUnsub) {
      this.componentAddedUnsub();
      this.componentAddedUnsub = undefined;
    }

    if (this.componentRemovedUnsub) {
      this.componentRemovedUnsub();
      this.componentRemovedUnsub = undefined;
    }

    this.isAttached = false;
    console.debug('[IndexEventAdapter] Detached from EntityManager and ComponentRegistry events');
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
   *
   * NOTE: Uses direct BitECS scan to avoid circular dependency with EntityManager.getAllEntities()
   */
  rebuildIndices(): void {
    console.debug('[IndexEventAdapter] Rebuilding indices from current ECS state');

    // Clear existing indices
    this.entities.clear();
    this.hierarchy.clear();
    this.components.clear();

    // Rebuild entity and hierarchy indices using direct scan (no EntityManager to avoid circular dependency)
    const world = (this.entityManager as any).world;
    const allEntities: Array<{ id: number; name: string; parentId?: number }> = [];

    // Direct BitECS scan - this is acceptable during initialization/rebuild
    for (let eid = 0; eid < 10000; eid++) {
      if (hasComponent(world, EntityMeta, eid)) {
        const entity = (this.entityManager as any).buildEntityFromEid(eid);
        if (entity) {
          allEntities.push(entity);
        }
      }
    }

    console.debug(`[IndexEventAdapter] Found ${allEntities.length} entities in world`);

    allEntities.forEach((entity) => {
      this.entities.add(entity.id);
      this.hierarchy.setParent(entity.id, entity.parentId);
      if (entity.parentId !== undefined) {
        console.debug(
          `[IndexEventAdapter] Setting parent: entity ${entity.id} -> parent ${entity.parentId}`,
        );
      }
    });

    // Rebuild component indices
    const componentTypes = this.componentRegistry.listComponents();
    console.debug(`[IndexEventAdapter] Found ${componentTypes.length} component types`);

    componentTypes.forEach((componentType) => {
      const entitiesWithComponent = this.componentRegistry.getEntitiesWithComponent(componentType);
      entitiesWithComponent.forEach((entityId) => {
        this.components.onAdd(componentType, entityId);
      });
      console.debug(
        `[IndexEventAdapter] Added ${entitiesWithComponent.length} entities for component ${componentType}`,
      );
    });

    console.debug('[IndexEventAdapter] Index rebuild complete');
    console.debug(
      `[IndexEventAdapter] Final: Entities: ${this.entities.size()}, Component types: ${this.components.getComponentTypes().length}`,
    );

    // Log hierarchy state
    const entityIds = this.entities.list();
    const hierarchyInfo = entityIds
      .map((id) => ({
        id,
        parent: this.hierarchy.getParent(id),
        children: this.hierarchy.getChildren(id),
      }))
      .filter((info) => info.parent !== undefined || info.children.length > 0);

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

    // Validate entity index
    const allEntities = this.entityManager.getAllEntities();
    const indexedEntities = new Set(this.entities.list());

    allEntities.forEach((entity) => {
      if (!indexedEntities.has(entity.id)) {
        errors.push(`Entity ${entity.id} exists in world but not in EntityIndex`);
      }
    });

    indexedEntities.forEach((entityId) => {
      const entity = this.entityManager.getEntity(entityId);
      if (!entity) {
        errors.push(`Entity ${entityId} exists in EntityIndex but not in world`);
      }
    });

    // Validate hierarchy index
    allEntities.forEach((entity) => {
      const indexedParent = this.hierarchy.getParent(entity.id);
      if (indexedParent !== entity.parentId) {
        errors.push(
          `Entity ${entity.id} parent mismatch: world=${entity.parentId}, index=${indexedParent}`,
        );
      }

      const indexedChildren = new Set(this.hierarchy.getChildren(entity.id));
      const actualChildren = new Set(entity.children);

      if (
        indexedChildren.size !== actualChildren.size ||
        ![...indexedChildren].every((child) => actualChildren.has(child))
      ) {
        errors.push(
          `Entity ${entity.id} children mismatch: world=[${Array.from(actualChildren)}], index=[${Array.from(indexedChildren)}]`,
        );
      }
    });

    // Validate component index
    const componentTypes = this.componentRegistry.listComponents();
    componentTypes.forEach((componentType) => {
      const worldEntities = new Set(this.componentRegistry.getEntitiesWithComponent(componentType));
      const indexEntities = new Set(this.components.list(componentType));

      worldEntities.forEach((entityId) => {
        if (!indexEntities.has(entityId)) {
          errors.push(
            `Entity ${entityId} has component ${componentType} in world but not in ComponentIndex`,
          );
        }
      });

      indexEntities.forEach((entityId) => {
        if (!worldEntities.has(entityId)) {
          errors.push(
            `Entity ${entityId} has component ${componentType} in ComponentIndex but not in world`,
          );
        }
      });
    });

    return errors;
  }
}
