// Core types and schemas
export type { IMaterialDefinition, IMaterialAssetMeta } from './Material.types';

export { MaterialDefinitionSchema, MaterialShaderSchema, MaterialTypeSchema } from './Material.types';

// Core classes
export { MaterialRegistry } from './MaterialRegistry';

// Utilities
export {
  createThreeMaterialFrom,
  updateThreeMaterialFrom,
  extractTexturesFromMaterial,
} from './MaterialConverter';

export type { IMaterialOverrides } from './MaterialOverrides';

export {
  applyOverrides,
  mergeOverrides,
  createEmptyOverrides,
  isOverridesEmpty,
} from './MaterialOverrides';

// Constants
export { DEFAULT_MATERIAL_COLOR } from './constants';
