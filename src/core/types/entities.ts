/**
 * Entity and Component Type Definitions
 * Provides strong typing for entity-related data structures
 */

import { z } from 'zod';

// Base component interface
export interface IEntityComponent {
  type: string;
  data: unknown;
}

// Rendering contributions interface
export interface IRenderingContributions {
  castShadow?: boolean;
  receiveShadow?: boolean;
  visible?: boolean;
  material?: IMaterialData;
}

// Material data interface
export interface IMaterialData {
  type?: 'standard' | 'basic' | 'physical' | 'toon';
  color?: string | { r: number; g: number; b: number };
  metalness?: number;
  roughness?: number;
  opacity?: number;
  transparent?: boolean;
  emissive?: string | { r: number; g: number; b: number };
  emissiveIntensity?: number;
  map?: string; // texture path
  normalMap?: string;
  roughnessMap?: string;
  metalnessMap?: string;
  alphaMap?: string;
  envMap?: string;
  [key: string]: unknown; // Allow for additional properties
}

// Specific component data schemas
export const MeshRendererDataSchema = z.object({
  modelPath: z.string().optional(),
  castShadow: z.boolean().optional(),
  receiveShadow: z.boolean().optional(),
  visible: z.boolean().optional(),
});

export const CameraDataSchema = z.object({
  fov: z.number().min(1).max(180).optional(),
  near: z.number().min(0.01).optional(),
  far: z.number().min(1).optional(),
  aspect: z.number().optional(),
  type: z.enum(['perspective', 'orthographic']).optional(),
});

export const LightDataSchema = z.object({
  lightType: z.enum(['directional', 'point', 'spot', 'ambient']).optional(),
  color: z.union([
    z.string(),
    z.object({
      r: z.number().min(0).max(1),
      g: z.number().min(0).max(1),
      b: z.number().min(0).max(1),
    }),
  ]).optional(),
  intensity: z.number().min(0).optional(),
  range: z.number().min(0).optional(),
  angle: z.number().min(0).max(Math.PI).optional(),
  decay: z.number().min(0).optional(),
  castShadow: z.boolean().optional(),
});

export const TransformDataSchema = z.object({
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }).optional(),
  rotation: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }).optional(),
  scale: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }).optional(),
});

// Inferred types from schemas
export type IMeshRendererData = z.infer<typeof MeshRendererDataSchema>;
export type ICameraData = z.infer<typeof CameraDataSchema>;
export type ILightData = z.infer<typeof LightDataSchema>;
export type ITransformData = z.infer<typeof TransformDataSchema>;

// Typed entity component interfaces
export interface IMeshRendererComponent extends IEntityComponent {
  type: 'MeshRenderer';
  data: IMeshRendererData;
}

export interface ICameraComponent extends IEntityComponent {
  type: 'Camera';
  data: ICameraData;
}

export interface ILightComponent extends IEntityComponent {
  type: 'Light';
  data: ILightData;
}

export interface ITransformComponent extends IEntityComponent {
  type: 'Transform';
  data: ITransformData;
}

// Union type for all known components
export type ITypedEntityComponent = 
  | IMeshRendererComponent
  | ICameraComponent
  | ILightComponent
  | ITransformComponent;

// Type guard functions
export function isMeshRendererComponent(component: IEntityComponent): component is IMeshRendererComponent {
  return component.type === 'MeshRenderer';
}

export function isCameraComponent(component: IEntityComponent): component is ICameraComponent {
  return component.type === 'Camera';
}

export function isLightComponent(component: IEntityComponent): component is ILightComponent {
  return component.type === 'Light';
}

export function isTransformComponent(component: IEntityComponent): component is ITransformComponent {
  return component.type === 'Transform';
}

// Utility function to get typed component data
export function getTypedComponentData<T extends ITypedEntityComponent>(
  components: IEntityComponent[],
  type: T['type']
): T['data'] | undefined {
  const component = components.find(c => c.type === type);
  return component?.data as T['data'] | undefined;
}