import { Logger } from '@core/lib/logger';
import { IEntity } from '@core/lib/ecs/IEntity';

const logger = Logger.create('AgentEntityService');

export type PrimitiveType = 'Cube' | 'Sphere' | 'Cylinder' | 'Cone' | 'Plane' | 'Light';

export interface IEntityCreationCallbacks {
  createCube: (name?: string) => IEntity;
  createSphere: (name?: string) => IEntity;
  createCylinder: (name?: string) => IEntity;
  createCone: (name?: string) => IEntity;
  createPlane: (name?: string) => IEntity;
  createDirectionalLight: (name?: string) => IEntity;
}

export class AgentEntityService {
  constructor(private readonly callbacks: IEntityCreationCallbacks) {}

  createPrimitive(type: PrimitiveType, name?: string): IEntity | null {
    const creatorMap: Record<PrimitiveType, () => IEntity> = {
      Cube: () => this.callbacks.createCube(name),
      Sphere: () => this.callbacks.createSphere(name),
      Cylinder: () => this.callbacks.createCylinder(name),
      Cone: () => this.callbacks.createCone(name),
      Plane: () => this.callbacks.createPlane(name),
      Light: () => this.callbacks.createDirectionalLight(name),
    };

    const creator = creatorMap[type];
    if (!creator) {
      logger.warn('Unknown primitive type', { type });
      return null;
    }

    const entity = creator();
    logger.info('Primitive created', { type, entityId: entity.id, name });
    return entity;
  }
}
