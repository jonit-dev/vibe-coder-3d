/**
 * Service for tracking entity components
 */

import { ErrorLogger } from '../utils/errors';

export class EntityService {
  private entityComponents = new Map<number, Set<string>>();

  /**
   * Add a component to an entity's tracking
   */
  addComponent(entityId: number, componentId: string): void {
    if (!this.entityComponents.has(entityId)) {
      this.entityComponents.set(entityId, new Set());
    }

    this.entityComponents.get(entityId)!.add(componentId);

    ErrorLogger.debug(`Tracked component '${componentId}' for entity ${entityId}`, {
      componentId,
      entityId,
    });
  }

  /**
   * Remove a component from an entity's tracking
   */
  removeComponent(entityId: number, componentId: string): void {
    const components = this.entityComponents.get(entityId);
    if (components) {
      components.delete(componentId);

      // Clean up empty entity records
      if (components.size === 0) {
        this.entityComponents.delete(entityId);
      }

      ErrorLogger.debug(`Untracked component '${componentId}' for entity ${entityId}`, {
        componentId,
        entityId,
      });
    }
  }

  /**
   * Get all components for an entity
   */
  getEntityComponents(entityId: number): string[] {
    const components = this.entityComponents.get(entityId);
    return components ? Array.from(components) : [];
  }

  /**
   * Check if an entity has a specific component
   */
  hasComponent(entityId: number, componentId: string): boolean {
    return this.entityComponents.get(entityId)?.has(componentId) ?? false;
  }

  /**
   * Get all tracked entities
   */
  getAllEntities(): number[] {
    return Array.from(this.entityComponents.keys());
  }

  /**
   * Get entities that have a specific component
   */
  getEntitiesWithComponent(componentId: string): number[] {
    const entities: number[] = [];

    for (const [entityId, components] of this.entityComponents) {
      if (components.has(componentId)) {
        entities.push(entityId);
      }
    }

    return entities;
  }

  /**
   * Get component count for an entity
   */
  getComponentCount(entityId: number): number {
    return this.entityComponents.get(entityId)?.size ?? 0;
  }

  /**
   * Remove all components for an entity
   */
  removeEntity(entityId: number): string[] {
    const components = this.entityComponents.get(entityId);
    const removedComponents = components ? Array.from(components) : [];

    this.entityComponents.delete(entityId);

    if (removedComponents.length > 0) {
      ErrorLogger.debug(`Removed entity ${entityId} with ${removedComponents.length} components`, {
        entityId,
        additionalData: { components: removedComponents },
      });
    }

    return removedComponents;
  }

  /**
   * Get total number of tracked entities
   */
  getEntityCount(): number {
    return this.entityComponents.size;
  }

  /**
   * Get total number of tracked components across all entities
   */
  getTotalComponentCount(): number {
    let total = 0;
    for (const components of this.entityComponents.values()) {
      total += components.size;
    }
    return total;
  }

  /**
   * Clear all entity tracking
   */
  clear(): void {
    const entityCount = this.entityComponents.size;
    this.entityComponents.clear();

    ErrorLogger.debug(`Cleared tracking for ${entityCount} entities`);
  }

  /**
   * Get entities with multiple components (useful for debugging)
   */
  getEntitiesWithMultipleComponents(): Array<{ entityId: number; components: string[] }> {
    const result: Array<{ entityId: number; components: string[] }> = [];

    for (const [entityId, components] of this.entityComponents) {
      if (components.size > 1) {
        result.push({
          entityId,
          components: Array.from(components),
        });
      }
    }

    return result;
  }
}
