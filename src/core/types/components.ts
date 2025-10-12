/**
 * Component Type Definitions for Scene Entities
 * Provides compile-time type safety for scene TSX files
 *
 * These types ensure VSCode shows errors for invalid component data
 */

/**
 * Transform Component - Position, rotation, scale
 */
export interface ITransformComponent {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

/**
 * Camera Component - Camera settings
 */
export interface ICameraComponent {
  fov: number;
  near: number;
  far: number;
  projectionType: 'perspective' | 'orthographic';
  orthographicSize: number;
  depth: number;
  isMain: boolean;
  clearFlags?: 'skybox' | 'solidColor' | 'depthOnly' | 'dontClear';
  skyboxTexture?: string;
  backgroundColor?: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  controlMode?: 'free' | 'orbit' | 'follow' | 'fixed';
  viewportRect?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  hdr?: boolean;
  toneMapping?: 'none' | 'linear' | 'reinhard' | 'cineon' | 'aces';
  toneMappingExposure?: number;
  enablePostProcessing?: boolean;
  postProcessingPreset?: 'none' | 'cinematic' | 'stylized' | 'retro';
  enableSmoothing?: boolean;
  followTarget?: number;
  followOffset?: {
    x: number;
    y: number;
    z: number;
  };
  smoothingSpeed?: number;
  rotationSmoothing?: number;
}

/**
 * Light Component - Light settings
 */
export interface ILightComponent {
  lightType: 'directional' | 'point' | 'spot' | 'ambient';
  color: {
    r: number;
    g: number;
    b: number;
  };
  intensity: number;
  enabled: boolean;
  castShadow: boolean;
  directionX: number;
  directionY: number;
  directionZ: number;
  range: number;
  decay: number;
  angle: number;
  penumbra: number;
  shadowMapSize: number;
  shadowBias: number;
  shadowRadius: number;
}

/**
 * Material data for inline material definitions
 */
export interface IMaterialData {
  shader: 'standard' | 'unlit';
  materialType: 'solid' | 'texture';
  color: string;
  metalness: number;
  roughness: number;
  emissive: string;
  emissiveIntensity: number;
  normalScale: number;
  occlusionStrength: number;
  textureOffsetX: number;
  textureOffsetY: number;
  textureRepeatX: number;
  textureRepeatY: number;
  albedoTexture?: string;
  normalTexture?: string;
  metallicTexture?: string;
  roughnessTexture?: string;
  emissiveTexture?: string;
  occlusionTexture?: string;
}

/**
 * MeshRenderer Component - Mesh rendering
 */
export interface IMeshRendererComponent {
  meshId: string;
  materialId: string;
  enabled: boolean;
  castShadows: boolean;
  receiveShadows: boolean;
  modelPath: string;
  material?: IMaterialData;
}

// PersistentId is auto-generated - not included in scene files

/**
 * RigidBody Component - Physics body
 */
export interface IRigidBodyComponent {
  type: string;
  mass: number;
  isStatic?: boolean;
  restitution?: number;
  friction?: number;
  enabled?: boolean;
  bodyType?: 'dynamic' | 'kinematic' | 'static';
  gravityScale?: number;
  canSleep?: boolean;
  material?: {
    friction?: number;
    restitution?: number;
    density?: number;
  };
}

/**
 * MeshCollider Component - Collision detection
 */
export interface IMeshColliderComponent {
  enabled: boolean;
  colliderType: 'box' | 'sphere' | 'capsule' | 'convex' | 'mesh' | 'heightfield';
  isTrigger: boolean;
  center: [number, number, number];
  size: {
    width: number;
    height: number;
    depth: number;
    radius: number;
    capsuleRadius: number;
    capsuleHeight: number;
  };
  physicsMaterial: {
    friction: number;
    restitution: number;
    density: number;
  };
  type?: string;
  meshId?: string;
}

/**
 * PrefabInstance Component - Prefab instantiation
 */
export interface IPrefabInstanceComponent {
  prefabId: string;
  version: number;
  instanceUuid: string;
  overridePatch?: {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
    [key: string]: unknown;
  };
}

/**
 * Script Component - Script execution
 */
export interface IScriptComponent {
  code: string;
  enabled: boolean;
  scriptName: string;
  description: string;
  scriptRef?: {
    scriptId: string;
    source: 'external' | 'inline';
    path?: string;
    codeHash?: string;
    lastModified?: number;
  };
  executeInUpdate: boolean;
  executeOnStart: boolean;
  executeOnEnable: boolean;
  maxExecutionTime: number;
  hasErrors?: boolean;
  lastErrorMessage?: string;
  lastExecutionTime?: number;
  executionCount?: number;
  parameters?: Record<string, unknown>;
  lastModified?: number;
  compiledCode?: string;
  language?: 'typescript' | 'javascript';
}

/**
 * PersistentId Component - Unique identifier for entities across scene saves/loads
 */
export interface IPersistentIdComponent {
  id: string;
}

/**
 * Component map - Maps component names to their types
 * This provides autocomplete and type checking for component data
 *
 * Note: PersistentId is optional - if not provided, it will be auto-generated during scene loading
 */
export interface IComponentMap {
  PersistentId: IPersistentIdComponent;
  Transform: ITransformComponent;
  Camera: ICameraComponent;
  Light: ILightComponent;
  MeshRenderer: IMeshRendererComponent;
  RigidBody: IRigidBodyComponent;
  MeshCollider: IMeshColliderComponent;
  PrefabInstance: IPrefabInstanceComponent;
  Script: IScriptComponent;
}

/**
 * Typed entity for scenes - Provides type safety for entity component data
 * Components can be partially defined - defaults are applied at runtime
 */
export interface ITypedSceneEntity {
  id?: number | string; // Optional - auto-generated during scene loading if not provided
  name: string;
  parentId?: number | string | null;
  components: {
    [K in keyof IComponentMap]?: Partial<IComponentMap[K]>;
  };
}
