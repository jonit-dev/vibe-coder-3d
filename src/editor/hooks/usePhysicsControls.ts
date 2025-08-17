import { useGameEngine } from '@/core/hooks/useGameEngine';
import { usePlayModeState } from './usePlayModeState';

interface IPhysicsControlsProps {
  onStatusMessage: (message: string) => void;
}

export const usePhysicsControls = ({ onStatusMessage }: IPhysicsControlsProps) => {
  const { startEngine, pauseEngine, stopEngine } = useGameEngine();
  const { backupTransforms, restoreTransforms, hasBackup } = usePlayModeState();

  const handlePlay = () => {
    // Backup current transform states before starting physics
    backupTransforms();
    
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
