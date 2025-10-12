import type { IMaterialDefinition } from '@core/materials/Material.types';
import { restoreDefaults } from '@core/lib/serialization/utils/DefaultOmitter';
import { MATERIAL_DEFAULTS } from '@core/lib/serialization/defaults/MaterialDefaults';

/**
 * Define materials for external material asset files
 * Used in .materials.tsx files to define scene-specific or shared materials
 *
 * @example
 * ```typescript
 * // Forest.materials.tsx
 * export default defineMaterials([
 *   { id: 'OakBark', name: 'Oak Bark', color: '#3d2817', roughness: 0.9 },
 *   { id: 'Grass', name: 'Grass', color: '#2d5016', roughness: 0.8 },
 * ]);
 * ```
 */
export function defineMaterials(materials: Array<Partial<IMaterialDefinition> & Pick<IMaterialDefinition, 'id' | 'name'>>): IMaterialDefinition[] {
  return materials.map(material => restoreDefaults(material as Record<string, unknown>, MATERIAL_DEFAULTS) as IMaterialDefinition);
}

/**
 * Define a single material for shared library files
 * Used in .material.tsx files in the shared asset library
 * Automatically restores default values for omitted properties
 *
 * @example
 * ```typescript
 * // assets/materials/common/Stone.material.tsx
 * export default defineMaterial({
 *   id: 'Stone',
 *   name: 'Generic Stone',
 *   color: '#7a7a7a',
 *   roughness: 0.85,
 * });
 * ```
 */
export function defineMaterial(material: Partial<IMaterialDefinition> & Pick<IMaterialDefinition, 'id' | 'name'>): IMaterialDefinition {
  return restoreDefaults(material as Record<string, unknown>, MATERIAL_DEFAULTS) as IMaterialDefinition;
}
