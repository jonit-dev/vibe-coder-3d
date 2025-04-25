// Core asset metadata interfaces
export enum AssetKeys {
  NightStalkerModel = 'NightStalkerModel',
  NightStalkerTexture = 'NightStalkerTexture',
}

export type AssetType = 'gltf' | 'texture' | 'audio';

export interface IBaseAssetMetadata {
  key: AssetKeys;
  type: AssetType;
  url: string;
  config?: IAssetConfig;
}

export interface IModelAssetMetadata extends IBaseAssetMetadata {
  type: 'gltf';
  config?: IModelConfig;
}

export interface ITextureAssetMetadata extends IBaseAssetMetadata {
  type: 'texture';
  config?: ITextureConfig;
}

export interface IAudioAssetMetadata extends IBaseAssetMetadata {
  type: 'audio';
  config?: IAudioConfig;
}

// Asset config interfaces
export interface IModelConfig {
  scale?: number | [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  offset?: [number, number, number];
  initialAnimation?: string;
  animations?: string[]; // Array of animation URLs or asset keys
}

export interface ITextureConfig {
  wrapS?: number;
  wrapT?: number;
  repeat?: [number, number];
  magFilter?: number;
  minFilter?: number;
}

export interface IAudioConfig {
  volume?: number;
  loop?: boolean;
}

// Union type for all asset configs
export type IAssetConfig = IModelConfig | ITextureConfig | IAudioConfig;

// Union type for all asset metadata
export type IAssetMetadata = IModelAssetMetadata | ITextureAssetMetadata | IAudioAssetMetadata;

// Asset manifest type
export type AssetManifest = Record<AssetKeys, IAssetMetadata>;
