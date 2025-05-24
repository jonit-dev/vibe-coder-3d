import {
  ComponentCategory,
  IComponentGroup,
  IComponentGroupResult,
} from '@/core/types/component-registry';

import { ComponentGroupMap } from './ComponentGroupMap';

export class ComponentGroupManager {
  private static groupMap = new ComponentGroupMap();

  static registerGroup(group: IComponentGroup): void {
    if (this.groupMap.has(group.id)) {
      console.warn(`Component group '${group.id}' is already registered, skipping...`);
      return;
    }
    this.groupMap.register(group);
    console.log(`Component group '${group.name}' registered with id '${group.id}'`);
  }

  static getGroup(id: string): IComponentGroup | undefined {
    return this.groupMap.get(id);
  }

  static getAllGroups(): IComponentGroup[] {
    return this.groupMap.getAll();
  }

  static getGroupsByCategory(category: ComponentCategory): IComponentGroup[] {
    return this.groupMap.getByCategory(category);
  }

  static searchGroups(query: string): IComponentGroup[] {
    return this.groupMap.search(query);
  }

  static async addGroupToEntity(
    entityId: number,
    groupId: string,
    overrides?: Record<string, any>,
  ): Promise<IComponentGroupResult> {
    const group = this.getGroup(groupId);
    if (!group) {
      return {
        success: false,
        errors: [`Group '${groupId}' not found`],
        addedComponents: [],
        failedComponents: [],
      };
    }

    // We need to get the dynamic component manager instance
    // This will be injected or accessed via a global registry
    const { DynamicComponentManager } = await import('../manager/DynamicComponentManager');
    const dynamicComponentManager = DynamicComponentManager.getInstance();

    const errors: string[] = [];
    const addedComponents: string[] = [];
    const failedComponents: string[] = [];

    // Add each component in the group
    for (const componentId of group.components) {
      const defaultData = group.defaultValues?.[componentId];
      const overrideData = overrides?.[componentId];
      const componentData = overrideData || defaultData;

      try {
        const result = await dynamicComponentManager.addComponent(
          entityId,
          componentId,
          componentData,
        );
        if (result.valid) {
          addedComponents.push(componentId);
        } else {
          failedComponents.push(componentId);
          errors.push(`Failed to add ${componentId}: ${result.errors.join(', ')}`);
        }
      } catch (error) {
        failedComponents.push(componentId);
        errors.push(`Error adding ${componentId}: ${error}`);
      }
    }

    return {
      success: addedComponents.length === group.components.length,
      errors,
      addedComponents,
      failedComponents,
    };
  }

  static async canAddGroupToEntity(entityId: number, groupId: string): Promise<boolean> {
    const group = this.getGroup(groupId);
    if (!group) return false;

    // We need to check if any components in the group are already present
    // This requires access to the component registry
    try {
      const { ComponentRegistry } = await import('../registry/ComponentRegistry');
      const registry = ComponentRegistry.getInstance();

      for (const componentId of group.components) {
        if (registry.hasEntityComponent(entityId, componentId)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.warn('Failed to check group availability:', error);
      return false;
    }
  }

  static getStatistics() {
    return {
      totalGroups: this.groupMap.size(),
      categories: this.groupMap.getCategories(),
      groupsByCategory: this.groupMap.getCategories().map((category) => ({
        category,
        count: this.groupMap.getByCategory(category).length,
      })),
    };
  }

  static reset(): void {
    this.groupMap.clear();
  }
}
