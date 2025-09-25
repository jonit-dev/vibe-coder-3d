/**
 * TSX Scene DSL Schema - Zod schemas for validating code-side scene nodes
 * Defines the constrained JSX patterns allowed in TSX scene files
 */

import { z } from 'zod';

// Base types for common patterns
const Vector3Schema = z.tuple([z.number(), z.number(), z.number()]);
const Vector4Schema = z.tuple([z.number(), z.number(), z.number(), z.number()]);
const ColorSchema = z.object({
  r: z.number().min(0).max(1),
  g: z.number().min(0).max(1),
  b: z.number().min(0).max(1),
  a: z.number().min(0).max(1).optional(),
});

// Supported component prop schemas - must match ECS component definitions
export const TransformPropsSchema = z.object({
  position: Vector3Schema.optional().default([0, 0, 0]),
  rotation: Vector3Schema.or(Vector4Schema).optional().default([0, 0, 0]),
  scale: Vector3Schema.optional().default([1, 1, 1]),
});

export const MeshRendererPropsSchema = z.object({
  meshId: z.string().optional(),
  materialId: z.string().optional(),
  enabled: z.boolean().optional().default(true),
  castShadows: z.boolean().optional().default(true),
  receiveShadows: z.boolean().optional().default(true),
  material: z
    .object({
      shader: z.enum(['standard', 'unlit', 'skybox']).optional().default('standard'),
      materialType: z.enum(['solid', 'transparent']).optional().default('solid'),
      color: z.string().or(ColorSchema).optional().default('#ffffff'),
      metalness: z.number().min(0).max(1).optional().default(0),
      roughness: z.number().min(0).max(1).optional().default(0.5),
      emissive: z.string().or(ColorSchema).optional().default('#000000'),
      emissiveIntensity: z.number().min(0).optional().default(0),
    })
    .optional(),
});

export const CameraPropsSchema = z.object({
  fov: z.number().min(1).max(180).optional().default(50),
  near: z.number().min(0.001).optional().default(0.1),
  far: z.number().min(0.1).optional().default(1000),
  projectionType: z.enum(['perspective', 'orthographic']).optional().default('perspective'),
  orthographicSize: z.number().min(0.1).optional().default(10),
  isMain: z.boolean().optional().default(false),
  clearFlags: z.enum(['skybox', 'solid', 'depth']).optional().default('skybox'),
  backgroundColor: ColorSchema.optional(),
});

export const LightPropsSchema = z.object({
  lightType: z.enum(['directional', 'point', 'spot', 'ambient']),
  color: ColorSchema.optional().default({ r: 1, g: 1, b: 1 }),
  intensity: z.number().min(0).optional().default(1),
  enabled: z.boolean().optional().default(true),
  castShadow: z.boolean().optional().default(false),
  // Directional/Spot light properties
  directionX: z.number().optional(),
  directionY: z.number().optional(),
  directionZ: z.number().optional(),
  // Point/Spot light properties
  range: z.number().min(0).optional(),
  // Spot light properties
  spotAngle: z.number().min(0).max(180).optional(),
  // Shadow properties
  shadowMapSize: z.number().min(64).max(4096).optional().default(1024),
});

// Geometry component schemas
export const CubePropsSchema = z.object({
  material: MeshRendererPropsSchema.shape.material.optional(),
  castShadows: z.boolean().optional().default(true),
  receiveShadows: z.boolean().optional().default(true),
});

export const SpherePropsSchema = z.object({
  radius: z.number().min(0.001).optional().default(0.5),
  widthSegments: z.number().min(3).max(64).optional().default(8),
  heightSegments: z.number().min(2).max(32).optional().default(6),
  material: MeshRendererPropsSchema.shape.material.optional(),
  castShadows: z.boolean().optional().default(true),
  receiveShadows: z.boolean().optional().default(true),
});

export const PlanePropsSchema = z.object({
  width: z.number().min(0.001).optional().default(1),
  height: z.number().min(0.001).optional().default(1),
  widthSegments: z.number().min(1).max(100).optional().default(1),
  heightSegments: z.number().min(1).max(100).optional().default(1),
  material: MeshRendererPropsSchema.shape.material.optional(),
  castShadows: z.boolean().optional().default(true),
  receiveShadows: z.boolean().optional().default(true),
});

// Entity schema - the root container
export const EntityPropsSchema = z.object({
  name: z.string().optional(),
  persistentId: z.string(),
  parentId: z.string().optional(), // PersistentId of parent entity
  debug: z.boolean().optional().default(false),
});

// Component union type for validation
export const ComponentSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('Transform'), props: TransformPropsSchema }),
  z.object({ type: z.literal('MeshRenderer'), props: MeshRendererPropsSchema }),
  z.object({ type: z.literal('Camera'), props: CameraPropsSchema }),
  z.object({ type: z.literal('Light'), props: LightPropsSchema }),
  z.object({ type: z.literal('Cube'), props: CubePropsSchema }),
  z.object({ type: z.literal('Sphere'), props: SpherePropsSchema }),
  z.object({ type: z.literal('Plane'), props: PlanePropsSchema }),
]);

// JSX Element types that are allowed in TSX scenes
export const JSXElementSchema = z.discriminatedUnion('elementType', [
  z.object({
    elementType: z.literal('Entity'),
    props: EntityPropsSchema,
    children: z.array(z.lazy(() => JSXElementSchema)).optional(),
  }),
  z.object({
    elementType: z.literal('Transform'),
    props: TransformPropsSchema,
    children: z.never().optional(),
  }),
  z.object({
    elementType: z.literal('MeshRenderer'),
    props: MeshRendererPropsSchema,
    children: z.never().optional(),
  }),
  z.object({
    elementType: z.literal('Camera'),
    props: CameraPropsSchema,
    children: z.never().optional(),
  }),
  z.object({
    elementType: z.literal('Light'),
    props: LightPropsSchema,
    children: z.never().optional(),
  }),
  z.object({
    elementType: z.literal('Cube'),
    props: CubePropsSchema,
    children: z.never().optional(),
  }),
  z.object({
    elementType: z.literal('Sphere'),
    props: SpherePropsSchema,
    children: z.never().optional(),
  }),
  z.object({
    elementType: z.literal('Plane'),
    props: PlanePropsSchema,
    children: z.never().optional(),
  }),
]);

// Scene root schema - represents the entire scene structure
export const TSXSceneSchema = z.object({
  filePath: z.string(),
  elements: z.array(JSXElementSchema),
  metadata: z
    .object({
      name: z.string().optional(),
      description: z.string().optional(),
      author: z.string().optional(),
      version: z.string().optional().default('1.0'),
      tags: z.array(z.string()).optional(),
      lastModified: z.string().optional(),
    })
    .optional(),
});

// Type exports
export type TransformProps = z.infer<typeof TransformPropsSchema>;
export type MeshRendererProps = z.infer<typeof MeshRendererPropsSchema>;
export type CameraProps = z.infer<typeof CameraPropsSchema>;
export type LightProps = z.infer<typeof LightPropsSchema>;
export type CubeProps = z.infer<typeof CubePropsSchema>;
export type SphereProps = z.infer<typeof SpherePropsSchema>;
export type PlaneProps = z.infer<typeof PlanePropsSchema>;
export type EntityProps = z.infer<typeof EntityPropsSchema>;
export type Component = z.infer<typeof ComponentSchema>;
export type JSXElement = z.infer<typeof JSXElementSchema>;
export type TSXScene = z.infer<typeof TSXSceneSchema>;

// Validation utilities
export const TSXSceneValidator = {
  /**
   * Validate props for a specific component type
   */
  validateComponentProps(componentType: string, props: unknown): {
    valid: boolean;
    errors: string[];
    data?: unknown;
  } {
    try {
      let schema;
      switch (componentType) {
        case 'Transform':
          schema = TransformPropsSchema;
          break;
        case 'MeshRenderer':
          schema = MeshRendererPropsSchema;
          break;
        case 'Camera':
          schema = CameraPropsSchema;
          break;
        case 'Light':
          schema = LightPropsSchema;
          break;
        case 'Cube':
          schema = CubePropsSchema;
          break;
        case 'Sphere':
          schema = SpherePropsSchema;
          break;
        case 'Plane':
          schema = PlanePropsSchema;
          break;
        case 'Entity':
          schema = EntityPropsSchema;
          break;
        default:
          return {
            valid: false,
            errors: [`Unknown component type: ${componentType}`],
          };
      }

      const result = schema.parse(props);
      return {
        valid: true,
        errors: [],
        data: result,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Validation failed for ${componentType}: ${error.message}`],
      };
    }
  },

  /**
   * Validate a complete TSX scene structure
   */
  validateScene(scene: unknown): {
    valid: boolean;
    errors: string[];
    warnings: string[];
    scene?: TSXScene;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const validatedScene = TSXSceneSchema.parse(scene);

      // Additional validation rules
      const persistentIds = new Set<string>();
      const entityNames = new Set<string>();

      function validateElement(element: JSXElement, path: string[] = []): void {
        if (element.elementType === 'Entity') {
          // Check for duplicate persistent IDs
          if (persistentIds.has(element.props.persistentId)) {
            errors.push(
              `Duplicate persistentId "${element.props.persistentId}" at ${path.join(' > ')}`
            );
          }
          persistentIds.add(element.props.persistentId);

          // Check for duplicate entity names (warning only)
          if (element.props.name && entityNames.has(element.props.name)) {
            warnings.push(
              `Duplicate entity name "${element.props.name}" at ${path.join(' > ')}`
            );
          }
          if (element.props.name) {
            entityNames.add(element.props.name);
          }

          // Validate children
          if (element.children) {
            element.children.forEach((child, index) => {
              validateElement(child, [...path, element.props.name || `Entity[${index}]`]);
            });
          }
        }
      }

      validatedScene.elements.forEach((element, index) => {
        validateElement(element, [`Root[${index}]`]);
      });

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        scene: validatedScene,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Scene schema validation failed: ${error.message}`],
        warnings,
      };
    }
  }

  /**
   * Check if a JSX element is supported
   */
  isSupportedElement(elementType: string): boolean {
    const supportedTypes = [
      'Entity',
      'Transform',
      'MeshRenderer',
      'Camera',
      'Light',
      'Cube',
      'Sphere',
      'Plane',
    ];
    return supportedTypes.includes(elementType);
  }

  /**
   * Get default props for a component type
   */
  getDefaultProps(componentType: string): unknown {
    switch (componentType) {
      case 'Transform':
        return TransformPropsSchema.parse({});
      case 'MeshRenderer':
        return MeshRendererPropsSchema.parse({});
      case 'Camera':
        return CameraPropsSchema.parse({});
      case 'Light':
        return { lightType: 'directional', ...LightPropsSchema.parse({ lightType: 'directional' }) };
      case 'Cube':
        return CubePropsSchema.parse({});
      case 'Sphere':
        return SpherePropsSchema.parse({});
      case 'Plane':
        return PlanePropsSchema.parse({});
      default:
        return {};
    }
  }

  /**
   * Validate that parent-child relationships make sense
   */
  validateHierarchy(scene: TSXScene): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const entityIds = new Set<string>();

    // Collect all entity IDs
    function collectIds(elements: JSXElement[]): void {
      elements.forEach((element) => {
        if (element.elementType === 'Entity') {
          entityIds.add(element.props.persistentId);
          if (element.children) {
            collectIds(element.children);
          }
        }
      });
    }

    // Check parent references
    function validateParentRefs(elements: JSXElement[]): void {
      elements.forEach((element) => {
        if (element.elementType === 'Entity') {
          if (element.props.parentId && !entityIds.has(element.props.parentId)) {
            errors.push(
              `Entity "${element.props.persistentId}" references non-existent parent "${element.props.parentId}"`
            );
          }
          if (element.children) {
            validateParentRefs(element.children);
          }
        }
      });
    }

    collectIds(scene.elements);
    validateParentRefs(scene.elements);

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};