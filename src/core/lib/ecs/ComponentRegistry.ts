/**
 * Scalable Component Registry System
 * Provides a unified way to register and manage ECS components with minimal boilerplate
 */

import { addComponent, defineComponent, hasComponent, removeComponent, Component } from 'bitecs';
import { z } from 'zod';

import { emit } from '../events';
import { Logger } from '../logger';
import { ECSWorld } from './World';
import { EntityId } from './types';

// Base component descriptor interface
export interface IComponentDescriptor<TData = unknown> {
  id: string;
  name: string;
  category: ComponentCategory;
  schema: z.ZodType<TData, any, any>;
  bitECSSchema: Record<string, unknown>;
  serialize: (eid: EntityId) => TData;
  deserialize: (eid: EntityId, data: TData) => void;
  onAdd?: (eid: EntityId, data: TData) => void;
  onRemove?: (eid: EntityId) => void;
  dependencies?: string[];
  conflicts?: string[];
  incompatibleComponents?: string[]; // Components that cannot coexist with this one
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
    schema: z.ZodType<TData, any, any>;
    fields: Record<string, unknown>; // BitECS field definitions
    serialize: (eid: EntityId, bitECSComponent: unknown) => TData;
    deserialize: (eid: EntityId, data: TData, bitECSComponent: unknown) => void;
    onAdd?: (eid: EntityId, data: TData) => void;
    onRemove?: (eid: EntityId) => void;
    dependencies?: string[];
    conflicts?: string[];
    incompatibleComponents?: string[]; // Components that cannot coexist with this one
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
      incompatibleComponents: config.incompatibleComponents,
      metadata: config.metadata,
      _bitECSComponent: bitECSComponent, // Internal reference
    } as IComponentDescriptor<TData> & { _bitECSComponent: unknown };
  }

  /**
   * Creates a simple component with automatic field mapping
   */
  static createSimple<TData extends Record<string, unknown>>(config: {
    id: string;
    name: string;
    category: ComponentCategory;
    schema: z.ZodType<TData, any, any>;
    fieldMappings: Record<keyof TData, unknown>; // Maps data fields to BitECS types
    onAdd?: (eid: EntityId, data: TData) => void;
    onRemove?: (eid: EntityId) => void;
    dependencies?: string[];
    conflicts?: string[];
    incompatibleComponents?: string[];
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
      serialize: (eid: EntityId, bitECSComponent: unknown) => {
        const result = {} as TData;
        for (const [key] of Object.entries(config.fieldMappings)) {
          (result as Record<string, unknown>)[key] = (
            bitECSComponent as Record<string, Record<number, unknown>>
          )[key][eid];
        }
        return result;
      },
      deserialize: (eid: EntityId, data: TData, bitECSComponent: unknown) => {
        for (const [key, value] of Object.entries(data)) {
          const component = bitECSComponent as Record<string, Record<number, unknown>>;
          if (component[key]) {
            component[key][eid] = value;
          }
        }
      },
    });
  }
}

// Global component registry
export class ComponentRegistry {
  private static instance: ComponentRegistry;
  private components = new Map<string, IComponentDescriptor<any>>();
  private bitECSComponents = new Map<string, Component>();
  private world = ECSWorld.getInstance().getWorld();
  private logger = Logger.create('ComponentRegistry');

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
      this.logger.warn(`Component ${descriptor.id} is already registered`);
      return;
    }

    this.components.set(descriptor.id, descriptor);

    // Store BitECS component reference
    const bitECSComponent = (
      descriptor as IComponentDescriptor<TData> & { _bitECSComponent: Component }
    )._bitECSComponent;
    if (bitECSComponent) {
      this.bitECSComponents.set(descriptor.id, bitECSComponent);
    }

    this.logger.info(`Registered component: ${descriptor.name} (${descriptor.id})`);
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
  getByCategory(category: ComponentCategory): IComponentDescriptor<any>[] {
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

    // Check if entity already has this component
    if (hasComponent(this.world, bitECSComponent, entityId)) {
      console.warn(`Entity ${entityId} already has component ${componentId}`);
      return false;
    }

    // Check for component conflicts
    if (descriptor.conflicts) {
      for (const conflictingComponent of descriptor.conflicts) {
        if (this.hasComponent(entityId, conflictingComponent)) {
          console.warn(
            `Cannot add component ${componentId} to entity ${entityId}: conflicts with existing component ${conflictingComponent}`,
          );
          return false;
        }
      }
    }

    // Check for incompatible components
    if (descriptor.incompatibleComponents) {
      for (const incompatibleComponent of descriptor.incompatibleComponents) {
        if (this.hasComponent(entityId, incompatibleComponent)) {
          console.warn(
            `Cannot add component ${componentId} to entity ${entityId}: incompatible with existing component ${incompatibleComponent}`,
          );
          return false;
        }
      }
    }

    // Check if any existing components are incompatible with this one
    const existingComponents = this.getEntityComponents(entityId);
    for (const existingComponentId of existingComponents) {
      const existingDescriptor = this.get(existingComponentId);
      if (existingDescriptor?.incompatibleComponents?.includes(componentId)) {
        console.warn(
          `Cannot add component ${componentId} to entity ${entityId}: existing component ${existingComponentId} is incompatible with it`,
        );
        return false;
      }
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
      emit('component:added', {
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
      emit('component:removed', {
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

      // Special handling for camera components - ensure needsUpdate flag is set
      if (componentId === 'Camera') {
        const bitECSCamera = this.bitECSComponents.get('Camera') as
          | Record<string, Record<number, number>>
          | undefined;
        if (bitECSCamera?.needsUpdate) {
          bitECSCamera.needsUpdate[entityId] = 1;
        }
      }

      // Special handling for light components - ensure needsUpdate flag is set
      if (componentId === 'Light') {
        const bitECSLight = this.bitECSComponents.get('Light') as
          | Record<string, Record<number, number>>
          | undefined;
        if (bitECSLight?.needsUpdate) {
          bitECSLight.needsUpdate[entityId] = 1;
        }
      }

      // Emit component updated event
      emit('component:updated', {
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

    this.bitECSComponents.forEach((bitECSComponent, componentId) => {
      if (hasComponent(this.world, bitECSComponent, entityId)) {
        entityComponents.push(componentId);
      }
    });

    return entityComponents;
  }

  /**
   * Get BitECS component for queries
   */
  getBitECSComponent(componentId: string): unknown {
    return this.bitECSComponents.get(componentId);
  }

  /**
   * Get incompatible components for a given component
   */
  getIncompatibleComponents(componentId: string): string[] {
    const descriptor = this.get(componentId);
    return descriptor?.incompatibleComponents || [];
  }

  /**
   * Check if two components are incompatible with each other
   */
  areComponentsIncompatible(componentA: string, componentB: string): boolean {
    const descriptorA = this.get(componentA);
    const descriptorB = this.get(componentB);

    // Check if A is incompatible with B
    if (descriptorA?.incompatibleComponents?.includes(componentB)) {
      return true;
    }

    // Check if B is incompatible with A
    if (descriptorB?.incompatibleComponents?.includes(componentA)) {
      return true;
    }

    // Check conflicts as well for backward compatibility
    if (descriptorA?.conflicts?.includes(componentB)) {
      return true;
    }

    if (descriptorB?.conflicts?.includes(componentA)) {
      return true;
    }

    return false;
  }

  /**
   * Get all components that would be incompatible with adding a specific component to an entity
   */
  getIncompatibleComponentsForEntity(entityId: EntityId, componentId: string): string[] {
    const existingComponents = this.getEntityComponents(entityId);
    const incompatibleComponents: string[] = [];

    for (const existingComponentId of existingComponents) {
      if (this.areComponentsIncompatible(componentId, existingComponentId)) {
        incompatibleComponents.push(existingComponentId);
      }
    }

    return incompatibleComponents;
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

    const entitySet = new Set<EntityId>();

    // Iterate through all possible entity IDs and check if they have the component
    // This is not the most efficient approach, but it works for compatibility
    for (let eid = 0; eid < 10000; eid++) {
      // Reasonable upper bound
      if (hasComponent(this.world, bitECSComponent, eid)) {
        entitySet.add(eid);
      }
    }

    return Array.from(entitySet).sort((a, b) => a - b);
  }

  /**
   * Get components for entity in old format (legacy compatibility)
   */
  getComponentsForEntity(
    entityId: EntityId,
  ): Array<{ entityId: EntityId; type: string; data: unknown }> {
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
   * Refresh world reference after world reset
   */
  refreshWorld(): void {
    this.world = ECSWorld.getInstance().getWorld();
    console.debug('[ComponentRegistry] Refreshed world reference');
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
  entityComponents: Array<{ type: string; data: unknown }>,
): Record<string, unknown> {
  const combined = {
    visible: true,
    castShadow: true,
    receiveShadow: true,
    meshType: null as string | null, // No default mesh type - only show mesh if explicitly set
    material: {
      shader: 'standard' as 'standard' | 'unlit',
      materialType: 'solid' as 'solid' | 'texture',
      color: '#cccccc', // Lighter gray instead of pure white
      normalScale: 1,
      metalness: 0,
      roughness: 0.7, // Higher roughness for more diffuse look
      emissive: '#000000',
      emissiveIntensity: 0,
      occlusionStrength: 1,
      textureOffsetX: 0,
      textureOffsetY: 0,
      // Texture properties
      albedoTexture: undefined as string | undefined,
      normalTexture: undefined as string | undefined,
      metallicTexture: undefined as string | undefined,
      roughnessTexture: undefined as string | undefined,
      emissiveTexture: undefined as string | undefined,
      occlusionTexture: undefined as string | undefined,
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
    terrain: 'Terrain',
    Wall: 'Wall',
    trapezoid: 'Trapezoid',
    octahedron: 'Octahedron',
    prism: 'Prism',
    pyramid: 'Pyramid',
    capsule: 'Capsule',
    helix: 'Helix',
    mobiusStrip: 'MobiusStrip',
    dodecahedron: 'Dodecahedron',
    icosahedron: 'Icosahedron',
    tetrahedron: 'Tetrahedron',
    torusKnot: 'TorusKnot',
    ramp: 'Ramp',
    stairs: 'Stairs',
    spiralStairs: 'SpiralStairs',
    star: 'Star',
    heart: 'Heart',
    diamond: 'Diamond',
    tube: 'Tube',
    cross: 'Cross',
    tree: 'Tree',
    rock: 'Rock',
    bush: 'Bush',
    grass: 'Grass',
    custom: 'custom',
  };

  entityComponents.forEach(({ type, data }) => {
    if (type === 'MeshRenderer' && data) {
      const meshData = data as Record<string, unknown>;
      // Map meshId to meshType
      if (meshData.meshId) {
        combined.meshType = meshIdToTypeMap[meshData.meshId as string] || 'Cube';
      }

      if (meshData.material) {
        Object.assign(combined.material, meshData.material);
      }
      combined.visible = (meshData.enabled as boolean) ?? true;
      combined.castShadow = (meshData.castShadows as boolean) ?? true;
      combined.receiveShadow = (meshData.receiveShadows as boolean) ?? true;
    }

    // Special handling for Camera components
    if (type === 'Camera') {
      combined.meshType = 'Camera';
    }

    // Special handling for Light components
    if (type === 'Light') {
      combined.meshType = 'Light';
    }
  });

  return combined;
}

/**
 * Combine physics contributions from multiple components (legacy compatibility)
 */
export function combinePhysicsContributions(
  entityComponents: Array<{ type: string; data: unknown }>,
): Record<string, unknown> {
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
      const rigidBodyData = data as Record<string, unknown>;
      combined.enabled = (rigidBodyData.enabled as boolean) ?? false;
      if (rigidBodyData.bodyType || rigidBodyData.type) {
        combined.rigidBodyProps.type =
          (rigidBodyData.bodyType as string) || (rigidBodyData.type as string);
      }
      combined.rigidBodyProps.mass = (rigidBodyData.mass as number) ?? 1;
      combined.rigidBodyProps.gravityScale = (rigidBodyData.gravityScale as number) ?? 1;
      combined.rigidBodyProps.canSleep = (rigidBodyData.canSleep as boolean) ?? true;

      if (rigidBodyData.material) {
        const material = rigidBodyData.material as Record<string, number>;
        combined.rigidBodyProps.friction = material.friction ?? 0.7;
        combined.rigidBodyProps.restitution = material.restitution ?? 0.3;
        combined.rigidBodyProps.density = material.density ?? 1;
      }
    }
  });

  return combined;
}
