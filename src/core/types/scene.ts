/**
 * Type-safe Scene Definitions
 * Provides comprehensive type safety for dynamically generated scenes
 */

import { z } from 'zod';
import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import type {
  CameraData,
  LightData,
  MeshRendererData,
  RigidBodyData,
  MeshColliderData,
  PersistentIdData,
  TransformData,
  AnimationData,
} from '@/core/lib/ecs/components/definitions';

// Base entity interface
export interface ISceneEntity {
  id: string | number; // Support both string and numeric IDs for compatibility
  name: string;
  parentId?: string | number | null; // Support both formats for parent references
  components: Record<string, unknown>;
}

// Component data type mapping
export type ComponentDataMap = {
  [KnownComponentTypes.TRANSFORM]: TransformData;
  [KnownComponentTypes.MESH_RENDERER]: MeshRendererData;
  [KnownComponentTypes.RIGID_BODY]: RigidBodyData;
  [KnownComponentTypes.MESH_COLLIDER]: MeshColliderData;
  [KnownComponentTypes.CAMERA]: CameraData;
  [KnownComponentTypes.LIGHT]: LightData;
  [KnownComponentTypes.PERSISTENT_ID]: PersistentIdData;
  [KnownComponentTypes.ANIMATION]: AnimationData;
};

// Zod schemas for validation and type inference
export const SceneComponentSchema = z.union([
  z.object({
    Transform: z.object({
      position: z.tuple([z.number(), z.number(), z.number()]),
      rotation: z.tuple([z.number(), z.number(), z.number()]),
      scale: z.tuple([z.number(), z.number(), z.number()]),
    }),
  }),
  z.object({
    MeshRenderer: z.object({
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
    }),
  }),
  z.object({
    Camera: z.object({
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
    }),
  }),
  z.object({
    Light: z.object({
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
    }),
  }),
  z.object({
    RigidBody: z.object({
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
    }),
  }),
  z.object({
    MeshCollider: z.object({
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
    }),
  }),
  z.object({
    PersistentId: z.object({
      id: z.string(),
    }),
  }),
]);

// Scene entity schema
export const SceneEntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  parentId: z.string().nullable().optional(),
  components: z.record(z.string(), z.any()), // We'll validate components separately
});

// Scene schema
export const SceneSchema = z.object({
  metadata: z.object({
    name: z.string(),
    version: z.number(),
    timestamp: z.string(),
    author: z.string().optional(),
    description: z.string().optional(),
  }),
  entities: z.array(SceneEntitySchema),
});

// Type inference from schemas
export type SceneEntityData = z.infer<typeof SceneEntitySchema>;
export type SceneData = z.infer<typeof SceneSchema>;
export type SceneMetadata = z.infer<typeof SceneSchema>['metadata'];

// Utility types for type-safe component access
export type ComponentData<T extends keyof ComponentDataMap> = ComponentDataMap[T];
export type SceneEntityWithComponents<T extends readonly (keyof ComponentDataMap)[]> = {
  id: string;
  name: string;
  parentId?: string | null;
  components: {
    [K in T[number]]: ComponentData<K>;
  } & {
    [key: string]: unknown; // Allow additional components
  };
};

// Scene builder type for type-safe scene creation
export type SceneBuilderFn<T extends readonly (keyof ComponentDataMap)[]> = (
  builder: ISceneBuilder<T>,
) => void;

export interface ISceneBuilder<T extends readonly (keyof ComponentDataMap)[]> {
  entity<K extends string>(
    name: K,
    components: {
      [P in T[number]]: ComponentData<P>;
    } & {
      [key: string]: unknown; // Allow additional components
    },
  ): SceneEntityWithComponents<T>;

  entity<K extends string>(
    name: K,
    parentId: string,
    components: {
      [P in T[number]]: ComponentData<P>;
    } & {
      [key: string]: unknown; // Allow additional components
    },
  ): SceneEntityWithComponents<T>;
}

// Validation function
export function validateSceneEntity(entity: unknown): SceneEntityData {
  return SceneEntitySchema.parse(entity);
}

export function validateScene(data: unknown): SceneData {
  return SceneSchema.parse(data);
}
