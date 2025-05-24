/**
 * Component handler for EditorStore components
 */

import type { IComponentHandler } from '../types/core';
import { ComponentError, ErrorLogger } from '../utils/errors';

interface IEditorStore {
  getState(): {
    setEntityRigidBody: (entityId: number, data: any) => void;
    setEntityMeshCollider: (entityId: number, data: any) => void;
    setEntityMeshRenderer: (entityId: number, data: any) => void;
  };
}

export class EditorStoreHandler implements IComponentHandler {
  private entityComponents = new Map<number, Set<string>>();

  constructor(
    private componentId: string,
    private getEditorStore: () => IEditorStore | null,
  ) {}

  async add(entityId: number, data?: any): Promise<void> {
    const editorStore = this.getEditorStore();
    if (!editorStore) {
      throw new ComponentError('Editor store not available', this.componentId, entityId, 'add');
    }

    try {
      const componentData = this.createDefaultData(data);

      switch (this.componentId) {
        case 'rigidBody':
          editorStore.getState().setEntityRigidBody(entityId, componentData);
          break;
        case 'meshCollider':
          editorStore.getState().setEntityMeshCollider(entityId, componentData);
          break;
        case 'meshRenderer':
          editorStore.getState().setEntityMeshRenderer(entityId, componentData);
          break;
        default:
          throw new ComponentError(
            `Unknown editor store component: ${this.componentId}`,
            this.componentId,
            entityId,
            'add',
          );
      }

      // Track component
      if (!this.entityComponents.has(entityId)) {
        this.entityComponents.set(entityId, new Set());
      }
      this.entityComponents.get(entityId)!.add(this.componentId);

      ErrorLogger.debug(
        `Added editor store component '${this.componentId}' to entity ${entityId}`,
        {
          componentId: this.componentId,
          entityId,
          operation: 'add',
        },
      );
    } catch (error) {
      ErrorLogger.error(
        `Failed to add editor store component '${this.componentId}' to entity ${entityId}`,
        {
          componentId: this.componentId,
          entityId,
          operation: 'add',
          additionalData: { error: String(error) },
        },
      );
      throw error;
    }
  }

  async remove(entityId: number): Promise<void> {
    const editorStore = this.getEditorStore();
    if (!editorStore) {
      throw new ComponentError('Editor store not available', this.componentId, entityId, 'remove');
    }

    try {
      switch (this.componentId) {
        case 'rigidBody':
          editorStore.getState().setEntityRigidBody(entityId, null);
          break;
        case 'meshCollider':
          editorStore.getState().setEntityMeshCollider(entityId, null);
          break;
        case 'meshRenderer':
          editorStore.getState().setEntityMeshRenderer(entityId, null);
          break;
        default:
          throw new ComponentError(
            `Unknown editor store component: ${this.componentId}`,
            this.componentId,
            entityId,
            'remove',
          );
      }

      // Untrack component
      const entityComponentSet = this.entityComponents.get(entityId);
      if (entityComponentSet) {
        entityComponentSet.delete(this.componentId);
        if (entityComponentSet.size === 0) {
          this.entityComponents.delete(entityId);
        }
      }

      ErrorLogger.debug(
        `Removed editor store component '${this.componentId}' from entity ${entityId}`,
        {
          componentId: this.componentId,
          entityId,
          operation: 'remove',
        },
      );
    } catch (error) {
      ErrorLogger.error(
        `Failed to remove editor store component '${this.componentId}' from entity ${entityId}`,
        {
          componentId: this.componentId,
          entityId,
          operation: 'remove',
          additionalData: { error: String(error) },
        },
      );
      throw error;
    }
  }

  async update(entityId: number, data: any): Promise<void> {
    // For editor store components, update is the same as add with new data
    await this.add(entityId, data);
  }

  has(entityId: number): boolean {
    return this.entityComponents.get(entityId)?.has(this.componentId) ?? false;
  }

  getData(entityId: number): any {
    // Editor store components don't provide direct data access
    // This would need to be implemented based on the specific editor store API
    if (!this.has(entityId)) {
      return null;
    }

    // Return a placeholder object - in a real implementation, this would
    // query the editor store for the current component data
    return {};
  }

  private createDefaultData(data?: any): any {
    const baseData = data || {};

    switch (this.componentId) {
      case 'rigidBody':
        return {
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
          ...baseData,
        };

      case 'meshCollider':
        return {
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
          ...baseData,
        };

      case 'meshRenderer':
        return {
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
          ...baseData,
        };

      default:
        return baseData;
    }
  }
}
