import { defineMaterials } from '@core/lib/serialization/assets/defineMaterials';

/**
 * Scene Materials
 * 3 unique materials
 */
export default defineMaterials([
  {
    "id": "default",
    "name": "Default Material",
    "shader": "standard",
    "materialType": "solid",
    "color": "#cccccc",
    "metalness": 0,
    "roughness": 0.7,
    "emissive": "#000000",
    "emissiveIntensity": 0,
    "normalScale": 1,
    "occlusionStrength": 1,
    "textureOffsetX": 0,
    "textureOffsetY": 0,
    "textureRepeatX": 1,
    "textureRepeatY": 1
  },
  {
    "id": "test123",
    "name": "Test Material",
    "shader": "standard",
    "materialType": "solid",
    "color": "#ff6600",
    "metalness": 0.3,
    "roughness": 0.6,
    "emissive": "#000000",
    "emissiveIntensity": 0,
    "normalScale": 1,
    "occlusionStrength": 1,
    "textureOffsetX": 0,
    "textureOffsetY": 0,
    "textureRepeatX": 1,
    "textureRepeatY": 1
  },
  {
    "id": "dss",
    "name": "dss",
    "shader": "standard",
    "materialType": "texture",
    "color": "#cccccc",
    "metalness": 0,
    "roughness": 0.7,
    "emissive": "#000000",
    "emissiveIntensity": 0,
    "normalScale": 1,
    "occlusionStrength": 1,
    "textureOffsetX": 0,
    "textureOffsetY": 0,
    "textureRepeatX": 1,
    "textureRepeatY": 1,
    "albedoTexture": "/assets/textures/crate-texture.png"
  }
]);
