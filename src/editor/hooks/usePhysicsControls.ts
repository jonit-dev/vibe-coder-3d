interface IPhysicsControlsProps {
  onStatusMessage: (message: string) => void;
}

export const usePhysicsControls = ({ onStatusMessage }: IPhysicsControlsProps) => {
  const handlePlay = () => {
    onStatusMessage('Physics simulation started');
  };

  const handlePause = () => {
    onStatusMessage('Physics simulation paused');
  };

  const handleStop = () => {
    onStatusMessage('Physics simulation stopped');
  };

  return {
    handlePlay,
    handlePause,
    handleStop,
  };
};
