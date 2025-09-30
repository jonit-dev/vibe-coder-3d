import { defineQuery } from 'bitecs';
import { Mesh, MeshBasicMaterial, MeshStandardMaterial } from 'three';

import { componentRegistry } from '../lib/ecs/ComponentRegistry';
import { ECSWorld } from '../lib/ecs/World';
import { MaterialRegistry } from '../materials/MaterialRegistry';
import { applyOverrides } from '../materials/MaterialOverrides';

import { updateThreeMaterialFrom } from '../materials/MaterialConverter';
import type { IMaterialDefinition } from '../materials/Material.types';
import type { MeshRendererData } from '../lib/ecs/components/definitions/MeshRendererComponent';

// Get world instance
const world = ECSWorld.getInstance().getWorld();

// Lazy-initialize the query to avoid module-load timing issues
let materialQuery: ReturnType<typeof defineQuery> | null = null;

// Initialize the query when needed
function getMaterialQuery() {
  if (!materialQuery) {
    const meshRendererComponent = componentRegistry.getBitECSComponent('MeshRenderer');
    if (!meshRendererComponent) {
      console.warn('[MaterialSystem] MeshRenderer component not yet registered, skipping update');
      return null;
    }
    materialQuery = defineQuery([meshRendererComponent]);
  }
  return materialQuery;
}

// Entity to Three.js object mapping (simplified for now)
const entityToObject = new Map<number, Mesh>();

/**
 * Material System - Updates Three.js materials from ECS MeshRenderer components
 * Only updates materials that are marked with needsUpdate flag for performance
 */
export class MaterialSystem {
  private lastUpdateCount = 0;
  private updateThrottleMs = 16; // ~60fps throttle
  private lastUpdateTime = 0;
  private materialRegistry: MaterialRegistry;

  constructor(materialRegistry?: MaterialRegistry) {
    // Support both DI and backward compatibility
    this.materialRegistry = materialRegistry || MaterialRegistry.getInstance();
  }

  /**
   * Update all materials that need updating
   * Returns the number of materials updated
   */
  update(): number {
    const now = performance.now();

    // Throttle updates to prevent excessive material changes
    if (now - this.lastUpdateTime < this.updateThrottleMs) {
      return 0;
    }

    // Get the query (lazy-initialized)
    const query = getMaterialQuery();
    if (!query) {
      return 0; // MeshRenderer component not yet registered
    }

    const entities = query(world);
    let updatedCount = 0;

    entities.forEach((eid: number) => {
      // Get mesh renderer data using the new component registry
      const meshRendererData = componentRegistry.getComponentData(
        eid,
        'MeshRenderer',
      ) as MeshRendererData;
      if (!meshRendererData || !meshRendererData.materialId) return;

      // Get the Three.js object
      const object = entityToObject.get(eid);
      if (!object) return;

      const mesh = object as Mesh;
      if (!mesh.material) return;

      // Handle multi-material support (materials array for submeshes)
      if (meshRendererData.materials && Array.isArray(meshRendererData.materials)) {
        // Multi-material mode: apply materials array to mesh
        const materials = meshRendererData.materials
          .map((matId) => this.materialRegistry.get(matId))
          .filter(Boolean) as IMaterialDefinition[];

        if (materials.length > 0) {
          if (Array.isArray(mesh.material)) {
            // Mesh already has material array - update each material
            const materialArray = mesh.material as Array<MeshStandardMaterial | MeshBasicMaterial>;
            materials.forEach((matDef, index) => {
              if (materialArray[index]) {
                this.applyMaterialProperties(materialArray[index], matDef);
              }
            });
          } else {
            // Single material - just apply the first one from the array
            const finalMaterial = meshRendererData.material
              ? this.applyOverrides(materials[0], meshRendererData.material)
              : materials[0];
            this.applyMaterialProperties(
              mesh.material as MeshStandardMaterial | MeshBasicMaterial,
              finalMaterial,
            );
          }
          updatedCount++;
        }
      } else {
        // Single material mode: use materialId
        const baseMaterial = this.materialRegistry.get(meshRendererData.materialId);
        if (!baseMaterial) return;

        // Apply mesh renderer overrides if they exist
        const finalMaterial = meshRendererData.material
          ? this.applyOverrides(baseMaterial, meshRendererData.material)
          : baseMaterial;

        // Apply material properties to Three.js material
        if (Array.isArray(mesh.material)) {
          // Apply same material to all submeshes
          mesh.material.forEach((mat) => {
            this.applyMaterialProperties(
              mat as MeshStandardMaterial | MeshBasicMaterial,
              finalMaterial,
            );
          });
        } else {
          this.applyMaterialProperties(
            mesh.material as MeshStandardMaterial | MeshBasicMaterial,
            finalMaterial,
          );
        }

        updatedCount++;
      }
    });

    this.lastUpdateCount = updatedCount;
    this.lastUpdateTime = now;
    return updatedCount;
  }

  /**
   * Force immediate update without throttling
   */
  forceUpdate(): number {
    this.lastUpdateTime = 0;
    return this.update();
  }

  /**
   * Set the throttle interval in milliseconds
   */
  setThrottleMs(ms: number): void {
    this.updateThrottleMs = ms;
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    // Get the query (lazy-initialized)
    const query = getMaterialQuery();
    const totalEntities = query ? query(world).length : 0;

    return {
      lastUpdateCount: this.lastUpdateCount,
      totalEntities,
      throttleMs: this.updateThrottleMs,
      lastUpdateTime: this.lastUpdateTime,
    };
  }

  /**
   * Register an entity-to-object mapping for material synchronization
   */
  registerEntityObject(entityId: number, object: Mesh): void {
    entityToObject.set(entityId, object);
  }

  /**
   * Unregister an entity-to-object mapping
   */
  private applyOverrides(
    baseMaterial: IMaterialDefinition,
    overrides: Partial<IMaterialDefinition>,
  ): IMaterialDefinition {
    return applyOverrides(baseMaterial, overrides);
  }

  private applyMaterialProperties(
    material: MeshStandardMaterial | MeshBasicMaterial,
    def: IMaterialDefinition,
  ): void {
    // Update basic properties
    updateThreeMaterialFrom(material, def);

    // Update texture transforms if textures exist
    if (material.map) {
      material.map.offset.set(def.textureOffsetX || 0, def.textureOffsetY || 0);
      material.map.repeat.set(def.textureRepeatX || 1, def.textureRepeatY || 1);
    }
    if ('normalMap' in material && material.normalMap) {
      material.normalMap.offset.set(def.textureOffsetX || 0, def.textureOffsetY || 0);
      material.normalMap.repeat.set(def.textureRepeatX || 1, def.textureRepeatY || 1);
    }
    if ('metalnessMap' in material && material.metalnessMap) {
      material.metalnessMap.offset.set(def.textureOffsetX || 0, def.textureOffsetY || 0);
      material.metalnessMap.repeat.set(def.textureRepeatX || 1, def.textureRepeatY || 1);
    }
    if ('roughnessMap' in material && material.roughnessMap) {
      material.roughnessMap.offset.set(def.textureOffsetX || 0, def.textureOffsetY || 0);
      material.roughnessMap.repeat.set(def.textureRepeatX || 1, def.textureRepeatY || 1);
    }
    if ('emissiveMap' in material && material.emissiveMap) {
      material.emissiveMap.offset.set(def.textureOffsetX || 0, def.textureOffsetY || 0);
      material.emissiveMap.repeat.set(def.textureRepeatX || 1, def.textureRepeatY || 1);
    }
    if ('aoMap' in material && material.aoMap) {
      material.aoMap.offset.set(def.textureOffsetX || 0, def.textureOffsetY || 0);
      material.aoMap.repeat.set(def.textureRepeatX || 1, def.textureRepeatY || 1);
    }

    // Trigger update
    material.needsUpdate = true;
    if (material.map) material.map.needsUpdate = true;
    if ('normalMap' in material && material.normalMap) material.normalMap.needsUpdate = true;
    if ('metalnessMap' in material && material.metalnessMap)
      material.metalnessMap.needsUpdate = true;
    if ('roughnessMap' in material && material.roughnessMap)
      material.roughnessMap.needsUpdate = true;
    if ('emissiveMap' in material && material.emissiveMap) material.emissiveMap.needsUpdate = true;
    if ('aoMap' in material && material.aoMap) material.aoMap.needsUpdate = true;
  }

  /**
   * Unregister an entity-to-object mapping
   */
  unregisterEntityObject(entityId: number): void {
    entityToObject.delete(entityId);
  }
}

// Export singleton instance
export const materialSystem = new MaterialSystem();
