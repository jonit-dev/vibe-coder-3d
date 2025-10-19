import { Box3, BufferGeometry, Camera, Frustum, Matrix4, Mesh, Scene } from 'three';
import {
  computeBoundsTree,
  disposeBoundsTree,
  acceleratedRaycast,
  MeshBVH,
  CENTER,
  AVERAGE,
  SAH,
  type SplitStrategy,
} from 'three-mesh-bvh';
import { Logger } from '@core/lib/logger';

const logger = Logger.create('BVHManager');

// Extend Three.js Mesh to support BVH

declare module 'three' {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface BufferGeometry {
    boundsTree?: MeshBVH;
    computeBoundsTree: typeof computeBoundsTree;
    disposeBoundsTree: typeof disposeBoundsTree;
  }
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface Mesh {
    raycast: typeof acceleratedRaycast;
  }
}

export interface IBVHManagerConfig {
  enableFrustumCulling?: boolean;
  enableRaycastAcceleration?: boolean;
  updateInterval?: number; // milliseconds between BVH updates
  maxLeafTris?: number; // Maximum triangles per BVH leaf node
  strategy?: 'CENTER' | 'SAH' | 'AVERAGE'; // BVH construction strategy
}

export interface ICullingStats {
  totalObjects: number;
  culledObjects: number;
  visibleObjects: number;
  cullingRatio: number;
}

/**
 * BVHManager - Manages Bounding Volume Hierarchy for scene optimization
 *
 * Features:
 * - Accelerated raycasting using BVH
 * - Frustum culling optimization
 * - Automatic BVH updates for dynamic scenes
 * - Performance monitoring
 */
export class BVHManager {
  private config: Required<IBVHManagerConfig>;
  private meshes: Map<string, Mesh> = new Map();
  private lastUpdateTime: number = 0;
  private cullingStats: ICullingStats = {
    totalObjects: 0,
    culledObjects: 0,
    visibleObjects: 0,
    cullingRatio: 0,
  };

  // Cached frustum and matrix for culling
  private frustum = new Frustum();
  private projScreenMatrix = new Matrix4();

  constructor(config: IBVHManagerConfig = {}) {
    this.config = {
      enableFrustumCulling: config.enableFrustumCulling ?? true,
      enableRaycastAcceleration: config.enableRaycastAcceleration ?? true,
      updateInterval: config.updateInterval ?? 1000, // Update every second by default
      maxLeafTris: config.maxLeafTris ?? 10,
      strategy: config.strategy ?? 'SAH', // Spatial Adaptive Hierarchy - best for most scenes
    };

    // Apply BVH extensions to Three.js prototypes
    this.initializeBVHExtensions();
  }

  /**
   * Get the SplitStrategy constant from string config
   */
  private getStrategy(): SplitStrategy {
    switch (this.config.strategy) {
      case 'CENTER':
        return CENTER;
      case 'AVERAGE':
        return AVERAGE;
      case 'SAH':
        return SAH;
      default:
        return SAH;
    }
  }

  /**
   * Initialize Three.js prototype extensions for BVH
   */
  private initializeBVHExtensions(): void {
    try {
      // Apply BVH methods to BufferGeometry prototype
      BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
      BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;

      // Apply accelerated raycast to Mesh (only if raycasting is enabled)
      if (this.config.enableRaycastAcceleration) {
        Mesh.prototype.raycast = acceleratedRaycast;
      }
    } catch (error) {
      logger.error('Failed to initialize BVH extensions', { error });
    }
  }

  /**
   * Register a mesh for BVH optimization
   */
  public registerMesh(mesh: Mesh, id?: string): void {
    const meshId = id || mesh.uuid;

    try {
      if (!mesh || !mesh.geometry) {
        logger.warn('Cannot register mesh without geometry', { mesh });
        return;
      }

      // Skip if geometry has no vertices
      if (!mesh.geometry.attributes.position || mesh.geometry.attributes.position.count === 0) {
        return;
      }

      // Skip if already registered
      if (this.meshes.has(meshId)) {
        return;
      }

      // Build BVH for the mesh geometry (only if not already present)
      if (!mesh.geometry.boundsTree) {
        mesh.geometry.computeBoundsTree({
          maxLeafTris: this.config.maxLeafTris,
          strategy: this.getStrategy(),
        });

        logger.debug('BVH computed for mesh', {
          meshId,
          vertices: mesh.geometry.attributes.position?.count || 0,
        });
      }

      this.meshes.set(meshId, mesh);
    } catch (error) {
      logger.error('Failed to register mesh with BVH', { error, meshId });
    }
  }

  /**
   * Unregister a mesh and dispose its BVH
   */
  public unregisterMesh(id: string): void {
    const mesh = this.meshes.get(id);
    if (mesh && mesh.geometry.boundsTree) {
      mesh.geometry.disposeBoundsTree();
      logger.debug('BVH disposed for mesh', { meshId: id });
    }
    this.meshes.delete(id);
  }

  /**
   * Update BVH for all registered meshes that need it
   */
  public update(): void {
    const now = performance.now();

    // Check if enough time has passed since last update
    if (now - this.lastUpdateTime < this.config.updateInterval) {
      return;
    }

    this.lastUpdateTime = now;

    let updatedCount = 0;

    // Update BVH for meshes that have changed
    for (const mesh of this.meshes.values()) {
      if (!mesh.geometry) continue;

      // Check if geometry needs BVH rebuild
      // This would typically happen if the geometry has been modified
      const positionAttr = mesh.geometry.attributes.position;
      if (positionAttr && 'version' in positionAttr) {
        const shouldRebuild = !mesh.geometry.boundsTree;

        if (shouldRebuild) {
          mesh.geometry.computeBoundsTree({
            maxLeafTris: this.config.maxLeafTris,
            strategy: this.getStrategy(),
          });
          updatedCount++;
        }
      }
    }

    if (updatedCount > 0) {
      logger.debug('BVH updated', {
        meshesUpdated: updatedCount,
        totalMeshes: this.meshes.size,
      });
    }
  }

  /**
   * Perform frustum culling on a scene using BVH acceleration
   */
  public performFrustumCulling(scene: Scene, camera: Camera): ICullingStats {
    if (!this.config.enableFrustumCulling) {
      return this.cullingStats;
    }

    // Update frustum from camera
    this.projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.projScreenMatrix);

    let totalObjects = 0;
    let culledObjects = 0;

    // Traverse scene and cull objects
    scene.traverse((object) => {
      // Only process visible mesh objects
      if (!(object as Mesh).isMesh || !object.visible) {
        return;
      }

      totalObjects++;

      const mesh = object as Mesh;

      // Use BVH bounds if available, otherwise fall back to bounding box/sphere
      if (mesh.geometry.boundsTree) {
        // Get BVH root bounds
        const bounds = mesh.geometry.boundsTree.getBoundingBox(new Box3());
        bounds.applyMatrix4(mesh.matrixWorld);

        // Check if bounds intersect frustum
        // Use layers instead of visible to preserve physics simulation
        if (!this.frustum.intersectsBox(bounds)) {
          mesh.layers.disable(0); // Hide from camera layer 0 (rendering only)
          culledObjects++;
          return;
        } else {
          mesh.layers.enable(0); // Show in camera layer 0
        }
      } else {
        // Fallback to standard bounding sphere check
        if (mesh.geometry.boundingSphere) {
          const sphere = mesh.geometry.boundingSphere.clone();
          sphere.applyMatrix4(mesh.matrixWorld);

          if (!this.frustum.intersectsSphere(sphere)) {
            mesh.layers.disable(0); // Hide from camera layer 0 (rendering only)
            culledObjects++;
            return;
          } else {
            mesh.layers.enable(0); // Show in camera layer 0
          }
        }
      }

      // Object is visible - ensure it's on layer 0
      mesh.layers.enable(0);
    });

    // Update statistics
    this.cullingStats = {
      totalObjects,
      culledObjects,
      visibleObjects: totalObjects - culledObjects,
      cullingRatio: totalObjects > 0 ? culledObjects / totalObjects : 0,
    };

    return this.cullingStats;
  }

  /**
   * Get culling statistics
   */
  public getStats(): ICullingStats {
    return { ...this.cullingStats };
  }

  /**
   * Process entire scene to register all meshes
   */
  public processScene(scene: Scene): void {
    try {
      let meshCount = 0;
      const meshes: Mesh[] = [];

      // Collect all meshes first
      scene.traverse((object) => {
        if ((object as Mesh).isMesh) {
          meshes.push(object as Mesh);
        }
      });

      // Process meshes in batches to avoid blocking
      let processedCount = 0;
      const totalMeshes = meshes.length;

      for (let i = 0; i < meshes.length; i++) {
        this.registerMesh(meshes[i]);
        processedCount++;
        meshCount++;

        // Log progress for large scenes
        if (totalMeshes > 100 && processedCount % 50 === 0) {
          logger.debug('BVH processing progress', {
            processed: processedCount,
            total: totalMeshes,
            percent: Math.round((processedCount / totalMeshes) * 100),
          });
        }
      }

      logger.info('Scene processed for BVH', {
        meshCount,
        totalRegistered: this.meshes.size,
      });
    } catch (error) {
      logger.error('Failed to process scene for BVH', { error });
    }
  }

  /**
   * Rebuild BVH for all registered meshes
   */
  public rebuildAll(): void {
    logger.info('Rebuilding all BVH structures', {
      meshCount: this.meshes.size,
    });

    for (const mesh of this.meshes.values()) {
      if (mesh.geometry.boundsTree) {
        mesh.geometry.disposeBoundsTree();
      }

      mesh.geometry.computeBoundsTree({
        maxLeafTris: this.config.maxLeafTris,
        strategy: this.getStrategy(),
      });
    }

    logger.info('BVH rebuild complete');
  }

  /**
   * Dispose all BVH structures and clean up
   */
  public dispose(): void {
    for (const mesh of this.meshes.values()) {
      if (mesh.geometry.boundsTree) {
        mesh.geometry.disposeBoundsTree();
      }
    }

    this.meshes.clear();
  }

  /**
   * Get current configuration
   */
  public getConfig(): Readonly<Required<IBVHManagerConfig>> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<IBVHManagerConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };

    logger.info('BVHManager configuration updated', { config: this.config });
  }
}

// Export a singleton instance for convenience
let bvhManagerInstance: BVHManager | null = null;

export const getBVHManager = (config?: IBVHManagerConfig): BVHManager => {
  if (!bvhManagerInstance) {
    bvhManagerInstance = new BVHManager(config);
  }
  return bvhManagerInstance;
};

export const disposeBVHManager = (): void => {
  if (bvhManagerInstance) {
    bvhManagerInstance.dispose();
    bvhManagerInstance = null;
  }
};
