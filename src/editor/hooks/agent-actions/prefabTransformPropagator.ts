/**
 * Helper to propagate transform changes to prefab instance children
 */

import { Logger } from '@core/lib/logger';
import { EntityManager } from '@core/lib/ecs/EntityManager';
import { componentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { KnownComponentTypes } from '@core/lib/ecs/IComponent';

const logger = Logger.create('PrefabTransformPropagator');

interface ITransformValue {
  x: number;
  y: number;
  z: number;
}

interface ITransformData {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export class PrefabTransformPropagator {
  /**
   * Propagate position change to all children using delta from first child
   */
  static propagatePosition(
    entityId: number,
    position: ITransformValue,
    updateComponent: <TData>(entityId: number, componentType: string, data: Partial<TData>) => boolean,
  ): void {
    const entity = EntityManager.getInstance().getEntity(entityId);
    if (!entity?.children || entity.children.length === 0) {
      return;
    }

    const firstChildId = entity.children[0];
    const firstChildTransform = componentRegistry.getComponentData(
      firstChildId,
      KnownComponentTypes.TRANSFORM,
    ) as ITransformData | undefined;

    const currentPos = firstChildTransform?.position || [0, 0, 0];
    const delta = [position.x - currentPos[0], position.y - currentPos[1], position.z - currentPos[2]];

    logger.info('Propagating position delta to prefab children', {
      entityId,
      childCount: entity.children.length,
      delta,
    });

    for (const childId of entity.children) {
      if (componentRegistry.hasComponent(childId, KnownComponentTypes.TRANSFORM)) {
        const childTransform = componentRegistry.getComponentData(
          childId,
          KnownComponentTypes.TRANSFORM,
        ) as ITransformData | undefined;

        const childPos = childTransform?.position || [0, 0, 0];
        updateComponent(childId, KnownComponentTypes.TRANSFORM, {
          position: [childPos[0] + delta[0], childPos[1] + delta[1], childPos[2] + delta[2]],
        });
      }
    }
  }

  /**
   * Propagate rotation change to all children using delta from first child
   */
  static propagateRotation(
    entityId: number,
    rotation: ITransformValue,
    updateComponent: <TData>(entityId: number, componentType: string, data: Partial<TData>) => boolean,
  ): void {
    const entity = EntityManager.getInstance().getEntity(entityId);
    if (!entity?.children || entity.children.length === 0) {
      return;
    }

    const firstChildId = entity.children[0];
    const firstChildTransform = componentRegistry.getComponentData(
      firstChildId,
      KnownComponentTypes.TRANSFORM,
    ) as ITransformData | undefined;

    const currentRot = firstChildTransform?.rotation || [0, 0, 0];
    const delta = [rotation.x - currentRot[0], rotation.y - currentRot[1], rotation.z - currentRot[2]];

    logger.info('Propagating rotation delta to prefab children', {
      entityId,
      childCount: entity.children.length,
      delta,
    });

    for (const childId of entity.children) {
      if (componentRegistry.hasComponent(childId, KnownComponentTypes.TRANSFORM)) {
        const childTransform = componentRegistry.getComponentData(
          childId,
          KnownComponentTypes.TRANSFORM,
        ) as ITransformData | undefined;

        const childRot = childTransform?.rotation || [0, 0, 0];
        updateComponent(childId, KnownComponentTypes.TRANSFORM, {
          rotation: [childRot[0] + delta[0], childRot[1] + delta[1], childRot[2] + delta[2]],
        });
      }
    }
  }

  /**
   * Propagate scale change to all children using multiplier from first child
   */
  static propagateScale(
    entityId: number,
    scale: ITransformValue,
    updateComponent: <TData>(entityId: number, componentType: string, data: Partial<TData>) => boolean,
  ): void {
    const entity = EntityManager.getInstance().getEntity(entityId);
    if (!entity?.children || entity.children.length === 0) {
      return;
    }

    const firstChildId = entity.children[0];
    const firstChildTransform = componentRegistry.getComponentData(
      firstChildId,
      KnownComponentTypes.TRANSFORM,
    ) as ITransformData | undefined;

    const currentScale = firstChildTransform?.scale || [1, 1, 1];
    const multiplier = [
      currentScale[0] !== 0 ? scale.x / currentScale[0] : 1,
      currentScale[1] !== 0 ? scale.y / currentScale[1] : 1,
      currentScale[2] !== 0 ? scale.z / currentScale[2] : 1,
    ];

    logger.info('Propagating scale multiplier to prefab children', {
      entityId,
      childCount: entity.children.length,
      multiplier,
    });

    for (const childId of entity.children) {
      if (componentRegistry.hasComponent(childId, KnownComponentTypes.TRANSFORM)) {
        const childTransform = componentRegistry.getComponentData(
          childId,
          KnownComponentTypes.TRANSFORM,
        ) as ITransformData | undefined;

        const childScale = childTransform?.scale || [1, 1, 1];
        updateComponent(childId, KnownComponentTypes.TRANSFORM, {
          scale: [
            childScale[0] * multiplier[0],
            childScale[1] * multiplier[1],
            childScale[2] * multiplier[2],
          ],
        });
      }
    }
  }
}
