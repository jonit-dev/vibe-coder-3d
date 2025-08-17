import { useTexture } from '@react-three/drei';
import React, { useMemo } from 'react';

export const useTextureLoading = (material: any) => {
  const isTextureMode = material.materialType === 'texture';

  // Prepare texture URLs for batch loading with useTexture
  const textureUrls = useMemo(() => {
    if (!isTextureMode) return {};

    const urls: Record<string, string> = {};

    // Only add URLs that actually exist to prevent unnecessary loading attempts
    if (material.albedoTexture) urls.albedoTexture = material.albedoTexture;
    if (material.normalTexture) urls.normalTexture = material.normalTexture;
    if (material.metallicTexture) urls.metallicTexture = material.metallicTexture;
    if (material.roughnessTexture) urls.roughnessTexture = material.roughnessTexture;
    if (material.emissiveTexture) urls.emissiveTexture = material.emissiveTexture;
    if (material.occlusionTexture) urls.occlusionTexture = material.occlusionTexture;

    return urls;
  }, [
    isTextureMode,
    material.albedoTexture,
    material.normalTexture,
    material.metallicTexture,
    material.roughnessTexture,
    material.emissiveTexture,
    material.occlusionTexture,
  ]);

  // Load all textures at once using drei's useTexture
  const textures = useTexture(textureUrls);

  // Configure texture offsets after textures are loaded
  React.useEffect(() => {
    Object.values(textures).forEach((texture) => {
      if (texture && typeof texture === 'object' && 'offset' in texture) {
        texture.offset.set(material.textureOffsetX ?? 0, material.textureOffsetY ?? 0);
        texture.needsUpdate = true;
      }
    });
  }, [textures, material.textureOffsetX, material.textureOffsetY]);

  return { textures, isTextureMode };
};
