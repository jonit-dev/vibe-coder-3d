import { IComponent, KnownComponentTypes } from './IComponent';
import { IMeshColliderData } from './components/MeshColliderComponent';
import { IMeshRendererData } from './components/MeshRendererComponent';
import { IRigidBodyData } from './components/RigidBodyComponent';
import { ITransformData } from './components/TransformComponent';
import { ComponentType, EntityId } from './types';

type ComponentDataMap = Map<EntityId, any>;

type ComponentEvent = {
  type: 'component-added' | 'component-updated' | 'component-removed';
  entityId: EntityId;
  componentType: ComponentType;
  data?: any;
};

type ComponentEventListener = (event: ComponentEvent) => void;

export class ComponentManager {
  private static instance: ComponentManager;
  private componentStores: Map<ComponentType, ComponentDataMap> = new Map();
  private eventListeners: ComponentEventListener[] = [];

  private constructor() {
    // Initialize stores for known component types
    Object.values(KnownComponentTypes).forEach((type) => {
      this.componentStores.set(type, new Map());
    });
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
    if (!this.componentStores.has(type)) {
      console.warn(`Component type ${type} not registered. Adding dynamically.`);
      this.componentStores.set(type, new Map());
    }
    this.componentStores.get(type)!.set(entityId, data);

    // Emit event for reactive updates
    this.emitEvent({
      type: 'component-added',
      entityId,
      componentType: type,
      data,
    });

    return { entityId, type, data };
  }

  getComponent<TData>(entityId: EntityId, type: ComponentType): IComponent<TData> | undefined {
    const data = this.componentStores.get(type)?.get(entityId);
    return data ? { entityId, type, data } : undefined;
  }

  getComponentData<TData>(entityId: EntityId, type: ComponentType): TData | undefined {
    return this.componentStores.get(type)?.get(entityId);
  }

  updateComponent<TData>(entityId: EntityId, type: ComponentType, data: Partial<TData>): boolean {
    const store = this.componentStores.get(type);
    if (!store || !store.has(entityId)) {
      return false;
    }

    const existingData = store.get(entityId);
    const updatedData = { ...existingData, ...data };
    store.set(entityId, updatedData);

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
    this.componentStores.forEach((store, type) => {
      if (store.has(entityId)) {
        components.push({ entityId, type, data: store.get(entityId) });
      }
    });
    return components;
  }

  hasComponent(entityId: EntityId, type: ComponentType): boolean {
    return this.componentStores.get(type)?.has(entityId) ?? false;
  }

  removeComponent(entityId: EntityId, type: ComponentType): boolean {
    const store = this.componentStores.get(type);
    if (!store || !store.has(entityId)) return false;

    const wasDeleted = store.delete(entityId);

    if (wasDeleted) {
      // Emit event for reactive updates
      this.emitEvent({
        type: 'component-removed',
        entityId,
        componentType: type,
      });
    }

    return wasDeleted;
  }

  removeComponentsForEntity(entityId: EntityId): void {
    this.componentStores.forEach((store) => store.delete(entityId));
  }

  getEntitiesWithComponent(componentType: ComponentType): EntityId[] {
    const store = this.componentStores.get(componentType);
    if (!store) return [];

    return Array.from(store.keys());
  }

  getEntitiesWithComponents(types: ComponentType[]): EntityId[] {
    if (types.length === 0) return [];

    // Start with entities that have the first component type
    const firstStore = this.componentStores.get(types[0]);
    if (!firstStore) return [];

    let entities = Array.from(firstStore.keys());

    // Filter to only include entities that have all required components
    for (let i = 1; i < types.length; i++) {
      const store = this.componentStores.get(types[i]);
      if (!store) return [];

      entities = entities.filter((entityId) => store.has(entityId));
    }

    return entities;
  }

  clearComponents(): void {
    this.componentStores.forEach((store) => store.clear());
  }

  getComponentCount(type?: ComponentType): number {
    if (type) {
      return this.componentStores.get(type)?.size ?? 0;
    }

    let total = 0;
    this.componentStores.forEach((store) => (total += store.size));
    return total;
  }

  getRegisteredComponentTypes(): ComponentType[] {
    return Array.from(this.componentStores.keys());
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
