// Core types and schemas
export type {
  IPrefabDefinition,
  IPrefabEntity,
  IPrefabVariant,
  IPrefabAssetMeta,
  IInstantiateOptions,
  IPrefabOverrideRules,
} from './Prefab.types';

export {
  PrefabDefinitionSchema,
  PrefabEntitySchema,
  PrefabVariantSchema,
  PrefabVersionSchema,
} from './Prefab.types';

// Core classes
export { PrefabManager, prefabManager } from './PrefabManager';
export { PrefabRegistry, prefabRegistry } from './PrefabRegistry';
export { PrefabSerializer } from './PrefabSerializer';
export { PrefabApplier } from './PrefabApplier';
export { PrefabPool } from './PrefabPool';

// Utilities
export {
  validatePrefab,
  detectCycle,
  generatePrefabHash,
  calculateMaxDepth,
  traversePrefabEntity,
  clonePrefabEntity,
  mergePrefabEntities,
  generateIdMapping,
  sanitizePrefabId,
  generatePrefabPath,
  isMaxDepthExceeded,
} from './PrefabUtils';

export {
  computeOverridePatch,
  applyOverridePatch,
  mergePatches,
  validatePatch,
  clearOverrides,
} from './PrefabOverrides';

// Initialization
export { initPrefabs, loadPrefabFromFile, downloadPrefab } from './initPrefabs';
