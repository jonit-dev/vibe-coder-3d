/**
 * Unified Dynamic Component Manager
 * Consolidates all component functionality into a single class
 */

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

interface IComponentHandler {
  add(entityId: number, data?: any): Promise<void>;
  remove(entityId: number): Promise<void>;
  update?(entityId: number, data: any): Promise<void>;
  has(entityId: number): boolean;
  get?(entityId: number): any;
}

interface IComponentInfo {
  descriptor: IComponentDescriptor;
  handler: IComponentHandler;
}

interface IComponentOperation {
  action: 'add' | 'remove' | 'update';
  entityId: number;
  componentId: string;
  data?: any;
}

interface IComponentBatch {
  operations: IComponentOperation[];
  continueOnError?: boolean;
}

interface IComponentOperationResult {
  successful: number;
  failed: number;
  results: Array<{ operation: IComponentOperation; result: IValidationResult }>;
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

export class ComponentManager {
  // Singleton instance for backwards compatibility
  private static instance: ComponentManager;

  // Component registry
  private components = new Map<string, IComponentInfo>();

  // Entity tracking
  private entityComponents = new Map<number, Set<string>>();

  // Event listeners
  private eventListeners: Array<(event: IComponentChangeEvent) => void> = [];

  // Component groups
  private componentGroups = new Map<string, IComponentGroup>();

  constructor() {
    console.debug('ComponentManager initialized');
  }

  /**
   * Get singleton instance (for backwards compatibility)
   */
  static getInstance(): ComponentManager {
    if (!ComponentManager.instance) {
      ComponentManager.instance = new ComponentManager();
    }
    return ComponentManager.instance;
  }

  // ========== Component Registry Methods ==========

  /**
   * Register a component descriptor
   */
  registerComponent(descriptor: IComponentDescriptor): void {
    try {
      // Create handler based on component type
      const handler = this.createHandler(descriptor);

      this.components.set(descriptor.id, { descriptor, handler });
      console.debug(`Component '${descriptor.id}' registered`);

      // Emit registration event
      this.emitEvent({
        entityId: -1, // Special value for registration events
        componentId: descriptor.id,
        action: 'add',
        data: descriptor,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(`Failed to register component '${descriptor.id}'`, error);
      throw error;
    }
  }

  /**
   * Get a component descriptor by ID
   */
  getComponent(componentId: string): IComponentDescriptor | undefined {
    return this.components.get(componentId)?.descriptor;
  }

  /**
   * Get all registered components
   */
  getAllComponents(): IComponentDescriptor[] {
    return Array.from(this.components.values()).map((info) => info.descriptor);
  }

  /**
   * Check if a component is registered
   */
  hasRegisteredComponent(componentId: string): boolean {
    return this.components.has(componentId);
  }

  /**
   * Get components by category
   */
  getComponentsByCategory(category: ComponentCategory): IComponentDescriptor[] {
    return this.getAllComponents().filter((comp) => comp.category === category);
  }

  // ========== Entity Component Management ==========

  /**
   * Add a component to an entity
   */
  async addComponent(
    entityId: number,
    componentId: string,
    data?: any,
  ): Promise<IValidationResult> {
    try {
      // Validate the operation
      const validation = this.validateAdd(entityId, componentId);
      if (!validation.valid) {
        return validation;
      }

      const componentInfo = this.components.get(componentId);
      if (!componentInfo) {
        return {
          valid: false,
          errors: [`Component '${componentId}' not registered`],
          warnings: [],
        };
      }

      // Auto-add missing dependencies
      if (validation.missingDependencies?.length) {
        for (const depId of validation.missingDependencies) {
          const depResult = await this.addComponent(entityId, depId);
          if (!depResult.valid) {
            return {
              valid: false,
              errors: [`Failed to add dependency '${depId}': ${depResult.errors.join(', ')}`],
              warnings: [],
            };
          }
        }
      }

      // Add the component
      await componentInfo.handler.add(entityId, data);

      // Track the component
      if (!this.entityComponents.has(entityId)) {
        this.entityComponents.set(entityId, new Set());
      }
      this.entityComponents.get(entityId)!.add(componentId);

      // Emit event
      this.emitEvent({
        entityId,
        componentId,
        action: 'add',
        data,
        timestamp: Date.now(),
      });

      return { valid: true, errors: [], warnings: validation.warnings || [] };
    } catch (error) {
      const errorMsg = `Failed to add component '${componentId}' to entity ${entityId}: ${String(error)}`;
      console.error(errorMsg, error);
      return { valid: false, errors: [errorMsg], warnings: [] };
    }
  }

  /**
   * Remove a component from an entity
   */
  async removeComponent(entityId: number, componentId: string): Promise<IValidationResult> {
    try {
      // Validate the operation
      const validation = this.validateRemove(entityId, componentId);
      if (!validation.valid) {
        return validation;
      }

      const componentInfo = this.components.get(componentId);
      if (!componentInfo) {
        return {
          valid: false,
          errors: [`Component '${componentId}' not registered`],
          warnings: [],
        };
      }

      // Remove the component
      await componentInfo.handler.remove(entityId);

      // Untrack the component
      this.entityComponents.get(entityId)?.delete(componentId);
      if (this.entityComponents.get(entityId)?.size === 0) {
        this.entityComponents.delete(entityId);
      }

      // Emit event
      this.emitEvent({
        entityId,
        componentId,
        action: 'remove',
        timestamp: Date.now(),
      });

      return { valid: true, errors: [], warnings: [] };
    } catch (error) {
      const errorMsg = `Failed to remove component '${componentId}' from entity ${entityId}: ${String(error)}`;
      console.error(errorMsg, error);
      return { valid: false, errors: [errorMsg], warnings: [] };
    }
  }

  /**
   * Update component data for an entity
   */
  async updateComponent(
    entityId: number,
    componentId: string,
    data: any,
  ): Promise<IValidationResult> {
    try {
      // Validate the operation
      const validation = this.validateUpdate(entityId, componentId, data);
      if (!validation.valid) {
        return validation;
      }

      const componentInfo = this.components.get(componentId);
      if (!componentInfo) {
        return {
          valid: false,
          errors: [`Component '${componentId}' not registered`],
          warnings: [],
        };
      }

      // Update the component
      if (componentInfo.handler.update) {
        await componentInfo.handler.update(entityId, data);
      } else {
        // Fallback to add with new data
        await componentInfo.handler.add(entityId, data);
      }

      // Emit event
      this.emitEvent({
        entityId,
        componentId,
        action: 'update',
        data,
        timestamp: Date.now(),
      });

      return { valid: true, errors: [], warnings: [] };
    } catch (error) {
      const errorMsg = `Failed to update component '${componentId}' for entity ${entityId}: ${String(error)}`;
      console.error(errorMsg, error);
      return { valid: false, errors: [errorMsg], warnings: [] };
    }
  }

  /**
   * Set component data (alias for updateComponent for backwards compatibility)
   */
  async setComponentData(
    entityId: number,
    componentId: string,
    data: any,
  ): Promise<IValidationResult> {
    return this.updateComponent(entityId, componentId, data);
  }

  /**
   * Check if an entity has a specific component
   */
  hasComponent(entityId: number, componentId: string): boolean {
    return this.entityComponents.get(entityId)?.has(componentId) ?? false;
  }

  /**
   * Get all components for an entity
   */
  getEntityComponents(entityId: number): string[] {
    return Array.from(this.entityComponents.get(entityId) ?? []);
  }

  /**
   * Get component data for an entity
   */
  getComponentData(entityId: number, componentId: string): any {
    const componentInfo = this.components.get(componentId);
    if (!componentInfo || !componentInfo.handler.get) {
      return null;
    }
    return componentInfo.handler.get(entityId);
  }

  // ========== Component Groups ==========

  /**
   * Register a component group
   */
  registerComponentGroup(group: IComponentGroup): void {
    this.componentGroups.set(group.id, group);
    console.debug(`Component group '${group.id}' registered`);
  }

  /**
   * Get all component groups
   */
  getAllGroups(): IComponentGroup[] {
    return Array.from(this.componentGroups.values()).sort((a, b) => a.order - b.order);
  }

  /**
   * Get a component group by ID
   */
  getGroup(groupId: string): IComponentGroup | undefined {
    return this.componentGroups.get(groupId);
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

  /**
   * Add all components from a group to an entity
   */
  async addGroupToEntity(entityId: number, groupId: string): Promise<IValidationResult> {
    const group = this.componentGroups.get(groupId);
    if (!group) {
      return { valid: false, errors: [`Group '${groupId}' not found`], warnings: [] };
    }

    const results: IValidationResult[] = [];

    for (const componentId of group.components) {
      const defaultData = group.defaultValues?.[componentId];
      const result = await this.addComponent(entityId, componentId, defaultData);
      results.push(result);

      if (!result.valid) {
        return {
          valid: false,
          errors: [`Failed to add group '${groupId}': ${result.errors.join(', ')}`],
          warnings: [],
        };
      }
    }

    return {
      valid: true,
      errors: [],
      warnings: results.flatMap((r) => r.warnings || []),
    };
  }

  // ========== Event System ==========

  /**
   * Subscribe to component change events
   */
  subscribe(listener: (event: IComponentChangeEvent) => void): void {
    this.eventListeners.push(listener);
  }

  /**
   * Unsubscribe from component change events
   */
  unsubscribe(listener: (event: IComponentChangeEvent) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * Add event listener (alias for backwards compatibility)
   */
  addEventListener(listener: (event: IComponentChangeEvent) => void): void {
    this.subscribe(listener);
  }

  /**
   * Remove event listener (alias for backwards compatibility)
   */
  removeEventListener(listener: (event: IComponentChangeEvent) => void): void {
    this.unsubscribe(listener);
  }

  // ========== Batch Operations ==========

  /**
   * Process multiple component operations in batch
   */
  async processBatch(batch: IComponentBatch): Promise<IComponentOperationResult> {
    const results: Array<{ operation: IComponentOperation; result: IValidationResult }> = [];

    for (const operation of batch.operations) {
      let result: IValidationResult;

      try {
        switch (operation.action) {
          case 'add':
            result = await this.addComponent(
              operation.entityId,
              operation.componentId,
              operation.data,
            );
            break;
          case 'remove':
            result = await this.removeComponent(operation.entityId, operation.componentId);
            break;
          case 'update':
            result = await this.updateComponent(
              operation.entityId,
              operation.componentId,
              operation.data,
            );
            break;
          default:
            result = {
              valid: false,
              errors: [`Unknown operation: ${operation.action}`],
              warnings: [],
            };
        }
      } catch (error) {
        result = { valid: false, errors: [`Operation failed: ${String(error)}`], warnings: [] };
      }

      results.push({ operation, result });

      // Stop on first failure if not continuing on error
      if (!result.valid && !batch.continueOnError) {
        break;
      }
    }

    const successful = results.filter((r) => r.result.valid).length;
    const failed = results.length - successful;

    return {
      successful,
      failed,
      results,
    };
  }

  // ========== Validation ==========

  /**
   * Validate if a component can be added to an entity
   */
  validateComponentAddition(entityId: number, componentId: string): IValidationResult {
    return this.validateAdd(entityId, componentId);
  }

  // ========== Utility Methods ==========

  /**
   * Get system statistics
   */
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

  /**
   * Clear all data (useful for testing)
   */
  clear(): void {
    this.components.clear();
    this.entityComponents.clear();
    this.eventListeners = [];
    this.componentGroups.clear();
  }

  // ========== Private Helper Methods ==========

  private createHandler(descriptor: IComponentDescriptor): IComponentHandler {
    // Create a basic handler that delegates to the descriptor's implementation
    return new BasicComponentHandler(descriptor);
  }

  private validateAdd(entityId: number, componentId: string): IValidationResult {
    const componentInfo = this.components.get(componentId);
    if (!componentInfo) {
      return { valid: false, errors: [`Component '${componentId}' not registered`], warnings: [] };
    }

    // Check if component already exists
    if (this.hasComponent(entityId, componentId)) {
      return {
        valid: false,
        errors: [`Entity ${entityId} already has component '${componentId}'`],
        warnings: [],
      };
    }

    // Check dependencies
    const { descriptor } = componentInfo;
    const missingDependencies: string[] = [];
    const warnings: string[] = [];

    if (descriptor.dependencies) {
      for (const depId of descriptor.dependencies) {
        if (!this.hasComponent(entityId, depId)) {
          missingDependencies.push(depId);
          warnings.push(`Auto-adding missing dependency: ${depId}`);
        }
      }
    }

    return {
      valid: true,
      errors: [],
      warnings,
      missingDependencies: missingDependencies.length > 0 ? missingDependencies : undefined,
    };
  }

  private validateRemove(entityId: number, componentId: string): IValidationResult {
    if (!this.hasComponent(entityId, componentId)) {
      return {
        valid: false,
        errors: [`Entity ${entityId} does not have component '${componentId}'`],
        warnings: [],
      };
    }

    // Check for dependents
    const dependents: string[] = [];
    const entityComponents = this.getEntityComponents(entityId);

    for (const otherComponentId of entityComponents) {
      const otherComponent = this.components.get(otherComponentId);
      if (otherComponent?.descriptor.dependencies?.includes(componentId)) {
        dependents.push(otherComponentId);
      }
    }

    if (dependents.length > 0) {
      return {
        valid: false,
        errors: [
          `Cannot remove component '${componentId}' - it's required by: ${dependents.join(', ')}`,
        ],
        warnings: [],
      };
    }

    return { valid: true, errors: [], warnings: [] };
  }

  private validateUpdate(entityId: number, componentId: string, data: any): IValidationResult {
    if (!this.hasComponent(entityId, componentId)) {
      return {
        valid: false,
        errors: [`Entity ${entityId} does not have component '${componentId}'`],
        warnings: [],
      };
    }

    // Basic data validation could be added here
    if (data === null || data === undefined) {
      return { valid: false, errors: ['Component data cannot be null or undefined'], warnings: [] };
    }

    return { valid: true, errors: [], warnings: [] };
  }

  private emitEvent(event: IComponentChangeEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in component change listener:', error);
      }
    }
  }
}

// Simplified handler implementation
class BasicComponentHandler implements IComponentHandler {
  private descriptor: IComponentDescriptor;

  constructor(descriptor: IComponentDescriptor) {
    this.descriptor = descriptor;
  }

  async add(entityId: number, data?: any): Promise<void> {
    // Use descriptor's deserialize method to add component data
    if (data && this.descriptor.deserialize) {
      this.descriptor.deserialize(entityId, data);
    }

    // Call onAdd callback if defined
    if (this.descriptor.onAdd) {
      this.descriptor.onAdd(entityId);
    }
  }

  async remove(entityId: number): Promise<void> {
    // Call onRemove callback if defined
    if (this.descriptor.onRemove) {
      this.descriptor.onRemove(entityId);
    }
  }

  async update?(entityId: number, data: any): Promise<void> {
    // Update by deserializing new data
    if (this.descriptor.deserialize) {
      this.descriptor.deserialize(entityId, data);
    }
  }

  has(entityId: number): boolean {
    // Use the descriptor's serialize method to check existence
    // If serialize returns undefined, the component doesn't exist
    return this.descriptor.serialize(entityId) !== undefined;
  }

  get?(entityId: number): any {
    return this.descriptor.serialize(entityId);
  }
}
