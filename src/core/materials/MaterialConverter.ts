import { Color, MeshBasicMaterial, MeshStandardMaterial, Texture } from 'three';
import type { IMaterialDefinition } from './Material.types';

export function createThreeMaterialFrom(
  def: IMaterialDefinition,
  textures: Record<string, Texture>,
): MeshStandardMaterial | MeshBasicMaterial {
  let material: MeshStandardMaterial | MeshBasicMaterial;

  if (def.shader === 'standard') {
    material = new MeshStandardMaterial();

    // Set PBR properties
    material.metalness = def.metalness;
    material.roughness = def.roughness;

    // Set emissive properties
    const emissiveColor = new Color(def.emissive);
    material.emissive = emissiveColor;
    material.emissiveIntensity = def.emissiveIntensity;

    // Attach textures if available
    if (def.albedoTexture && textures[def.albedoTexture]) {
      material.map = textures[def.albedoTexture];
      material.map.offset.set(def.textureOffsetX, def.textureOffsetY);
      material.map.repeat.set(def.textureRepeatX, def.textureRepeatY);
    }

    if (def.normalTexture && textures[def.normalTexture]) {
      material.normalMap = textures[def.normalTexture];
      material.normalMap.offset.set(def.textureOffsetX, def.textureOffsetY);
      material.normalMap.repeat.set(def.textureRepeatX, def.textureRepeatY);
      material.normalScale.set(def.normalScale, def.normalScale);
    }

    if (def.metallicTexture && textures[def.metallicTexture]) {
      material.metalnessMap = textures[def.metallicTexture];
      material.metalnessMap.offset.set(def.textureOffsetX, def.textureOffsetY);
      material.metalnessMap.repeat.set(def.textureRepeatX, def.textureRepeatY);
    }

    if (def.roughnessTexture && textures[def.roughnessTexture]) {
      material.roughnessMap = textures[def.roughnessTexture];
      material.roughnessMap.offset.set(def.textureOffsetX, def.textureOffsetY);
      material.roughnessMap.repeat.set(def.textureRepeatX, def.textureRepeatY);
    }

    if (def.emissiveTexture && textures[def.emissiveTexture]) {
      material.emissiveMap = textures[def.emissiveTexture];
      material.emissiveMap.offset.set(def.textureOffsetX, def.textureOffsetY);
      material.emissiveMap.repeat.set(def.textureRepeatX, def.textureRepeatY);
    }

    if (def.occlusionTexture && textures[def.occlusionTexture]) {
      material.aoMap = textures[def.occlusionTexture];
      material.aoMap.offset.set(def.textureOffsetX, def.textureOffsetY);
      material.aoMap.repeat.set(def.textureRepeatX, def.textureRepeatY);
      material.aoMapIntensity = def.occlusionStrength;
    }

    // Set base color (only if no albedo texture is actually applied)
    if (!def.albedoTexture || !textures[def.albedoTexture]) {
      const color = new Color(def.color);
      material.color = color;
    } else {
      // When texture is present and available, set color to white and let texture control color
      material.color.setHex(0xffffff);
    }
  } else {
    // Unlit shader
    material = new MeshBasicMaterial();

    // Set base color (only if no albedo texture is actually applied)
    if (!def.albedoTexture || !textures[def.albedoTexture]) {
      const color = new Color(def.color);
      material.color = color;
    } else {
      material.color.setHex(0xffffff);
    }

    // Attach texture if available
    if (def.albedoTexture && textures[def.albedoTexture]) {
      material.map = textures[def.albedoTexture];
      material.map.offset.set(def.textureOffsetX, def.textureOffsetY);
      material.map.repeat.set(def.textureRepeatX, def.textureRepeatY);
    }
  }


  return material;
}

export function updateThreeMaterialFrom(
  material: MeshStandardMaterial | MeshBasicMaterial,
  def: IMaterialDefinition,
): void {
  if (material instanceof MeshStandardMaterial) {
    // Update PBR properties
    material.metalness = def.metalness;
    material.roughness = def.roughness;

    // Update emissive properties
    const emissiveColor = new Color(def.emissive);
    material.emissive = emissiveColor;
    material.emissiveIntensity = def.emissiveIntensity;

    // Set base color (only if no albedo texture is actually applied)
    if (!def.albedoTexture) {
      const color = new Color(def.color);
      material.color = color;
    } else {
      // When texture is present, set color to white
      material.color.setHex(0xffffff);
    }
  } else if (material instanceof MeshBasicMaterial) {
    // Update color
    if (!def.albedoTexture) {
      const color = new Color(def.color);
      material.color = color;
    } else {
      material.color.setHex(0xffffff);
    }
  }

  // Note: Texture updates would require re-loading textures
  // For now, we assume textures are managed externally
}

export function extractTexturesFromMaterial(
  material: MeshStandardMaterial | MeshBasicMaterial,
): string[] {
  const texturePaths: string[] = [];

  if (material instanceof MeshStandardMaterial) {
    if (material.map) texturePaths.push('albedoTexture');
    if (material.normalMap) texturePaths.push('normalTexture');
    if (material.metalnessMap) texturePaths.push('metallicTexture');
    if (material.roughnessMap) texturePaths.push('roughnessTexture');
    if (material.emissiveMap) texturePaths.push('emissiveTexture');
    if (material.aoMap) texturePaths.push('occlusionTexture');
  } else if (material instanceof MeshBasicMaterial) {
    if (material.map) texturePaths.push('albedoTexture');
  }

  return texturePaths;
}
