/**
 * Component Default Values Registry
 * Extracted from component Zod schemas and deserialize methods
 *
 * These defaults are used for:
 * 1. Omitting unchanged values during serialization (reducing file size)
 * 2. Restoring omitted values during deserialization
 */

/**
 * Transform Component Defaults
 * All entities exist at origin with no rotation and unit scale by default
 */
export const TRANSFORM_DEFAULTS = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
} as const;

/**
 * Camera Component Defaults
 * Based on CameraComponent.ts deserialize defaults
 */
export const CAMERA_DEFAULTS = {
  fov: 75,
  near: 0.1,
  far: 100,
  projectionType: 'perspective',
  orthographicSize: 10,
  depth: 0,
  isMain: false,
  clearFlags: 'skybox',
  skyboxTexture: '',
  backgroundColor: {
    r: 0,
    g: 0,
    b: 0,
    a: 1,
  },
  controlMode: 'free',
  viewportRect: {
    x: 0,
    y: 0,
    width: 1,
    height: 1,
  },
  hdr: false,
  toneMapping: 'none',
  toneMappingExposure: 1,
  enablePostProcessing: false,
  postProcessingPreset: 'none',
  enableSmoothing: false,
  followTarget: 0,
  followOffset: {
    x: 0,
    y: 5,
    z: -10,
  },
  smoothingSpeed: 2,
  rotationSmoothing: 1.5,
  skyboxScale: {
    x: 1,
    y: 1,
    z: 1,
  },
  skyboxRotation: {
    x: 0,
    y: 0,
    z: 0,
  },
  skyboxRepeat: {
    u: 1,
    v: 1,
  },
  skyboxOffset: {
    u: 0,
    v: 0,
  },
  skyboxIntensity: 1,
  skyboxBlur: 0,
} as const;

/**
 * Light Component Defaults
 * Based on LightComponent.ts deserialize defaults
 */
export const LIGHT_DEFAULTS = {
  color: {
    r: 1,
    g: 1,
    b: 1,
  },
  intensity: 1,
  enabled: true,
  castShadow: true,
  directionX: 0,
  directionY: -1,
  directionZ: 0,
  range: 10,
  decay: 1,
  angle: 0.5235987755982988, // Math.PI / 6 (30 degrees)
  penumbra: 0.1,
  shadowMapSize: 4096,
  shadowBias: -0.0005,
  shadowRadius: 0.2,
} as const;

/**
 * MeshRenderer Component Defaults
 * Based on MeshRendererComponent.ts schema defaults
 */
export const MESH_RENDERER_DEFAULTS = {
  enabled: true,
  castShadows: true,
  receiveShadows: true,
  modelPath: '',
  // Material is optional - when present, use MATERIAL_DEFAULTS for nested comparison
} as const;

/**
 * RigidBody Component Defaults
 * Based on RigidBodyComponent.ts
 */
export const RIGID_BODY_DEFAULTS = {
  enabled: true,
  bodyType: 'dynamic',
  mass: 1,
  gravityScale: 1,
  canSleep: true,
  material: {
    friction: 0.7,
    restitution: 0.3,
    density: 1,
  },
} as const;

/**
 * MeshCollider Component Defaults
 * Based on MeshColliderComponent.ts
 */
export const MESH_COLLIDER_DEFAULTS = {
  enabled: true,
  isTrigger: false,
  colliderType: 'box',
  center: [0, 0, 0],
  size: {
    width: 1,
    height: 1,
    depth: 1,
    radius: 0.5,
    capsuleRadius: 0.5,
    capsuleHeight: 2,
  },
  physicsMaterial: {
    friction: 0.7,
    restitution: 0.3,
    density: 1,
  },
} as const;

/**
 * Terrain Component Defaults
 * Based on TerrainComponent.ts schema defaults
 */
export const TERRAIN_DEFAULTS = {
  size: [20, 20],
  segments: [129, 129],
  heightScale: 2,
  noiseEnabled: true,
  noiseSeed: 1337,
  noiseFrequency: 4.0,
  noiseOctaves: 4,
  noisePersistence: 0.5,
  noiseLacunarity: 2.0,
} as const;

/**
 * Script Component Defaults
 * Based on ScriptComponent.ts schema defaults
 */
export const SCRIPT_DEFAULTS = {
  code: '',
  enabled: true,
  scriptName: 'Script',
  description: '',
  executeInUpdate: true,
  executeOnStart: true,
  executeOnEnable: false,
  maxExecutionTime: 16,
  hasErrors: false,
  lastErrorMessage: '',
  lastExecutionTime: 0,
  executionCount: 0,
  parameters: {},
  lastModified: 0,
  compiledCode: '',
} as const;

/**
 * Sound Component Defaults
 * Based on SoundComponent.ts schema defaults
 */
export const SOUND_DEFAULTS = {
  enabled: true,
  autoplay: false,
  loop: false,
  volume: 1,
  pitch: 1,
  playbackRate: 1,
  is3D: true,
  minDistance: 1,
  maxDistance: 10000,
  rolloffFactor: 1,
  coneInnerAngle: 360,
  coneOuterAngle: 360,
  coneOuterGain: 0,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  muted: false,
} as const;

/**
 * CustomShape Component Defaults
 * Based on CustomShapeComponent.ts schema defaults
 */
export const CUSTOM_SHAPE_DEFAULTS = {
  params: {},
} as const;

/**
 * GeometryAsset Component Defaults
 * Based on GeometryAssetComponent.ts deserialize defaults
 */
export const GEOMETRY_ASSET_DEFAULTS = {
  path: '',
  geometryId: '',
  materialId: '',
  enabled: true,
  castShadows: true,
  receiveShadows: true,
  options: {
    recomputeNormals: false,
    recomputeTangents: false,
    recenter: false,
    computeBounds: true,
    flipNormals: false,
    scale: 1,
  },
} as const;

/**
 * PrefabInstance Component Defaults
 */
export const PREFAB_INSTANCE_DEFAULTS = {
  version: 1,
  overridePatch: {},
} as const;

/**
 * Animation Component Defaults
 * Based on AnimationComponent.ts schema defaults
 */
export const ANIMATION_DEFAULTS = {
  blendIn: 0.2,
  blendOut: 0.2,
  layer: 0,
  weight: 1,
  playing: false,
  time: 0,
  clips: [],
  version: 1,
} as const;

/**
 * Component Defaults Registry
 * Maps component type to its default values
 */
export const COMPONENT_DEFAULTS = {
  Transform: TRANSFORM_DEFAULTS,
  Camera: CAMERA_DEFAULTS,
  Light: LIGHT_DEFAULTS,
  MeshRenderer: MESH_RENDERER_DEFAULTS,
  RigidBody: RIGID_BODY_DEFAULTS,
  MeshCollider: MESH_COLLIDER_DEFAULTS,
  Terrain: TERRAIN_DEFAULTS,
  Script: SCRIPT_DEFAULTS,
  Sound: SOUND_DEFAULTS,
  CustomShape: CUSTOM_SHAPE_DEFAULTS,
  GeometryAsset: GEOMETRY_ASSET_DEFAULTS,
  PrefabInstance: PREFAB_INSTANCE_DEFAULTS,
  Animation: ANIMATION_DEFAULTS,
} as const;

/**
 * Get default values for a component type
 * @param componentType - The component type string (e.g., 'Transform', 'Camera')
 * @returns Default values object for the component, or undefined if not found
 */
export function getComponentDefaults(componentType: string): Record<string, unknown> | undefined {
  return COMPONENT_DEFAULTS[componentType as keyof typeof COMPONENT_DEFAULTS] as
    | Record<string, unknown>
    | undefined;
}

/**
 * Check if a component type has defaults defined
 */
export function hasComponentDefaults(componentType: string): boolean {
  return componentType in COMPONENT_DEFAULTS;
}

/**
 * Get all component types that have defaults
 */
export function getComponentTypesWithDefaults(): string[] {
  return Object.keys(COMPONENT_DEFAULTS);
}
