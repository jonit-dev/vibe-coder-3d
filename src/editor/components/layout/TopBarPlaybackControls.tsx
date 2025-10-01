import React from 'react';
import { FiPlay, FiPause, FiSquare } from 'react-icons/fi';
import { ToolbarButton } from '../shared/ToolbarButton';
import { ToolbarGroup } from '../shared/ToolbarGroup';

export interface ITopBarPlaybackControlsProps {
  isPlaying?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
}

export const TopBarPlaybackControls: React.FC<ITopBarPlaybackControlsProps> = React.memo(
  ({ isPlaying = false, onPlay, onPause, onStop }) => {
    return (
      <ToolbarGroup>
        <ToolbarButton onClick={onPlay} disabled={isPlaying} variant="success" title="Play (Space)">
          <FiPlay className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={onPause} disabled={!isPlaying} variant="warning" title="Pause">
          <FiPause className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={onStop} variant="danger" title="Stop">
          <FiSquare className="w-4 h-4" />
        </ToolbarButton>
      </ToolbarGroup>
    );
  },
);

TopBarPlaybackControls.displayName = 'TopBarPlaybackControls';
