// Centralized ECS Manager - Clean API with automatic event emission
import { addComponent, addEntity, hasComponent, removeComponent, removeEntity } from 'bitecs';

import {
  Material,
  MeshType,
  MeshTypeEnum,
  Name,
  Transform,
  Velocity,
  entityToObject,
  incrementWorldVersion,
  objectToEntity,
  world,
} from './ecs';
import { frameEventBatch } from './ecs-events';

export interface IEntityCreateOptions {
  meshType?: MeshTypeEnum;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  color?: [number, number, number];
  name?: string;
}

export interface ITransformData {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface IVelocityOptions {
  linear?: [number, number, number];
  angular?: [number, number, number];
  linearDamping?: number;
  angularDamping?: number;
  priority?: number;
}

/**
 * Centralized ECS Manager
 * Provides a clean, event-driven API for all ECS operations
 */
export class ECSManager {
  private static instance: ECSManager;

  static getInstance(): ECSManager {
    if (!ECSManager.instance) {
      ECSManager.instance = new ECSManager();
    }
    return ECSManager.instance;
  }

  /**
   * Create a new entity with optional configuration
   */
  createEntity(options: IEntityCreateOptions = {}): number {
    const entity = addEntity(world);

    // Add core components
    addComponent(world, Transform, entity);
    addComponent(world, MeshType, entity);
    addComponent(world, Material, entity);

    // Set mesh type
    MeshType.type[entity] = options.meshType || MeshTypeEnum.Cube;

    // Set transform values
    const pos = options.position || [0, 0, 0];
    const rot = options.rotation || [0, 0, 0];
    const scale = options.scale || [1, 1, 1];

    Transform.position[entity][0] = pos[0];
    Transform.position[entity][1] = pos[1];
    Transform.position[entity][2] = pos[2];

    Transform.rotation[entity][0] = rot[0];
    Transform.rotation[entity][1] = rot[1];
    Transform.rotation[entity][2] = rot[2];

    Transform.scale[entity][0] = scale[0];
    Transform.scale[entity][1] = scale[1];
    Transform.scale[entity][2] = scale[2];

    Transform.needsUpdate[entity] = 1;

    // Set material color
    const color = options.color || [0.2, 0.6, 1.0];
    Material.color[entity][0] = color[0];
    Material.color[entity][1] = color[1];
    Material.color[entity][2] = color[2];
    Material.needsUpdate[entity] = 1;

    // Set name if provided
    if (options.name) {
      this.setEntityName(entity, options.name);
    }

    incrementWorldVersion();

    // Emit events
    frameEventBatch.add('entity:created', { entityId: entity });
    frameEventBatch.add('component:added', { entityId: entity, componentName: 'Transform' });
    frameEventBatch.add('component:added', { entityId: entity, componentName: 'MeshType' });
    frameEventBatch.add('component:added', { entityId: entity, componentName: 'Material' });

    return entity;
  }

  /**
   * Destroy an entity and clean up all references
   */
  destroyEntity(entity: number): void {
    // Remove from object mappings
    const object = entityToObject.get(entity);
    if (object) {
      entityToObject.delete(entity);
      objectToEntity.delete(object);
    }

    // Remove all components
    const componentsToRemove = [];
    if (hasComponent(world, Transform, entity)) {
      removeComponent(world, Transform, entity);
      componentsToRemove.push('Transform');
    }
    if (hasComponent(world, MeshType, entity)) {
      removeComponent(world, MeshType, entity);
      componentsToRemove.push('MeshType');
    }
    if (hasComponent(world, Material, entity)) {
      removeComponent(world, Material, entity);
      componentsToRemove.push('Material');
    }
    if (hasComponent(world, Velocity, entity)) {
      removeComponent(world, Velocity, entity);
      componentsToRemove.push('Velocity');
    }
    if (hasComponent(world, Name, entity)) {
      removeComponent(world, Name, entity);
      componentsToRemove.push('Name');
    }

    // Remove entity
    removeEntity(world, entity);
    incrementWorldVersion();

    // Emit events
    componentsToRemove.forEach((componentName) => {
      frameEventBatch.add('component:removed', { entityId: entity, componentName });
    });
    frameEventBatch.add('entity:destroyed', { entityId: entity });
  }

  /**
   * Update entity transform with automatic event emission
   */
  updateTransform(entity: number, transform: Partial<ITransformData>): void {
    if (!hasComponent(world, Transform, entity)) {
      console.warn(`Entity ${entity} does not have Transform component`);
      return;
    }

    const updatedTransform: Partial<ITransformData> = {};

    if (transform.position) {
      Transform.position[entity][0] = transform.position[0];
      Transform.position[entity][1] = transform.position[1];
      Transform.position[entity][2] = transform.position[2];
      updatedTransform.position = [...transform.position];
    }

    if (transform.rotation) {
      Transform.rotation[entity][0] = transform.rotation[0];
      Transform.rotation[entity][1] = transform.rotation[1];
      Transform.rotation[entity][2] = transform.rotation[2];
      updatedTransform.rotation = [...transform.rotation];
    }

    if (transform.scale) {
      Transform.scale[entity][0] = transform.scale[0];
      Transform.scale[entity][1] = transform.scale[1];
      Transform.scale[entity][2] = transform.scale[2];
      updatedTransform.scale = [...transform.scale];
    }

    Transform.needsUpdate[entity] = 1;
    incrementWorldVersion();

    // Emit transform update event
    frameEventBatch.add('transform:updated', {
      entityId: entity,
      transform: updatedTransform,
    });
  }

  /**
   * Get entity transform data
   */
  getTransform(entity: number): ITransformData | null {
    if (!hasComponent(world, Transform, entity)) {
      return null;
    }

    return {
      position: [
        Transform.position[entity][0],
        Transform.position[entity][1],
        Transform.position[entity][2],
      ],
      rotation: [
        Transform.rotation[entity][0],
        Transform.rotation[entity][1],
        Transform.rotation[entity][2],
      ],
      scale: [Transform.scale[entity][0], Transform.scale[entity][1], Transform.scale[entity][2]],
    };
  }

  /**
   * Add velocity component to entity
   */
  addVelocity(entity: number, options: IVelocityOptions = {}): void {
    if (hasComponent(world, Velocity, entity)) {
      console.warn(`Entity ${entity} already has Velocity component`);
      return;
    }

    addComponent(world, Velocity, entity);

    const linear = options.linear || [0, 0, 0];
    const angular = options.angular || [0, 0, 0];

    Velocity.linear[entity][0] = linear[0];
    Velocity.linear[entity][1] = linear[1];
    Velocity.linear[entity][2] = linear[2];

    Velocity.angular[entity][0] = angular[0];
    Velocity.angular[entity][1] = angular[1];
    Velocity.angular[entity][2] = angular[2];

    Velocity.linearDamping[entity] = options.linearDamping ?? 0.01;
    Velocity.angularDamping[entity] = options.angularDamping ?? 0.01;
    Velocity.priority[entity] = options.priority ?? 1;

    incrementWorldVersion();

    frameEventBatch.add('component:added', { entityId: entity, componentName: 'Velocity' });
  }

  /**
   * Remove velocity component from entity
   */
  removeVelocity(entity: number): void {
    if (!hasComponent(world, Velocity, entity)) {
      console.warn(`Entity ${entity} does not have Velocity component`);
      return;
    }

    removeComponent(world, Velocity, entity);
    incrementWorldVersion();

    frameEventBatch.add('component:removed', { entityId: entity, componentName: 'Velocity' });
  }

  /**
   * Update entity material color
   */
  updateMaterialColor(entity: number, color: [number, number, number]): void {
    if (!hasComponent(world, Material, entity)) {
      console.warn(`Entity ${entity} does not have Material component`);
      return;
    }

    Material.color[entity][0] = color[0];
    Material.color[entity][1] = color[1];
    Material.color[entity][2] = color[2];
    Material.needsUpdate[entity] = 1;

    incrementWorldVersion();

    frameEventBatch.add('material:updated', { entityId: entity, color });
  }

  /**
   * Set entity name
   */
  setEntityName(entity: number, name: string): void {
    if (!hasComponent(world, Name, entity)) {
      addComponent(world, Name, entity);
      frameEventBatch.add('component:added', { entityId: entity, componentName: 'Name' });
    }

    const encoder = new TextEncoder();
    const bytes = encoder.encode(name.slice(0, 32));
    Name.value[entity].fill(0);
    for (let i = 0; i < bytes.length; i++) {
      Name.value[entity][i] = bytes[i];
    }

    incrementWorldVersion();

    frameEventBatch.add('component:updated', {
      entityId: entity,
      componentName: 'Name',
      data: { name },
    });
  }

  /**
   * Get entity name
   */
  getEntityName(entity: number): string {
    if (!hasComponent(world, Name, entity)) {
      return `Entity ${entity}`;
    }

    const decoder = new TextDecoder();
    const bytes = Name.value[entity];
    const nullIndex = bytes.indexOf(0);
    const validBytes = nullIndex === -1 ? bytes : bytes.slice(0, nullIndex);
    return decoder.decode(validBytes) || `Entity ${entity}`;
  }

  /**
   * Check if entity has a specific component
   */
  hasComponent(entity: number, component: any): boolean {
    return hasComponent(world, component, entity);
  }

  /**
   * Get all entities with specific components (query)
   */
  query(_components: any[]): number[] {
    // This would use the existing query system
    // For now, we'll need to implement a simple version
    // In a real implementation, this would be more sophisticated
    return [];
  }
}

// Export singleton instance
export const ecsManager = ECSManager.getInstance();
