/**
 * Material Default Values
 * Based on MaterialDefinitionSchema defaults
 *
 * Note: Texture fields are optional in the schema and should be omitted entirely
 * when not specified (not included as empty strings). They are NOT in this defaults
 * object because undefined fields should not be compared against defaults.
 */

export const MATERIAL_DEFAULTS = {
  shader: 'standard',
  materialType: 'solid',
  color: '#cccccc',
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
  // Texture fields intentionally omitted - they are optional and should not be serialized when undefined
} as const;

export type MaterialDefaults = typeof MATERIAL_DEFAULTS;
