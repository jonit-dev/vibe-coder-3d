/**
 * Serialization Utilities
 * Export all utility functions for scene compression
 */

export {
  omitDefaults,
  restoreDefaults,
  roundPrecision,
  calculateCompressionRatio,
  formatSizeReduction,
  omitDefaultsBatch,
  restoreDefaultsBatch,
} from './DefaultOmitter';

export {
  MaterialDeduplicator,
  hashMaterial,
  generateMaterialId,
  extractMaterialFromMeshRenderer,
  replaceMaterialWithReference,
} from './MaterialHasher';
