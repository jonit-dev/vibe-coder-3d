// Core asset metadata interfaces
export enum AssetKeys {
  NightStalkerModel = 'NightStalkerModel',
  NightStalkerTexture = 'NightStalkerTexture',
  // Add other asset keys as needed
}

export type AssetType = 'gltf' | 'fbx' | 'obj' | 'dae' | 'texture' | 'audio';

// Base asset metadata interface
export interface IBaseAssetMetadata {
  key: AssetKeys;
  type: AssetType;
  url: string;
}

// Animation configuration
export interface IAnimationConfig {
  isStatic: boolean; // Whether the model has animations
  loop: boolean; // Whether to loop the animation
  timeScale: number; // Playback speed (1.0 = normal, 0.5 = half speed, etc.)
  clampWhenFinished: boolean; // Hold the last frame when animation completes
  blendDuration: number; // Transition time between animations
  crossFadeEnabled: boolean; // Whether to use crossfade between animations
}

// Physics configuration
export interface IPhysicsConfig {
  enabled: boolean; // Whether physics are enabled for this model
  mass: number; // Mass in kg
  friction: number; // Friction coefficient (0-1)
  restitution: number; // Bounciness (0-1)
  linearDamping: number; // Resistance to linear movement
  angularDamping: number; // Resistance to rotation
  useGravity: boolean; // Whether this object is affected by gravity
}

// Collision configuration
export interface ICollisionConfig {
  enabled: boolean; // Whether collision is enabled
  type: 'static' | 'dynamic' | 'kinematic' | 'characterController';
  shape: 'box' | 'sphere' | 'capsule' | 'mesh' | 'convexHull';
  height?: number; // For capsule, cylinder
  radius?: number; // For sphere, capsule, cylinder
  offset: [number, number, number]; // Position offset from model center
  isTrigger: boolean; // Is this a trigger volume or solid collision
  layer: string; // Collision layer for filtering
}

// Level of Detail (LOD) configuration
interface ILODLevel {
  distance: number; // Distance at which this LOD becomes active
  detail: 'high' | 'medium' | 'low' | 'ultralow';
}

// GameObject configuration (Unity-like concepts)
export interface IGameObjectConfig {
  tag: string; // Object tag for quick identification
  layer: string; // Rendering/physics layer
  isInteractive: boolean; // Whether the object can be interacted with
  isSelectable: boolean; // Whether the object can be selected
  castShadows: boolean; // Whether this object casts shadows
  receiveShadows: boolean; // Whether this object receives shadows
  cullingEnabled: boolean; // Whether this object can be culled from rendering
  LODLevels?: ILODLevel[]; // Level of detail configuration
}

// Debug mode configuration
export interface IDebugConfig {
  enabled: boolean;
  showBoundingBox: boolean;
  showColliders: boolean;
  showSkeleton: boolean;
  showWireframe: boolean;
  showPhysicsForces: boolean;
  showVelocity: boolean;
  showObjectPivot: boolean;
  debugColor: [number, number, number]; // RGB color for debug visualizations
  logToConsole: boolean;
}

// Model configuration with expanded options
export interface IModelConfig {
  scale: number | [number, number, number]; // Uniform or XYZ scale
  position: [number, number, number];
  rotation: [number, number, number];
  offset: [number, number, number];

  // Animation properties
  initialAnimation?: string;
  animations?: string[];
  animationConfig?: IAnimationConfig;

  // Game engine properties
  physics?: IPhysicsConfig;
  collision?: ICollisionConfig;
  gameObject?: IGameObjectConfig;
  debugMode?: IDebugConfig;
}

// Texture configuration with expanded options
export interface ITextureConfig {
  repeat: [number, number];
  filter?: 'nearest' | 'linear' | 'mipmap';
  mipmap?: boolean;
  anisotropy?: number;
  encoding?: 'linear' | 'sRGB' | 'RGBE' | 'RGBM';
  flipY?: boolean;
  premultiplyAlpha?: boolean;
  wrapS?: 'clamp' | 'repeat' | 'mirror';
  wrapT?: 'clamp' | 'repeat' | 'mirror';
  generateMipmaps?: boolean;
  compression?: 'none' | 'default' | 'ASTC' | 'BPTC' | 'ETC1' | 'ETC2' | 'S3TC' | 'PVRTC';
}

// Audio configuration
export interface IAudioConfig {
  volume?: number;
  loop?: boolean;
  autoplay?: boolean;
  spatial?: boolean;
  maxDistance?: number;
  rolloffFactor?: number;
}

// Model asset metadata
export interface IModelAssetMetadata extends IBaseAssetMetadata {
  type: 'gltf' | 'fbx' | 'obj' | 'dae';
  config: IModelConfig;
}

// Texture asset metadata
export interface ITextureAssetMetadata extends IBaseAssetMetadata {
  type: 'texture';
  config: ITextureConfig;
}

// Audio asset metadata
export interface IAudioAssetMetadata extends IBaseAssetMetadata {
  type: 'audio';
  config: IAudioConfig;
}

// Union type for all asset configs
export type IAssetConfig = IModelConfig | ITextureConfig | IAudioConfig;

// Union type for all asset metadata
export type IAssetMetadataUnion = IModelAssetMetadata | ITextureAssetMetadata | IAudioAssetMetadata;

// Asset manifest type
export type AssetManifest = Record<AssetKeys, IAssetMetadataUnion>;
