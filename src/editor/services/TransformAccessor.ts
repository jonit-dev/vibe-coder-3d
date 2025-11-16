import { Logger } from '@/core/lib/logger';
import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import { EntityManager } from '@/core/lib/ecs/EntityManager';
import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { ITransformData } from '@/core/lib/ecs/components/TransformComponent';

const logger = Logger.create('TransformAccessor');

/**
 * TransformAccessor - Centralized abstraction for entity transform access
 *
 * Handles the architectural complexity of prefab roots that don't have Transform components.
 * Prefab roots are container entities with PrefabInstance but no Transform - their visual
 * representation comes from their children.
 *
 * This service provides a unified interface to get/set transforms for ANY entity,
 * automatically handling the prefab root → first child transform fallback.
 */
export class TransformAccessor {
  /**
   * Check if an entity is a prefab root (has PrefabInstance but no Transform)
   */
  static isPrefabRoot(entityId: number): boolean {
    return (
      componentRegistry.hasComponent(entityId, 'PrefabInstance') &&
      !componentRegistry.hasComponent(entityId, KnownComponentTypes.TRANSFORM)
    );
  }

  /**
   * Get the effective transform for an entity.
   * For normal entities: returns their Transform component
   * For prefab roots: returns the first child's Transform component
   *
   * @returns Transform data or null if not available
   */
  static getEffectiveTransform(entityId: number): ITransformData | null {
    // Try to get the entity's own transform first
    const transform = componentRegistry.getComponentData<ITransformData>(
      entityId,
      KnownComponentTypes.TRANSFORM,
    );

    if (transform) {
      return transform;
    }

    // If no transform, check if it's a prefab root
    if (!this.isPrefabRoot(entityId)) {
      return null;
    }

    // Prefab root: use first child's transform
    const entity = EntityManager.getInstance().getEntity(entityId);
    if (!entity?.children || entity.children.length === 0) {
      logger.warn('Prefab root has no children', { entityId });
      return null;
    }

    const firstChildTransform = componentRegistry.getComponentData<ITransformData>(
      entity.children[0],
      KnownComponentTypes.TRANSFORM,
    );

    if (!firstChildTransform) {
      logger.warn('Prefab first child has no transform', {
        prefabId: entityId,
        childId: entity.children[0],
      });
      return null;
    }

    return firstChildTransform;
  }

  /**
   * Get all entity IDs that should be updated when setting a transform.
   * For normal entities: returns [entityId]
   * For prefab roots: returns all children IDs with transforms
   */
  static getTargetEntities(entityId: number): number[] {
    if (!this.isPrefabRoot(entityId)) {
      return [entityId];
    }

    // Prefab root: target all children with transforms
    const entity = EntityManager.getInstance().getEntity(entityId);
    if (!entity?.children) {
      return [];
    }

    return entity.children.filter((childId) =>
      componentRegistry.hasComponent(childId, KnownComponentTypes.TRANSFORM),
    );
  }

  /**
   * Update the effective transform for an entity.
   * For normal entities: updates their Transform component
   * For prefab roots: updates all children's Transform components
   *
   * @param propagateDelta If true, applies delta to existing transforms (for prefabs)
   *                       If false, sets absolute values (replaces transforms)
   */
  static updateEffectiveTransform(
    entityId: number,
    transform: Partial<ITransformData>,
    propagateDelta = false,
  ): void {
    const isPrefab = this.isPrefabRoot(entityId);

    if (!isPrefab) {
      // Normal entity: direct update
      componentRegistry.updateComponent(entityId, KnownComponentTypes.TRANSFORM, transform);
      logger.debug('Updated entity transform', { entityId, transform });
      return;
    }

    // Prefab root: update children
    const targets = this.getTargetEntities(entityId);
    if (targets.length === 0) {
      logger.warn('No target entities for prefab', { entityId });
      return;
    }

    if (propagateDelta) {
      // Calculate delta from first child's current position
      const firstChildTransform = componentRegistry.getComponentData<ITransformData>(
        targets[0],
        KnownComponentTypes.TRANSFORM,
      );

      if (!firstChildTransform) return;

      const delta: Partial<ITransformData> = {};

      if (transform.position && firstChildTransform.position) {
        delta.position = [
          transform.position[0] - firstChildTransform.position[0],
          transform.position[1] - firstChildTransform.position[1],
          transform.position[2] - firstChildTransform.position[2],
        ];
      }

      if (transform.rotation && firstChildTransform.rotation) {
        delta.rotation = [
          transform.rotation[0] - firstChildTransform.rotation[0],
          transform.rotation[1] - firstChildTransform.rotation[1],
          transform.rotation[2] - firstChildTransform.rotation[2],
        ];
      }

      if (transform.scale && firstChildTransform.scale) {
        delta.scale = [
          firstChildTransform.scale[0] !== 0
            ? transform.scale[0] / firstChildTransform.scale[0]
            : 1,
          firstChildTransform.scale[1] !== 0
            ? transform.scale[1] / firstChildTransform.scale[1]
            : 1,
          firstChildTransform.scale[2] !== 0
            ? transform.scale[2] / firstChildTransform.scale[2]
            : 1,
        ];
      }

      // Apply delta to all children
      targets.forEach((childId) => {
        const childTransform = componentRegistry.getComponentData<ITransformData>(
          childId,
          KnownComponentTypes.TRANSFORM,
        );

        if (!childTransform) return;

        const updated: Partial<ITransformData> = {};

        if (delta.position && childTransform.position) {
          updated.position = [
            childTransform.position[0] + delta.position[0],
            childTransform.position[1] + delta.position[1],
            childTransform.position[2] + delta.position[2],
          ];
        }

        if (delta.rotation && childTransform.rotation) {
          updated.rotation = [
            childTransform.rotation[0] + delta.rotation[0],
            childTransform.rotation[1] + delta.rotation[1],
            childTransform.rotation[2] + delta.rotation[2],
          ];
        }

        if (delta.scale && childTransform.scale) {
          updated.scale = [
            childTransform.scale[0] * delta.scale[0],
            childTransform.scale[1] * delta.scale[1],
            childTransform.scale[2] * delta.scale[2],
          ];
        }

        componentRegistry.updateComponent(childId, KnownComponentTypes.TRANSFORM, updated);
      });

      logger.debug('Propagated delta to prefab children', {
        prefabId: entityId,
        childCount: targets.length,
        delta,
      });
    } else {
      // Absolute update: set same transform on all children
      targets.forEach((childId) => {
        componentRegistry.updateComponent(childId, KnownComponentTypes.TRANSFORM, transform);
      });

      logger.debug('Updated prefab children transforms', {
        prefabId: entityId,
        childCount: targets.length,
        transform,
      });
    }
  }
}
