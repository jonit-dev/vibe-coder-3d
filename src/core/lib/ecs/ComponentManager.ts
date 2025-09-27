import { addComponent, hasComponent, removeComponent } from 'bitecs';

import { emit } from '../events';
import { Camera, MeshCollider, MeshRenderer, RigidBody, Transform } from './BitECSComponents';
import {
  getCameraData,
  getMeshColliderData,
  getMeshRendererData,
  getRigidBodyData,
  getTransformData,
  setCameraData,
  setMeshColliderData,
  setMeshRendererData,
  setRigidBodyData,
  setTransformData,
} from './DataConversion';
import { IComponent, KnownComponentTypes } from './IComponent';
import { ECSWorld } from './World';
import { ICameraData } from './components/CameraComponent';
import { IMeshColliderData } from './components/MeshColliderComponent';
import { IMeshRendererData } from './components/MeshRendererComponent';
import { IRigidBodyData } from './components/RigidBodyComponent';
import { ITransformData } from './components/TransformComponent';
import { ComponentType, EntityId } from './types';
import { EntityQueries } from './queries/entityQueries';

type ComponentEvent = {
  type: 'component-added' | 'component-updated' | 'component-removed';
  entityId: EntityId;
  componentType: ComponentType;
  data?: unknown;
};

type ComponentEventListener = (event: ComponentEvent) => void;

// Map component type strings to BitECS components
const componentMap = {
  [KnownComponentTypes.TRANSFORM]: Transform,
  [KnownComponentTypes.MESH_RENDERER]: MeshRenderer,
  [KnownComponentTypes.RIGID_BODY]: RigidBody,
  [KnownComponentTypes.MESH_COLLIDER]: MeshCollider,
  [KnownComponentTypes.CAMERA]: Camera,
};

export class ComponentManager {
  private static instance: ComponentManager;
  private eventListeners: ComponentEventListener[] = [];
  private queries: EntityQueries;
  private world: any; // BitECS world

  constructor(world?: any, entityQueries?: EntityQueries) {
    if (world) {
      // Instance mode with injected world
      this.world = world;
      this.queries = entityQueries || new EntityQueries(world);
    } else {
      // Singleton mode (backward compatibility)
      this.world = ECSWorld.getInstance().getWorld();
      this.queries = EntityQueries.getInstance();
    }
  }

  public static getInstance(): ComponentManager {
    if (!ComponentManager.instance) {
      ComponentManager.instance = new ComponentManager();
    }
    return ComponentManager.instance;
  }

  public reset(): void {
    this.eventListeners = [];
  }

  // Event system for reactive updates
  addEventListener(listener: ComponentEventListener): () => void {
    this.eventListeners.push(listener);
    return () => {
      const index = this.eventListeners.indexOf(listener);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  private emitEvent(event: ComponentEvent): void {
    this.eventListeners.forEach((listener) => listener(event));

    // Also emit global events for the new event system
    switch (event.type) {
      case 'component-added':
        emit('component:added', {
          entityId: event.entityId,
          componentId: event.componentType,
          data: event.data,
        });
        break;
      case 'component-updated':
        emit('component:updated', {
          entityId: event.entityId,
          componentId: event.componentType,
          data: event.data,
        });
        break;
      case 'component-removed':
        emit('component:removed', {
          entityId: event.entityId,
          componentId: event.componentType,
        });
        break;
    }
  }

  addComponent<TData>(entityId: EntityId, type: ComponentType, data: TData): IComponent<TData> {
    const bitECSComponent = componentMap[type as keyof typeof componentMap];

    if (!bitECSComponent) {
      console.warn(`Component type ${type} not supported in BitECS implementation.`);
      return { entityId, type, data };
    }

    // Add the component to the entity
    addComponent(this.world, bitECSComponent, entityId);

    // Set the component data using conversion functions
    this.setComponentData(entityId, type, data);

    // Emit event for reactive updates
    this.emitEvent({
      type: 'component-added',
      entityId,
      componentType: type,
      data,
    });

    return { entityId, type, data };
  }

  private setComponentData<TData>(entityId: EntityId, type: ComponentType, data: TData): void {
    switch (type) {
      case KnownComponentTypes.TRANSFORM:
        // Ensure complete transform data with defaults for missing fields
        const transformData = data as Partial<ITransformData>;
        const completeTransformData: ITransformData = {
          position: transformData.position || [0, 0, 0],
          rotation: transformData.rotation || [0, 0, 0],
          scale: transformData.scale || [1, 1, 1],
        };
        setTransformData(entityId, completeTransformData);
        break;
      case KnownComponentTypes.MESH_RENDERER:
        setMeshRendererData(entityId, data as IMeshRendererData);
        break;
      case KnownComponentTypes.RIGID_BODY:
        setRigidBodyData(entityId, data as IRigidBodyData);
        break;
      case KnownComponentTypes.MESH_COLLIDER:
        setMeshColliderData(entityId, data as IMeshColliderData);
        break;
      case KnownComponentTypes.CAMERA:
        setCameraData(entityId, data as ICameraData);
        break;
    }
  }

  private getComponentDataInternal<TData>(
    entityId: EntityId,
    type: ComponentType,
  ): TData | undefined {
    switch (type) {
      case KnownComponentTypes.TRANSFORM:
        return getTransformData(entityId) as TData;
      case KnownComponentTypes.MESH_RENDERER:
        return getMeshRendererData(entityId) as TData;
      case KnownComponentTypes.RIGID_BODY:
        return getRigidBodyData(entityId) as TData;
      case KnownComponentTypes.MESH_COLLIDER:
        return getMeshColliderData(entityId) as TData;
      case KnownComponentTypes.CAMERA:
        return getCameraData(entityId) as TData;
      default:
        return undefined;
    }
  }

  getComponent<TData>(entityId: EntityId, type: ComponentType): IComponent<TData> | undefined {
    const bitECSComponent = componentMap[type as keyof typeof componentMap];

    if (!bitECSComponent || !hasComponent(this.world, bitECSComponent, entityId)) {
      return undefined;
    }

    const data = this.getComponentDataInternal<TData>(entityId, type);
    return data ? { entityId, type, data } : undefined;
  }

  getComponentData<TData>(entityId: EntityId, type: ComponentType): TData | undefined {
    const bitECSComponent = componentMap[type as keyof typeof componentMap];

    if (!bitECSComponent || !hasComponent(this.world, bitECSComponent, entityId)) {
      return undefined;
    }

    return this.getComponentDataInternal<TData>(entityId, type);
  }

  updateComponent<TData>(entityId: EntityId, type: ComponentType, data: Partial<TData>): boolean {
    const bitECSComponent = componentMap[type as keyof typeof componentMap];

    if (!bitECSComponent || !hasComponent(this.world, bitECSComponent, entityId)) {
      return false;
    }

    // Get existing data and merge with updates
    const existingData = this.getComponentDataInternal<TData>(entityId, type);
    if (!existingData) return false;

    const updatedData = { ...existingData, ...data };
    this.setComponentData(entityId, type, updatedData);

    // Emit event for reactive updates
    this.emitEvent({
      type: 'component-updated',
      entityId,
      componentType: type,
      data: updatedData,
    });

    return true;
  }

  getComponentsForEntity(entityId: EntityId): IComponent<unknown>[] {
    const components: IComponent<unknown>[] = [];

    Object.entries(componentMap).forEach(([typeString, bitECSComponent]) => {
      if (hasComponent(this.world, bitECSComponent, entityId)) {
        const data = this.getComponentDataInternal(entityId, typeString);
        if (data) {
          components.push({ entityId, type: typeString, data });
        }
      }
    });

    return components;
  }

  hasComponent(entityId: EntityId, type: ComponentType): boolean {
    const bitECSComponent = componentMap[type as keyof typeof componentMap];
    return bitECSComponent ? hasComponent(this.world, bitECSComponent, entityId) : false;
  }

  removeComponent(entityId: EntityId, type: ComponentType): boolean {
    const bitECSComponent = componentMap[type as keyof typeof componentMap];

    if (!bitECSComponent || !hasComponent(this.world, bitECSComponent, entityId)) {
      return false;
    }

    removeComponent(this.world, bitECSComponent, entityId);

    // Emit event for reactive updates
    this.emitEvent({
      type: 'component-removed',
      entityId,
      componentType: type,
    });

    return true;
  }

  removeComponentsForEntity(entityId: EntityId): void {
    Object.values(componentMap).forEach((bitECSComponent) => {
      if (hasComponent(this.world, bitECSComponent, entityId)) {
        removeComponent(this.world, bitECSComponent, entityId);
      }
    });
  }

  getEntitiesWithComponent(componentType: ComponentType): EntityId[] {
    const bitECSComponent = componentMap[componentType as keyof typeof componentMap];
    if (!bitECSComponent) return [];

    // Try to use efficient indexed query, fall back to scan if not available
    try {
      const result = this.queries.listEntitiesWithComponent(componentType);

      // If queries are initialized but return empty, verify with a quick check
      if (result.length === 0) {
        // Quick verification: check if component exists on any entity
        for (let eid = 0; eid < 100; eid++) {
          if (hasComponent(this.world, bitECSComponent, eid)) {
            // Found an entity, queries might not be ready yet - fall back to scan
            const entities: EntityId[] = [];
            for (let scanEid = 0; scanEid < 10000; scanEid++) {
              if (hasComponent(this.world, bitECSComponent, scanEid)) {
                entities.push(scanEid);
              }
            }
            return entities;
          }
        }
      }

      return result;
    } catch (error) {
      // Fall back to scan if queries not available
      const entities: EntityId[] = [];
      for (let eid = 0; eid < 10000; eid++) {
        if (hasComponent(this.world, bitECSComponent, eid)) {
          entities.push(eid);
        }
      }
      return entities;
    }
  }

  getEntitiesWithComponents(types: ComponentType[]): EntityId[] {
    if (types.length === 0) return [];

    // Try to use efficient indexed set intersection, fall back if not available
    try {
      const result = this.queries.listEntitiesWithComponents(types);

      // If result is empty, verify with fallback
      if (result.length === 0) {
        // Quick check if any entity has the first component
        const bitECSComponent = componentMap[types[0] as keyof typeof componentMap];
        if (bitECSComponent) {
          for (let eid = 0; eid < 100; eid++) {
            if (hasComponent(this.world, bitECSComponent, eid)) {
              // Entities exist, fall back to scan+filter
              let entities = this.getEntitiesWithComponent(types[0]);
              for (let i = 1; i < types.length; i++) {
                const entitiesWithComponent = this.getEntitiesWithComponent(types[i]);
                entities = entities.filter((entityId) => entitiesWithComponent.includes(entityId));
              }
              return entities;
            }
          }
        }
      }

      return result;
    } catch (error) {
      // Fall back to scan+filter
      let entities = this.getEntitiesWithComponent(types[0]);
      for (let i = 1; i < types.length; i++) {
        const entitiesWithComponent = this.getEntitiesWithComponent(types[i]);
        entities = entities.filter((entityId) => entitiesWithComponent.includes(entityId));
      }
      return entities;
    }
  }

  clearComponents(): void {
    // This would require removing all components from all entities
    // For now, we'll rely on the EntityManager's clearEntities method
    console.warn('clearComponents not fully implemented - use EntityManager.clearEntities()');
  }

  getComponentCount(type?: ComponentType): number {
    if (type) {
      return this.getEntitiesWithComponent(type).length;
    }

    let total = 0;
    Object.keys(componentMap).forEach((componentType) => {
      total += this.getEntitiesWithComponent(componentType).length;
    });
    return total;
  }

  getRegisteredComponentTypes(): ComponentType[] {
    return Object.keys(componentMap);
  }

  // Helper methods for specific component types
  getTransformComponent(entityId: EntityId): IComponent<ITransformData> | undefined {
    return this.getComponent<ITransformData>(entityId, KnownComponentTypes.TRANSFORM);
  }

  getMeshRendererComponent(entityId: EntityId): IComponent<IMeshRendererData> | undefined {
    return this.getComponent<IMeshRendererData>(entityId, KnownComponentTypes.MESH_RENDERER);
  }

  getRigidBodyComponent(entityId: EntityId): IComponent<IRigidBodyData> | undefined {
    return this.getComponent<IRigidBodyData>(entityId, KnownComponentTypes.RIGID_BODY);
  }

  getMeshColliderComponent(entityId: EntityId): IComponent<IMeshColliderData> | undefined {
    return this.getComponent<IMeshColliderData>(entityId, KnownComponentTypes.MESH_COLLIDER);
  }

  getCameraComponent(entityId: EntityId): IComponent<ICameraData> | undefined {
    return this.getComponent<ICameraData>(entityId, KnownComponentTypes.CAMERA);
  }
}
