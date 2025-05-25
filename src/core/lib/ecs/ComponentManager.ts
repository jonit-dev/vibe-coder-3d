import { addComponent, hasComponent, removeComponent } from 'bitecs';

import { MeshCollider, MeshRenderer, RigidBody, Transform } from './BitECSComponents';
import {
  getMeshColliderData,
  getMeshRendererData,
  getRigidBodyData,
  getTransformData,
  setMeshColliderData,
  setMeshRendererData,
  setRigidBodyData,
  setTransformData,
} from './DataConversion';
import { IComponent, KnownComponentTypes } from './IComponent';
import { ECSWorld } from './World';
import { IMeshColliderData } from './components/MeshColliderComponent';
import { IMeshRendererData } from './components/MeshRendererComponent';
import { IRigidBodyData } from './components/RigidBodyComponent';
import { ITransformData } from './components/TransformComponent';
import { ComponentType, EntityId } from './types';

type ComponentEvent = {
  type: 'component-added' | 'component-updated' | 'component-removed';
  entityId: EntityId;
  componentType: ComponentType;
  data?: any;
};

type ComponentEventListener = (event: ComponentEvent) => void;

// Map component type strings to BitECS components
const componentMap = {
  [KnownComponentTypes.TRANSFORM]: Transform,
  [KnownComponentTypes.MESH_RENDERER]: MeshRenderer,
  [KnownComponentTypes.RIGID_BODY]: RigidBody,
  [KnownComponentTypes.MESH_COLLIDER]: MeshCollider,
};

export class ComponentManager {
  private static instance: ComponentManager;
  private world = ECSWorld.getInstance().getWorld();
  private eventListeners: ComponentEventListener[] = [];

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): ComponentManager {
    if (!ComponentManager.instance) {
      ComponentManager.instance = new ComponentManager();
    }
    return ComponentManager.instance;
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
        setTransformData(entityId, data as ITransformData);
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

  getComponentsForEntity(entityId: EntityId): IComponent<any>[] {
    const components: IComponent<any>[] = [];

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

    const entities: EntityId[] = [];

    // Scan for entities with this component
    // Note: BitECS doesn't provide a direct way to get all entities with a component,
    // so we'll scan a reasonable range starting from 0
    for (let eid = 0; eid < 10000; eid++) {
      if (hasComponent(this.world, bitECSComponent, eid)) {
        entities.push(eid);
      }
    }

    return entities;
  }

  getEntitiesWithComponents(types: ComponentType[]): EntityId[] {
    if (types.length === 0) return [];

    // Start with entities that have the first component type
    let entities = this.getEntitiesWithComponent(types[0]);

    // Filter to only include entities that have all required components
    for (let i = 1; i < types.length; i++) {
      const entitiesWithComponent = this.getEntitiesWithComponent(types[i]);
      entities = entities.filter((entityId) => entitiesWithComponent.includes(entityId));
    }

    return entities;
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
}
