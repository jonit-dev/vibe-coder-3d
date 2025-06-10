export interface IMeshRendererData {
  meshId: string;
  materialId: string;
  enabled?: boolean;
  castShadows?: boolean;
  receiveShadows?: boolean;
  material?: {
    materialType?: 'solid' | 'texture';
    color?: string;
    metalness?: number;
    roughness?: number;
    emissive?: string;
    emissiveIntensity?: number;
    // Texture properties
    albedoTexture?: string;
    normalTexture?: string;
    metallicTexture?: string;
    roughnessTexture?: string;
    emissiveTexture?: string;
    occlusionTexture?: string;
  };
}
