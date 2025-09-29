/**
 * JSX ECS Façade - React/R3F-style components that integrate with ECS
 * Provides declarative scene authoring while maintaining ECS compatibility
 */

// Core components
export { Entity, EntityDebug } from './Entity';
export type { IEntityProps } from './Entity';

// Transform components
export { Transform, Position, Rotation, Scale } from './Transform';
export type { ITransformProps } from './Transform';

// Renderer components
export { MeshRenderer, Cube, Sphere, Cylinder, Plane } from './MeshRenderer';
export type { IMeshRendererProps, IMaterialProps } from './MeshRenderer';

// Camera components
export { Camera, PerspectiveCamera, OrthographicCamera } from './Camera';
export type { ICameraProps } from './Camera';

// Light components
export { Light, DirectionalLight, PointLight, SpotLight, AmbientLight } from './Light';
export type { ILightProps } from './Light';

// Context
export { useEntityContext, useEntityContextOptional } from './EntityContext';

// Re-export common types for convenience
export type { EntityId } from '@/core/lib/ecs/types';

// Development utilities
export const JSX_ECS_VERSION = '1.0.0';

/**
 * Development warning for raw R3F meshes not wrapped in Entity
 */
export function warnUnwrappedMesh(meshName: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `[JSX-ECS] Raw R3F mesh '${meshName}' detected. ` +
        `For editor compatibility, wrap with <Entity><MeshRenderer /></Entity>. ` +
        `Raw meshes won't be editable in the visual editor.`,
    );
  }
}

/**
 * Check if JSX ECS components are being used correctly
 */
export function validateJSXECSUsage(): boolean {
  if (process.env.NODE_ENV === 'development') {
    // Could add runtime validation here

  }
  return true;
}
