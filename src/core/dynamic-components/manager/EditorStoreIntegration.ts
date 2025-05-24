/**
 * Handles integration with the editor store for components that aren't managed by bitECS
 */
export class EditorStoreIntegration {
  // Queue for operations when editor store isn't available
  private static pendingOperations: Array<{
    entityId: number;
    componentId: string;
    operation: 'add' | 'remove';
    data?: any;
    resolve: (value: void) => void;
    reject: (error: Error) => void;
  }> = [];

  private static isProcessingQueue = false;

  private static getEditorStore() {
    try {
      const globalThis = window as any;
      const editorStore = globalThis.__editorStore;
      if (!editorStore) {
        console.warn('[EditorStoreIntegration] Editor store not available on global object');
        return null;
      }
      return editorStore;
    } catch (error) {
      console.warn('[EditorStoreIntegration] Failed to access editor store:', error);
      return null;
    }
  }

  private static async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.pendingOperations.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    console.log(
      `[EditorStoreIntegration] Processing ${this.pendingOperations.length} pending operations`,
    );

    const operations = [...this.pendingOperations];
    this.pendingOperations = [];

    for (const op of operations) {
      try {
        await this.handleComponentInternal(op.entityId, op.componentId, op.operation, op.data);
        op.resolve();
      } catch (error) {
        op.reject(error as Error);
      }
    }

    this.isProcessingQueue = false;
  }

  static async handleComponent(
    entityId: number,
    componentId: string,
    operation: 'add' | 'remove',
    data?: any,
  ): Promise<void> {
    console.log(
      `[EditorStoreIntegration] Handling ${operation} of '${componentId}' for entity ${entityId}`,
    );

    const editorStore = this.getEditorStore();
    if (!editorStore) {
      console.warn(
        `[EditorStoreIntegration] Editor store not available, queueing ${operation} of '${componentId}' for entity ${entityId}`,
      );

      // Return a promise that will be resolved when the queue is processed
      return new Promise<void>((resolve, reject) => {
        this.pendingOperations.push({
          entityId,
          componentId,
          operation,
          data,
          resolve,
          reject,
        });

        // Try to process queue after a short delay
        setTimeout(() => this.processQueue(), 100);
      });
    }

    return this.handleComponentInternal(entityId, componentId, operation, data);
  }

  private static async handleComponentInternal(
    entityId: number,
    componentId: string,
    operation: 'add' | 'remove',
    data?: any,
  ): Promise<void> {
    const editorStore = this.getEditorStore();
    if (!editorStore) {
      const errorMsg = `Editor store not available when trying to ${operation} '${componentId}' for entity ${entityId}`;
      console.error(`[EditorStoreIntegration] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    try {
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
      console.log(
        `[EditorStoreIntegration] ✅ Successfully ${operation === 'add' ? 'added' : 'removed'} '${componentId}' for entity ${entityId}`,
      );
    } catch (error) {
      console.error(
        `[EditorStoreIntegration] ❌ Failed to ${operation} '${componentId}' for entity ${entityId}:`,
        error,
      );
      throw error;
    }
  }

  // Public method to manually trigger queue processing (can be called from editor initialization)
  static processPendingOperations(): Promise<void> {
    return this.processQueue();
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
      console.log(
        `[EditorStoreIntegration] Adding rigidBody to entity ${entityId} with data:`,
        rigidBodyData,
      );
      setEntityRigidBody(entityId, rigidBodyData);
    } else {
      console.log(`[EditorStoreIntegration] Removing rigidBody from entity ${entityId}`);
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
      console.log(
        `[EditorStoreIntegration] Adding meshCollider to entity ${entityId} with data:`,
        meshColliderData,
      );
      setEntityMeshCollider(entityId, meshColliderData);
    } else {
      console.log(`[EditorStoreIntegration] Removing meshCollider from entity ${entityId}`);
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
      console.log(
        `[EditorStoreIntegration] Adding meshRenderer to entity ${entityId} with data:`,
        meshRendererData,
      );
      setEntityMeshRenderer(entityId, meshRendererData);
    } else {
      console.log(`[EditorStoreIntegration] Removing meshRenderer from entity ${entityId}`);
      setEntityMeshRenderer(entityId, null);
    }
  }
}
