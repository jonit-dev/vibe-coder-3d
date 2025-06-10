import { defineComponent, Types } from 'bitecs';

// BitECS component definitions that map to our existing component interfaces
export const Transform = defineComponent({
  positionX: Types.f32,
  positionY: Types.f32,
  positionZ: Types.f32,
  rotationX: Types.f32,
  rotationY: Types.f32,
  rotationZ: Types.f32,
  scaleX: Types.f32,
  scaleY: Types.f32,
  scaleZ: Types.f32,
});

export const MeshRenderer = defineComponent({
  enabled: Types.ui8,
  castShadows: Types.ui8,
  receiveShadows: Types.ui8,
  materialType: Types.ui8, // 0 = solid, 1 = texture
  // Material properties
  materialColorR: Types.f32,
  materialColorG: Types.f32,
  materialColorB: Types.f32,
  metalness: Types.f32,
  roughness: Types.f32,
  emissiveR: Types.f32,
  emissiveG: Types.f32,
  emissiveB: Types.f32,
  emissiveIntensity: Types.f32,
  // String IDs are stored as uint32 hashes for performance
  meshIdHash: Types.ui32,
  materialIdHash: Types.ui32,
  // Texture hashes
  albedoTextureHash: Types.ui32,
  normalTextureHash: Types.ui32,
  metallicTextureHash: Types.ui32,
  roughnessTextureHash: Types.ui32,
  emissiveTextureHash: Types.ui32,
  occlusionTextureHash: Types.ui32,
});

export const RigidBody = defineComponent({
  enabled: Types.ui8,
  bodyTypeHash: Types.ui32, // Store body type as hashed string for exact preservation
  mass: Types.f32,
  gravityScale: Types.f32,
  canSleep: Types.ui8,
  // Material properties
  friction: Types.f32,
  restitution: Types.f32,
  density: Types.f32,
});

export const MeshCollider = defineComponent({
  enabled: Types.ui8,
  isTrigger: Types.ui8,
  shapeType: Types.ui8, // 0: box, 1: sphere, 2: cylinder, etc.
  // Shape dimensions
  sizeX: Types.f32,
  sizeY: Types.f32,
  sizeZ: Types.f32,
  // Offset from entity position
  offsetX: Types.f32,
  offsetY: Types.f32,
  offsetZ: Types.f32,
});

export const Camera = defineComponent({
  // Camera settings
  fov: Types.f32,
  near: Types.f32,
  far: Types.f32,
  projectionType: Types.ui8, // 0: perspective, 1: orthographic
  orthographicSize: Types.f32,
  depth: Types.i32,
  isMain: Types.ui8,
  // Flag to mark when the camera needs to be updated
  needsUpdate: Types.ui8,
});

// Entity metadata component to store hierarchy and name information
export const EntityMeta = defineComponent({
  // Store entity hierarchy using entity references
  parentEntity: Types.eid, // 0 means no parent
  // Name is stored as a hash for performance, original name in metadata
  nameHash: Types.ui32,
});

// Helper to map our string component types to actual BitECS components
export const ComponentTypeMap = {
  Transform: 'Transform',
  MeshRenderer: 'MeshRenderer',
  RigidBody: 'RigidBody',
  MeshCollider: 'MeshCollider',
  Camera: 'Camera',
} as const;

export type BitECSComponentType = keyof typeof ComponentTypeMap;
