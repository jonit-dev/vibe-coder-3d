/**
 * Material Deduplication System
 * Extracts inline materials from entities and deduplicates them
 * Reduces scene file size by 50%+ by eliminating repeated material definitions
 */

import type { IMaterialDefinition } from '../../../materials/Material.types';
import { MATERIAL_DEFAULTS } from '../defaults/MaterialDefaults';

/**
 * Normalize material for hashing (stable JSON serialization)
 * Ensures consistent hash regardless of property order
 */
function normalizeMaterial(material: Record<string, unknown>): string {
  // Sort keys for stable serialization
  const sorted = Object.keys(material)
    .sort()
    .reduce(
      (acc, key) => {
        acc[key] = material[key];
        return acc;
      },
      {} as Record<string, unknown>,
    );

  return JSON.stringify(sorted);
}

/**
 * Simple fast hash function for browser compatibility
 * Based on Java's String.hashCode() algorithm
 * Good enough for material deduplication (not cryptographic)
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Convert to hex string (8 chars max)
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Generate hash for material data
 * Uses simple hash algorithm for browser compatibility
 */
export function hashMaterial(material: Record<string, unknown>): string {
  const normalized = normalizeMaterial(material);
  const hash = simpleHash(normalized);
  return hash; // 8 hex chars
}

/**
 * Generate unique material ID from hash
 */
export function generateMaterialId(material: Record<string, unknown>, prefix = 'mat'): string {
  const hash = hashMaterial(material);
  return `${prefix}_${hash}`;
}

/**
 * Material deduplication tracker
 * Maintains registry of unique materials and their IDs
 */
export class MaterialDeduplicator {
  private materialsByHash = new Map<string, IMaterialDefinition>();
  private hashById = new Map<string, string>();

  /**
   * Add material and get its unique ID
   * Returns existing ID if material already exists (deduplication)
   *
   * @param material - Material data to add
   * @param proposedId - Optional ID to use (if not conflicting)
   * @returns Unique material ID
   */
  addMaterial(material: Record<string, unknown>, proposedId?: string): string {
    const hash = hashMaterial(material);

    // Check if we've seen this exact material before
    const existing = this.materialsByHash.get(hash);
    if (existing) {
      // logger.debug('Material already exists, reusing', { hash, id: existing.id });
      return existing.id;
    }

    // Generate new ID
    const id = proposedId || generateMaterialId(material);

    // Ensure ID is unique (handle collisions)
    let finalId = id;
    let counter = 1;
    while (this.hashById.has(finalId)) {
      finalId = `${id}_${counter}`;
      counter++;
    }

    // Create material definition with defaults
    const materialDef: IMaterialDefinition = {
      id: finalId,
      name: proposedId || `Material ${finalId}`,
      ...(MATERIAL_DEFAULTS as Record<string, unknown>),
      ...material,
    } as IMaterialDefinition;

    this.materialsByHash.set(hash, materialDef);
    this.hashById.set(finalId, hash);

    // logger.debug('New material registered', { hash, id: finalId });
    return finalId;
  }

  /**
   * Get all unique materials
   */
  getMaterials(): IMaterialDefinition[] {
    return Array.from(this.materialsByHash.values());
  }

  /**
   * Get material by ID
   */
  getMaterialById(id: string): IMaterialDefinition | undefined {
    const hash = this.hashById.get(id);
    if (!hash) return undefined;
    return this.materialsByHash.get(hash);
  }

  /**
   * Check if material ID exists
   */
  hasMaterial(id: string): boolean {
    return this.hashById.has(id);
  }

  /**
   * Get material count
   */
  getMaterialCount(): number {
    return this.materialsByHash.size;
  }

  /**
   * Clear all materials
   */
  clear(): void {
    this.materialsByHash.clear();
    this.hashById.clear();
    // logger.debug('Cleared all materials');
  }

  /**
   * Get deduplication statistics
   */
  getStats(): {
    uniqueMaterials: number;
    totalReferences: number;
    deduplicationRatio: number;
  } {
    const uniqueMaterials = this.materialsByHash.size;
    const totalReferences = this.hashById.size;
    const deduplicationRatio =
      totalReferences > 0 ? ((totalReferences - uniqueMaterials) / totalReferences) * 100 : 0;

    return {
      uniqueMaterials,
      totalReferences,
      deduplicationRatio,
    };
  }
}

/**
 * Extract material from MeshRenderer component data
 * Returns material data if present, undefined otherwise
 */
export function extractMaterialFromMeshRenderer(
  meshRendererData: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!meshRendererData.material || typeof meshRendererData.material !== 'object') {
    return undefined;
  }

  return meshRendererData.material as Record<string, unknown>;
}

/**
 * Replace inline material with material ID reference
 * Returns new MeshRenderer data with materialId instead of inline material
 */
export function replaceMaterialWithReference(
  meshRendererData: Record<string, unknown>,
  materialId: string,
): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { material, ...rest } = meshRendererData;

  return {
    ...rest,
    materialId,
  };
}
