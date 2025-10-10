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

/**
 * Transform data interface
 */
export interface ITransformData {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

/**
 * Transform-specific accessor with helper methods
 */
export interface ITransformAccessor extends IComponentAccessor<ITransformData> {
  /**
   * Set position
   */
  setPosition(x: number, y: number, z: number): void;

  /**
   * Set rotation (in radians)
   */
  setRotation(x: number, y: number, z: number): void;

  /**
   * Set scale
   */
  setScale(x: number, y: number, z: number): void;

  /**
   * Translate by offset
   */
  translate(x: number, y: number, z: number): void;

  /**
   * Rotate by offset (in radians)
   */
  rotate(x: number, y: number, z: number): void;

  /**
   * Look at target position
   */
  lookAt(targetPos: [number, number, number]): void;

  /**
   * Get forward vector
   */
  forward(): [number, number, number];

  /**
   * Get right vector
   */
  right(): [number, number, number];

  /**
   * Get up vector
   */
  up(): [number, number, number];
}

/**
 * Camera data interface
 */
export interface ICameraData {
  fov: number;
  near: number;
  far: number;
  projectionType: 'perspective' | 'orthographic';
  orthographicSize: number;
  depth: number;
  isMain: boolean;
}

/**
 * Camera-specific accessor with helper methods
 */
export interface ICameraAccessor extends IComponentAccessor<ICameraData> {
  /**
   * Set field of view (perspective only)
   */
  setFov(fov: number): void;

  /**
   * Set near/far clipping planes
   */
  setClipping(near: number, far: number): void;

  /**
   * Set projection type
   */
  setProjection(type: 'perspective' | 'orthographic'): void;

  /**
   * Set as main camera
   */
  setAsMain(isMain: boolean): void;
}

/**
 * RigidBody data interface
 */
export interface IRigidBodyData {
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
 * RigidBody-specific accessor with helper methods
 */
export interface IRigidBodyAccessor extends IComponentAccessor<IRigidBodyData> {
  /**
   * Enable/disable physics simulation
   */
  enable(value: boolean): void;

  /**
   * Set body type
   */
  setBodyType(type: 'dynamic' | 'kinematic' | 'static'): void;

  /**
   * Set mass (dynamic bodies only)
   */
  setMass(mass: number): void;

  /**
   * Set gravity scale (0 = no gravity, 1 = normal gravity)
   */
  setGravityScale(scale: number): void;

  /**
   * Set physics material properties
   */
  setPhysicsMaterial(friction: number, restitution: number, density?: number): void;

  /**
   * Apply force to the rigid body
   * @param force - Force vector [x, y, z]
   * @param point - Optional application point in world space
   */
  applyForce(force: [number, number, number], point?: [number, number, number]): void;

  /**
   * Apply impulse to the rigid body (instant velocity change)
   * @param impulse - Impulse vector [x, y, z]
   * @param point - Optional application point in world space
   */
  applyImpulse(impulse: [number, number, number], point?: [number, number, number]): void;

  /**
   * Set linear velocity
   * @param vel - Velocity vector [x, y, z]
   */
  setLinearVelocity(vel: [number, number, number]): void;

  /**
   * Get current linear velocity
   * @returns Velocity vector [x, y, z]
   */
  getLinearVelocity(): [number, number, number];

  /**
   * Set angular velocity
   * @param vel - Angular velocity vector [x, y, z]
   */
  setAngularVelocity(vel: [number, number, number]): void;

  /**
   * Get current angular velocity
   * @returns Angular velocity vector [x, y, z]
   */
  getAngularVelocity(): [number, number, number];
}

/**
 * MeshCollider data interface
 */
export interface IMeshColliderData {
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
 * MeshCollider-specific accessor with helper methods
 */
export interface IMeshColliderAccessor extends IComponentAccessor<IMeshColliderData> {
  /**
   * Enable/disable collider
   */
  enable(value: boolean): void;

  /**
   * Set as trigger (no physics collision, only events)
   */
  setTrigger(isTrigger: boolean): void;

  /**
   * Set collider type
   */
  setType(type: 'box' | 'sphere' | 'capsule' | 'convex' | 'mesh' | 'heightfield'): void;

  /**
   * Set collider center offset
   */
  setCenter(x: number, y: number, z: number): void;

  /**
   * Set box size
   */
  setBoxSize(width: number, height: number, depth: number): void;

  /**
   * Set sphere radius
   */
  setSphereRadius(radius: number): void;

  /**
   * Set capsule dimensions
   */
  setCapsuleSize(radius: number, height: number): void;
}
