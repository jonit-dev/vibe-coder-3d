import type { IMaterialDefinition } from './Material.types';

export interface IMaterialOverrides {
  color?: string;
  metalness?: number;
  roughness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  normalScale?: number;
  occlusionStrength?: number;
  textureOffsetX?: number;
  textureOffsetY?: number;
  // Texture overrides (for future use)
  albedoTexture?: string;
  normalTexture?: string;
  metallicTexture?: string;
  roughnessTexture?: string;
  emissiveTexture?: string;
  occlusionTexture?: string;
}

export function applyOverrides(
  base: IMaterialDefinition,
  overrides?: IMaterialOverrides,
): IMaterialDefinition {
  if (!overrides) {
    return base;
  }

  return {
    ...base,
    ...overrides,
  };
}

export function mergeOverrides(
  base: IMaterialOverrides,
  additional?: IMaterialOverrides,
): IMaterialOverrides {
  if (!additional) {
    return base;
  }

  return {
    ...base,
    ...additional,
  };
}

export function createEmptyOverrides(): IMaterialOverrides {
  return {};
}

export function isOverridesEmpty(overrides: IMaterialOverrides): boolean {
  return Object.keys(overrides).length === 0;
}
