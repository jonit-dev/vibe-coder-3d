/**
 * Component Definitions Index
 * Exports all component definitions from individual files
 */

export { cameraComponent, type CameraData } from './CameraComponent';
export { customShapeComponent, type CustomShapeData } from './CustomShapeComponent';
export { lightComponent, type LightData } from './LightComponent';
export { meshColliderComponent, type MeshColliderData } from './MeshColliderComponent';
export { meshRendererComponent, type MeshRendererData } from './MeshRendererComponent';
export { persistentIdComponent, type PersistentIdData } from './PersistentIdComponent';
export { PrefabInstanceComponent, type IPrefabInstance } from './PrefabInstanceComponent';
export { rigidBodyComponent, type RigidBodyData } from './RigidBodyComponent';
export { scriptComponent, type ScriptData } from './ScriptComponent';
export { soundComponent, type SoundData } from './SoundComponent';
export { terrainComponent, type TerrainData } from './TerrainComponent';
export { transformComponent, type TransformData } from './TransformComponent';

// Re-export component registry for convenience
export { ComponentCategory, componentRegistry } from '../../ComponentRegistry';
