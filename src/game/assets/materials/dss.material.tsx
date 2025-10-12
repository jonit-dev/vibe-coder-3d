import { defineMaterial } from '@core/lib/serialization/assets/defineMaterials';

export default defineMaterial({
  "id": "dss",
  "name": "Crate Texture",
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
});
