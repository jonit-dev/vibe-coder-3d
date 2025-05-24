/**
 * Handles integration with the editor store for components that aren't managed by bitECS
 */
export class EditorStoreIntegration {
  private static getEditorStore() {
    try {
      const globalThis = window as any;
      return globalThis.__editorStore;
    } catch (error) {
      console.warn('Failed to access editor store:', error);
      return null;
    }
  }

  static async handleComponent(
    entityId: number,
    componentId: string,
    operation: 'add' | 'remove',
    data?: any,
  ): Promise<void> {
    const editorStore = this.getEditorStore();
    if (!editorStore) {
      throw new Error('Editor store not available');
    }

    switch (componentId) {
      case 'rigidBody':
        await this.handleRigidBody(editorStore, entityId, operation, data);
        break;
      case 'meshCollider':
        await this.handleMeshCollider(editorStore, entityId, operation, data);
        break;
      case 'meshRenderer':
        await this.handleMeshRenderer(editorStore, entityId, operation, data);
        break;
      default:
        throw new Error(`Unknown editor store component: ${componentId}`);
    }
  }

  private static async handleRigidBody(
    editorStore: any,
    entityId: number,
    operation: 'add' | 'remove',
    data?: any,
  ): Promise<void> {
    const { setEntityRigidBody } = editorStore.getState();

    if (operation === 'add') {
      const rigidBodyData = {
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
        ...data,
      };
      setEntityRigidBody(entityId, rigidBodyData);
    } else {
      setEntityRigidBody(entityId, null);
    }
  }

  private static async handleMeshCollider(
    editorStore: any,
    entityId: number,
    operation: 'add' | 'remove',
    data?: any,
  ): Promise<void> {
    const { setEntityMeshCollider } = editorStore.getState();

    if (operation === 'add') {
      const meshColliderData = {
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
        ...data,
      };
      setEntityMeshCollider(entityId, meshColliderData);
    } else {
      setEntityMeshCollider(entityId, null);
    }
  }

  private static async handleMeshRenderer(
    editorStore: any,
    entityId: number,
    operation: 'add' | 'remove',
    data?: any,
  ): Promise<void> {
    const { setEntityMeshRenderer } = editorStore.getState();

    if (operation === 'add') {
      const meshRendererData = {
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
        ...data,
      };
      setEntityMeshRenderer(entityId, meshRendererData);
    } else {
      setEntityMeshRenderer(entityId, null);
    }
  }
}
