/**
 * Scalable Component Registry System
 * Provides a unified way to register and manage ECS components with minimal boilerplate
 */

import { addComponent, defineComponent, hasComponent, removeComponent } from 'bitecs';
import { z } from 'zod';

import { ECSWorld } from './World';
import { EntityId } from './types';

// Base component descriptor interface
export interface IComponentDescriptor<TData = any> {
  id: string;
  name: string;
  category: ComponentCategory;
  schema: z.ZodSchema<TData>;
  bitECSSchema: Record<string, any>;
  serialize: (eid: EntityId) => TData;
  deserialize: (eid: EntityId, data: TData) => void;
  onAdd?: (eid: EntityId, data: TData) => void;
  onRemove?: (eid: EntityId) => void;
  dependencies?: string[];
  conflicts?: string[];
  metadata?: {
    description?: string;
    version?: string;
    author?: string;
    tags?: string[];
  };
}

export enum ComponentCategory {
  Core = 'core',
  Rendering = 'rendering',
  Physics = 'physics',
  Gameplay = 'gameplay',
  AI = 'ai',
  Audio = 'audio',
  UI = 'ui',
  Network = 'network',
}

// Component factory for creating component descriptors with minimal boilerplate
export class ComponentFactory {
  /**
   * Creates a component descriptor with automatic BitECS component generation
   */
  static create<TData>(config: {
    id: string;
    name: string;
    category: ComponentCategory;
    schema: z.ZodSchema<TData>;
    fields: Record<string, any>; // BitECS field definitions
    serialize: (eid: EntityId, bitECSComponent: any) => TData;
    deserialize: (eid: EntityId, data: TData, bitECSComponent: any) => void;
    onAdd?: (eid: EntityId, data: TData) => void;
    onRemove?: (eid: EntityId) => void;
    dependencies?: string[];
    conflicts?: string[];
    metadata?: {
      description?: string;
      version?: string;
      author?: string;
      tags?: string[];
    };
  }): IComponentDescriptor<TData> {
    // Create BitECS component automatically
    const bitECSComponent = defineComponent(config.fields);

    return {
      id: config.id,
      name: config.name,
      category: config.category,
      schema: config.schema,
      bitECSSchema: config.fields,
      serialize: (eid: EntityId) => config.serialize(eid, bitECSComponent),
      deserialize: (eid: EntityId, data: TData) => config.deserialize(eid, data, bitECSComponent),
      onAdd: config.onAdd,
      onRemove: config.onRemove,
      dependencies: config.dependencies,
      conflicts: config.conflicts,
      metadata: config.metadata,
      _bitECSComponent: bitECSComponent, // Internal reference
    } as IComponentDescriptor<TData> & { _bitECSComponent: any };
  }

  /**
   * Creates a simple component with automatic field mapping
   */
  static createSimple<TData extends Record<string, any>>(config: {
    id: string;
    name: string;
    category: ComponentCategory;
    schema: z.ZodSchema<TData>;
    fieldMappings: Record<keyof TData, any>; // Maps data fields to BitECS types
    onAdd?: (eid: EntityId, data: TData) => void;
    onRemove?: (eid: EntityId) => void;
    dependencies?: string[];
    conflicts?: string[];
    metadata?: {
      description?: string;
      version?: string;
      author?: string;
      tags?: string[];
    };
  }): IComponentDescriptor<TData> {
    return ComponentFactory.create({
      ...config,
      fields: config.fieldMappings,
      serialize: (eid: EntityId, bitECSComponent: any) => {
        const result = {} as TData;
        for (const [key, _] of Object.entries(config.fieldMappings)) {
          (result as any)[key] = bitECSComponent[key][eid];
        }
        return result;
      },
      deserialize: (eid: EntityId, data: TData, bitECSComponent: any) => {
        for (const [key, value] of Object.entries(data)) {
          if (bitECSComponent[key]) {
            bitECSComponent[key][eid] = value;
          }
        }
      },
    });
  }
}

// Global component registry
export class ComponentRegistry {
  private static instance: ComponentRegistry;
  private components = new Map<string, IComponentDescriptor>();
  private bitECSComponents = new Map<string, any>();
  private world = ECSWorld.getInstance().getWorld();
  private eventListeners = new Set<(event: any) => void>();

  private constructor() {}

  static getInstance(): ComponentRegistry {
    if (!ComponentRegistry.instance) {
      ComponentRegistry.instance = new ComponentRegistry();
    }
    return ComponentRegistry.instance;
  }

  /**
   * Register a component descriptor
   */
  register<TData>(descriptor: IComponentDescriptor<TData>): void {
    if (this.components.has(descriptor.id)) {
      console.warn(`Component ${descriptor.id} is already registered`);
      return;
    }

    this.components.set(descriptor.id, descriptor);

    // Store BitECS component reference
    const bitECSComponent = (descriptor as any)._bitECSComponent;
    if (bitECSComponent) {
      this.bitECSComponents.set(descriptor.id, bitECSComponent);
    }

    console.log(`Registered component: ${descriptor.name} (${descriptor.id})`);
  }

  /**
   * Get component descriptor by ID
   */
  get<TData>(id: string): IComponentDescriptor<TData> | undefined {
    return this.components.get(id) as IComponentDescriptor<TData>;
  }

  /**
   * Get all components in a category
   */
  getByCategory(category: ComponentCategory): IComponentDescriptor[] {
    return Array.from(this.components.values()).filter((comp) => comp.category === category);
  }

  /**
   * Add component to entity
   */
  addComponent<TData>(entityId: EntityId, componentId: string, data: TData): boolean {
    const descriptor = this.get<TData>(componentId);
    if (!descriptor) {
      console.error(`Component ${componentId} not found`);
      return false;
    }

    const bitECSComponent = this.bitECSComponents.get(componentId);
    if (!bitECSComponent) {
      console.error(`BitECS component for ${componentId} not found`);
      return false;
    }

    try {
      // Validate data
      descriptor.schema.parse(data);

      // Add BitECS component
      addComponent(this.world, bitECSComponent, entityId);

      // Set data
      descriptor.deserialize(entityId, data);

      // Call onAdd callback
      descriptor.onAdd?.(entityId, data);

      // Emit component added event
      this.emitEvent({
        type: 'component-added',
        entityId,
        componentId,
        data,
      });

      return true;
    } catch (error) {
      console.error(`Failed to add component ${componentId} to entity ${entityId}:`, error);
      return false;
    }
  }

  /**
   * Remove component from entity
   */
  removeComponent(entityId: EntityId, componentId: string): boolean {
    const descriptor = this.get(componentId);
    if (!descriptor) {
      console.error(`Component ${componentId} not found`);
      return false;
    }

    const bitECSComponent = this.bitECSComponents.get(componentId);
    if (!bitECSComponent) {
      console.error(`BitECS component for ${componentId} not found`);
      return false;
    }

    try {
      // Call onRemove callback
      descriptor.onRemove?.(entityId);

      // Remove BitECS component
      removeComponent(this.world, bitECSComponent, entityId);

      // Emit component removed event
      this.emitEvent({
        type: 'component-removed',
        entityId,
        componentId,
      });

      return true;
    } catch (error) {
      console.error(`Failed to remove component ${componentId} from entity ${entityId}:`, error);
      return false;
    }
  }

  /**
   * Check if entity has component
   */
  hasComponent(entityId: EntityId, componentId: string): boolean {
    const bitECSComponent = this.bitECSComponents.get(componentId);
    if (!bitECSComponent) {
      return false;
    }

    return hasComponent(this.world, bitECSComponent, entityId);
  }

  /**
   * Get component data from entity
   */
  getComponentData<TData>(entityId: EntityId, componentId: string): TData | undefined {
    const descriptor = this.get<TData>(componentId);
    if (!descriptor || !this.hasComponent(entityId, componentId)) {
      return undefined;
    }

    return descriptor.serialize(entityId);
  }

  /**
   * Update component data
   */
  updateComponent<TData>(entityId: EntityId, componentId: string, data: Partial<TData>): boolean {
    const descriptor = this.get<TData>(componentId);
    if (!descriptor || !this.hasComponent(entityId, componentId)) {
      return false;
    }

    try {
      // Get current data
      const currentData = descriptor.serialize(entityId);

      // Merge with new data
      const updatedData = { ...currentData, ...data };

      // Validate merged data
      descriptor.schema.parse(updatedData);

      // Update data
      descriptor.deserialize(entityId, updatedData);

      // Emit component updated event
      this.emitEvent({
        type: 'component-updated',
        entityId,
        componentId,
        data: updatedData,
      });

      return true;
    } catch (error) {
      console.error(`Failed to update component ${componentId} on entity ${entityId}:`, error);
      return false;
    }
  }

  /**
   * List all registered component IDs
   */
  listComponents(): string[] {
    return Array.from(this.components.keys());
  }

  /**
   * Get all components attached to an entity
   */
  getEntityComponents(entityId: EntityId): string[] {
    const entityComponents: string[] = [];

    for (const [componentId, bitECSComponent] of this.bitECSComponents.entries()) {
      if (hasComponent(this.world, bitECSComponent, entityId)) {
        entityComponents.push(componentId);
      }
    }

    return entityComponents;
  }

  /**
   * Get BitECS component for queries
   */
  getBitECSComponent(componentId: string): any {
    return this.bitECSComponents.get(componentId);
  }

  // ============================================================================
  // LEGACY COMPATIBILITY METHODS
  // ============================================================================

  /**
   * Get all entities that have a specific component (legacy compatibility)
   */
  getEntitiesWithComponent(componentId: string): EntityId[] {
    const bitECSComponent = this.bitECSComponents.get(componentId);
    if (!bitECSComponent) {
      return [];
    }

    const entities: EntityId[] = [];

    // Iterate through all possible entity IDs and check if they have the component
    // This is not the most efficient approach, but it works for compatibility
    for (let eid = 0; eid < 10000; eid++) {
      // Reasonable upper bound
      if (hasComponent(this.world, bitECSComponent, eid)) {
        entities.push(eid);
      }
    }

    return entities;
  }

  /**
   * Get components for entity in old format (legacy compatibility)
   */
  getComponentsForEntity(
    entityId: EntityId,
  ): Array<{ entityId: EntityId; type: string; data: any }> {
    const componentIds = this.getEntityComponents(entityId);
    return componentIds.map((componentId) => ({
      entityId,
      type: componentId,
      data: this.getComponentData(entityId, componentId),
    }));
  }

  /**
   * Get component in old format (legacy compatibility)
   */
  getComponent<TData>(
    entityId: EntityId,
    componentId: string,
  ): { entityId: EntityId; type: string; data: TData } | undefined {
    const data = this.getComponentData<TData>(entityId, componentId);
    return data ? { entityId, type: componentId, data } : undefined;
  }

  /**
   * Get specific component types (legacy compatibility)
   */
  getTransformComponent(entityId: EntityId):
    | {
        entityId: EntityId;
        type: string;
        data: import('./components/TransformComponent').ITransformData;
      }
    | undefined {
    return this.getComponent(entityId, 'Transform');
  }

  getMeshRendererComponent(entityId: EntityId):
    | {
        entityId: EntityId;
        type: string;
        data: import('./components/MeshRendererComponent').IMeshRendererData;
      }
    | undefined {
    return this.getComponent(entityId, 'MeshRenderer');
  }

  getRigidBodyComponent(entityId: EntityId):
    | {
        entityId: EntityId;
        type: string;
        data: import('./components/RigidBodyComponent').IRigidBodyData;
      }
    | undefined {
    return this.getComponent(entityId, 'RigidBody');
  }

  getMeshColliderComponent(entityId: EntityId):
    | {
        entityId: EntityId;
        type: string;
        data: import('./components/MeshColliderComponent').IMeshColliderData;
      }
    | undefined {
    return this.getComponent(entityId, 'MeshCollider');
  }

  getCameraComponent(
    entityId: EntityId,
  ):
    | { entityId: EntityId; type: string; data: import('./components/CameraComponent').ICameraData }
    | undefined {
    return this.getComponent(entityId, 'Camera');
  }

  /**
   * Remove all components from entity (legacy compatibility)
   */
  removeComponentsForEntity(entityId: EntityId): void {
    const componentIds = this.getEntityComponents(entityId);
    componentIds.forEach((componentId) => {
      this.removeComponent(entityId, componentId);
    });
  }

  /**
   * Clear all components (legacy compatibility)
   */
  clearComponents(): void {
    console.warn('clearComponents not fully implemented - use EntityManager.clearEntities()');
  }

  /**
   * Event system for legacy compatibility
   */
  addEventListener(listener: (event: any) => void): () => void {
    this.eventListeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  /**
   * Emit event to all listeners
   */
  private emitEvent(event: any): void {
    this.eventListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in component event listener:', error);
      }
    });
  }
}

// Export singleton instance
export const componentRegistry = ComponentRegistry.getInstance();

// ============================================================================
// LEGACY COMPATIBILITY FUNCTIONS
// ============================================================================

/**
 * Check if a component can be removed (legacy compatibility)
 */
export function isComponentRemovable(componentId: string): boolean {
  // Transform and Camera components cannot be removed as they are essential
  // Transform: Required for all entities to exist in 3D space
  // Camera: A camera entity without a Camera component would be useless
  return componentId !== 'Transform' && componentId !== 'Camera';
}

/**
 * Combine rendering contributions from multiple components (legacy compatibility)
 */
export function combineRenderingContributions(
  entityComponents: Array<{ type: string; data: any }>,
): any {
  const combined = {
    visible: true,
    castShadow: true,
    receiveShadow: true,
    meshType: null as string | null, // No default mesh type - only show mesh if explicitly set
    material: {
      color: '#3399ff',
      metalness: 0,
      roughness: 0.5,
      emissive: '#000000',
      emissiveIntensity: 0,
    },
  };

  // Convert meshId to meshType for geometry selection
  const meshIdToTypeMap: { [key: string]: string } = {
    cube: 'Cube',
    sphere: 'Sphere',
    cylinder: 'Cylinder',
    cone: 'Cone',
    torus: 'Torus',
    plane: 'Plane',
    capsule: 'Cube', // Fallback to cube for now
  };

  entityComponents.forEach(({ type, data }) => {
    if (type === 'MeshRenderer' && data) {
      // Map meshId to meshType
      if (data.meshId) {
        combined.meshType = meshIdToTypeMap[data.meshId] || 'Cube';
      }

      if (data.material) {
        Object.assign(combined.material, data.material);
      }
      combined.visible = data.enabled ?? true;
      combined.castShadow = data.castShadows ?? true;
      combined.receiveShadow = data.receiveShadows ?? true;
    }

    // Special handling for Camera components
    if (type === 'Camera') {
      combined.meshType = 'Camera';
    }
  });

  return combined;
}

/**
 * Combine physics contributions from multiple components (legacy compatibility)
 */
export function combinePhysicsContributions(
  entityComponents: Array<{ type: string; data: any }>,
): any {
  const combined = {
    enabled: false,
    rigidBodyProps: {
      type: 'dynamic',
      mass: 1,
      friction: 0.7,
      restitution: 0.3,
      density: 1,
      gravityScale: 1,
      canSleep: true,
    },
    colliders: [],
  };

  // Simple implementation for now - can be enhanced later
  entityComponents.forEach(({ type, data }) => {
    if (type === 'RigidBody' && data) {
      combined.enabled = data.enabled ?? false;
      if (data.bodyType || data.type) {
        combined.rigidBodyProps.type = data.bodyType || data.type;
      }
      combined.rigidBodyProps.mass = data.mass ?? 1;
      combined.rigidBodyProps.gravityScale = data.gravityScale ?? 1;
      combined.rigidBodyProps.canSleep = data.canSleep ?? true;

      if (data.material) {
        combined.rigidBodyProps.friction = data.material.friction ?? 0.7;
        combined.rigidBodyProps.restitution = data.material.restitution ?? 0.3;
        combined.rigidBodyProps.density = data.material.density ?? 1;
      }
    }
  });

  return combined;
}
