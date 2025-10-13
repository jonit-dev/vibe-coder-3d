import type { IPrefabDefinition } from '@core/prefabs/Prefab.types';
import { PrefabDefinitionSchema } from '@core/prefabs/Prefab.types';

/**
 * Define prefabs for external prefab asset files
 * Used in .prefabs.tsx files to define scene-specific or shared prefabs
 * Automatically applies defaults from PrefabDefinitionSchema
 *
 * @example
 * ```typescript
 * // Forest.prefabs.tsx
 * export default definePrefabs([
 *   {
 *     id: 'OakTree',
 *     name: 'Oak Tree',
 *     root: { name: 'Tree', components: { ... } },
 *   },
 * ]);
 * ```
 */
export function definePrefabs(prefabs: Array<Partial<IPrefabDefinition> & Pick<IPrefabDefinition, 'id' | 'name' | 'root'>>): IPrefabDefinition[] {
  return prefabs.map(prefab => PrefabDefinitionSchema.parse(prefab));
}

/**
 * Define a single prefab for shared library files
 * Used in .prefab.tsx files in the shared asset library
 * Automatically applies defaults from PrefabDefinitionSchema
 *
 * @example
 * ```typescript
 * // assets/prefabs/props/Tree.prefab.tsx
 * export default definePrefab({
 *   id: 'Tree',
 *   name: 'Generic Tree',
 *   root: { name: 'Tree', components: {} },
 * });
 * ```
 */
export function definePrefab(prefab: Partial<IPrefabDefinition> & Pick<IPrefabDefinition, 'id' | 'name' | 'root'>): IPrefabDefinition {
  return PrefabDefinitionSchema.parse(prefab);
}
