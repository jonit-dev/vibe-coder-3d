import { defineMaterial } from '@core/lib/serialization/assets/defineMaterials';

export default defineMaterial({
  "id": "myMaterial",
  "name": "My Material",
  "shader": "standard",
  "materialType": "solid",
  "color": "#00ff00",
  "metalness": 0,
  "roughness": 0.5,
  "emissive": "#000000",
  "emissiveIntensity": 0,
  "normalScale": 1,
  "occlusionStrength": 1,
  "textureOffsetX": 0,
  "textureOffsetY": 0,
  "textureRepeatX": 1,
  "textureRepeatY": 1
});
