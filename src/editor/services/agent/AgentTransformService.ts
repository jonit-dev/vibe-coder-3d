import { Logger } from '@core/lib/logger';
import { ComponentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { EntityManager } from '@core/lib/ecs/EntityManager';
import { KnownComponentTypes } from '@core/lib/ecs/IComponent';

const logger = Logger.create('AgentTransformService');

export interface IVector3 {
  x: number;
  y: number;
  z: number;
}

export interface ITransformUpdate {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export interface IUpdateComponentCallback {
  (entityId: number, componentType: string, data: Partial<unknown>): void;
}

export class AgentTransformService {
  constructor(
    private readonly componentRegistry: ComponentRegistry,
    private readonly entityManager: EntityManager,
    private readonly updateComponent: IUpdateComponentCallback,
  ) {}

  private isPrefabRoot(entityId: number): boolean {
    return (
      this.componentRegistry.hasComponent(entityId, 'PrefabInstance') &&
      !this.componentRegistry.hasComponent(entityId, KnownComponentTypes.TRANSFORM)
    );
  }

  private getTransformComponent(entityId: number) {
    return this.componentRegistry.getComponentData(entityId, KnownComponentTypes.TRANSFORM) as
      | { position?: [number, number, number]; rotation?: [number, number, number]; scale?: [number, number, number] }
      | undefined;
  }

  setPosition(entityId: number, position: IVector3): void {
    if (this.isPrefabRoot(entityId)) {
      this.propagatePositionDelta(entityId, position);
    } else {
      this.updateComponent(entityId, KnownComponentTypes.TRANSFORM, {
        position: [position.x, position.y, position.z],
      });
      logger.info('Position updated', { entityId, position });
    }
  }

  setRotation(entityId: number, rotation: IVector3): void {
    if (this.isPrefabRoot(entityId)) {
      this.propagateRotationDelta(entityId, rotation);
    } else {
      this.updateComponent(entityId, KnownComponentTypes.TRANSFORM, {
        rotation: [rotation.x, rotation.y, rotation.z],
      });
      logger.info('Rotation updated', { entityId, rotation });
    }
  }

  setScale(entityId: number, scale: IVector3): void {
    if (this.isPrefabRoot(entityId)) {
      this.propagateScaleMultiplier(entityId, scale);
    } else {
      this.updateComponent(entityId, KnownComponentTypes.TRANSFORM, {
        scale: [scale.x, scale.y, scale.z],
      });
      logger.info('Scale updated', { entityId, scale });
    }
  }

  applyTransform(entityId: number, position?: IVector3, rotation?: IVector3, scale?: IVector3): void {
    const update: ITransformUpdate = {
      position: position ? [position.x, position.y, position.z] : [0, 0, 0],
      rotation: rotation ? [rotation.x, rotation.y, rotation.z] : [0, 0, 0],
      scale: scale ? [scale.x, scale.y, scale.z] : [1, 1, 1],
    };

    this.updateComponent(entityId, KnownComponentTypes.TRANSFORM, update);
    logger.debug('Transform applied', { entityId, update });
  }

  private propagatePositionDelta(entityId: number, targetPosition: IVector3): void {
    const entity = this.entityManager.getEntity(entityId);
    if (!entity?.children || entity.children.length === 0) return;

    const firstChildTransform = this.getTransformComponent(entity.children[0]);
    const currentPos = firstChildTransform?.position || [0, 0, 0];

    const delta: [number, number, number] = [
      targetPosition.x - currentPos[0],
      targetPosition.y - currentPos[1],
      targetPosition.z - currentPos[2],
    ];

    logger.info('Propagating position delta to prefab children', {
      entityId,
      childCount: entity.children.length,
      delta,
      targetPosition,
    });

    for (const childId of entity.children) {
      if (this.componentRegistry.hasComponent(childId, KnownComponentTypes.TRANSFORM)) {
        const childTransform = this.getTransformComponent(childId);
        const childPos = childTransform?.position || [0, 0, 0];

        this.updateComponent(childId, KnownComponentTypes.TRANSFORM, {
          position: [childPos[0] + delta[0], childPos[1] + delta[1], childPos[2] + delta[2]],
        });
      }
    }

    logger.info('Position delta propagated', { entityId, childCount: entity.children.length });
  }

  private propagateRotationDelta(entityId: number, targetRotation: IVector3): void {
    const entity = this.entityManager.getEntity(entityId);
    if (!entity?.children || entity.children.length === 0) return;

    const firstChildTransform = this.getTransformComponent(entity.children[0]);
    const currentRot = firstChildTransform?.rotation || [0, 0, 0];

    const delta: [number, number, number] = [
      targetRotation.x - currentRot[0],
      targetRotation.y - currentRot[1],
      targetRotation.z - currentRot[2],
    ];

    logger.info('Propagating rotation delta to prefab children', {
      entityId,
      childCount: entity.children.length,
      delta,
      targetRotation,
    });

    for (const childId of entity.children) {
      if (this.componentRegistry.hasComponent(childId, KnownComponentTypes.TRANSFORM)) {
        const childTransform = this.getTransformComponent(childId);
        const childRot = childTransform?.rotation || [0, 0, 0];

        this.updateComponent(childId, KnownComponentTypes.TRANSFORM, {
          rotation: [childRot[0] + delta[0], childRot[1] + delta[1], childRot[2] + delta[2]],
        });
      }
    }

    logger.info('Rotation delta propagated', { entityId, childCount: entity.children.length });
  }

  private propagateScaleMultiplier(entityId: number, targetScale: IVector3): void {
    const entity = this.entityManager.getEntity(entityId);
    if (!entity?.children || entity.children.length === 0) return;

    const firstChildTransform = this.getTransformComponent(entity.children[0]);
    const currentScale = firstChildTransform?.scale || [1, 1, 1];

    const multiplier: [number, number, number] = [
      currentScale[0] !== 0 ? targetScale.x / currentScale[0] : 1,
      currentScale[1] !== 0 ? targetScale.y / currentScale[1] : 1,
      currentScale[2] !== 0 ? targetScale.z / currentScale[2] : 1,
    ];

    logger.info('Propagating scale multiplier to prefab children', {
      entityId,
      childCount: entity.children.length,
      multiplier,
      targetScale,
    });

    for (const childId of entity.children) {
      if (this.componentRegistry.hasComponent(childId, KnownComponentTypes.TRANSFORM)) {
        const childTransform = this.getTransformComponent(childId);
        const childScale = childTransform?.scale || [1, 1, 1];

        this.updateComponent(childId, KnownComponentTypes.TRANSFORM, {
          scale: [
            childScale[0] * multiplier[0],
            childScale[1] * multiplier[1],
            childScale[2] * multiplier[2],
          ],
        });
      }
    }

    logger.info('Scale multiplier propagated', { entityId, childCount: entity.children.length });
  }
}
