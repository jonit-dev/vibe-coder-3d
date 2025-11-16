import { Logger } from '@core/lib/logger';
import { TransformAccessor } from '@/editor/services/TransformAccessor';

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
  constructor() {}

  setPosition(entityId: number, position: IVector3): void {
    TransformAccessor.updateEffectiveTransform(
      entityId,
      { position: [position.x, position.y, position.z] },
      true, // propagate delta for prefabs
    );
    logger.info('Position updated', { entityId, position });
  }

  setRotation(entityId: number, rotation: IVector3): void {
    TransformAccessor.updateEffectiveTransform(
      entityId,
      { rotation: [rotation.x, rotation.y, rotation.z] },
      true, // propagate delta for prefabs
    );
    logger.info('Rotation updated', { entityId, rotation });
  }

  setScale(entityId: number, scale: IVector3): void {
    TransformAccessor.updateEffectiveTransform(
      entityId,
      { scale: [scale.x, scale.y, scale.z] },
      true, // propagate delta for prefabs (as multiplier)
    );
    logger.info('Scale updated', { entityId, scale });
  }

  applyTransform(
    entityId: number,
    position?: IVector3,
    rotation?: IVector3,
    scale?: IVector3,
  ): void {
    const update: ITransformUpdate = {
      position: position ? [position.x, position.y, position.z] : [0, 0, 0],
      rotation: rotation ? [rotation.x, rotation.y, rotation.z] : [0, 0, 0],
      scale: scale ? [scale.x, scale.y, scale.z] : [1, 1, 1],
    };

    TransformAccessor.updateEffectiveTransform(entityId, update, false);
    logger.debug('Transform applied', { entityId, update });
  }
}
