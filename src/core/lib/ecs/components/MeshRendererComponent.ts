export interface IMeshRendererData {
  meshId: string;
  materialId: string;
  enabled?: boolean;
  castShadows?: boolean;
  receiveShadows?: boolean;
  material?: {
    color?: string;
    metalness?: number;
    roughness?: number;
    emissive?: string;
    emissiveIntensity?: number;
  };
}
