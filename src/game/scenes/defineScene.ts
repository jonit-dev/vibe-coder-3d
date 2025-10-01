import React from 'react';
import type { ISceneData } from '@core/lib/serialization';

/**
 * Define a scene with type safety and zero boilerplate
 *
 * Scene files are now PASSIVE - they only provide data.
 * Loading is handled by SceneRegistry when the scene is explicitly loaded.
 *
 * Usage:
 * ```tsx
 * export default defineScene({
 *   metadata: { name: 'MyScene', version: 1, timestamp: '...' },
 *   entities: [...],
 *   materials: [...],
 *   prefabs: []
 * });
 * ```
 */
export function defineScene(sceneData: ISceneData) {
  // Create a passive component that doesn't auto-load
  // Loading is handled by SceneRegistry when scene is explicitly loaded
  const SceneComponent: React.FC = () => {
    return null;
  };

  SceneComponent.displayName = sceneData.metadata.name;

  return {
    Component: SceneComponent,
    metadata: sceneData.metadata,
    data: sceneData
  };
}
