export interface IMeshRendererData {
  meshId: string;
  materialId: string;
  enabled?: boolean;
  castShadows?: boolean;
  receiveShadows?: boolean;
  material?: {
    shader?: 'standard' | 'unlit';
    materialType?: 'solid' | 'texture';
    color?: string;
    metalness?: number;
    roughness?: number;
    emissive?: string;
    emissiveIntensity?: number;
    normalScale?: number;
    occlusionStrength?: number;
    textureOffsetX?: number;
    textureOffsetY?: number;
    // Texture properties
    albedoTexture?: string;
    normalTexture?: string;
    metallicTexture?: string;
    roughnessTexture?: string;
    emissiveTexture?: string;
    occlusionTexture?: string;
  };
}
