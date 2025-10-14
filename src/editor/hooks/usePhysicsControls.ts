import { useGameEngineControls } from '@core/hooks/useGameEngineControls';
import { usePlayModeState } from './usePlayModeState';
import { EntityManager, componentRegistry } from '@core/index';
import { SceneSerializer } from '@core/lib/serialization/SceneSerializer';
import { RustSceneExporter } from '@core/lib/serialization/RustSceneExporter';
import { Logger } from '@core/lib/logger';

const logger = Logger.create('PhysicsControls');

interface IPhysicsControlsProps {
  onStatusMessage: (message: string) => void;
}

export const usePhysicsControls = ({ onStatusMessage }: IPhysicsControlsProps) => {
  const { startEngine, pauseEngine, stopEngine } = useGameEngineControls();
  const { backupTransforms, restoreTransforms, hasBackup } = usePlayModeState();

  const handlePlay = async () => {
    // Backup current transform states before starting physics
    backupTransforms();

    // Export current scene to Rust before playing
    try {
      const entityManager = EntityManager.getInstance();
      const sceneSerializer = new SceneSerializer();
      const rustExporter = new RustSceneExporter();

      // Serialize current scene state
      const sceneData = await sceneSerializer.serialize(entityManager, componentRegistry, {
        name: 'play-mode',
        description: 'Play mode scene snapshot',
      });

      // Export to Rust
      await rustExporter.export(
        'play-mode',
        {
          entities: sceneData.entities,
          materials: sceneData.materials,
          prefabs: sceneData.prefabs,
          inputAssets: sceneData.inputAssets,
          lockedEntityIds: sceneData.lockedEntityIds,
        },
        sceneData.metadata,
      );

      logger.debug('Scene exported to Rust for play mode');
    } catch (error) {
      // Don't fail play mode if export fails
      logger.warn('Failed to export scene to Rust', { error });
    }

    // Start the physics engine
    startEngine();

    onStatusMessage('Physics simulation started - positions backed up');
  };

  const handlePause = () => {
    // Pause the physics engine
    pauseEngine();

    onStatusMessage('Physics simulation paused');
  };

  const handleStop = () => {
    // Stop the physics engine
    stopEngine();

    // Restore original transform states if backup exists
    if (hasBackup()) {
      restoreTransforms();
      onStatusMessage('Physics simulation stopped - positions restored');
    } else {
      onStatusMessage('Physics simulation stopped');
    }
  };

  return {
    handlePlay,
    handlePause,
    handleStop,
  };
};
