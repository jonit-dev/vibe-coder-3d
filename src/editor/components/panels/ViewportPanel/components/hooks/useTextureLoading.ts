import { useTexture } from '@react-three/drei';
import React, { useMemo } from 'react';

export const useTextureLoading = (material: any) => {
  const isTextureMode = material.materialType === 'texture';

  // Prepare texture URLs for batch loading with useTexture
  // Load textures whenever URLs are present, regardless of materialType
  const textureUrls = useMemo(() => {
    const urls: Record<string, string> = {};

    // Load textures if URLs exist, even if materialType is 'solid'
    // This allows textures to be applied without requiring materialType change
    if (material.albedoTexture) urls.albedoTexture = material.albedoTexture;
    if (material.normalTexture) urls.normalTexture = material.normalTexture;
    if (material.metallicTexture) urls.metallicTexture = material.metallicTexture;
    if (material.roughnessTexture) urls.roughnessTexture = material.roughnessTexture;
    if (material.emissiveTexture) urls.emissiveTexture = material.emissiveTexture;
    if (material.occlusionTexture) urls.occlusionTexture = material.occlusionTexture;

    return urls;
  }, [
    material.albedoTexture,
    material.normalTexture,
    material.metallicTexture,
    material.roughnessTexture,
    material.emissiveTexture,
    material.occlusionTexture,
  ]);

  // Load all textures at once using drei's useTexture
  // Note: useTexture will suspend until textures are loaded, causing brief flicker
  // Always call useTexture to avoid conditional hook usage
  const hasTextures = Object.keys(textureUrls).length > 0;

  const loadedTextures = useTexture(hasTextures ? textureUrls : {});
  const textures = hasTextures ? loadedTextures : {};

  // Configure texture offsets and repeat after textures are loaded
  React.useEffect(() => {
    if (Object.keys(textures).length === 0) return;

    Object.values(textures).forEach((texture) => {
      if (texture && typeof texture === 'object' && 'offset' in texture) {
        const offsetX = material.textureOffsetX ?? 0;
        const offsetY = material.textureOffsetY ?? 0;
        const repeatX = material.textureRepeatX ?? 1;
        const repeatY = material.textureRepeatY ?? 1;

        // Configure texture wrapping for repeat
        texture.wrapS = texture.wrapT = 1000; // THREE.RepeatWrapping

        // Only update if the offset or repeat actually changed
        const offsetChanged = texture.offset.x !== offsetX || texture.offset.y !== offsetY;
        const repeatChanged = texture.repeat.x !== repeatX || texture.repeat.y !== repeatY;

        if (offsetChanged) {
          texture.offset.set(offsetX, offsetY);
          texture.needsUpdate = true;
        }

        if (repeatChanged) {
          texture.repeat.set(repeatX, repeatY);
          texture.needsUpdate = true;
        }

        // Force texture update
        texture.needsUpdate = true;
      }
    });
  }, [textures, material.textureOffsetX, material.textureOffsetY, material.textureRepeatX, material.textureRepeatY]);

  return { textures, isTextureMode };
};
