// Updated scene serialization - now uses the new ECS system
import { useECSSceneSerialization } from '@core/lib/ecs-serialization';

// Legacy interface for backward compatibility
export interface ISerializedScene {
  version: number;
  entities: any[];
}

// Re-export the SCENE_VERSION from the new system
export { SCENE_VERSION } from '@core/lib/ecs-serialization';

// Simple wrapper around the new ECS serialization system
export function useSceneSerialization() {
  const ecsSerializer = useECSSceneSerialization();

  return {
    exportScene: () => ecsSerializer.exportScene(),
    importScene: (scene: any) => ecsSerializer.importScene(scene, { clearExisting: true }),
  };
}
