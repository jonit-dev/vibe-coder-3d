export interface IMeshRendererData {
  meshId: string;
  materialId: string;
  materials?: string[]; // Optional array for multi-submesh support
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
    textureRepeatX?: number;
    textureRepeatY?: number;
    // Texture properties
    albedoTexture?: string;
    normalTexture?: string;
    metallicTexture?: string;
    roughnessTexture?: string;
    emissiveTexture?: string;
    occlusionTexture?: string;
  };
}
