import { addComponent, hasComponent as bitecsHasComponent, removeComponent as bitecsRemoveComponent } from 'bitecs';

import { getComponentDefinition, getAllComponentDefinitions } from './dynamicComponentRegistry'; // Added
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
  [KnownComponentTypes.CAMERA]: Camera,
};

export class ComponentManager {
  private static instance: ComponentManager;
  private world = ECSWorld.getInstance().getWorld();
  private eventListeners: ComponentEventListener[] = [];
  private manifestComponentData: Map<EntityId, Map<ComponentType, any>> = new Map(); // Added for non-bitecs components

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

  addComponent<TData>(entityId: EntityId, type: ComponentType, initialData?: TData): IComponent<TData> | undefined {
    const manifest = getComponentDefinition(type);
    if (!manifest) {
      console.error(`[ComponentManager] Component type "${type}" not registered.`);
      return undefined;
    }

    let dataToStore: any;
    if (initialData !== undefined) {
      const validationResult = manifest.schema.safeParse(initialData);
      if (validationResult.success) {
        dataToStore = validationResult.data;
      } else {
        console.error(`[ComponentManager] Invalid initial data for component "${type}" on entity ${entityId}:`, validationResult.error.format());
        // Fallback to default data
        const defaultData = manifest.getDefaultData();
        const defaultValidationResult = manifest.schema.safeParse(defaultData);
        if (defaultValidationResult.success) {
          console.warn(`[ComponentManager] Using default data for "${type}" on entity ${entityId} due to invalid initial data.`);
          dataToStore = defaultValidationResult.data;
        } else {
          console.error(`[ComponentManager] Default data for component "${type}" is also invalid. Aborting addComponent.`, defaultValidationResult.error.format());
          return undefined;
        }
      }
    } else {
      const defaultData = manifest.getDefaultData();
      const validationResult = manifest.schema.safeParse(defaultData);
      if (validationResult.success) {
        dataToStore = validationResult.data;
      } else {
        console.error(`[ComponentManager] Default data for component "${type}" is invalid. Aborting addComponent.`, validationResult.error.format());
        return undefined;
      }
    }

    const bitECSComponent = componentMap[type as keyof typeof componentMap];
    if (bitECSComponent) {
      // It's a BitECS managed component
      if (!bitecsHasComponent(this.world, bitECSComponent, entityId)) {
        addComponent(this.world, bitECSComponent, entityId);
      }
      this.setComponentDataInternal(entityId, type, dataToStore); // Use internal setter
    } else {
      // It's a manifest-only component
      if (!this.manifestComponentData.has(entityId)) {
        this.manifestComponentData.set(entityId, new Map());
      }
      if (this.manifestComponentData.get(entityId)!.has(type)) {
         console.warn(`[ComponentManager] Component "${type}" already exists on entity ${entityId}. Overwriting.`);
      }
      this.manifestComponentData.get(entityId)!.set(type, dataToStore);
    }

    if (manifest.onAdd) {
      manifest.onAdd(entityId, dataToStore);
    }

    this.emitEvent({
      type: 'component-added',
      entityId,
      componentType: type,
      data: dataToStore,
    });

    return { entityId, type, data: dataToStore as TData };
  }

  private setComponentDataInternal<TData>(entityId: EntityId, type: ComponentType, data: TData): void {
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
      case KnownComponentTypes.CAMERA:
        setCameraData(entityId, data as ICameraData);
        break;
    }
  }

  private getComponentDataInternal<TData>( // Renamed from setComponentData to setComponentDataInternal
    entityId: EntityId,
    type: ComponentType,
  ): TData | undefined {
    const bitECSComponent = componentMap[type as keyof typeof componentMap];
    if (bitECSComponent) {
      if (!bitecsHasComponent(this.world, bitECSComponent, entityId)) return undefined;
      // For BitECS components, defer to specific getters
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
          // Should not happen if componentMap is exhaustive for KnownComponentTypes
          console.warn(`[ComponentManager] Unhandled BitECS component type in getComponentDataInternal: ${type}`);
          return undefined;
      }
    } else {
      // For manifest-only components
      return this.manifestComponentData.get(entityId)?.get(type) as TData | undefined;
    }
  }

  getComponent<TData>(entityId: EntityId, type: ComponentType): IComponent<TData> | undefined {
    if (!this.hasComponent(entityId, type)) {
      return undefined;
    }
    const data = this.getComponentDataInternal<TData>(entityId, type);
    // Ensure data is not undefined, though hasComponent should guarantee this.
    return data !== undefined ? { entityId, type, data } : undefined;
  }

  getComponentData<TData>(entityId: EntityId, type: ComponentType): TData | undefined {
     if (!this.hasComponent(entityId, type)) {
      return undefined;
    }
    return this.getComponentDataInternal<TData>(entityId, type);
  }

  updateComponent<TData>(entityId: EntityId, type: ComponentType, data: Partial<TData>): boolean {
    const manifest = getComponentDefinition(type);
    if (!manifest) {
      console.error(`[ComponentManager] Component type "${type}" not registered. Cannot update.`);
      return false;
    }

    if (!this.hasComponent(entityId, type)) {
      console.warn(`[ComponentManager] Component "${type}" not found on entity ${entityId}. Cannot update.`);
      return false;
    }

    const existingData = this.getComponentDataInternal<TData>(entityId, type);
    if (existingData === undefined) { // Should be caught by hasComponent, but as a safeguard
      console.error(`[ComponentManager] Failed to retrieve existing data for "${type}" on entity ${entityId}. Cannot update.`);
      return false;
    }

    const mergedData = { ...existingData, ...data };
    const validationResult = manifest.schema.safeParse(mergedData);

    if (!validationResult.success) {
      console.error(`[ComponentManager] Invalid data for component "${type}" on entity ${entityId} after update:`, validationResult.error.format());
      return false;
    }
    const validatedData = validationResult.data as TData;

    const bitECSComponent = componentMap[type as keyof typeof componentMap];
    if (bitECSComponent) {
      this.setComponentDataInternal(entityId, type, validatedData);
    } else {
      const entityDataMap = this.manifestComponentData.get(entityId);
      if (entityDataMap) {
        entityDataMap.set(type, validatedData);
      } else {
        // This case should ideally not be reached if hasComponent passed.
        console.error(`[ComponentManager] Entity data map not found for entity ${entityId} during update of "${type}".`);
        return false;
      }
    }

    // TODO: Consider onUpdate hook from manifest if needed in the future.
    // if (manifest.onUpdate) manifest.onUpdate(entityId, validatedData);

    this.emitEvent({
      type: 'component-updated',
      entityId,
      componentType: type,
      data: validatedData,
    });

    return true;
  }

  getComponentsForEntity(entityId: EntityId): IComponent<any>[] {
    const components: IComponent<any>[] = [];

    // BitECS components
    Object.entries(componentMap).forEach(([typeString, bitECSComponent]) => {
      if (bitecsHasComponent(this.world, bitECSComponent, entityId)) {
        const data = this.getComponentDataInternal(entityId, typeString as ComponentType);
        if (data !== undefined) {
          components.push({ entityId, type: typeString as ComponentType, data });
        }
      }
    });

    // Manifest-only components
    const entityManifestComponents = this.manifestComponentData.get(entityId);
    if (entityManifestComponents) {
      entityManifestComponents.forEach((data, typeString) => {
        // Avoid duplicating if a component type could somehow be in both (should not happen with current logic)
        if (!componentMap[typeString as keyof typeof componentMap]) {
          components.push({ entityId, type: typeString, data });
        }
      });
    }
    return components;
  }

  hasComponent(entityId: EntityId, type: ComponentType): boolean {
    const bitECSComponent = componentMap[type as keyof typeof componentMap];
    if (bitECSComponent && bitecsHasComponent(this.world, bitECSComponent, entityId)) {
      return true;
    }
    return this.manifestComponentData.get(entityId)?.has(type) ?? false;
  }

  removeComponent(entityId: EntityId, type: ComponentType): boolean {
    if (!this.hasComponent(entityId, type)) {
      return false;
    }

    const manifest = getComponentDefinition(type);
    if (manifest && manifest.onRemove) {
      // Pass the current data to onRemove if the hook needs it.
      // const currentData = this.getComponentDataInternal(entityId, type);
      manifest.onRemove(entityId /*, currentData */);
    }

    const bitECSComponent = componentMap[type as keyof typeof componentMap];
    if (bitECSComponent) {
      bitecsRemoveComponent(this.world, bitECSComponent, entityId);
    } else {
      const entityDataMap = this.manifestComponentData.get(entityId);
      if (entityDataMap) {
        entityDataMap.delete(type);
        if (entityDataMap.size === 0) {
          this.manifestComponentData.delete(entityId);
        }
      }
    }

    this.emitEvent({
      type: 'component-removed',
      entityId,
      componentType: type,
    });

    return true;
  }

  removeComponentsForEntity(entityId: EntityId): void {
    // Remove BitECS components
    Object.entries(componentMap).forEach(([typeString, bitECSComponent]) => {
      if (bitecsHasComponent(this.world, bitECSComponent, entityId)) {
        const manifest = getComponentDefinition(typeString as ComponentType);
        if (manifest && manifest.onRemove) {
          manifest.onRemove(entityId);
        }
        bitecsRemoveComponent(this.world, bitECSComponent, entityId);
      }
    });

    // Remove manifest-only components
    const entityManifestComponents = this.manifestComponentData.get(entityId);
    if (entityManifestComponents) {
      entityManifestComponents.forEach((_data, typeString) => {
        const manifest = getComponentDefinition(typeString as ComponentType);
        if (manifest && manifest.onRemove) {
          manifest.onRemove(entityId);
        }
      });
      this.manifestComponentData.delete(entityId);
    }
    // Note: Emitting individual 'component-removed' events here might be noisy.
    // Consider a single 'entity-cleared-components' event or rely on callers to know.
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
    // This should reflect all components discoverable by the dynamic registry
    return getAllComponentDefinitions().map(def => def.id);
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
