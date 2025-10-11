/**
 * Material Default Values
 * Based on MaterialDefinitionSchema defaults
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
  albedoTexture: '',
  normalTexture: '',
  metallicTexture: '',
  roughnessTexture: '',
  emissiveTexture: '',
  occlusionTexture: '',
} as const;

export type MaterialDefaults = typeof MATERIAL_DEFAULTS;
