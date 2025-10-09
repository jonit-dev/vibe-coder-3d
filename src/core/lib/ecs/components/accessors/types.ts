/**
 * Component Accessor Types - Type definitions for direct component access API
 */

/**
 * Base component accessor interface
 * Provides get/set operations for any component type
 */
export interface IComponentAccessor<TData> {
  /**
   * Get current component data
   * Returns null if component doesn't exist on entity
   */
  get(): TData | null;

  /**
   * Set component data via partial patch
   * Updates are batched via mutation buffer and flushed at end of frame
   */
  set(patch: Partial<TData>): void;
}

/**
 * Material data subset for MeshRenderer
 */
export interface IMaterialData {
  shader?: 'standard' | 'unlit';
  materialType?: 'solid' | 'texture';
  color?: string;
  metalness?: number;
  roughness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  normalScale?: number;
  albedoTexture?: string;
  normalTexture?: string;
  metallicTexture?: string;
  roughnessTexture?: string;
  emissiveTexture?: string;
  occlusionTexture?: string;
  occlusionStrength?: number;
  textureOffsetX?: number;
  textureOffsetY?: number;
  textureRepeatX?: number;
  textureRepeatY?: number;
}

/**
 * MeshRenderer-specific accessor with material helpers
 */
export interface IMeshRendererAccessor extends IComponentAccessor<IMeshRendererData> {
  /**
   * Enable/disable the mesh renderer
   */
  enable(value: boolean): void;

  /**
   * Material manipulation helpers
   */
  material: {
    /**
     * Set material color
     * @param hex - Color as hex string ('#ff0000') or number (0xff0000)
     */
    setColor(hex: string | number): void;

    /**
     * Set metalness (0-1, clamped)
     */
    setMetalness(value: number): void;

    /**
     * Set roughness (0-1, clamped)
     */
    setRoughness(value: number): void;

    /**
     * Set emissive color and optional intensity
     * @param hex - Emissive color as hex string or number
     * @param intensity - Emissive intensity (default 1)
     */
    setEmissive(hex: string | number, intensity?: number): void;

    /**
     * Set texture for a specific material map
     * @param kind - Texture type (albedo, normal, metallic, etc.)
     * @param idOrPath - Asset ID or path to texture
     */
    setTexture(
      kind: 'albedo' | 'normal' | 'metallic' | 'roughness' | 'emissive' | 'occlusion',
      idOrPath: string,
    ): void;
  };
}

/**
 * MeshRenderer data interface (must match MeshRendererComponent schema)
 */
export interface IMeshRendererData {
  meshId: string;
  materialId: string;
  materials?: string[];
  enabled: boolean;
  castShadows: boolean;
  receiveShadows: boolean;
  modelPath?: string;
  material?: IMaterialData;
}
