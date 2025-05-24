/**
 * Unified Dynamic Component Manager
 * THE SINGLE SOURCE OF TRUTH for all entity and component operations
 */

import { addComponent, addEntity, hasComponent, removeComponent } from 'bitecs';

import { world } from '@/core/lib/ecs';
import type {
  ComponentCategory,
  IComponentChangeEvent,
  IComponentDescriptor,
  IValidationResult,
} from '@/core/types/component-registry';

interface IComponentStats {
  registeredComponents: number;
  entitiesWithComponents: number;
  totalComponentInstances: number;
}

interface IComponentInfo {
  descriptor: IComponentDescriptor;
}

interface IComponentGroup {
  id: string;
  name: string;
  description: string;
  category: ComponentCategory;
  icon: string;
  components: string[];
  defaultValues?: Record<string, any>;
  order: number;
}

export interface IEntityCreationOptions {
  name?: string;
  components?: Array<{ id: string; data?: any }>;
}

export class ComponentManager {
  // Singleton instance
  private static instance: ComponentManager;

  // Component registry
  private components = new Map<string, IComponentInfo>();

  // Entity tracking - THIS IS THE MASTER REGISTRY
  private entities = new Set<number>();
  private entityComponents = new Map<number, Set<string>>();
  private entityData = new Map<string, Map<number, any>>(); // componentId -> entityId -> data

  // Event listeners
  private eventListeners: Array<(event: IComponentChangeEvent) => void> = [];

  // Component groups
  private componentGroups = new Map<string, IComponentGroup>();

  constructor() {
    console.debug('[ComponentManager] 🚀 Centralized system initialized');
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ComponentManager {
    if (!ComponentManager.instance) {
      ComponentManager.instance = new ComponentManager();
    }
    return ComponentManager.instance;
  }

  // ========== ENTITY MANAGEMENT (CENTRALIZED) ==========

  /**
   * Create a new entity through ComponentManager (CENTRALIZED)
   */
  createEntity(options: IEntityCreationOptions = {}): number {
    // Create BitECS entity
    const entityId = addEntity(world);

    // Track in our centralized system
    this.entities.add(entityId);
    this.entityComponents.set(entityId, new Set());

    console.debug(`[ComponentManager] 🆕 Created entity ${entityId}`);

    // Add default name component
    const name = options.name || `Entity ${entityId}`;
    this.addComponentSync(entityId, 'name', { value: name });

    // Add any requested components
    if (options.components) {
      for (const { id, data } of options.components) {
        this.addComponentSync(entityId, id, data);
      }
    }

    this.emitEvent({
      entityId,
      componentId: '__entity__',
      action: 'add',
      timestamp: Date.now(),
    });

    return entityId;
  }

  /**
   * Destroy an entity through ComponentManager (CENTRALIZED)
   */
  destroyEntity(entityId: number): void {
    if (!this.entities.has(entityId)) {
      console.warn(`[ComponentManager] Entity ${entityId} does not exist`);
      return;
    }

    // Remove all components first
    const components = Array.from(this.entityComponents.get(entityId) || []);
    for (const componentId of components) {
      this.removeComponentSync(entityId, componentId);
    }

    // Remove from tracking
    this.entities.delete(entityId);
    this.entityComponents.delete(entityId);

    // Clear all component data for this entity
    for (const componentData of this.entityData.values()) {
      componentData.delete(entityId);
    }

    console.debug(`[ComponentManager] 🗑️ Destroyed entity ${entityId}`);

    this.emitEvent({
      entityId,
      componentId: '__entity__',
      action: 'remove',
      timestamp: Date.now(),
    });
  }

  /**
   * Get all entities (CENTRALIZED QUERY)
   */
  getAllEntities(): number[] {
    return Array.from(this.entities);
  }

  /**
   * Get entities with specific components (CENTRALIZED QUERY)
   */
  getEntitiesWithComponents(componentIds: string[]): number[] {
    const result: number[] = [];

    for (const entityId of this.entities) {
      const entityComponents = this.entityComponents.get(entityId);
      if (entityComponents && componentIds.every((id) => entityComponents.has(id))) {
        result.push(entityId);
      }
    }

    return result;
  }

  // ========== COMPONENT REGISTRY ==========

  /**
   * Register a component descriptor
   */
  registerComponent(descriptor: IComponentDescriptor): void {
    this.components.set(descriptor.id, { descriptor });

    // Initialize component data storage
    this.entityData.set(descriptor.id, new Map());

    console.debug(`[ComponentManager] 📝 Registered component '${descriptor.id}'`);
  }

  /**
   * Get all registered components
   */
  getAllComponents(): IComponentDescriptor[] {
    return Array.from(this.components.values()).map((info) => info.descriptor);
  }

  /**
   * Get component by ID
   */
  getComponent(componentId: string): IComponentDescriptor | undefined {
    return this.components.get(componentId)?.descriptor;
  }

  // ========== COMPONENT MANAGEMENT (CENTRALIZED) ==========

  /**
   * Add component to entity (CENTRALIZED)
   */
  async addComponent(
    entityId: number,
    componentId: string,
    data?: any,
  ): Promise<IValidationResult> {
    return this.addComponentSync(entityId, componentId, data);
  }

  /**
   * Add component synchronously (CENTRALIZED)
   */
  addComponentSync(entityId: number, componentId: string, data?: any): IValidationResult {
    // Validate
    const componentInfo = this.components.get(componentId);
    if (!componentInfo) {
      return { valid: false, errors: [`Component '${componentId}' not registered`], warnings: [] };
    }

    if (this.hasComponent(entityId, componentId)) {
      return {
        valid: false,
        errors: [`Entity ${entityId} already has component '${componentId}'`],
        warnings: [],
      };
    }

    const { descriptor } = componentInfo;

    try {
      // Add to BitECS if it's a BitECS component
      if (descriptor.component) {
        addComponent(world, descriptor.component, entityId);
        console.debug(
          `[ComponentManager] ➕ Added BitECS component '${componentId}' to entity ${entityId}`,
        );
      }

      // Store component data in centralized storage
      const componentDataMap = this.entityData.get(componentId)!;
      if (data && descriptor.deserialize) {
        // Use descriptor to deserialize data
        descriptor.deserialize(entityId, data);
        componentDataMap.set(entityId, data);
      } else if (data) {
        componentDataMap.set(entityId, data);
      } else {
        // Create default data
        const defaultData = this.createDefaultData(descriptor);
        if (descriptor.deserialize) {
          descriptor.deserialize(entityId, defaultData);
        }
        componentDataMap.set(entityId, defaultData);
      }

      // Track component
      this.entityComponents.get(entityId)!.add(componentId);

      // Call onAdd callback
      if (descriptor.onAdd) {
        descriptor.onAdd(entityId);
      }

      console.debug(`[ComponentManager] ✅ Added component '${componentId}' to entity ${entityId}`);

      this.emitEvent({
        entityId,
        componentId,
        action: 'add',
        data,
        timestamp: Date.now(),
      });

      return { valid: true, errors: [], warnings: [] };
    } catch (error) {
      console.error(`[ComponentManager] ❌ Failed to add component '${componentId}':`, error);
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: [],
      };
    }
  }

  /**
   * Remove component from entity (CENTRALIZED)
   */
  async removeComponent(entityId: number, componentId: string): Promise<IValidationResult> {
    return this.removeComponentSync(entityId, componentId);
  }

  /**
   * Remove component synchronously (CENTRALIZED)
   */
  removeComponentSync(entityId: number, componentId: string): IValidationResult {
    if (!this.hasComponent(entityId, componentId)) {
      return {
        valid: false,
        errors: [`Entity ${entityId} does not have component '${componentId}'`],
        warnings: [],
      };
    }

    const componentInfo = this.components.get(componentId)!;
    const { descriptor } = componentInfo;

    try {
      // Remove from BitECS if it's a BitECS component
      if (descriptor.component && hasComponent(world, descriptor.component, entityId)) {
        removeComponent(world, descriptor.component, entityId);
        console.debug(
          `[ComponentManager] ➖ Removed BitECS component '${componentId}' from entity ${entityId}`,
        );
      }

      // Remove from centralized storage
      this.entityData.get(componentId)!.delete(entityId);
      this.entityComponents.get(entityId)!.delete(componentId);

      // Call onRemove callback
      if (descriptor.onRemove) {
        descriptor.onRemove(entityId);
      }

      console.debug(
        `[ComponentManager] ✅ Removed component '${componentId}' from entity ${entityId}`,
      );

      this.emitEvent({
        entityId,
        componentId,
        action: 'remove',
        timestamp: Date.now(),
      });

      return { valid: true, errors: [], warnings: [] };
    } catch (error) {
      console.error(`[ComponentManager] ❌ Failed to remove component '${componentId}':`, error);
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: [],
      };
    }
  }

  /**
   * Update component data (CENTRALIZED)
   */
  async updateComponent(
    entityId: number,
    componentId: string,
    data: any,
  ): Promise<IValidationResult> {
    if (!this.hasComponent(entityId, componentId)) {
      return {
        valid: false,
        errors: [`Entity ${entityId} does not have component '${componentId}'`],
        warnings: [],
      };
    }

    const componentInfo = this.components.get(componentId)!;
    const { descriptor } = componentInfo;

    try {
      // Update data in centralized storage
      const componentDataMap = this.entityData.get(componentId)!;
      componentDataMap.set(entityId, { ...componentDataMap.get(entityId), ...data });

      // Use descriptor to deserialize updated data
      if (descriptor.deserialize) {
        descriptor.deserialize(entityId, componentDataMap.get(entityId));
      }

      console.debug(
        `[ComponentManager] 🔄 Updated component '${componentId}' for entity ${entityId}`,
      );

      this.emitEvent({
        entityId,
        componentId,
        action: 'update',
        data,
        timestamp: Date.now(),
      });

      return { valid: true, errors: [], warnings: [] };
    } catch (error) {
      console.error(`[ComponentManager] ❌ Failed to update component '${componentId}':`, error);
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: [],
      };
    }
  }

  /**
   * Check if entity has component (CENTRALIZED)
   */
  hasComponent(entityId: number, componentId: string): boolean {
    return this.entityComponents.get(entityId)?.has(componentId) ?? false;
  }

  /**
   * Get all components for entity (CENTRALIZED)
   */
  getEntityComponents(entityId: number): string[] {
    return Array.from(this.entityComponents.get(entityId) ?? []);
  }

  /**
   * Get component data (CENTRALIZED)
   */
  getComponentData(entityId: number, componentId: string): any {
    return this.entityData.get(componentId)?.get(entityId);
  }

  /**
   * Set component data (alias for updateComponent - backwards compatibility)
   */
  async setComponentData(
    entityId: number,
    componentId: string,
    data: any,
  ): Promise<IValidationResult> {
    return this.updateComponent(entityId, componentId, data);
  }

  // ========== COMPONENT GROUPS ==========

  registerComponentGroup(group: IComponentGroup): void {
    this.componentGroups.set(group.id, group);
  }

  getAllGroups(): IComponentGroup[] {
    return Array.from(this.componentGroups.values());
  }

  /**
   * Check if a group can be added to an entity
   */
  canAddGroupToEntity(entityId: number, groupId: string): boolean {
    const group = this.componentGroups.get(groupId);
    if (!group) return false;

    // Check if entity already has any components from this group
    return !group.components.some((componentId) => this.hasComponent(entityId, componentId));
  }

  // ========== EVENT SYSTEM ==========

  subscribe(listener: (event: IComponentChangeEvent) => void): void {
    this.eventListeners.push(listener);
  }

  unsubscribe(listener: (event: IComponentChangeEvent) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  // Backwards compatibility aliases
  addEventListener = this.subscribe;
  removeEventListener = this.unsubscribe;

  // ========== UTILITIES ==========

  /**
   * Validate if a component can be added to an entity (backwards compatibility)
   */
  validateComponentAddition(entityId: number, componentId: string): IValidationResult {
    const componentInfo = this.components.get(componentId);
    if (!componentInfo) {
      return { valid: false, errors: [`Component '${componentId}' not registered`], warnings: [] };
    }

    if (this.hasComponent(entityId, componentId)) {
      return {
        valid: false,
        errors: [`Entity ${entityId} already has component '${componentId}'`],
        warnings: [],
      };
    }

    return { valid: true, errors: [], warnings: [] };
  }

  getStats(): IComponentStats {
    let totalInstances = 0;
    for (const components of this.entityComponents.values()) {
      totalInstances += components.size;
    }

    return {
      registeredComponents: this.components.size,
      entitiesWithComponents: this.entityComponents.size,
      totalComponentInstances: totalInstances,
    };
  }

  clear(): void {
    this.components.clear();
    this.entities.clear();
    this.entityComponents.clear();
    this.entityData.clear();
    this.eventListeners = [];
    this.componentGroups.clear();
  }

  // ========== PRIVATE HELPERS ==========

  private createDefaultData(descriptor: IComponentDescriptor): any {
    // Create sensible defaults based on component type
    switch (descriptor.id) {
      case 'transform':
        return {
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          needsUpdate: 1,
        };
      case 'material':
        return {
          color: [0.8, 0.8, 0.8],
          needsUpdate: 1,
        };
      case 'meshType':
        return {
          type: 0, // Default to Cube
        };
      case 'name':
        return {
          value: 'Entity',
        };
      default:
        return {};
    }
  }

  private emitEvent(event: IComponentChangeEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('[ComponentManager] Error in event listener:', error);
      }
    }
  }
}
