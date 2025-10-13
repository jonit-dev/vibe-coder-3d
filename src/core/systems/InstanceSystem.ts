/**
 * Instance System
 * Manages THREE.InstancedMesh objects for efficient rendering of repeated geometry
 */

import * as THREE from 'three';
import { Logger } from '@core/lib/logger';
import { componentRegistry } from '@core/lib/ecs/ComponentRegistry';
import type {
  InstancedComponentData,
  InstanceData,
} from '@core/lib/ecs/components/definitions/InstancedComponent';
import { InstanceBufferManager, InstanceBufferPool } from '@core/lib/instancing';
import type { EntityId } from '@core/lib/ecs/types';

const logger = Logger.create('InstanceSystem');

/**
 * System state for managing instanced meshes
 */
export interface IInstanceSystemState {
  enabled: boolean;
  scene: THREE.Scene | null;
  instancedMeshes: Map<EntityId, THREE.InstancedMesh>;
  bufferManagers: Map<EntityId, InstanceBufferManager>;
  geometryCache: Map<string, THREE.BufferGeometry>;
  materialCache: Map<string, THREE.Material>;
}

const state: IInstanceSystemState = {
  enabled: true,
  scene: null,
  instancedMeshes: new Map(),
  bufferManagers: new Map(),
  geometryCache: new Map(),
  materialCache: new Map(),
};

/**
 * Initialize the Instance system with scene reference
 */
export const initInstanceSystem = (scene: THREE.Scene): void => {
  state.scene = scene;
  logger.info('Instance System initialized');
};

/**
 * Update the Instance system
 * Should be called every frame from the game loop
 */
export const updateInstanceSystem = (): void => {
  if (!state.enabled || !state.scene) {
    return;
  }

  // Query all entities with Instanced component
  const entities = componentRegistry.getEntitiesWithComponent('Instanced');

  for (const entityId of entities) {
    const instancedComponent = componentRegistry.getComponent<InstancedComponentData>(
      entityId,
      'Instanced',
    );

    if (!instancedComponent || !instancedComponent.data.enabled) {
      // Remove instanced mesh if disabled
      removeInstancedMesh(entityId);
      continue;
    }

    // Create or update instanced mesh
    if (!state.instancedMeshes.has(entityId)) {
      createInstancedMesh(entityId, instancedComponent.data);
    } else {
      updateInstancedMesh(entityId, instancedComponent.data);
    }
  }

  // Clean up meshes for removed entities
  const entitiesToRemove: EntityId[] = [];
  for (const entityId of state.instancedMeshes.keys()) {
    if (!entities.includes(entityId)) {
      entitiesToRemove.push(entityId);
    }
  }
  entitiesToRemove.forEach((eid) => removeInstancedMesh(eid));
};

/**
 * Create a new instanced mesh for an entity
 */
function createInstancedMesh(entityId: EntityId, data: InstancedComponentData): void {
  if (!state.scene) return;

  // Get or create geometry and material
  const geometry = getGeometry(data.baseMeshId);
  const material = getMaterial(data.baseMaterialId);

  if (!geometry || !material) {
    logger.warn('Failed to create instanced mesh - missing geometry or material', {
      entityId,
      baseMeshId: data.baseMeshId,
      baseMaterialId: data.baseMaterialId,
    });
    return;
  }

  // Create instanced mesh
  const instancedMesh = new THREE.InstancedMesh(geometry, material, data.capacity);
  instancedMesh.castShadow = data.castShadows;
  instancedMesh.receiveShadow = data.receiveShadows;
  instancedMesh.frustumCulled = data.frustumCulled;
  instancedMesh.count = data.instances.length;

  // Create buffer manager
  const bufferManager = InstanceBufferPool.acquire(data.capacity);
  bufferManager.updateFromData(data.instances);

  // Apply matrices to instanced mesh
  const matrices = bufferManager.getMatrices();
  for (let i = 0; i < data.capacity; i++) {
    instancedMesh.setMatrixAt(i, matrices[i]);
  }

  // Apply colors if available
  const colors = bufferManager.getColors();
  const hasColors = data.instances.some((inst) => inst.color !== undefined);
  if (hasColors) {
    instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(data.capacity * 3),
      3,
    );
    for (let i = 0; i < data.capacity; i++) {
      instancedMesh.setColorAt(i, colors[i]);
    }
  }

  instancedMesh.instanceMatrix.needsUpdate = true;
  if (instancedMesh.instanceColor) {
    instancedMesh.instanceColor.needsUpdate = true;
  }

  // Add to scene and cache
  state.scene.add(instancedMesh);
  state.instancedMeshes.set(entityId, instancedMesh);
  state.bufferManagers.set(entityId, bufferManager);

  logger.debug('Created instanced mesh', {
    entityId,
    capacity: data.capacity,
    instanceCount: data.instances.length,
  });
}

/**
 * Update an existing instanced mesh
 */
function updateInstancedMesh(entityId: EntityId, data: InstancedComponentData): void {
  const instancedMesh = state.instancedMeshes.get(entityId);
  const bufferManager = state.bufferManagers.get(entityId);

  if (!instancedMesh || !bufferManager) return;

  // Update count
  instancedMesh.count = data.instances.length;

  // Update buffers if dirty
  bufferManager.updateFromData(data.instances);

  if (bufferManager.isDirty()) {
    const matrices = bufferManager.getMatrices();
    for (let i = 0; i < data.capacity; i++) {
      instancedMesh.setMatrixAt(i, matrices[i]);
    }

    const colors = bufferManager.getColors();
    const hasColors = data.instances.some((inst) => inst.color !== undefined);
    if (hasColors) {
      if (!instancedMesh.instanceColor) {
        instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(
          new Float32Array(data.capacity * 3),
          3,
        );
      }
      for (let i = 0; i < data.capacity; i++) {
        instancedMesh.setColorAt(i, colors[i]);
      }
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }

    bufferManager.markClean();
  }

  // Update shadow properties
  instancedMesh.castShadow = data.castShadows;
  instancedMesh.receiveShadow = data.receiveShadows;
  instancedMesh.frustumCulled = data.frustumCulled;
}

/**
 * Remove an instanced mesh from the scene
 */
function removeInstancedMesh(entityId: EntityId): void {
  const instancedMesh = state.instancedMeshes.get(entityId);
  const bufferManager = state.bufferManagers.get(entityId);

  if (instancedMesh && state.scene) {
    state.scene.remove(instancedMesh);
    instancedMesh.geometry.dispose();
    if (instancedMesh.material instanceof THREE.Material) {
      instancedMesh.material.dispose();
    }
  }

  if (bufferManager) {
    InstanceBufferPool.release(bufferManager);
  }

  state.instancedMeshes.delete(entityId);
  state.bufferManagers.delete(entityId);
}

/**
 * Get or create geometry from cache
 */
function getGeometry(meshId: string): THREE.BufferGeometry | null {
  if (state.geometryCache.has(meshId)) {
    return state.geometryCache.get(meshId)!;
  }

  // Create basic geometries based on meshId
  let geometry: THREE.BufferGeometry | null = null;

  switch (meshId) {
    case 'cube':
    case 'box':
      geometry = new THREE.BoxGeometry(1, 1, 1);
      break;
    case 'sphere':
      geometry = new THREE.SphereGeometry(0.5, 32, 32);
      break;
    case 'cylinder':
      geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
      break;
    case 'plane':
      geometry = new THREE.PlaneGeometry(1, 1);
      break;
    case 'cone':
      geometry = new THREE.ConeGeometry(0.5, 1, 32);
      break;
    default:
      logger.warn('Unknown mesh ID for instancing', { meshId });
      return null;
  }

  if (geometry) {
    state.geometryCache.set(meshId, geometry);
  }

  return geometry;
}

/**
 * Get or create material from cache
 */
function getMaterial(materialId: string): THREE.Material | null {
  if (state.materialCache.has(materialId)) {
    return state.materialCache.get(materialId)!;
  }

  // Create a basic material (in a real implementation, this would use MaterialRegistry)
  const material = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    metalness: 0,
    roughness: 0.7,
  });

  state.materialCache.set(materialId, material);
  return material;
}

/**
 * Enable or disable the Instance system
 */
export const setInstanceSystemEnabled = (enabled: boolean): void => {
  state.enabled = enabled;
  logger.info(`Instance System ${enabled ? 'enabled' : 'disabled'}`);
};

/**
 * Get current Instance system state
 */
export const getInstanceSystemState = (): Readonly<IInstanceSystemState> => {
  return {
    ...state,
    instancedMeshes: new Map(state.instancedMeshes),
    bufferManagers: new Map(state.bufferManagers),
  };
};

/**
 * API for programmatically managing instances
 */
export interface IInstanceSystemApi {
  /**
   * Add a new instance to an entity's instanced mesh
   */
  addInstance(
    entityId: EntityId,
    instance: InstanceData,
  ): { success: boolean; index?: number; error?: string };

  /**
   * Update an instance's transform
   */
  updateInstance(
    entityId: EntityId,
    index: number,
    data: Partial<InstanceData>,
  ): { success: boolean; error?: string };

  /**
   * Remove an instance by index
   */
  removeInstance(entityId: EntityId, index: number): { success: boolean; error?: string };

  /**
   * Get all instances for an entity
   */
  getInstances(entityId: EntityId): InstanceData[] | null;

  /**
   * Get instance count for an entity
   */
  getInstanceCount(entityId: EntityId): number;
}

/**
 * Exposed API for managing instances
 */
export const instanceSystemApi: IInstanceSystemApi = {
  addInstance(entityId, instance) {
    const component = componentRegistry.getComponent<InstancedComponentData>(entityId, 'Instanced');
    if (!component) {
      return { success: false, error: 'Entity does not have Instanced component' };
    }

    const data = component.data;
    if (data.instances.length >= data.capacity) {
      return { success: false, error: 'Instance capacity reached' };
    }

    data.instances.push(instance);
    componentRegistry.updateComponent(entityId, 'Instanced', data);

    return { success: true, index: data.instances.length - 1 };
  },

  updateInstance(entityId, index, newData) {
    const component = componentRegistry.getComponent<InstancedComponentData>(entityId, 'Instanced');
    if (!component) {
      return { success: false, error: 'Entity does not have Instanced component' };
    }

    const data = component.data;
    if (index < 0 || index >= data.instances.length) {
      return { success: false, error: 'Instance index out of bounds' };
    }

    data.instances[index] = { ...data.instances[index], ...newData };
    componentRegistry.updateComponent(entityId, 'Instanced', data);

    return { success: true };
  },

  removeInstance(entityId, index) {
    const component = componentRegistry.getComponent<InstancedComponentData>(entityId, 'Instanced');
    if (!component) {
      return { success: false, error: 'Entity does not have Instanced component' };
    }

    const data = component.data;
    if (index < 0 || index >= data.instances.length) {
      return { success: false, error: 'Instance index out of bounds' };
    }

    data.instances.splice(index, 1);
    componentRegistry.updateComponent(entityId, 'Instanced', data);

    return { success: true };
  },

  getInstances(entityId) {
    const component = componentRegistry.getComponent<InstancedComponentData>(entityId, 'Instanced');
    return component?.data.instances || null;
  },

  getInstanceCount(entityId) {
    const component = componentRegistry.getComponent<InstancedComponentData>(entityId, 'Instanced');
    return component?.data.instances.length || 0;
  },
};

/**
 * Cleanup function to dispose all resources
 */
export const cleanupInstanceSystem = (): void => {
  // Remove all instanced meshes
  for (const entityId of state.instancedMeshes.keys()) {
    removeInstancedMesh(entityId);
  }

  // Clear caches
  for (const geometry of state.geometryCache.values()) {
    geometry.dispose();
  }
  for (const material of state.materialCache.values()) {
    material.dispose();
  }

  state.geometryCache.clear();
  state.materialCache.clear();
  InstanceBufferPool.clear();

  logger.info('Instance System cleaned up');
};
