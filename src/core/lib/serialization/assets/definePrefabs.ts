import type { IPrefabDefinition } from '@core/prefabs/Prefab.types';

/**
 * Define prefabs for external prefab asset files
 * Used in .prefabs.tsx files to define scene-specific or shared prefabs
 *
 * @example
 * ```typescript
 * // Forest.prefabs.tsx
 * export default definePrefabs([
 *   {
 *     id: 'OakTree',
 *     name: 'Oak Tree',
 *     version: 1,
 *     root: { name: 'Tree', components: { ... }, children: [] },
 *   },
 * ]);
 * ```
 */
export function definePrefabs(prefabs: IPrefabDefinition[]): IPrefabDefinition[] {
  return prefabs;
}

/**
 * Define a single prefab for shared library files
 * Used in .prefab.tsx files in the shared asset library
 *
 * @example
 * ```typescript
 * // assets/prefabs/props/Tree.prefab.tsx
 * export default definePrefab({
 *   id: 'Tree',
 *   name: 'Generic Tree',
 *   version: 1,
 *   root: { ... },
 * });
 * ```
 */
export function definePrefab(prefab: IPrefabDefinition): IPrefabDefinition {
  return prefab;
}
