import React from 'react';
import type { ISceneData } from '@core/lib/serialization';
import type {
  ITypedSceneEntity,
  IMaterialDefinition,
  IPrefabDefinition,
  IInputActionsAsset,
} from '@core';

/**
 * Typed scene data with component validation
 * This provides VSCode autocomplete and type checking for entity components
 */
export interface ITypedSceneData {
  metadata: {
    name: string;
    version: number;
    timestamp: string;
    author?: string;
    description?: string;
  };
  entities: ITypedSceneEntity[];
  materials?: IMaterialDefinition[];
  prefabs?: IPrefabDefinition[];
  inputAssets?: IInputActionsAsset[];
  assetReferences?: {
    materials?: string;
    prefabs?: string;
    inputs?: string;
  };
}

/**
 * Define a scene with compile-time type safety
 *
 * Scene files are PASSIVE - they only provide data.
 * Loading is handled by SceneRegistry when the scene is explicitly loaded.
 *
 * Type Safety:
 * - Entities use ITypedSceneEntity for component validation
 * - VSCode will show red squiggles for invalid component fields
 * - Autocomplete for component properties
 *
 * Usage:
 * ```tsx
 * export default defineScene({
 *   metadata: { name: 'MyScene', version: 1, timestamp: '...' },
 *   entities: [
 *     {
 *       id: 0,
 *       name: 'Camera',
 *       components: {
 *         Transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
 *         Camera: { fov: 75, near: 0.1, far: 100, ... }
 *       }
 *     }
 *   ],
 *   materials: [...],
 *   prefabs: []
 * });
 * ```
 */
export function defineScene(sceneData: ITypedSceneData) {
  // Create a passive component that doesn't auto-load
  // Loading is handled by SceneRegistry when scene is explicitly loaded
  const SceneComponent: React.FC = () => {
    return null;
  };

  SceneComponent.displayName = sceneData.metadata.name;

  return {
    Component: SceneComponent,
    metadata: sceneData.metadata,
    data: sceneData as unknown as ISceneData, // Cast for runtime compatibility
  };
}
