import { MeshBasicMaterial, MeshStandardMaterial } from 'three';
import { DEFAULT_MATERIAL_COLOR } from './constants';
import type { IMaterialAssetMeta, IMaterialDefinition } from './Material.types';
import { createThreeMaterialFrom, updateThreeMaterialFrom } from './MaterialConverter';

export class MaterialRegistry {
  private static instance: MaterialRegistry | null = null;

  /**
   * @deprecated Use dependency injection via Container instead
   * This method is kept for backward compatibility during migration
   */
  static getInstance(): MaterialRegistry {
    if (!this.instance) this.instance = new MaterialRegistry();
    return this.instance;
  }

  private idToDef = new Map<string, IMaterialDefinition>();
  private idToThree = new Map<string, MeshStandardMaterial | MeshBasicMaterial>();
  private assetPathToId = new Map<string, string>();

  constructor() {
    // Initialize with default material only
    this.initializeDefaults();
  }

  private initializeDefaults(): void {
    // Create default material
    const defaultMaterial: IMaterialDefinition = {
      id: 'default',
      name: 'Default Material',
      shader: 'standard',
      materialType: 'solid',
      color: DEFAULT_MATERIAL_COLOR,
      metalness: 0,
      roughness: 0.7,
      emissive: '#000000',
      emissiveIntensity: 0,
      normalScale: 1,
      occlusionStrength: 1,
      textureOffsetX: 0,
      textureOffsetY: 0,
      textureRepeatX: 1,
      textureRepeatY: 1,
    };

    this.upsert(defaultMaterial);
  }

  list(): IMaterialDefinition[] {
    return [...this.idToDef.values()];
  }

  get(id: string): IMaterialDefinition | undefined {
    return this.idToDef.get(id);
  }

  upsert(def: IMaterialDefinition): void {
    this.idToDef.set(def.id, def);
    this.idToThree.delete(def.id);

    // Update asset path mapping
    const assetPath = `/assets/materials/${def.id}.mat.json`;
    this.assetPathToId.set(assetPath, def.id);
  }

  remove(id: string): void {
    this.idToDef.delete(id);
    this.idToThree.delete(id);

    // Remove from asset path mapping
    const assetPath = `/assets/materials/${id}.mat.json`;
    this.assetPathToId.delete(assetPath);
  }

  getByAssetPath(path: string): IMaterialDefinition | undefined {
    const id = this.assetPathToId.get(path);
    return id ? this.get(id) : undefined;
  }

  async ensureThreeMaterial(id: string): Promise<MeshStandardMaterial | MeshBasicMaterial> {
    if (!this.idToThree.has(id)) {
      const def = this.get(id);
      if (!def) {
        throw new Error(`Material definition not found for id: ${id}`);
      }

      try {
        const material = createThreeMaterialFrom(def, {});
        this.idToThree.set(id, material);
      } catch (error) {
        console.error('Failed to create Three.js material:', error);
        throw error;
      }
    }

    const material = this.idToThree.get(id);
    if (!material) {
      throw new Error(`Three.js material not found for id: ${id}`);
    }
    return material;
  }

  // Synchronous version that returns existing material or creates a default one
  getThreeMaterial(id: string): MeshStandardMaterial | MeshBasicMaterial {
    const existing = this.idToThree.get(id);
    if (existing) {
      return existing;
    }

    // If material doesn't exist, create a basic default material immediately
    const def = this.get(id);
    if (!def) {
      // Create a basic gray material as fallback
      const fallback = new MeshStandardMaterial({
        color: parseInt(DEFAULT_MATERIAL_COLOR.replace('#', ''), 16),
      });
      this.idToThree.set(id, fallback);
      return fallback;
    }

    // Create material synchronously using the converter
    try {
      const material = createThreeMaterialFrom(def, {});
      this.idToThree.set(id, material);
      return material;
    } catch (error) {
      console.error('Failed to create Three.js material synchronously:', error);
      // Return a fallback material
      const fallback = new MeshStandardMaterial({
        color: parseInt(DEFAULT_MATERIAL_COLOR.replace('#', ''), 16),
      });
      this.idToThree.set(id, fallback);
      return fallback;
    }
  }

  async updateInstanceParams(id: string): Promise<void> {
    // If the material definition changed, we need to update any cached Three.js instances
    if (this.idToThree.has(id)) {
      const def = this.get(id);
      if (def) {
        try {
          const { updateThreeMaterialFrom } = await import('./MaterialConverter');
          const material = this.idToThree.get(id);
          if (material) {
            updateThreeMaterialFrom(material, def);
          }
        } catch (error) {
          console.error('Failed to update Three.js material:', error);
        }
      }
    }
  }

  // Synchronous version that updates existing materials
  updateInstanceParamsSync(id: string): void {
    if (this.idToThree.has(id)) {
      const def = this.get(id);
      if (def) {
        try {
          const material = this.idToThree.get(id);
          if (material) {
            updateThreeMaterialFrom(material, def);
          }
        } catch (error) {
          console.error('Failed to update Three.js material synchronously:', error);
        }
      }
    }
  }

  // Scene-based persistence methods
  clearMaterials(): void {
    // Keep default material, remove all others
    const defaultMaterial = this.idToDef.get('default');
    this.idToDef.clear();
    this.idToThree.clear();
    this.assetPathToId.clear();

    if (defaultMaterial) {
      this.upsert(defaultMaterial);
    } else {
      this.initializeDefaults();
    }
  }

  loadMaterials(materials: IMaterialDefinition[]): void {
    // Load materials into registry (called during scene import)
    for (const material of materials) {
      this.upsert(material);
    }
  }

  // Get metadata for all materials (for asset browser)
  getAssetMetas(): IMaterialAssetMeta[] {
    return this.list().map((def) => ({
      id: def.id,
      name: def.name,
      path: `/assets/materials/${def.id}.mat.json`,
    }));
  }
}
