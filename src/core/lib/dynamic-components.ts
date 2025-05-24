import { addComponent, hasComponent, removeComponent } from 'bitecs';

import { IComponentChangeEvent, IValidationResult } from '../types/component-registry';

import { componentRegistry } from './component-registry';
import { incrementWorldVersion, world } from './ecs';

export class DynamicComponentManager {
  private static instance: DynamicComponentManager;

  static getInstance(): DynamicComponentManager {
    if (!DynamicComponentManager.instance) {
      DynamicComponentManager.instance = new DynamicComponentManager();
    }
    return DynamicComponentManager.instance;
  }

  async addComponent(
    entityId: number,
    componentId: string,
    data?: any,
  ): Promise<IValidationResult> {
    const validation = this.validateComponentAddition(entityId, componentId);
    if (!validation.valid) {
      return validation;
    }

    const descriptor = componentRegistry.getComponent(componentId);
    if (!descriptor) {
      return {
        valid: false,
        errors: [`Component '${componentId}' not found`],
        warnings: [],
      };
    }

    try {
      // Add required dependencies first
      if (validation.missingDependencies) {
        for (const depId of validation.missingDependencies) {
          const depResult = await this.addComponent(entityId, depId);
          if (!depResult.valid) {
            return {
              valid: false,
              errors: [`Failed to add dependency '${depId}': ${depResult.errors.join(', ')}`],
              warnings: [],
            };
          }
        }
      }

      // Add the component to the entity
      if (descriptor.component) {
        // BitECS component
        addComponent(world, descriptor.component, entityId);
      }

      // Handle editor store components (rigidBody, meshCollider, meshRenderer)
      const editorStoreComponents = ['rigidBody', 'meshCollider', 'meshRenderer'];
      if (editorStoreComponents.includes(componentId)) {
        await this.handleEditorStoreComponent(entityId, componentId, data);
      }

      // Deserialize data if provided (for bitECS components)
      if (data && descriptor.component) {
        try {
          const validatedData = descriptor.schema.parse(data);
          descriptor.deserialize(entityId, validatedData);
        } catch (error) {
          // If deserialization fails, still add the component but use defaults
          console.warn(`Failed to deserialize data for component '${componentId}':`, error);
        }
      }

      // Call onAdd callback if defined
      if (descriptor.onAdd) {
        descriptor.onAdd(entityId);
      }

      // Emit event
      const event: IComponentChangeEvent = {
        entityId,
        componentId,
        action: 'add',
        data,
        timestamp: Date.now(),
      };
      componentRegistry.emitEvent(event);

      // Update world version
      incrementWorldVersion();

      return {
        valid: true,
        errors: [],
        warnings: validation.warnings,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Failed to add component '${componentId}': ${error}`],
        warnings: [],
      };
    }
  }

  async removeComponent(entityId: number, componentId: string): Promise<IValidationResult> {
    const descriptor = componentRegistry.getComponent(componentId);
    if (!descriptor) {
      return {
        valid: false,
        errors: [`Component '${componentId}' not found`],
        warnings: [],
      };
    }

    if (!hasComponent(world, descriptor.component, entityId)) {
      return {
        valid: false,
        errors: [`Entity ${entityId} does not have component '${componentId}'`],
        warnings: [],
      };
    }

    // Check if other components depend on this one
    const dependentComponents = this.findDependentComponents(entityId, componentId);
    if (dependentComponents.length > 0) {
      return {
        valid: false,
        errors: [
          `Cannot remove component '${componentId}' because these components depend on it: ${dependentComponents.join(', ')}`,
        ],
        warnings: [],
      };
    }

    try {
      // Call onRemove callback if defined
      if (descriptor.onRemove) {
        descriptor.onRemove(entityId);
      }

      // Remove the component from the entity
      removeComponent(world, descriptor.component, entityId);

      // Emit event
      const event: IComponentChangeEvent = {
        entityId,
        componentId,
        action: 'remove',
        timestamp: Date.now(),
      };
      componentRegistry.emitEvent(event);

      // Update world version
      incrementWorldVersion();

      return {
        valid: true,
        errors: [],
        warnings: [],
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Failed to remove component '${componentId}': ${error}`],
        warnings: [],
      };
    }
  }

  hasComponent(entityId: number, componentId: string): boolean {
    return componentRegistry.hasEntityComponent(entityId, componentId);
  }

  getEntityComponents(entityId: number): string[] {
    return componentRegistry.getEntityComponents(entityId);
  }

  validateComponentAddition(entityId: number, componentId: string): IValidationResult {
    const descriptor = componentRegistry.getComponent(componentId);
    if (!descriptor) {
      return {
        valid: false,
        errors: [`Component '${componentId}' not found`],
        warnings: [],
      };
    }

    // Check if component is already present
    if (hasComponent(world, descriptor.component, entityId)) {
      return {
        valid: false,
        errors: [`Entity ${entityId} already has component '${componentId}'`],
        warnings: [],
      };
    }

    // Get current entity components
    const currentComponents = this.getEntityComponents(entityId);
    const targetComponents = [...currentComponents, componentId];

    // Validate dependencies and conflicts
    const validation = componentRegistry.validateDependencies(targetComponents);

    // Resolve missing dependencies
    if (validation.missingDependencies && validation.missingDependencies.length > 0) {
      const resolvedDeps = componentRegistry.resolveDependencies([componentId]);
      const missingDeps = resolvedDeps.filter((dep) => !currentComponents.includes(dep));

      if (missingDeps.length > 0) {
        validation.missingDependencies = missingDeps;
        validation.warnings.push(`Will automatically add dependencies: ${missingDeps.join(', ')}`);
      }
    }

    return validation;
  }

  private findDependentComponents(entityId: number, componentId: string): string[] {
    const currentComponents = this.getEntityComponents(entityId);
    const dependentComponents: string[] = [];

    for (const currentComponentId of currentComponents) {
      const descriptor = componentRegistry.getComponent(currentComponentId);
      if (descriptor?.dependencies?.includes(componentId)) {
        dependentComponents.push(currentComponentId);
      }
    }

    return dependentComponents;
  }

  getComponentData(entityId: number, componentId: string): any {
    const descriptor = componentRegistry.getComponent(componentId);
    if (!descriptor || !this.hasComponent(entityId, componentId)) {
      return undefined;
    }

    return descriptor.serialize(entityId);
  }

  setComponentData(entityId: number, componentId: string, data: any): IValidationResult {
    const descriptor = componentRegistry.getComponent(componentId);
    if (!descriptor) {
      return {
        valid: false,
        errors: [`Component '${componentId}' not found`],
        warnings: [],
      };
    }

    if (!this.hasComponent(entityId, componentId)) {
      return {
        valid: false,
        errors: [`Entity ${entityId} does not have component '${componentId}'`],
        warnings: [],
      };
    }

    try {
      const validatedData = descriptor.schema.parse(data);
      descriptor.deserialize(entityId, validatedData);

      // Emit event
      const event: IComponentChangeEvent = {
        entityId,
        componentId,
        action: 'add', // Use 'add' to indicate data change
        data: validatedData,
        timestamp: Date.now(),
      };
      componentRegistry.emitEvent(event);

      incrementWorldVersion();

      return {
        valid: true,
        errors: [],
        warnings: [],
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Invalid data for component '${componentId}': ${error}`],
        warnings: [],
      };
    }
  }

  private async handleEditorStoreComponent(
    entityId: number,
    componentId: string,
    data?: any,
  ): Promise<void> {
    // Import the editor store dynamically to avoid circular dependencies
    const { useEditorStore } = await import('../../editor/store/editorStore');

    switch (componentId) {
      case 'rigidBody': {
        const defaultRigidBody = {
          enabled: true,
          bodyType: 'dynamic' as const,
          mass: 1,
          gravityScale: 1,
          canSleep: true,
          linearDamping: 0.01,
          angularDamping: 0.01,
          initialVelocity: [0, 0, 0] as [number, number, number],
          initialAngularVelocity: [0, 0, 0] as [number, number, number],
          material: {
            friction: 0.6,
            restitution: 0.3,
            density: 1,
          },
        };
        const rigidBodyData = { ...defaultRigidBody, ...data };
        useEditorStore.getState().setEntityRigidBody(entityId, rigidBodyData);
        break;
      }

      case 'meshCollider': {
        const defaultMeshCollider = {
          enabled: true,
          colliderType: 'box' as const,
          isTrigger: false,
          center: [0, 0, 0] as [number, number, number],
          size: {
            width: 1,
            height: 1,
            depth: 1,
            radius: 0.5,
            capsuleRadius: 0.5,
            capsuleHeight: 2,
          },
          physicsMaterial: {
            friction: 0.6,
            restitution: 0.3,
            density: 1,
          },
        };
        const meshColliderData = { ...defaultMeshCollider, ...data };
        useEditorStore.getState().setEntityMeshCollider(entityId, meshColliderData);
        break;
      }

      case 'meshRenderer': {
        const defaultMeshRenderer = {
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          material: {
            color: '#ffffff',
            metalness: 0,
            roughness: 0.5,
            emissive: '#000000',
            emissiveIntensity: 0,
          },
        };
        const meshRendererData = { ...defaultMeshRenderer, ...data };
        useEditorStore.getState().setEntityMeshRenderer(entityId, meshRendererData);
        break;
      }

      default:
        console.warn(`Unknown editor store component: ${componentId}`);
    }
  }
}

// Export singleton instance
export const dynamicComponentManager = DynamicComponentManager.getInstance();
