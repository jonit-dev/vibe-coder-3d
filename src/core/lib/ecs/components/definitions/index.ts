/**
 * Component Definitions Index
 * Exports all component definitions from individual files
 */

export { cameraComponent, type CameraData } from './CameraComponent';
export { lightComponent, type LightData } from './LightComponent';
export { meshColliderComponent, type MeshColliderData } from './MeshColliderComponent';
export { meshRendererComponent, type MeshRendererData } from './MeshRendererComponent';
export { rigidBodyComponent, type RigidBodyData } from './RigidBodyComponent';
export { transformComponent, type TransformData } from './TransformComponent';

// Re-export component registry for convenience
export { ComponentCategory, componentRegistry } from '../../ComponentRegistry';
