/**
 * Type-Safe Scene Builder Utilities
 * Provides type-safe utilities for creating and validating scene data
 */

import { z } from 'zod';
import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import type {
  ComponentDataMap,
  ComponentData,
  SceneData,
  SceneEntityData,
  SceneEntityWithComponents,
  ISceneBuilder,
} from '@/core/types/scene';
import { validateSceneEntity, validateScene } from '@/core/types/scene';
import { AnimationComponentSchema } from '@/core/components/animation/AnimationComponent';

// Component data validation schemas
const TransformSchema = z.object({
  position: z.tuple([z.number(), z.number(), z.number()]),
  rotation: z.tuple([z.number(), z.number(), z.number()]),
  scale: z.tuple([z.number(), z.number(), z.number()]),
});

const MeshRendererSchema = z.object({
  meshId: z.string(),
  materialId: z.string(),
  enabled: z.boolean(),
  castShadows: z.boolean(),
  receiveShadows: z.boolean(),
  modelPath: z.string(),
  material: z.object({
    shader: z.string(),
    materialType: z.string(),
    color: z.string(),
    normalScale: z.number(),
    metalness: z.number(),
    roughness: z.number(),
    emissive: z.string(),
    emissiveIntensity: z.number(),
    occlusionStrength: z.number(),
    textureOffsetX: z.number(),
    textureOffsetY: z.number(),
  }),
});

const CameraSchema = z.object({
  fov: z.number(),
  near: z.number(),
  far: z.number(),
  projectionType: z.enum(['perspective', 'orthographic']),
  orthographicSize: z.number(),
  depth: z.number(),
  isMain: z.boolean(),
  clearFlags: z.enum(['skybox', 'solidColor', 'depthOnly', 'dontClear']).optional(),
  skyboxTexture: z.string().optional(),
  backgroundColor: z
    .object({
      r: z.number(),
      g: z.number(),
      b: z.number(),
      a: z.number(),
    })
    .optional(),
  controlMode: z.enum(['locked', 'free']).optional(),
  enableSmoothing: z.boolean().optional(),
  followTarget: z.number().optional(),
  followOffset: z
    .object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    })
    .optional(),
  smoothingSpeed: z.number().optional(),
  viewportRect: z
    .object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    })
    .optional(),
  hdr: z.boolean().optional(),
  toneMapping: z.enum(['none', 'linear', 'reinhard', 'cineon', 'aces']).optional(),
  toneMappingExposure: z.number().optional(),
  enablePostProcessing: z.boolean().optional(),
  postProcessingPreset: z.enum(['none', 'cinematic', 'realistic', 'stylized']).optional(),
  rotationSmoothing: z.number().optional(),
});

const LightSchema = z.object({
  lightType: z.enum(['directional', 'point', 'spot', 'ambient']),
  color: z.object({
    r: z.number(),
    g: z.number(),
    b: z.number(),
  }),
  intensity: z.number(),
  enabled: z.boolean(),
  castShadow: z.boolean(),
  directionX: z.number(),
  directionY: z.number(),
  directionZ: z.number(),
  range: z.number(),
  decay: z.number(),
  angle: z.number(),
  penumbra: z.number(),
  shadowMapSize: z.number(),
  shadowBias: z.number(),
  shadowRadius: z.number(),
});

const RigidBodySchema = z.object({
  enabled: z.boolean(),
  bodyType: z.enum(['dynamic', 'kinematic', 'fixed']),
  type: z.enum(['dynamic', 'kinematic', 'fixed']),
  mass: z.number(),
  gravityScale: z.number(),
  canSleep: z.boolean(),
  material: z.object({
    friction: z.number(),
    restitution: z.number(),
    density: z.number(),
  }),
});

const MeshColliderSchema = z.object({
  enabled: z.boolean(),
  isTrigger: z.boolean(),
  colliderType: z.enum(['box', 'sphere', 'capsule', 'mesh']),
  center: z.tuple([z.number(), z.number(), z.number()]),
  size: z.object({
    width: z.number(),
    height: z.number(),
    depth: z.number(),
    radius: z.number(),
    capsuleRadius: z.number(),
    capsuleHeight: z.number(),
  }),
  physicsMaterial: z.object({
    friction: z.number(),
    restitution: z.number(),
    density: z.number(),
  }),
});

const PersistentIdSchema = z.object({
  id: z.string(),
});

// Component validation map
const ComponentValidationMap = {
  [KnownComponentTypes.TRANSFORM]: TransformSchema,
  [KnownComponentTypes.MESH_RENDERER]: MeshRendererSchema,
  [KnownComponentTypes.CAMERA]: CameraSchema,
  [KnownComponentTypes.LIGHT]: LightSchema,
  [KnownComponentTypes.RIGID_BODY]: RigidBodySchema,
  [KnownComponentTypes.MESH_COLLIDER]: MeshColliderSchema,
  [KnownComponentTypes.PERSISTENT_ID]: PersistentIdSchema,
  [KnownComponentTypes.ANIMATION]: AnimationComponentSchema,
} as const;

/**
 * Validates a component's data structure
 */
export function validateComponent<T extends keyof ComponentDataMap>(
  componentType: T,
  data: unknown,
): ComponentDataMap[T] {
  const schema = ComponentValidationMap[componentType];
  if (!schema) {
    throw new Error(`Unknown component type: ${componentType}`);
  }
  // Parse the data and cast to the expected type
  const validatedData = schema.parse(data);
  return validatedData as ComponentDataMap[T];
}

/**
 * Validates a single entity
 */
export function validateEntity(entity: unknown): SceneEntityData {
  const validatedEntity = validateSceneEntity(entity);

  // Validate each component in the entity
  for (const [componentType, componentData] of Object.entries(validatedEntity.components)) {
    if (componentType in ComponentValidationMap) {
      const schema = ComponentValidationMap[componentType as keyof typeof ComponentValidationMap];
      schema.parse(componentData);
    }
  }

  return validatedEntity;
}

/**
 * Type-safe scene builder class
 */
export class SceneBuilder<T extends readonly (keyof ComponentDataMap)[]>
  implements ISceneBuilder<T>
{
  private entities: SceneEntityWithComponents<T>[] = [];

  entity<K extends string>(
    name: K,
    components: {
      [P in T[number]]: ComponentDataMap[P];
    } & {
      [key: string]: unknown;
    },
  ): SceneEntityWithComponents<T>;

  entity<K extends string>(
    name: K,
    parentId: string,
    components: {
      [P in T[number]]: ComponentDataMap[P];
    } & {
      [key: string]: unknown;
    },
  ): SceneEntityWithComponents<T>;

  entity<K extends string>(
    name: K,
    parentIdOrComponents:
      | string
      | ({
          [P in T[number]]: ComponentDataMap[P];
        } & {
          [key: string]: unknown;
        }),
    components?: {
      [P in T[number]]: ComponentDataMap[P];
    } & {
      [key: string]: unknown;
    },
  ): SceneEntityWithComponents<T> {
    const parentId = typeof parentIdOrComponents === 'string' ? parentIdOrComponents : null;
    const componentData = components || parentIdOrComponents;

    // Validate required components
    const validatedComponents: Record<string, unknown> = {};
    for (const [componentType, data] of Object.entries(componentData)) {
      if (componentType in ComponentValidationMap) {
        validatedComponents[componentType] = validateComponent(componentType as T[number], data);
      } else {
        validatedComponents[componentType] = data;
      }
    }

    const entity: SceneEntityWithComponents<T> = {
      id: `${name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      parentId,
      components: validatedComponents as { [K in T[number]]: ComponentData<K> } & {
        [key: string]: unknown;
      },
    };

    this.entities.push(entity);
    return entity;
  }

  /**
   * Builds the scene data with proper validation
   */
  build(metadata: {
    name: string;
    version: number;
    timestamp: string;
    author?: string;
    description?: string;
  }): SceneData {
    const sceneData: SceneData = {
      metadata,
      entities: this.entities.map((entity) => ({
        id: entity.id,
        name: entity.name,
        parentId: entity.parentId,
        components: entity.components,
      })),
    };

    return validateScene(sceneData);
  }
}

/**
 * Creates a type-safe scene builder
 */
export function createSceneBuilder<
  T extends readonly (keyof ComponentDataMap)[],
>(): SceneBuilder<T> { // _requiredComponents?: T
  return new SceneBuilder<T>();
}

/**
 * Utility to create entities with automatic ID generation
 */
export function createEntity<K extends string>(
  name: K,
  components: Record<string, unknown>,
  parentId?: string,
): SceneEntityData {
  return {
    id: `${name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    parentId,
    components,
  };
}

/**
 * Utility to create transform components
 */
export function createTransformComponent(
  position: [number, number, number] = [0, 0, 0],
  rotation: [number, number, number] = [0, 0, 0],
  scale: [number, number, number] = [1, 1, 1],
): ComponentDataMap['Transform'] {
  return TransformSchema.parse({
    position,
    rotation,
    scale,
  });
}

/**
 * Utility to create mesh renderer components
 */
export function createMeshRendererComponent(
  meshId: string,
  materialId: string,
  options: Partial<Omit<ComponentDataMap['MeshRenderer'], 'meshId' | 'materialId'>> = {},
): ComponentDataMap['MeshRenderer'] {
  const defaultMaterial = {
    shader: 'standard' as const,
    materialType: 'solid' as const,
    color: '#ffffff',
    normalScale: 1,
    metalness: 0,
    roughness: 0.5,
    emissive: '#000000',
    emissiveIntensity: 0,
    occlusionStrength: 1,
    textureOffsetX: 0,
    textureOffsetY: 0,
  };

  const materialData = { ...defaultMaterial, ...options.material };
  // Ensure shader is properly typed
  if (materialData.shader && !['standard', 'unlit'].includes(materialData.shader)) {
    materialData.shader = 'standard';
  }

  const meshData = {
    meshId,
    materialId,
    enabled: true,
    castShadows: true,
    receiveShadows: true,
    modelPath: '',
    material: materialData,
    ...options,
  };

  return MeshRendererSchema.parse(meshData) as ComponentDataMap['MeshRenderer'];
}

/**
 * Utility to create camera components
 */
export function createCameraComponent(
  options: Partial<ComponentDataMap['Camera']> = {},
): ComponentDataMap['Camera'] {
  return CameraSchema.parse({
    fov: 45,
    near: 0.1,
    far: 200,
    projectionType: 'perspective',
    orthographicSize: 10,
    depth: 0,
    isMain: false,
    clearFlags: 'skybox',
    backgroundColor: { r: 0.6, g: 0.8, b: 1, a: 1 },
    controlMode: 'free',
    enableSmoothing: true,
    followTarget: 0,
    followOffset: { x: 0, y: 5, z: -10 },
    smoothingSpeed: 2,
    rotationSmoothing: 1.5,
    hdr: true,
    toneMapping: 'aces',
    toneMappingExposure: 1.2,
    enablePostProcessing: true,
    postProcessingPreset: 'cinematic',
    ...options,
  });
}

/**
 * Utility to create light components
 */
export function createLightComponent(
  lightType: 'directional' | 'point' | 'spot' | 'ambient',
  options: Partial<Omit<ComponentDataMap['Light'], 'lightType'>> = {},
): ComponentDataMap['Light'] {
  return LightSchema.parse({
    lightType,
    color: { r: 1, g: 1, b: 1 },
    intensity: 1,
    enabled: true,
    castShadow: lightType === 'directional',
    directionX: 0,
    directionY: -1,
    directionZ: 0,
    range: lightType === 'point' ? 10 : 50,
    decay: 2,
    angle: 0.52,
    penumbra: 0.1,
    shadowMapSize: 2048,
    shadowBias: -0.0001,
    shadowRadius: 4,
    ...options,
  });
}
